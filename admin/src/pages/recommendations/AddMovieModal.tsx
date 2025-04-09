// --- START OF FILE AddMovieModal.tsx ---
import React, { useState, useEffect, useMemo } from 'react';
import { useLazyQuery } from '@apollo/client';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Autocomplete, Box, Grid, Card, CardMedia, CardContent, Typography, IconButton, CircularProgress, Alert } from '@mui/material';
import { Delete } from '@mui/icons-material';
import EmptyPlaceholder from '@components/EmptyPlaceholder'; // Adjust path
// Use API movie types
import type { ApiMovieCore } from '@interfaces/movie.interfaces';
// Use API section type
import type { ApiRecommendationSection } from '@interfaces/recommendation.interfaces';
import { GET_MOVIES } from '@graphql/queries/movie.queries'; // Adjust path
import { debounce } from 'lodash'; // Import debounce

interface AddMovieModalProps {
    open: boolean;
    onClose: () => void;
    // Receive the actual section object from API
    selectedSection: ApiRecommendationSection | null;
    // Function to call when confirming additions
    onConfirmAdd: (sectionId: string, moviesToAdd: ApiMovieCore[]) => Promise<void>; // Make async
    // Loading state from parent mutation
    isConfirming: boolean;
}

const AddMovieModal: React.FC<AddMovieModalProps> = ({
    open,
    onClose,
    selectedSection,
    onConfirmAdd,
    isConfirming,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    // Use ApiMovieCore for movies to add
    const [moviesForAddition, setMoviesForAddition] = useState<ApiMovieCore[]>([]);
    // Keep track of the movie selected in Autocomplete
    const [autocompleteSelection, setAutocompleteSelection] = useState<ApiMovieCore | null>(null);
    // Auto add count - keeping local state as it doesn't directly interact with API here
    const [autoAddCount, setAutoAddCount] = useState(1);

    // --- Movie Search Query ---
    const [fetchMovies, { data: movieData, loading: loadingMovies, error: movieError }] = useLazyQuery<{ movies: ApiMovieCore[], movieCount: number }>(
        GET_MOVIES,
        {
            fetchPolicy: 'network-only', // Fetch fresh results for search
            variables: {
                limit: 5, // Fetch only 5 for autocomplete dropdown
                search: debouncedSearchQuery,
                // Exclude movies already in the section or selected for addition?
                // This filtering logic is complex for a basic query and might be better done client-side
                // on the returned results, or requires backend support.
            },
        }
    );

    // Debounce the search query trigger
    const debouncedFetchMovies = useMemo(
        () => debounce((query: string) => {
            if (query.trim().length > 1) { // Only search if query is > 1 char
                 setDebouncedSearchQuery(query);
                 fetchMovies({ variables: { limit: 5, search: query } });
            } else {
                 setDebouncedSearchQuery(''); // Clear results if query is short
            }
        }, 500), // 500ms delay
        [fetchMovies]
    );

    useEffect(() => {
        debouncedFetchMovies(searchQuery);
        // Cleanup debounce timer on unmount
        return () => debouncedFetchMovies.cancel();
    }, [searchQuery, debouncedFetchMovies]);

    // Clear state when modal opens/closes or section changes
    useEffect(() => {
        if (open) {
            setSearchQuery('');
            setDebouncedSearchQuery('');
            setMoviesForAddition([]);
            setAutocompleteSelection(null);
            setAutoAddCount(1);
        }
    }, [open, selectedSection]);

    const handleRemoveFromAddition = (movie: ApiMovieCore) => {
        setMoviesForAddition(prev => prev.filter(m => m.id !== movie.id));
    };

    // Add movie selected from Autocomplete
    const handleAddFromAutocomplete = (movie: ApiMovieCore | null) => {
        setAutocompleteSelection(movie); // Update selection
        if (movie) {
            // Check if not already in section OR in addition list
            const alreadyInSection = selectedSection?.movies.some(m => m.id === movie.id);
            const alreadySelected = moviesForAddition.some(m => m.id === movie.id);

            if (!alreadyInSection && !alreadySelected) {
                setMoviesForAddition(prev => [...prev, movie]);
            }
            // Clear search and selection after adding
            setSearchQuery('');
            setDebouncedSearchQuery('');
            // Do NOT setAutocompleteSelection(null) here, messes with controlled Autocomplete value
            // Instead, the Autocomplete's value prop controls what's displayed.
            // We might need to manually clear the Autocomplete input if needed.
        }
    };

     // Auto Add - requires fetching more movies and filtering
     const handleAutoAddMovies = async () => {
         if (!selectedSection || autoAddCount <= 0) return;

         // Fetch a larger list of movies (e.g., 50 popular/recent ones)
         // This requires a potentially different query or using GET_MOVIES with sorting
         // For simplicity, we'll just use the current search mechanism if needed,
         // but a dedicated "fetch candidates" query would be better.
         // Using current search results (limited to 5) is not ideal for auto-add.

         // Placeholder: This needs a proper implementation based on how you want to source
         // movies for auto-add (e.g., fetch top rated, fetch random, etc.)
         alert("Auto-add functionality requires fetching a suitable pool of movies (not fully implemented in this example).");

         // --- Example using a separate fetch (if you had a query like GET_POPULAR_MOVIES) ---
         /*
         try {
             const { data: popularMoviesData } = await fetchPopularMovies({ variables: { limit: 50 } }); // Assume this query exists
             if (popularMoviesData) {
                 const existingMovieIds = new Set([
                     ...selectedSection.movies.map(m => m.id),
                     ...moviesForAddition.map(m => m.id)
                 ]);
                 const availableMovies = popularMoviesData.popularMovies.filter(movie => !existingMovieIds.has(movie.id));
                 const shuffled = [...availableMovies].sort(() => 0.5 - Math.random());
                 const moviesToAdd = shuffled.slice(0, Math.min(autoAddCount, shuffled.length));
                 setMoviesForAddition(prev => [...prev, ...moviesToAdd]);
             }
         } catch (error) {
             console.error("Failed to fetch movies for auto-add:", error);
             alert("Failed to auto-add movies.");
         }
         */
     };


    const handleConfirm = () => {
        if (selectedSection && moviesForAddition.length > 0) {
            onConfirmAdd(selectedSection.id, moviesForAddition);
            // Parent will close modal on success/failure of the async operation
        } else {
            onClose(); // Close if nothing to add
        }
    };

    // Filter options for Autocomplete to exclude already added movies
     const filteredOptions = (movieData?.movies ?? []).filter(option =>
         !moviesForAddition.some(added => added.id === option.id) &&
         !selectedSection?.movies.some(existing => existing.id === option.id)
     );

    return (
        // Keep existing Dialog structure and class names
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle className='dialog-title'>
                {/* Use selectedSection */}
                <b>Add Movies to "{selectedSection?.title}"</b>
            </DialogTitle>
            <DialogContent className='dialog-content'>
                {/* Autocomplete for Movie Search */}
                <Box sx={{ mb: 3, mt: 1 }}>
                    <Autocomplete
                        // Use ApiMovieCore
                        options={filteredOptions}
                        getOptionLabel={(option: ApiMovieCore) => option.title}
                        value={autocompleteSelection} // Controlled component
                        // Use handleAddFromAutocomplete on selection
                        onChange={(_, newValue: ApiMovieCore | null) => {
                            handleAddFromAutocomplete(newValue);
                        }}
                        inputValue={searchQuery} // Control input value
                        onInputChange={(_, newInputValue) => {
                             // Prevent adding from input change, only on selection
                            setSearchQuery(newInputValue);
                        }}
                        loading={loadingMovies}
                        loadingText="Searching movies..."
                        noOptionsText={searchQuery.length > 1 ? "No movies found" : "Type to search..."}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                // Keep existing class name
                                className='rec-add-movie-modal-tf'
                                label="Search movies to add"
                                variant="outlined"
                                fullWidth
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {loadingMovies ? <CircularProgress color="inherit" size={20} /> : null}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                }}
                            />
                        )}
                        // Render option to show poster if available
                        renderOption={(props, option: ApiMovieCore) => (
                           <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
                             {option.poster_url && (
                                <img
                                  loading="lazy"
                                  width="40"
                                  src={option.poster_url}
                                  alt=""
                                />
                              )}
                             {option.title} ({new Date(option.release_date ?? '').getFullYear() || 'N/A'})
                           </Box>
                         )}
                         isOptionEqualToValue={(option, value) => option.id === value.id} // Important for object options
                    />
                     {movieError && <Alert severity="error" sx={{ mt: 1 }}>Error searching movies: {movieError.message}</Alert>}
                </Box>

                {/* Auto Add Section - Keep existing structure */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <TextField
                        label="Auto Add Movie Count"
                        value={autoAddCount}
                        onChange={(e) => setAutoAddCount(Math.max(1, parseInt(e.target.value) || 1))}
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 1 } }}
                        sx={{ mr: 2 }}
                        size="small"
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleAutoAddMovies}
                        size="medium"
                    >
                        Auto Add (Example)
                    </Button>
                </Box>

                {/* Selected Movies Display - Keep existing structure */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>Selected For Addition ({moviesForAddition.length})</Typography>
                    <Grid container spacing={2}>
                        {moviesForAddition.map((movie: ApiMovieCore) => (
                            // Keep existing classes
                            <Grid className="movie-grid1" item xs={6} sm={4} md={3} key={movie.id}>
                                <Card className="movie-card1" sx={{ position: 'relative', height: '100%' }}>
                                     {/* Use poster_url */}
                                    <CardMedia component="img" height="140" image={movie.poster_url ?? 'https://via.placeholder.com/150?text=No+Image'} alt={movie.title} />
                                    <CardContent className='movie-card1-content' sx={{ pt: 1, pb: '0 !important' }}> {/* Adjust padding */}
                                        {/* Keep existing class */}
                                        <Typography className='title-rec selectable' variant="body2" sx={{ mb: 1, fontWeight: 500, lineHeight: 1.2, height: '3.6em', overflow: 'hidden' }}>
                                            {movie.title}
                                        </Typography>
                                        {/* Keep existing class */}
                                        <IconButton
                                            className='delete-button-rec'
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveFromAddition(movie);
                                            }}
                                            size="small"
                                            sx={{ position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(255, 255, 255, 0.7)' }}
                                        >
                                            <Delete fontSize="inherit" color="error" />
                                        </IconButton>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                        {moviesForAddition.length === 0 && (
                            <Grid item xs={12}>
                                <EmptyPlaceholder title='No movies selected.' />
                            </Grid>
                        )}
                    </Grid>
                </Box>
            </DialogContent>
            {/* Keep existing DialogActions structure */}
            <DialogActions className='dialog-actions'>
                <Button onClick={onClose} disabled={isConfirming}>
                    Cancel
                </Button>
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    color="primary"
                    disabled={isConfirming || moviesForAddition.length === 0}
                    // Keep existing sx styles
                    sx={{
                        borderRadius: '6px',
                        fontWeight: 500,
                        textTransform: 'none',
                        minWidth: '100px',
                        boxShadow: 2
                    }}
                >
                    {isConfirming ? <CircularProgress size={24} /> : `Confirm Add (${moviesForAddition.length})`}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddMovieModal;
// --- END OF FILE AddMovieModal.tsx ---