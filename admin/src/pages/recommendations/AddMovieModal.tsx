// --- START OF FILE AddMovieModal.tsx ---
import React, { useState, useEffect, useMemo } from 'react';
import { useLazyQuery } from '@apollo/client';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Autocomplete, Box, Grid, Card, CardMedia, CardContent, Typography, IconButton, CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Delete, AutoAwesome } from '@mui/icons-material';
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

// Define sort options for auto-add
type SortOption = 'POPULARITY_DESC' | 'RELEASE_DATE_DESC' | 'VOTE_AVERAGE_DESC' | 'REVENUE_DESC';

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
    // Add sort option for auto-add
    const [autoAddSortBy, setAutoAddSortBy] = useState<SortOption>('POPULARITY_DESC');

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

    // Separate query for auto-add functionality
    const [fetchMoviesForAutoAdd, { loading: loadingAutoAdd }] = useLazyQuery<{ movies: ApiMovieCore[], movieCount: number }>(
        GET_MOVIES,
        {
            fetchPolicy: 'network-only',
            variables: {
                limit: 50, // Higher limit for auto-add pool
                sortBy: autoAddSortBy, // Use sort option
                // No search term for auto-add (get popular/recent)
            },
            onCompleted: (data) => {
                if (data?.movies && selectedSection) {
                    // Filter out movies already in the section or selected for addition
                    const existingMovieIds = new Set([
                        ...selectedSection.movies.map(m => m.id),
                        ...moviesForAddition.map(m => m.id)
                    ]);
                    
                    const availableMovies = data.movies.filter(movie => !existingMovieIds.has(movie.id));
                    
                    // Either shuffle or keep the sort order from the API
                    // const shuffled = [...availableMovies].sort(() => 0.5 - Math.random());
                    // Or keep API sort order:
                    const moviesToAdd = availableMovies.slice(0, Math.min(autoAddCount, availableMovies.length));
                    
                    setMoviesForAddition(prev => [...prev, ...moviesToAdd]);
                }
            },
            onError: (error) => {
                console.error("Failed to fetch movies for auto-add:", error);
                alert("Failed to auto-add movies. Please try again.");
            }
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
            setAutoAddSortBy('POPULARITY_DESC');
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

     // Auto Add - implemented using our query
     const handleAutoAddMovies = () => {
         if (!selectedSection || autoAddCount <= 0 || loadingAutoAdd) return;
         
         // Use the separate query with appropriate variables
         fetchMoviesForAutoAdd({
             variables: {
                 limit: Math.max(50, autoAddCount * 2), // Fetch enough movies to ensure we have candidates
                 sortBy: autoAddSortBy
             }
         });
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

                {/* Enhanced Auto Add Section */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <TextField
                        label="Auto Add Count"
                        value={autoAddCount}
                        onChange={(e) => setAutoAddCount(Math.max(1, parseInt(e.target.value) || 1))}
                        variant="outlined"
                        type="number"
                        InputProps={{ inputProps: { min: 1 } }}
                        sx={{ mr: 2 }}
                        size="small"
                    />
                    <FormControl size="small" sx={{ minWidth: 150, mr: 2 }}>
                        <InputLabel id="auto-add-sort-label">Sort By</InputLabel>
                        <Select
                            labelId="auto-add-sort-label"
                            value={autoAddSortBy}
                            label="Sort By"
                            onChange={(e) => setAutoAddSortBy(e.target.value as SortOption)}
                        >
                            <MenuItem value="POPULARITY_DESC">Most Popular</MenuItem>
                            <MenuItem value="RELEASE_DATE_DESC">Newest</MenuItem>
                            <MenuItem value="VOTE_AVERAGE_DESC">Highest Rated</MenuItem>
                            <MenuItem value="REVENUE_DESC">Highest Revenue</MenuItem>
                        </Select>
                    </FormControl>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleAutoAddMovies}
                        size="medium"
                        disabled={loadingAutoAdd}
                        startIcon={<AutoAwesome />}
                    >
                        {loadingAutoAdd ? "Adding..." : "Auto Add Movies"}
                    </Button>
                </Box>

                {/* Selected Movies Display */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>Selected For Addition ({moviesForAddition.length})</Typography>
                    
                    {moviesForAddition.length > 0 ? (
                        <Grid container spacing={2}>
                            {moviesForAddition.map((movie) => (
                                <Grid item xs={12} sm={6} md={4} key={movie.id}>
                                    <Card sx={{ display: 'flex', height: '100%', flexDirection: 'column' }}>
                                        <Box sx={{ position: 'relative' }}>
                                            <CardMedia
                                                component="img"
                                                height="140"
                                                image={movie.poster_url || '/placeholder-poster.jpg'}
                                                alt={movie.title}
                                            />
                                            <IconButton
                                                onClick={() => handleRemoveFromAddition(movie)}
                                                sx={{
                                                    position: 'absolute',
                                                    top: 5,
                                                    right: 5,
                                                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                                                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.95)' }
                                                }}
                                                size="small"
                                            >
                                                <Delete />
                                            </IconButton>
                                        </Box>
                                        <CardContent sx={{ flexGrow: 1 }}>
                                            <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'bold' }}>
                                                {movie.title}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                                                {movie.duration_minutes ? ` • ${movie.duration_minutes} min` : ''}
                                            </Typography>
                                            {movie.genres && movie.genres.length > 0 && (
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                    {movie.genres.map(g => g.name).join(', ')}
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    ) : (
                        <EmptyPlaceholder title="No movies selected for addition" />
                    )}
                </Box>
            </DialogContent>
            <DialogActions className='dialog-actions'>
                <Button onClick={onClose} color="primary" disabled={isConfirming}>
                    Cancel
                </Button>
                <Button 
                    onClick={handleConfirm} 
                    color="primary" 
                    variant="contained" 
                    disabled={moviesForAddition.length === 0 || isConfirming}
                >
                    {isConfirming ? 'Adding...' : `Add ${moviesForAddition.length} Movie${moviesForAddition.length !== 1 ? 's' : ''}`}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddMovieModal;
// --- END OF FILE AddMovieModal.tsx ---