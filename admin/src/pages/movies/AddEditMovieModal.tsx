// AddEditMovieModal.tsx
import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
    Chip, IconButton, Grid, InputAdornment, Box, Typography, CircularProgress,
    Select, MenuItem, FormControl, InputLabel, SelectChangeEvent, Autocomplete, Tooltip
} from '@mui/material';
import { Close, Refresh, PersonRemove, LabelOff } from '@mui/icons-material';
import { useEffect, useState, useRef } from 'react';
import { Movie, PersonOption, GenreOption } from '@interfaces/movie.interfaces';
import { useQuery } from '@apollo/client';
import { GET_ALL_GENRES } from '@graphql/queries/genre.queries';
import { GET_PERSONS, GET_ACTORS, GET_DIRECTORS } from '@graphql/queries/person.queries';
import { RetryableImage } from './RetryableImage';

interface AddEditMovieModalProps {
    mode: 'add' | 'edit';
    open: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<Movie, 'id'>) => void;
    isLoading: boolean;
    movie?: Movie;
}

// Default data matches the frontend Movie interface (excluding ID)
const defaultMovieData: Omit<Movie, 'id'> = {
    title: '',
    imageUrl: '',
    trailerUrl: '',
    shortDescription: '',
    description: '',
    genres: [],
    directors: [],
    actors: [],
    rating: 0,
    releaseDate: new Date().toISOString().split('T')[0],
    duration: 0,
    status: 'RELEASED',
    movieqRating: 0,
    imdbRating: 0,
    letterboxdRating: 0,
    selectedGenreIds: [],
    selectedDirectorIds: [],
    selectedActorIds: []
};

// Movie status options from schema
const MOVIE_STATUS_OPTIONS = [
    'RUMORED', 
    'PLANNED', 
    'IN_PRODUCTION', 
    'POST_PRODUCTION', 
    'RELEASED', 
    'CANCELED'
];

