// src/components/News/ViewNewsModal.tsx

import { Close } from "@mui/icons-material";
import { Box, Dialog, DialogTitle, IconButton, DialogContent, Typography, DialogActions, Button /*, Chip*/ } from "@mui/material"; // Chip might not be needed if tags & category are gone
import type { ApiNewsArticle } from '../../interfaces';

interface ViewNewsModalProps {
    isOpen: boolean;
    onClose: () => void;
    news: ApiNewsArticle | null;
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

// Helper to determine if an article is published based on published_at
const getDerivedStatusText = (published_at: string | null | undefined): string => {
    if (published_at) {
        const publishDate = new Date(published_at);
        if (publishDate.getTime() <= Date.now()) {
            return 'Published';
        }
        return 'Scheduled';
    }
    return 'Draft';
};

export const ViewNewsModal = ({
    isOpen,
    onClose,
    news
}: ViewNewsModalProps) => {

    // Add a check to prevent rendering if news is null
    if (!news) {
        return null;
    }

    const derivedStatusText = getDerivedStatusText(news.published_at);

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
                        {news.featured_image_url ? (
                            <Box
                                component="img"
                                src={news.featured_image_url}
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
                            {news.author ? `By ${news.author.username}` : 'System'}
                            {news.published_at && derivedStatusText === 'Published' ? ` | Published: ${formatDisplayDate(news.published_at)}` : (derivedStatusText === 'Scheduled' ? ` | Scheduled: ${formatDisplayDate(news.published_at)}` : ' | Draft')}
                        </Typography>

                        {/* Status text - derived from published_at (No Chip needed if just text) */}
                        <Typography variant="caption" sx={{ mb: 2, display: 'block', fontStyle: 'italic' }}>
                            Status: {derivedStatusText}
                        </Typography>

                        {/* Category Display Removed */}
                        {/* Tags Display Removed */}

                        {/* Excerpt/Short content */}
                        {news.excerpt && (
                            <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>Summary</Typography>
                                <Typography variant="body1">{news.excerpt}</Typography>
                            </Box>
                        )}

                        <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>Content</Typography>
                            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{news.content}</Typography>
                        </Box>

                        <Typography variant="caption" color="text.secondary">
                            Updated: {formatDisplayDate(news.updated_at)}
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