// src/components/News/AddEditNewsModal.tsx

import React, { useEffect, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
    Grid, IconButton, CircularProgress, Box, Typography,
} from '@mui/material';
import { Close } from '@mui/icons-material';
// Use interfaces matching GraphQL schema
import type { ApiNews, NewsInputData } from '../../interfaces';
// Import movie query/types if needed for movie selection
// import { useQuery } from '@apollo/client';
// import { GET_MOVIES_BASIC } // A query to fetch movie list { id, title }
// import { ApiMovieCore } from '../../interfaces';

interface AddEditNewsModalProps {
    mode: 'add' | 'edit';
    open: boolean;
    onClose: () => void;
    onSubmit: (data: NewsInputData) => Promise<void>; // Expects async submit
    isLoading: boolean;
    news?: ApiNews | null; // Use API type
}

// Default form data matching NewsInputData
const defaultFormData: NewsInputData = {
    title: '',
    short_content: '',
    content: '',
    image_url: '',
    published_at: '', // Use ISO string format YYYY-MM-DDTHH:mm
    movie_ids: [], // Default to empty array
};

// Helper to format date for datetime-local input
const formatDateForInput = (isoString: string | null | undefined): string => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        // Adjust for timezone offset to display correctly in local time input
        const timezoneOffset = date.getTimezoneOffset() * 60000; //offset in milliseconds
        const localISOTime = new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
        return localISOTime;
    } catch (e) {
        return ''; // Handle invalid date string
    }
};


export const AddEditNewsModal = ({
    mode,
    open,
    onClose,
    onSubmit,
    isLoading,
    news: newsItem
}: AddEditNewsModalProps) => {
    const [formData, setFormData] = useState<NewsInputData>(defaultFormData);
    // --- State for Movie Selection (Example) ---
    // const [movieSearch, setMovieSearch] = useState('');
    // const { data: movieData, loading: movieLoading } = useQuery(GET_MOVIES_BASIC, { variables: { search: movieSearch, limit: 20 }});
    // const movieOptions = movieData?.movies ?? [];
    // const selectedMovies = movieOptions.filter(m => formData.movie_ids?.includes(m.id));

    useEffect(() => {
        if (mode === 'edit' && newsItem) {
            setFormData({
                title: newsItem.title ?? '',
                short_content: newsItem.short_content ?? '',
                content: newsItem.content ?? '',
                image_url: newsItem.image_url ?? '',
                // Format date from API for the input field
                published_at: formatDateForInput(newsItem.published_at),
                // Extract movie IDs if present
                movie_ids: newsItem.movies?.map(m => m.id) ?? [],
            });
        } else {
            setFormData({
                ...defaultFormData,
                // Optionally set default published_at to now when adding
                published_at: mode === 'add' ? formatDateForInput(new Date().toISOString()) : '',
            });
        }
    }, [mode, newsItem, open]); // Rerun when modal opens

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // --- Handler for Movie Autocomplete (Example) ---
    // const handleMovieChange = (event: any, newValue: readonly ApiMovieCore[]) => {
    //     setFormData(prev => ({
    //         ...prev,
    //         movie_ids: newValue.map(movie => movie.id)
    //     }));
    // };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Convert date back to ISO string or let backend handle it if it accepts various formats
        // Ensure published_at is valid or null before sending
        let finalPublishedAt: string | null = null;
        if (formData.published_at) {
            try {
                finalPublishedAt = new Date(formData.published_at).toISOString();
            } catch (e) {
                 console.error("Invalid date format:", formData.published_at);
                 // Handle error - maybe show validation message
                 return;
            }
        }

        await onSubmit({
            ...formData,
            published_at: finalPublishedAt, // Send ISO string or null
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle className='dialog-title'>
                {mode === 'add' ? 'Add News Article' : `Edit News: ${newsItem?.title ?? ''}`}
                <IconButton aria-label="close" onClick={onClose} disabled={isLoading} sx={{ position: 'absolute', right: 8, top: 8 }}>
                    <Close />
                </IconButton>
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent dividers>
                    <Grid container spacing={2}>
                        {/* Image Preview (Optional but helpful) */}
                         <Grid item xs={12}>
                            <Box sx={{ mb: 1, border: '1px dashed grey', height: 150, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', bgcolor:'action.hover' }}>
                                {formData.image_url ? (
                                    <img src={formData.image_url} alt="Preview" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                ) : (
                                    <Typography color="text.secondary">Image Preview</Typography>
                                )}
                            </Box>
                            <TextField
                                name="image_url"
                                label="Image URL"
                                value={formData.image_url ?? ''}
                                onChange={handleInputChange}
                                fullWidth
                                disabled={isLoading}
                                size="small"
                            />
                        </Grid>

                        {/* Form Fields */}
                        <Grid item xs={12}>
                            <TextField
                                name="title"
                                label="Title"
                                value={formData.title}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                disabled={isLoading}
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                           <TextField
                                name="published_at"
                                label="Publish Date & Time"
                                type="datetime-local" // Use datetime-local input
                                value={formData.published_at}
                                onChange={handleInputChange}
                                fullWidth
                                disabled={isLoading}
                                size="small"
                                InputLabelProps={{ shrink: true }} // Keep label shrunk
                                // Consider adding helper text for format
                            />
                        </Grid>
                         {/* Movie Selection (Example using Autocomplete) */}
                         {/* <Grid item xs={12} md={6}>
                             <Autocomplete
                                 multiple
                                 id="news-movie-links"
                                 options={movieOptions}
                                 getOptionLabel={(option) => option.title}
                                 value={selectedMovies}
                                 loading={movieLoading}
                                 onChange={handleMovieChange}
                                 onInputChange={(event, newInputValue) => {
                                     setMovieSearch(newInputValue);
                                 }}
                                 isOptionEqualToValue={(option, value) => option.id === value.id}
                                 renderInput={(params) => (
                                     <TextField
                                         {...params}
                                         variant="outlined"
                                         label="Link Movies"
                                         placeholder="Search movies..."
                                         size="small"
                                         InputProps={{
                                             ...params.InputProps,
                                             endAdornment: (
                                                 <>
                                                     {movieLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                     {params.InputProps.endAdornment}
                                                 </>
                                             ),
                                         }}
                                     />
                                 )}
                             />
                        </Grid> */}

                        <Grid item xs={12}>
                            <TextField
                                name="short_content"
                                label="Short Content (Preview)"
                                value={formData.short_content ?? ''}
                                onChange={handleInputChange}
                                fullWidth
                                multiline
                                rows={3}
                                disabled={isLoading}
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                name="content"
                                label="Full Content"
                                value={formData.content}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                multiline
                                rows={6}
                                disabled={isLoading}
                                size="small"
                            />
                        </Grid>

                    </Grid>
                </DialogContent>

                <DialogActions className='dialog-actions'>
                    <Button onClick={onClose} disabled={isLoading} color="secondary">
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color='primary'
                        disabled={isLoading}
                        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {mode === 'add' ? 'Add News' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};