export const AddEditMovieModal = ({
    mode,
    open,
    onClose,
    onSubmit,
    isLoading,
    movie
}: AddEditMovieModalProps) => {
    // State holds data matching the frontend Movie interface (excluding ID)
    const [formData, setFormData] = useState<Omit<Movie, 'id'>>(defaultMovieData);
    
    // State for selected entities
    const [selectedGenres, setSelectedGenres] = useState<GenreOption[]>([]);
    const [selectedDirectors, setSelectedDirectors] = useState<PersonOption[]>([]);
    const [selectedActors, setSelectedActors] = useState<PersonOption[]>([]);
    
    // Save original selection values for undo functionality
    const originalGenres = useRef<GenreOption[]>([]);
    const originalDirectors = useRef<PersonOption[]>([]);
    const originalActors = useRef<PersonOption[]>([]);
    
    // Separate search terms for actors and directors
    const [actorSearch, setActorSearch] = useState('');
    const [directorSearch, setDirectorSearch] = useState('');
    
    // Fetch all genres for dropdown
    const { data: genresData, loading: loadingGenres } = useQuery(GET_ALL_GENRES);
    
    // Fetch some initial persons for both actors and directors (even without search)
    const { data: initialPersonsData, loading: loadingInitialPersons } = useQuery(GET_PERSONS, {
        variables: { limit: 30 }, // Fetch top 30 persons initially
        onError: (error) => {
            console.error("Error fetching initial persons:", error);
        }
    });
    
    // Fetch persons based on actor search term
    const { data: actorsData, loading: loadingActors } = useQuery(GET_ACTORS, {
        variables: { search: actorSearch, limit: 20 },
        skip: !actorSearch, // Skip if no search term
        onError: (error) => {
            console.error("Error fetching actors:", error);
        }
    });
    
    // Fetch persons based on director search term
    const { data: directorsData, loading: loadingDirectors } = useQuery(GET_DIRECTORS, {
        variables: { search: directorSearch, limit: 20 },
        skip: !directorSearch, // Skip if no search term
        onError: (error) => {
            console.error("Error fetching directors:", error);
        }
    });

    useEffect(() => {
        if (open) { // Reset/Populate only when opening
            if (mode === 'edit' && movie) {
                // If editing, populate form with existing movie data (excluding ID)
                const { id, ...movieData } = movie;
                setFormData({
                    ...defaultMovieData, // Start with defaults to ensure all fields exist
                    ...movieData,        // Override with actual movie data
                    releaseDate: movieData.releaseDate?.split('T')[0] || new Date().toISOString().split('T')[0], // Ensure correct date format
                });
                
                // Populate selected genres if we have genre data
                if (genresData?.genres && movieData.genres && movieData.selectedGenreIds) {
                    const genreOptions = genresData.genres.filter((g: GenreOption) => 
                        movieData.selectedGenreIds?.includes(g.id));
                    setSelectedGenres(genreOptions);
                    // Store original values for undo
                    originalGenres.current = [...genreOptions];
                }
                
                // Initialize selected actors/directors from person calls if needed
                // This will be populated when fetching movie details
                if (movie.directors && movie.selectedDirectorIds) {
                    const directorOptions = movie.directors.map((name, index) => ({
                        id: movie.selectedDirectorIds?.[index] || '',
                        name: name
                    }));
                    setSelectedDirectors(directorOptions);
                    // Store original values for undo
                    originalDirectors.current = [...directorOptions];
                }
                
                if (movie.actors && movie.selectedActorIds) {
                    const actorOptions = movie.actors.map((name, index) => ({
                        id: movie.selectedActorIds?.[index] || '',
                        name: name
                    }));
                    setSelectedActors(actorOptions);
                    // Store original values for undo
                    originalActors.current = [...actorOptions];
                }
            } else {
                // If adding, reset to default
                setFormData(defaultMovieData);
                setSelectedGenres([]);
                setSelectedDirectors([]);
                setSelectedActors([]);
                // Clear original values
                originalGenres.current = [];
                originalDirectors.current = [];
                originalActors.current = [];
            }
        }
    }, [mode, movie, open, genresData]); // Depend on `open` to trigger effect

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const finalValue = type === 'number' ? (value === '' ? '' : Number(value)) : value; // Allow clearing number field
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSelectChange = (e: SelectChangeEvent) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle genre selection in Autocomplete
    const handleGenreChange = (_: React.SyntheticEvent, newValue: GenreOption[]) => {
        setSelectedGenres(newValue);
        setFormData(prev => ({
            ...prev,
            genres: newValue.map(genre => genre.name),
            selectedGenreIds: newValue.map(genre => genre.id)
        }));
    };
    
    // Handle director selection in Autocomplete
    const handleDirectorChange = (_: React.SyntheticEvent, newValue: PersonOption[]) => {
        setSelectedDirectors(newValue);
        setFormData(prev => ({
            ...prev,
            directors: newValue.map(director => director.name),
            selectedDirectorIds: newValue.map(director => director.id)
        }));
    };
    
    // Handle actor selection in Autocomplete
    const handleActorChange = (_: React.SyntheticEvent, newValue: PersonOption[]) => {
        setSelectedActors(newValue);
        setFormData(prev => ({
            ...prev,
            actors: newValue.map(actor => actor.name),
            selectedActorIds: newValue.map(actor => actor.id)
        }));
    };
    
    // Restore original genre selections
    const handleResetGenres = () => {
        setSelectedGenres(originalGenres.current);
        setFormData(prev => ({
            ...prev,
            genres: originalGenres.current.map(genre => genre.name),
            selectedGenreIds: originalGenres.current.map(genre => genre.id)
        }));
    };
    
    // Restore original director selections
    const handleResetDirectors = () => {
        setSelectedDirectors(originalDirectors.current);
        setFormData(prev => ({
            ...prev,
            directors: originalDirectors.current.map(director => director.name),
            selectedDirectorIds: originalDirectors.current.map(director => director.id)
        }));
    };
    
    // Restore original actor selections
    const handleResetActors = () => {
        setSelectedActors(originalActors.current);
        setFormData(prev => ({
            ...prev,
            actors: originalActors.current.map(actor => actor.name),
            selectedActorIds: originalActors.current.map(actor => actor.id)
        }));
    };
    
    // Clear all selected genres
    const handleClearGenres = () => {
        setSelectedGenres([]);
        setFormData(prev => ({
            ...prev,
            genres: [],
            selectedGenreIds: []
        }));
    };
    
    // Clear all selected directors
    const handleClearDirectors = () => {
        setSelectedDirectors([]);
        setFormData(prev => ({
            ...prev,
            directors: [],
            selectedDirectorIds: []
        }));
    };
    
    // Clear all selected actors
    const handleClearActors = () => {
        setSelectedActors([]);
        setFormData(prev => ({
            ...prev,
            actors: [],
            selectedActorIds: []
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Add validation if needed here before submitting
        const dataToSubmit = {
            ...formData,
            // Ensure duration is a number, default to 0 if empty string or invalid
            duration: typeof formData.duration === 'number' ? formData.duration : 0,
            // Ensure tmdbId is a number or undefined
            tmdbId: formData.tmdbId ? Number(formData.tmdbId) : undefined,
            // Ensure ratings are numbers
            movieqRating: typeof formData.movieqRating === 'number' ? formData.movieqRating : 0,
            imdbRating: typeof formData.imdbRating === 'number' ? formData.imdbRating : 0,
            letterboxdRating: typeof formData.letterboxdRating === 'number' ? formData.letterboxdRating : 0
        };
        onSubmit(dataToSubmit);
    };

    const getTitle = () => {
        if (mode === 'add') return 'Add New Movie';
        return `Edit Movie: ${movie?.title || '...'}`; // Show movie title or loading dots
    }

    // Extract data from query results
    const genres: GenreOption[] = genresData?.genres || [];
    
    // Combine data sources for persons, prioritizing search results
    const actorOptions: PersonOption[] = actorSearch 
        ? (actorsData?.people || []) 
        : (initialPersonsData?.people || []);
        
    const directorOptions: PersonOption[] = directorSearch 
        ? (directorsData?.people || []) 
        : (initialPersonsData?.people || []);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            aria-labelledby="movie-dialog-title"
        >
            <DialogTitle id="movie-dialog-title" className='dialog-title'>
                {getTitle()}
                <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
                    <Close />
                </IconButton>
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent dividers>
                    {/* Use Grid for layout */}
                    <Grid container spacing={2}>
                        {/* Title */}
                        <Grid item xs={12} sm={6}>
                            <TextField label="Title" name="title" value={formData.title} onChange={handleInputChange} fullWidth required margin="dense" variant="outlined"/>
                        </Grid>
                        {/* Release Date */}
                        <Grid item xs={12} sm={6}>
                            <TextField label="Release Date" name="releaseDate" type="date" value={formData.releaseDate} onChange={handleInputChange} fullWidth required margin="dense" variant="outlined" InputLabelProps={{ shrink: true }} />
                        </Grid>
                        {/* Image URL */}
                        <Grid item xs={12} sm={6}>
                            <TextField label="Poster Image URL" name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} fullWidth required margin="dense" variant="outlined"/>
                        </Grid>
                        {/* Trailer URL */}
                        <Grid item xs={12} sm={6}>
                            <TextField label="Trailer URL (YouTube)" name="trailerUrl" value={formData.trailerUrl || ''} onChange={handleInputChange} fullWidth margin="dense" variant="outlined" placeholder="e.g., https://www.youtube.com/watch?v=..." />
                        </Grid>
                        {/* Poster Preview */}
                        {formData.imageUrl && (
                            <Grid item xs={12} md={4} sx={{ my: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>Poster Preview:</Typography>
                                <Box 
                                    sx={{ 
                                        width: '100%', 
                                        maxWidth: '200px', 
                                        height: '250px', 
                                        border: '1px solid #ddd', 
                                        borderRadius: '4px',
                                        overflow: 'hidden',
                                        bgcolor: '#f5f5f5',
                                        margin: '0 auto'
                                    }}
                                >
                                    <RetryableImage
                                        src={formData.imageUrl}
                                        alt={`${formData.title || 'Movie'} poster`}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'contain'
                                        }}
                                    />
                                </Box>
                            </Grid>
                        )}
                        {/* Status */}
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth margin="dense">
                                <InputLabel id="status-label">Status</InputLabel>
                                <Select
                                    labelId="status-label"
                                    id="status"
                                    name="status"
                                    value={formData.status || ''}
                                    label="Status"
                                    onChange={handleSelectChange}
                                >
                                    {MOVIE_STATUS_OPTIONS.map(status => (
                                        <MenuItem key={status} value={status}>{status}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        {/* Duration */}
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Duration (minutes)"
                                name="duration"
                                type="number"
                                value={formData.duration}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                margin="dense"
                                variant="outlined"
                                InputProps={{ endAdornment: <InputAdornment position="end">mins</InputAdornment> }}
                                inputProps={{ min: 0 }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField 
                                label="MovieQ Rating" 
                                name="movieqRating" 
                                type="number"
                                value={formData.movieqRating || 0} 
                                onChange={handleInputChange} 
                                fullWidth 
                                margin="dense" 
                                variant="outlined" 
                                inputProps={{ step: 0.01, min: 0, max: 10 }}
                                InputProps={{ endAdornment: <InputAdornment position="end">/10</InputAdornment> }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField 
                                label="IMDB Rating" 
                                name="imdbRating" 
                                type="number"
                                value={formData.imdbRating || 0} 
                                onChange={handleInputChange} 
                                fullWidth 
                                margin="dense" 
                                variant="outlined" 
                                inputProps={{ step: 0.1, min: 0, max: 10 }}
                                InputProps={{ endAdornment: <InputAdornment position="end">/10</InputAdornment> }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField 
                                label="Letterboxd Rating" 
                                name="letterboxdRating" 
                                type="number"
                                value={formData.letterboxdRating || 0} 
                                onChange={handleInputChange} 
                                fullWidth 
                                margin="dense" 
                                variant="outlined" 
                                inputProps={{ step: 0.1, min: 0, max: 10 }}
                                InputProps={{ endAdornment: <InputAdornment position="end">/10</InputAdornment> }}
                            />
                        </Grid>
                        
                        {/* Genres Dropdown */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom>Genres, Cast & Crew</Typography>
                        </Grid>
                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                <Autocomplete
                                    multiple
                                    id="genres-selection"
                                    options={genres}
                                    getOptionLabel={(option) => option.name}
                                    loading={loadingGenres}
                                    value={selectedGenres}
                                    onChange={handleGenreChange}
                                    sx={{ flexGrow: 1 }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Genres"
                                            placeholder="Select genres"
                                            variant="outlined"
                                            margin="dense"
                                        />
                                    )}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => {
                                            const tagProps = getTagProps({ index });
                                            return (
                                                <Chip
                                                    label={option.name}
                                                    {...tagProps}
                                                    size="small"
                                                />
                                            );
                                        })
                                    }
                                />
                                {mode === 'edit' && (
                                    <Box sx={{ display: 'flex', ml: 1, mt: 1 }}>
                                        <Tooltip title="Reset to original genres">
                                            <IconButton 
                                                onClick={handleResetGenres} 
                                                size="small"
                                                disabled={loadingGenres}
                                            >
                                                <Refresh fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Clear all genres">
                                            <IconButton 
                                                onClick={handleClearGenres} 
                                                size="small"
                                                disabled={loadingGenres}
                                            >
                                                <LabelOff fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                )}
                            </Box>
                        </Grid>
                        
                        {/* Directors Dropdown with Search */}
                        <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                <Autocomplete
                                    multiple
                                    id="directors-selection"
                                    options={directorOptions}
                                    getOptionLabel={(option) => option.name}
                                    loading={loadingDirectors || loadingInitialPersons}
                                    value={selectedDirectors}
                                    onChange={handleDirectorChange}
                                    sx={{ flexGrow: 1 }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Directors"
                                            placeholder="Search directors"
                                            variant="outlined"
                                            margin="dense"
                                            onChange={(e) => setDirectorSearch(e.target.value)}
                                        />
                                    )}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => {
                                            const tagProps = getTagProps({ index });
                                            return (
                                                <Chip
                                                    label={option.name}
                                                    {...tagProps}
                                                    size="small"
                                                />
                                            );
                                        })
                                    }
                                />
                                {mode === 'edit' && (
                                    <Box sx={{ display: 'flex', ml: 1, mt: 1 }}>
                                        <Tooltip title="Reset to original directors">
                                            <IconButton 
                                                onClick={handleResetDirectors} 
                                                size="small"
                                                disabled={loadingDirectors}
                                            >
                                                <Refresh fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Clear all directors">
                                            <IconButton 
                                                onClick={handleClearDirectors} 
                                                size="small"
                                                disabled={loadingDirectors}
                                            >
                                                <PersonRemove fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                )}
                            </Box>
                        </Grid>
                        
                        {/* Actors Dropdown with Search */}
                        <Grid item xs={12} sm={6}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                                <Autocomplete
                                    multiple
                                    id="actors-selection"
                                    options={actorOptions}
                                    getOptionLabel={(option) => option.name}
                                    loading={loadingActors || loadingInitialPersons}
                                    value={selectedActors}
                                    onChange={handleActorChange}
                                    sx={{ flexGrow: 1 }}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Actors"
                                            placeholder="Search actors"
                                            variant="outlined"
                                            margin="dense"
                                            onChange={(e) => setActorSearch(e.target.value)}
                                        />
                                    )}
                                    renderTags={(value, getTagProps) =>
                                        value.map((option, index) => {
                                            const tagProps = getTagProps({ index });
                                            return (
                                                <Chip
                                                    label={option.name}
                                                    {...tagProps}
                                                    size="small"
                                                />
                                            );
                                        })
                                    }
                                />
                                {mode === 'edit' && (
                                    <Box sx={{ display: 'flex', ml: 1, mt: 1 }}>
                                        <Tooltip title="Reset to original actors">
                                            <IconButton 
                                                onClick={handleResetActors} 
                                                size="small"
                                                disabled={loadingActors}
                                            >
                                                <Refresh fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Clear all actors">
                                            <IconButton 
                                                onClick={handleClearActors} 
                                                size="small"
                                                disabled={loadingActors}
                                            >
                                                <PersonRemove fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                )}
                            </Box>
                        </Grid>

                        {/* Full Description */}
                        <Grid item xs={12}>
                            <TextField label="Description / Overview" name="description" value={formData.description} onChange={handleInputChange} fullWidth required margin="dense" variant="outlined" multiline rows={4}/>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions className='dialog-actions'>
                    <Button onClick={onClose} disabled={isLoading}>Cancel</Button>
                    <Button type="submit" variant="contained" color='primary' disabled={isLoading}>
                        {isLoading ? <CircularProgress size={24} /> : (mode === 'add' ? 'Add Movie' : 'Save Changes')}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};