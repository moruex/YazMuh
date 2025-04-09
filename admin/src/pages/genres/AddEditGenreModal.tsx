// src/components/Genres/AddEditGenreModal.tsx

import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    CircularProgress,
    IconButton,
    FormControlLabel,
    Checkbox, // Import Checkbox
    Box, // For layout
    Typography, // For image placeholder text
} from '@mui/material';
import { Close, Image as ImageIcon } from '@mui/icons-material';
import type { ApiGenreCore, GenreInputData } from '../../interfaces'; // Use updated interfaces

interface AddEditGenreModalProps {
    mode: 'add' | 'edit';
    open: boolean;
    onClose: () => void;
    onSubmit: (data: GenreInputData) => Promise<void>; // Expects a promise for async handling
    isLoading: boolean;
    genre?: ApiGenreCore | null; // Use API type, allow null
}

// Default values matching the input data structure
const defaultGenreData: GenreInputData = {
    name: '',
    description: '',
    image_url: '',
    is_collection: false, // Default to false
};

export const AddEditGenreModal = ({
    mode,
    open,
    onClose,
    onSubmit,
    isLoading,
    genre
}: AddEditGenreModalProps) => {
    // State now holds data matching GenreInputData structure
    const [formData, setFormData] = useState<GenreInputData>(defaultGenreData);

    useEffect(() => {
        // When opening in edit mode, map the ApiGenreCore to GenreInputData
        if (mode === 'edit' && genre) {
            setFormData({
                name: genre.name ?? '',
                description: genre.description ?? '',
                image_url: genre.image_url ?? '',
                is_collection: genre.is_collection ?? false,
            });
        } else {
            // Reset to default for add mode or if genre is null
            setFormData(defaultGenreData);
        }
    }, [mode, genre, open]); // Rerun effect when modal opens

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // No need to construct data here, formData is already correct
        await onSubmit(formData);
        // Consider only closing if submit was successful (parent component handles this)
        // onClose(); // Let parent decide when to close
    };

    // Get image URL from formData for display
    const displayImageUrl = formData.image_url;
    const displayName = formData.name;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth className="genre-modal">
            <DialogTitle className="dialog-title">
                {mode === 'add' ? 'Add Genre' : `Edit Genre: ${genre?.name ?? ''}`}
                <IconButton aria-label="close" className="close-button" onClick={onClose} disabled={isLoading}>
                    <Close />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit}>
                <DialogContent dividers> {/* Use dividers for better separation */}
                    <Box display="flex" gap={3}> {/* Use Box for layout */}
                        {/* Image Section */}
                        <Box
                            flexShrink={0}
                            width={150}
                            height={225} // Maintain aspect ratio
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            bgcolor="action.hover" // Placeholder background
                            borderRadius={1}
                            overflow="hidden" // Clip image if needed
                            sx={{ border: '1px dashed grey', margin: 'auto'}}
                        >
                            {displayImageUrl ? (
                                <img
                                    src={displayImageUrl}
                                    alt={displayName || "Genre"}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; /* Hide on error */ }}
                                />
                            ) : (
                                <Box textAlign="center" color="text.secondary">
                                    <ImageIcon sx={{ fontSize: 40 }} />
                                    <Typography variant="caption">No Image</Typography>
                                </Box>
                            )}
                        </Box>

                        {/* Fields Section */}
                        <Box flexGrow={1} display="flex" flexDirection="column" gap={2}>
                            <TextField
                                name="name"
                                label="Name"
                                value={formData.name}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                disabled={isLoading}
                                size="small" // Consistent sizing
                            />
                             <TextField // Optional: Add URL validation or use file upload later
                                name="image_url"
                                label="Image URL"
                                value={formData.image_url ?? ''} // Handle null/undefined
                                onChange={handleInputChange}
                                fullWidth
                                disabled={isLoading}
                                size="small"
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name="is_collection"
                                        checked={formData.is_collection}
                                        onChange={handleCheckboxChange}
                                        disabled={isLoading}
                                        color="primary"
                                    />
                                }
                                label="Collection"
                            />
                            <TextField
                                name="description"
                                label="Description"
                                value={formData.description ?? ''} // Handle null/undefined
                                onChange={handleInputChange}
                                fullWidth
                                multiline
                                rows={4}
                                disabled={isLoading}
                                size="small"
                            />
                        </Box>
                    </Box>
                </DialogContent>

                <DialogActions className="dialog-actions">
                    <Button onClick={onClose} disabled={isLoading} >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isLoading}
                        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {mode === 'add' ? 'Add Genre' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};