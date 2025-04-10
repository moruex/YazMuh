// AddEditMovieModal.tsx
import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
    Chip, IconButton, Rating, Stack, Grid, InputAdornment, Box, Typography, CircularProgress
} from '@mui/material';
import { Close, Add } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { Movie } from '@interfaces/movie.interfaces'; // Corrected import path

interface AddEditMovieModalProps {
    mode: 'add' | 'edit';
    open: boolean;
    onClose: () => void;
    onSubmit: (data: Omit<Movie, 'id'>) => void; // Expects frontend Movie structure (without ID)
    isLoading: boolean;
    movie?: Movie; // Receives frontend Movie structure for editing
}

// Default data matches the frontend Movie interface (excluding ID)
const defaultMovieData: Omit<Movie, 'id'> = {
    title: '',
    imageUrl: '',
    trailerUrl: '',
    shortDescription: '', // Keep even if not directly editable, might be displayed
    description: '',
    genres: [],
    directors: [],
    actors: [],
    rating: 0, // Keep for potential display, but not editable
    releaseDate: new Date().toISOString().split('T')[0], // Default to today YYYY-MM-DD
    duration: 0, // Default duration
};

export const AddEditMovieModal = ({
    mode,
    open,
    onClose,
    onSubmit,
    isLoading,
    movie // Receives full frontend Movie object for edit mode
}: AddEditMovieModalProps) => {
    // State holds data matching the frontend Movie interface (excluding ID)
    const [formData, setFormData] = useState<Omit<Movie, 'id'>>(defaultMovieData);

    // Separate state for managing chip inputs
    const [currentChipInput, setCurrentChipInput] = useState({
        genres: '',
        directors: '',
        actors: '',
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
            } else {
                // If adding, reset to default
                setFormData(defaultMovieData);
            }
            // Reset chip inputs when modal opens or mode changes
            setCurrentChipInput({ genres: '', directors: '', actors: ''});
        }
    }, [mode, movie, open]); // Depend on `open` to trigger effect

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
         const finalValue = type === 'number' ? (value === '' ? '' : Number(value)) : value; // Allow clearing number field
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

     // Handle changes in chip input fields
     const handleChipInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCurrentChipInput(prev => ({ ...prev, [name]: value }));
    };

    // Add item to array fields (genres, directors, actors)
    const handleAddChip = (field: 'genres' | 'directors' | 'actors') => {
        const value = currentChipInput[field].trim();
        if (value === '' || formData[field].includes(value)) {
             setCurrentChipInput(prev => ({ ...prev, [field]: '' }));
             return;
        }
        setFormData(prev => ({
            ...prev,
            [field]: [...prev[field], value]
        }));
        setCurrentChipInput(prev => ({ ...prev, [field]: '' }));
    };

    // Remove item from array fields
    const handleRemoveChip = (field: 'genres' | 'directors' | 'actors', valueToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].filter((item) => item !== valueToRemove)
        }));
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Add validation if needed here before submitting
        const dataToSubmit = {
            ...formData,
            // Ensure duration is a number, default to 0 if empty string or invalid
            duration: typeof formData.duration === 'number' ? formData.duration : 0,
        };
        onSubmit(dataToSubmit);
    };

    const getTitle = () => {
        if (mode === 'add') return 'Add New Movie';
        return `Edit Movie: ${movie?.title || '...'}`; // Show movie title or loading dots
    }

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
                            <TextField label="Image URL" name="imageUrl" value={formData.imageUrl} onChange={handleInputChange} fullWidth required margin="dense" variant="outlined"/>
                        </Grid>
                        {/* Trailer URL */}
                         <Grid item xs={12} sm={6}>
                            <TextField label="Trailer URL (YouTube)" name="trailerUrl" value={formData.trailerUrl || ''} onChange={handleInputChange} fullWidth margin="dense" variant="outlined" placeholder="e.g., https://www.youtube.com/watch?v=..." />
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
                         {/* Rating Display (Read-only) */}
                         <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            <Typography component="legend" sx={{ mr: 1 }}>Avg Rating:</Typography>
                             <Rating name="rating-display" value={formData.rating} precision={0.5} readOnly />
                             <Typography sx={{ ml: 1 }}>({(formData.rating ?? 0).toFixed(1)})</Typography>
                        </Grid>

                        {/* --- Array Inputs (Chips) --- */}
                        {(['genres', 'directors', 'actors'] as const).map((field) => (
                            <Grid item xs={12} sm={6} md={4} key={field}> {/* Adjust grid sizing */}
                                <TextField
                                    label={`Add ${field.charAt(0).toUpperCase() + field.slice(1)}`}
                                    name={field}
                                    value={currentChipInput[field]}
                                    onChange={handleChipInputChange}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddChip(field);
                                        }
                                    }}
                                    fullWidth
                                    margin="dense"
                                    variant="outlined"
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton edge="end" onClick={() => handleAddChip(field)} size="small" title={`Add ${field.slice(0, -1)}`} disabled={!currentChipInput[field].trim()}>
                                                    <Add fontSize="small" />
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1, minHeight: '30px' }}>
                                    {formData[field].map((item) => (
                                        <Chip
                                            key={`${field}-${item}`} // Use item itself for key if unique
                                            label={item}
                                            onDelete={() => handleRemoveChip(field, item)}
                                            size="small"
                                        />
                                    ))}
                                </Box>
                            </Grid>
                        ))}
                         {/* --- End Array Inputs --- */}

                        {/* Full Description */}
                        <Grid item xs={12}>
                             <TextField label="Description / Plot Summary" name="description" value={formData.description} onChange={handleInputChange} fullWidth required margin="dense" variant="outlined" multiline rows={4}/>
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