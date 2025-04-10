// --- START OF FILE RecommendationsPage.tsx ---
import React, { useState } from 'react';
import { useQuery, useMutation, ApolloError } from '@apollo/client';
import { Box, CircularProgress, Alert } from '@mui/material'; // Import necessary MUI components

import CategorySection from './CategorySection'; // Adjust path
import AddMovieModal from './AddMovieModal'; // Adjust path
import MovieDetailsModal from './MovieDetailsModal'; // Adjust path
import DeleteConfirmation from '@components/modals/DeleteConfirmation'; // Adjust path

// Import API types
import type { ApiRecommendationSection } from '@interfaces/recommendation.interfaces';
import type { ApiMovieCore } from '@interfaces/movie.interfaces';
import { ADD_MOVIE_TO_SECTION, GET_RECOMMENDATION_SECTIONS, REMOVE_MOVIE_FROM_SECTION } from '@graphql/index';


export const RecommendationsPage: React.FC = () => {
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

    // State for removed movies
    const [removedMovies, setRemovedMovies] = useState<Record<number, string[]>>({});

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
         onCompleted: (removedData) => {
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
         // awaitRefetchQueries: true,
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
        try {
            // Calculate starting display order (simple approach: max + 1)
            const section = sections.find(s => s.id === sectionId);
            const maxOrder = section ? Math.max(-1, ...section.movies.map((m, index) => index)) : -1; // Use index as order proxy if display_order isn't fetched reliably

            // Run mutations sequentially or in parallel (parallel might overwhelm backend/network)
            for (let i = 0; i < moviesToAdd.length; i++) {
                const movie = moviesToAdd[i];
                // Ideally, use display_order from DB if available, otherwise index
                const displayOrder = maxOrder + 1 + i;
                await addMovieMutation({
                    variables: { sectionId, movieId: movie.id, displayOrder }
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
        const { type, section, movie } = deleteActionContext;

        try {
            if (type === 'single' && movie) {
                await removeMovieMutation({ variables: { sectionId: section.id, movieId: movie.id } });
            } else if (type === 'bulk') {
                const moviesToRemove = selectedMoviesMap[section.id] ?? [];
                // Run deletes sequentially or parallel
                for (const movieToRemove of moviesToRemove) {
                    await removeMovieMutation({ variables: { sectionId: section.id, movieId: movieToRemove.id } });
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
            [section.id]: (prev[section.id] || 10) + 10,
        }));
    };

     const handleShowLess = (section: ApiRecommendationSection) => {
        setLoadedMoviesCount(prev => ({
            ...prev,
            [section.id]: 10, // Reset to initial limit
        }));
    };

    const handleLoadAll = (section: ApiRecommendationSection) => {
        setLoadedMoviesCount(prev => ({
            ...prev,
            [section.id]: section.movieCount, // Use total count from API
        }));
    };


    // --- Render Logic ---
    if (loadingSections) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;
    }

    if (queryError) {
        return <Alert severity="error">Error loading recommendations: {queryError.message}</Alert>;
    }

    return (
        // Keep existing container class name
        <Box className="recommendations-container" sx={{ p: 2 }}>
            {/* Display mutation errors */}
             {mutationError && <Alert severity="warning" onClose={() => setMutationError(null)} sx={{ mb: 2 }}>{mutationError}</Alert>}

            {sections.map(section => (
                <CategorySection
                    key={section.id}
                    // Pass API data directly
                    category={section}
                    // Pass state maps and handlers
                    loadedMovies={loadedMoviesCount}
                    selectedMovies={selectedMoviesMap}
                    areAllSelected={areAllSelected}
                    handleAddMovies={handleOpenAddModal} // Use modal opener
                    handleToggleSelectAll={handleToggleSelectAll}
                    handleViewDetails={handleViewDetails}
                    handleOpenDeleteConfirmationBulk={handleOpenDeleteConfirmationBulk} // Use confirmation opener
                    toggleMovieSelection={toggleMovieSelection}
                    handleShowLess={handleShowLess}
                    handleLoadMore={handleLoadMore}
                    handleLoadAll={handleLoadAll}
                    handleOpenDeleteConfirmationSingle={handleOpenDeleteConfirmationSingle} // Use confirmation opener
                />
            ))}

             {/* Add Movie Modal */}
            <AddMovieModal
                open={openAddDialog}
                onClose={handleCloseAddModal}
                selectedSection={sectionForAddModal}
                onConfirmAdd={handleConfirmAddMovies} // Pass the confirmation handler
                isConfirming={addingMovie} // Pass loading state
            />

             {/* Movie Details Modal */}
             {/* Ensure MovieDetailsModal expects ApiMovieCore */}
            <MovieDetailsModal
                open={openDetailsDialog}
                onClose={handleCloseDetailsModal}
                currentSectionId={sectionIdForDetailsModal}
                selectedMoviesMap={selectedMoviesMap}
                detailsActiveStep={detailsActiveStep}
                handleNext={handleNextDetails}
                handleBack={handleBackDetails}
                sections={sections} // Pass all sections to find title
            />

            {/* Delete Confirmation Modal */}
            <DeleteConfirmation
                open={openDeleteConfirmation}
                onClose={handleCloseDeleteConfirmation}
                onConfirm={handleConfirmDelete} // Call the delete handler
                // isLoading={removingMovie} // Pass loading state
                // itemName={ // Dynamic item name based on context
                //     deleteActionContext?.type === 'single'
                //         ? `the movie "${deleteActionContext.movie?.title}"`
                //         : `${selectedMoviesMap[deleteActionContext?.section.id ?? '']?.length ?? 0} selected movies`
                // }
                // confirmationText={`Are you sure you want to remove ${ deleteActionContext?.type === 'single' ? `the movie "${deleteActionContext.movie?.title}"` : `${selectedMoviesMap[deleteActionContext?.section.id ?? '']?.length ?? 0} selected movies` } from the section "${deleteActionContext?.section.title}"? This action cannot be undone.`}
            />
        </Box>
    );
};
// --- END OF FILE RecommendationsPage.tsx ---