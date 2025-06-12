// --- START OF FILE RecommendationsPage.tsx ---
import React, { useState } from 'react';
import { useQuery, useMutation, ApolloError } from '@apollo/client';
import { Box, CircularProgress, Alert, Typography, Paper } from '@mui/material'; // Import necessary MUI components

import CategorySection from './CategorySection'; // Adjust path
import AddMovieModal from './AddMovieModal'; // Adjust path
import MovieDetailsModal from './MovieDetailsModal'; // Adjust path
import DeleteConfirmation from '@components/modals/DeleteConfirmation'; // Adjust path

// Import API types
import type { ApiRecommendationSection } from '@interfaces/recommendation.interfaces';
import type { ApiMovieCore } from '@interfaces/movie.interfaces';
// Proper imports from queries and mutations
import { GET_RECOMMENDATION_SECTIONS } from '@graphql/queries/recommendation.queries';
import { ADD_MOVIE_TO_SECTION, REMOVE_MOVIE_FROM_SECTION } from '@graphql/mutations/recommendation.mutations';
import { useAuth } from '@contexts/AuthContext';


export const RecommendationsPage: React.FC = () => {
    const { admin, isAuthenticated } = useAuth();
    
    // State for Modals
    const [openAddDialog, setOpenAddDialog] = useState(false);
    const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
    const [openDeleteConfirmation, setOpenDeleteConfirmation] = useState(false);

    // State for Modal Data / Context
    // Store the full section object when opening the Add modal
    const [sectionForAddModal, setSectionForAddModal] = useState<ApiRecommendationSection | null>(null);
    // Store the section ID for the Details modal
    const [sectionIdForDetailsModal, setSectionIdForDetailsModal] = useState<string | null>(null);
    const [detailsActiveStep, setDetailsActiveStep] = useState(0);
    // Store the delete action context (single movie or bulk)
    const [deleteActionContext, setDeleteActionContext] = useState<{
        type: 'single' | 'bulk';
        section: ApiRecommendationSection;
        movie?: ApiMovieCore; // Only for single delete
    } | null>(null);

    // State for UI Control
    // Map of section ID to number of movies loaded/shown { [sectionId]: count }
    const [loadedMoviesCount, setLoadedMoviesCount] = useState<{ [key: string]: number }>({});
    // Map of section ID to list of selected movies { [sectionId]: ApiMovieCore[] }
    const [selectedMoviesMap, setSelectedMoviesMap] = useState<{ [key: string]: ApiMovieCore[] }>({});

    // State for API Errors
    const [mutationError, setMutationError] = useState<string | null>(null);

    // --- Data Fetching ---
    const { data, loading: loadingSections, error: queryError, refetch } = useQuery<{ recommendations: ApiRecommendationSection[] }>(
        GET_RECOMMENDATION_SECTIONS,
        {
            fetchPolicy: 'cache-and-network',
            onError: (err) => console.error("Error fetching sections:", err),
        }
    );
    const sections = data?.recommendations ?? [];

    // --- Mutations ---
    const handleMutationError = (error: ApolloError, operation: string) => {
        console.error(`Error during ${operation}:`, error);
        setMutationError(`Operation failed: ${error.message}`);
        // Consider closing modals or showing error within them
        setOpenAddDialog(false); // Close add dialog on error
    };

    const [addMovieMutation, { loading: addingMovie }] = useMutation(ADD_MOVIE_TO_SECTION, {
        onError: (err) => handleMutationError(err, 'add movie'),
        // Update cache or refetch on completion - refetch is simpler
        onCompleted: () => {
             setMutationError(null);
             refetch(); // Refetch sections to show added movie
        },
        // awaitRefetchQueries: true, // Ensure refetch completes before proceeding if needed
    });

    const [removeMovieMutation, { loading: removingMovie }] = useMutation(REMOVE_MOVIE_FROM_SECTION, {
         onError: (err) => handleMutationError(err, 'remove movie'),
         onCompleted: () => {
             setMutationError(null);
             // If removing selected movies, clear selection
             if (deleteActionContext?.type === 'single' && deleteActionContext.movie) {
                handleClearSelectionAfterDelete(deleteActionContext.section.id, [deleteActionContext.movie.id]);
             } else if (deleteActionContext?.type === 'bulk') {
                handleClearSelectionAfterDelete(deleteActionContext.section.id, selectedMoviesMap[deleteActionContext.section.id]?.map(m => m.id) ?? []);
             }
             setDeleteActionContext(null); // Clear context
             refetch(); // Refetch sections
         },
    });

    const isMutating = addingMovie || removingMovie;

    // --- Handlers ---

    // Add Modal
    const handleOpenAddModal = (section: ApiRecommendationSection) => {
        setSectionForAddModal(section);
        setMutationError(null); // Clear previous errors
        setOpenAddDialog(true);
    };

    const handleCloseAddModal = () => {
        setOpenAddDialog(false);
        setSectionForAddModal(null);
    };

    // Function passed to AddMovieModal to confirm adding
    const handleConfirmAddMovies = async (sectionId: string, moviesToAdd: ApiMovieCore[]) => {
        setMutationError(null);
        if (!admin?.id) { // Check for admin id
            setMutationError("Admin authentication required.");
            return;
        }
        try {
            // Calculate starting display order (simple approach: max + 1)
            const section = sections.find(s => s.id === sectionId);
            // Ensure map explicitly returns numbers
            const movieIndices = section ? section.movies.map((_, index: number) => index) : [];
            const maxOrder = movieIndices.length > 0 ? Math.max(...movieIndices) : -1;

            // Run mutations sequentially or in parallel (parallel might overwhelm backend/network)
            for (let i = 0; i < moviesToAdd.length; i++) {
                const movie = moviesToAdd[i];
                // Ideally, use display_order from DB if available, otherwise index
                const displayOrder = maxOrder + 1 + i;
                await addMovieMutation({
                    variables: { performingAdminId: admin.id, sectionId, movieId: movie.id, displayOrder }
                });
                // Add a small delay if needed to avoid rate limiting
                // await new Promise(resolve => setTimeout(resolve, 50));
            }
            handleCloseAddModal(); // Close modal on success
        } catch (error) {
            // Error is handled by the mutation's onError handler
            console.error("Error occurred during batch add:", error);
            // Keep modal open on error
        }
    };


    // Delete Confirmation
    const handleOpenDeleteConfirmationSingle = (section: ApiRecommendationSection, movie: ApiMovieCore) => {
        setDeleteActionContext({ type: 'single', section, movie });
        setMutationError(null);
        setOpenDeleteConfirmation(true);
    };

    const handleOpenDeleteConfirmationBulk = (section: ApiRecommendationSection) => {
         if ((selectedMoviesMap[section.id] ?? []).length === 0) return; // Don't open if nothing selected
        setDeleteActionContext({ type: 'bulk', section });
        setMutationError(null);
        setOpenDeleteConfirmation(true);
    };

    const handleCloseDeleteConfirmation = () => {
        setOpenDeleteConfirmation(false);
        // Don't clear context immediately, needed in mutation onCompleted
    };

    // Called when user confirms deletion in the modal
    const handleConfirmDelete = async () => {
        if (!deleteActionContext) return;
        setMutationError(null);
        if (!admin?.id) { // Check for admin id
            setMutationError("Admin authentication required.");
            handleCloseDeleteConfirmation(); // Close modal if auth fails
            return;
        }
        const { type, section, movie } = deleteActionContext;

        try {
            if (type === 'single' && movie) {
                await removeMovieMutation({ variables: { performingAdminId: admin.id, sectionId: section.id, movieId: movie.id } });
            } else if (type === 'bulk') {
                const moviesToRemove = selectedMoviesMap[section.id] ?? [];
                // Run deletes sequentially or parallel
                for (const movieToRemove of moviesToRemove) {
                    await removeMovieMutation({ variables: { performingAdminId: admin.id, sectionId: section.id, movieId: movieToRemove.id } });
                     // Optional delay
                    // await new Promise(resolve => setTimeout(resolve, 50));
                }
            }
        } catch (error) {
             // Error handled by mutation's onError
             console.error("Error during batch delete:", error);
        } finally {
             handleCloseDeleteConfirmation(); // Close confirmation modal
             // Context is cleared in onCompleted
        }
    };

    // Helper to clear selection state after deletion
    const handleClearSelectionAfterDelete = (sectionId: string, deletedMovieIds: string[]) => {
        setSelectedMoviesMap(prev => ({
            ...prev,
            [sectionId]: (prev[sectionId] ?? []).filter(m => !deletedMovieIds.includes(m.id)),
        }));
    };


    // Movie Selection
    const toggleMovieSelection = (section: ApiRecommendationSection, movie: ApiMovieCore) => {
        setSelectedMoviesMap(prev => {
            const currentSelection = prev[section.id] || [];
            const isSelected = currentSelection.some(m => m.id === movie.id);
            let newSelection;
            if (isSelected) {
                newSelection = currentSelection.filter(m => m.id !== movie.id);
            } else {
                newSelection = [...currentSelection, movie];
            }
            return { ...prev, [section.id]: newSelection };
        });
    };

    const handleToggleSelectAll = (sectionId: string, isCurrentlyAllSelected: boolean) => {
        const section = sections.find(s => s.id === sectionId);
        if (!section) return;

        setSelectedMoviesMap(prev => ({
            ...prev,
            [sectionId]: isCurrentlyAllSelected ? [] : [...section.movies], // Select all movies in the section
        }));
    };

    const areAllSelected = (sectionId: string): boolean => {
         const section = sections.find(s => s.id === sectionId);
         if (!section || section.movies.length === 0) return false;
         const selectedCount = (selectedMoviesMap[sectionId] ?? []).length;
         return selectedCount > 0 && selectedCount === section.movies.length;
     };


    // View Details Modal
    const handleViewDetails = (sectionId: string) => {
         if ((selectedMoviesMap[sectionId] ?? []).length === 0) return; // Don't open if nothing selected
        setSectionIdForDetailsModal(sectionId);
        setDetailsActiveStep(0); // Reset step
        setOpenDetailsDialog(true);
    };

    const handleCloseDetailsModal = () => {
        setOpenDetailsDialog(false);
        setSectionIdForDetailsModal(null);
    };

    const handleNextDetails = () => {
        setDetailsActiveStep((prev) => prev + 1);
    };

    const handleBackDetails = () => {
        setDetailsActiveStep((prev) => prev - 1);
    };


    // Load More / Less Logic (remains client-side state)
    const handleLoadMore = (section: ApiRecommendationSection) => {
        setLoadedMoviesCount(prev => ({
            ...prev,
            [section.id]: Math.min((prev[section.id] ?? 5) + 5, section.movieCount),
        }));
    };

    const handleShowLess = (section: ApiRecommendationSection) => {
        setLoadedMoviesCount(prev => ({
            ...prev,
            [section.id]: Math.max((prev[section.id] ?? 5) - 5, 5),
        }));
    };

    const handleLoadAll = (section: ApiRecommendationSection) => {
        setLoadedMoviesCount(prev => ({
            ...prev,
            [section.id]: section.movieCount,
        }));
    };


    // Disabled Actions Status
    const isActionDisabled = !isAuthenticated || isMutating;

    // Render the main component
    if (loadingSections && !data) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box className="recommendations-container">
            {/* Page Header */}
            <Box className="recommendations-header" sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Movie Recommendations
                </Typography>
                <Typography variant="body1" gutterBottom>
                    Manage recommendation sections displayed to users. Add or remove movies from sections.
                </Typography>
            </Box>

            {/* Error Alert */}
            {queryError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    Error loading recommendations: {queryError.message}
                </Alert>
            )}

            {mutationError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {mutationError}
                </Alert>
            )}

            {/* Sections List */}
            {sections.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>No recommendation sections found</Typography>
                    <Typography variant="body2" color="textSecondary">
                        Contact your administrator to create recommendation sections.
                    </Typography>
                </Paper>
            ) : (
                <Box className="recommendations-sections">
                    {sections.map((section) => (
                        <CategorySection
                            key={section.id}
                            section={section}
                            onAddMovie={() => handleOpenAddModal(section)}
                            onDeleteMovie={(movie) => handleOpenDeleteConfirmationSingle(section, movie)}
                            onDeleteSelected={() => handleOpenDeleteConfirmationBulk(section)}
                            onViewDetails={() => handleViewDetails(section.id)}
                            selectedMovies={selectedMoviesMap[section.id] ?? []}
                            onToggleSelect={(movie) => toggleMovieSelection(section, movie)}
                            onToggleSelectAll={() => handleToggleSelectAll(section.id, areAllSelected(section.id))}
                            areAllSelected={areAllSelected(section.id)}
                            loadedMoviesCount={loadedMoviesCount[section.id] ?? 5}
                            onLoadMore={() => handleLoadMore(section)}
                            onShowLess={() => handleShowLess(section)}
                            onLoadAll={() => handleLoadAll(section)}
                            disabled={isActionDisabled}
                        />
                    ))}
                </Box>
            )}

            {/* Modals */}
            <AddMovieModal
                open={openAddDialog}
                onClose={handleCloseAddModal}
                selectedSection={sectionForAddModal}
                onConfirmAdd={handleConfirmAddMovies}
                isConfirming={addingMovie}
            />

            <MovieDetailsModal
                open={openDetailsDialog}
                onClose={handleCloseDetailsModal}
                movies={sectionIdForDetailsModal ? (selectedMoviesMap[sectionIdForDetailsModal] ?? []) : []}
                activeStep={detailsActiveStep}
                onNext={handleNextDetails}
                onBack={handleBackDetails}
            />

            <DeleteConfirmation
                open={openDeleteConfirmation}
                onClose={handleCloseDeleteConfirmation}
                onConfirm={handleConfirmDelete}
                title={
                    deleteActionContext?.type === 'single'
                        ? 'Remove Movie from Section'
                        : 'Remove Selected Movies'
                }
                message={
                    deleteActionContext?.type === 'single'
                        ? `Are you sure you want to remove "${deleteActionContext?.movie?.title}" from the "${deleteActionContext?.section.title}" section?`
                        : `Are you sure you want to remove ${(selectedMoviesMap[deleteActionContext?.section.id ?? ''] ?? []).length} selected movies from the "${deleteActionContext?.section.title}" section?`
                }
                // confirmText="Remove"
                // cancelText="Cancel"
                // isConfirming={removingMovie}
            />
        </Box>
    );
};

export default RecommendationsPage;
// --- END OF FILE RecommendationsPage.tsx ---