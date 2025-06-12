// src/components/News/AddEditNewsModal.tsx

import React, { useEffect, useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
    Grid, IconButton, CircularProgress, Box, Typography, /* FormControl, 
    InputLabel, Select, MenuItem, FormHelperText, SelectChangeEvent, Chip */ // Chip might still be used for tags if we kept them, but tags are removed
} from '@mui/material';
import { Close } from '@mui/icons-material';
import type { ApiNewsArticle, CreateNewsArticleInput, UpdateNewsArticleInput } from '../../interfaces';
// import { useQuery } from '@apollo/client'; // Not needed if categories are removed
// import { GET_NEWS_CATEGORIES } from '../../graphql'; // Not needed

interface AddEditNewsModalProps {
    mode: 'add' | 'edit';
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CreateNewsArticleInput | UpdateNewsArticleInput) => Promise<void>;
    isLoading: boolean;
    news?: ApiNewsArticle | null;
}

const defaultFormData: CreateNewsArticleInput = {
    title: '',
    content: '',
    excerpt: '',
    featured_image_url: '',
    published_at: '', // Will be set to current time for 'add' or kept from news item
    // tags: [] // Tags removed
};

const formatDateForInput = (isoString: string | null | undefined): string => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        const timezoneOffset = date.getTimezoneOffset() * 60000;
        const localISOTime = new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
        return localISOTime;
    } catch (e) {
        return '';
    }
};

export const AddEditNewsModal = ({
    mode,
    open,
    onClose,
    onSubmit,
    isLoading,
    news
}: AddEditNewsModalProps) => {
    const [formData, setFormData] = useState<CreateNewsArticleInput | UpdateNewsArticleInput>(defaultFormData);
    // const { data: categoriesData } = useQuery(GET_NEWS_CATEGORIES); // Categories removed
    // const categories = categoriesData?.newsCategories || []; // Categories removed

    useEffect(() => {
        if (mode === 'edit' && news) {
            setFormData({
                title: news.title || '',
                content: news.content || '',
                excerpt: news.excerpt || '',
                featured_image_url: news.featured_image_url || '',
                published_at: formatDateForInput(news.published_at),
                // category_id: news.category_id || '', // Categories removed
                // tags: news.tags || [] // Tags removed
                author_id: news.author_id || null // Ensure author_id is part of the form if needed for update/create
            });
        } else {
            setFormData({
                ...defaultFormData,
                published_at: mode === 'add' ? formatDateForInput(new Date().toISOString()) : '',
                author_id: null // default author_id for new article if applicable
            });
        }
    }, [mode, news, open]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // const handleSelectChange = (e: SelectChangeEvent<string>) => { // Select for category removed
    //     const { name, value } = e.target;
    //     setFormData(prev => ({ ...prev, [name]: value }));
    // };

    // const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => { // Tags input removed
    //     const tagString = e.target.value;
    //     const tagArray = tagString.split(',')
    //         .map(tag => tag.trim())
    //         .filter(tag => tag !== '');
    //     setFormData(prev => ({ ...prev, tags: tagArray }));
    // };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        let finalPublishedAt: string | null = null;
        if (formData.published_at) {
            try {
                finalPublishedAt = new Date(formData.published_at).toISOString();
            } catch (e) {
                console.error("Invalid date format:", formData.published_at);
                return;
            }
        } else {
            finalPublishedAt = null;
        }
        // Ensure author_id is correctly passed if it's part of formData and your input types
        const submissionData: CreateNewsArticleInput | UpdateNewsArticleInput = {
             ...formData,
            published_at: finalPublishedAt,
        };
        // If author_id is not managed in this form but set by backend, remove from here.
        // Otherwise, ensure it's part of submissionData if needed by mutations.
        // Based on current CreateNewsArticleInput, author_id is optional.

        await onSubmit(submissionData);
    };

    // const tagsToString = (tags?: string[] | null): string => { // Tags display helper removed
    //     if (!tags || tags.length === 0) return '';
    //     return tags.join(', ');
    // };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle className='dialog-title'>
                {mode === 'add' ? 'Add News Article' : `Edit News: ${news?.title ?? ''}`}
                <IconButton aria-label="close" onClick={onClose} disabled={isLoading} sx={{ position: 'absolute', right: 8, top: 8 }}>
                    <Close />
                </IconButton>
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent dividers>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Box sx={{ mb: 1, border: '1px dashed grey', height: 150, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', bgcolor:'action.hover' }}>
                                {formData.featured_image_url ? (
                                    <img src={formData.featured_image_url} alt="Preview" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                                ) : (
                                    <Typography color="text.secondary">Image Preview</Typography>
                                )}
                            </Box>
                            <TextField
                                name="featured_image_url"
                                label="Image URL"
                                value={formData.featured_image_url ?? ''}
                                onChange={handleInputChange}
                                fullWidth
                                disabled={isLoading}
                                size="small"
                            />
                        </Grid>

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

                        <Grid item xs={12}> {/* Was md={6}, changed to full width as category is removed */}
                           <TextField
                                name="published_at"
                                label="Publish Date & Time (optional)"
                                type="datetime-local"
                                value={formData.published_at || ''}
                                onChange={handleInputChange}
                                fullWidth
                                disabled={isLoading}
                                size="small"
                                InputLabelProps={{ shrink: true }}
                                helperText="Leave empty to keep as draft / unpublish"
                            />
                        </Grid>

                        {/* Category Selection Removed */}
                        {/* <Grid item xs={12} md={6}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Category</InputLabel>
                                <Select
                                    name="category_id"
                                    value={formData.category_id || ''}
                                    label="Category"
                                    onChange={handleSelectChange}
                                    disabled={isLoading}
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    {categories.map((category) => (
                                        <MenuItem key={category.id} value={category.id}>
                                            {category.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                <FormHelperText>Select a category for the article</FormHelperText>
                            </FormControl>
                        </Grid> */}

                        {/* Tags Input Removed */}
                        {/* <Grid item xs={12}>
                            <TextField
                                name="tags"
                                label="Tags"
                                value={tagsToString(formData.tags)}
                                onChange={handleTagsChange}
                                fullWidth
                                size="small"
                                helperText="Enter tags separated by commas"
                                disabled={isLoading}
                            />
                            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {formData.tags?.map(tag => (
                                    <Chip
                                        key={tag}
                                        label={tag}
                                        size="small"
                                    />
                                ))}
                            </Box>
                        </Grid> */}

                        <Grid item xs={12}>
                            <TextField
                                name="excerpt"
                                label="Short Excerpt"
                                value={formData.excerpt ?? ''}
                                onChange={handleInputChange}
                                fullWidth
                                multiline
                                rows={3}
                                disabled={isLoading}
                                size="small"
                                helperText="Brief summary of the article"
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