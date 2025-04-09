// src/components/News/ViewNewsModal.tsx

import { Close } from "@mui/icons-material";
import { Box, Dialog, DialogTitle, IconButton, DialogContent, Typography, DialogActions, Button, Chip } from "@mui/material";
// Use interface matching GraphQL schema
import type { ApiNews } from '../../interfaces'; // Adjust path if needed

interface ViewNewsModalProps {
    isOpen: boolean;
    onClose: () => void;
    news: ApiNews | null; // Allow null in case it's closed before data loads
}

// Helper to format date for display
const formatDisplayDate = (isoString: string | null | undefined): string => {
    if (!isoString) return 'N/A';
    try {
        // Use toLocaleString for better formatting including time
        return new Date(isoString).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    } catch (e) {
        return 'Invalid Date';
    }
};

export const ViewNewsModal = ({
    isOpen,
    onClose,
    news // news prop is now typed as ApiNews | null
}: ViewNewsModalProps) => {

    // Add a check to prevent rendering if news is null
    if (!news) {
        return null;
    }

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle className="dialog-title">
                {news.title}
                <IconButton aria-label="close" onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                    {/* Image Section */}
                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                        {news.image_url ? (
                            <Box
                                component="img"
                                src={news.image_url}
                                alt={news.title}
                                sx={{ maxWidth: '100%', maxHeight: 350, objectFit: 'contain', borderRadius: 1, mb: 2 }}
                            />
                        ) : (
                            <Typography color="text.secondary" sx={{ mt: 4 }}>No Image</Typography>
                        )}
                    </Box>

                    {/* Content Section */}
                    <Box sx={{ flex: 2 }}>
                        <Typography variant="h5" component="h2" gutterBottom>{news.title}</Typography>
                        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                            {/* FIXED: Access username and use correct date field */}
                            {news.author ? `By ${news.author.username}` : 'System'} | Published: {formatDisplayDate(news.published_at)}
                        </Typography>
                        {/* Display linked movies */}
                        {news.movies && news.movies.length > 0 && (
                            <Box sx={{ my: 1 }}>
                                <Typography variant="caption" component="div" color="text.secondary">Linked Movies:</Typography>
                                {news.movies.map(movie => (
                                    <Chip key={movie.id} label={movie.title} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                                ))}
                            </Box>
                        )}

                        {/* FIXED: Use short_content from ApiNews */}
                        {news.short_content && (
                            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>Summary</Typography>
                                <Typography variant="body1">{news.short_content}</Typography>
                            </Box>
                        )}

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>Content</Typography>
                            {/* Render content - Careful if it contains HTML/Markdown */}
                            {/* FIXED: Use content from ApiNews */}
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{news.content}</Typography>
                        </Box>

                        <Typography variant="caption" color="text.secondary">
                             {/* FIXED: Use correct date fields */}
                            Created: {formatDisplayDate(news.created_at)} | Updated: {formatDisplayDate(news.updated_at)}
                        </Typography>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary">Close</Button>
            </DialogActions>
        </Dialog>
    );
};