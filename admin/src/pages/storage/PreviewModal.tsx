import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, CircularProgress, Typography, Box, TextField } from '@mui/material'; // Added TextField
import { copyToClipboard, copyToClipboardLog } from '@utils/utils'; // Adjust import path
import { Link as LinkIcon } from 'lucide-react'; // Renamed to avoid conflict
import { Close } from '@mui/icons-material';
import { FileItem } from './interface'; // Adjust import path
import { getSignedUrlForDownload } from './utils'; // Import the specific util for temporary links
import { addNotification } from '@utils/utils'; // Import notification util

interface PreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedItem: FileItem | null;
    onDownload: (item: FileItem) => void; // Keep this, download action is separate
}

const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, selectedItem, onDownload }) => {
    // State for the URL to be displayed/used (can be public or temporary signed)
    const [displayUrl, setDisplayUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isTemporaryUrl, setIsTemporaryUrl] = useState<boolean>(false); // Track if the URL is signed

    useEffect(() => {
        setDisplayUrl(null); // Reset on item change or close
        setError(null);
        setIsLoading(false);
        setIsTemporaryUrl(false);

        if (isOpen && selectedItem && !selectedItem.isDirectory) {
            // --- URL Logic ---
            if (selectedItem.publicUrl) {
                // 1. Use public URL if available
                console.log("Using public URL for preview:", selectedItem.publicUrl);
                setDisplayUrl(selectedItem.publicUrl);
                setIsTemporaryUrl(false);
                setIsLoading(false); // Already have the URL
            } else {
                // 2. Fetch temporary signed URL if public is not available
                console.log("Public URL not found, fetching temporary signed URL for preview...");
                const fetchTemporaryUrl = async () => {
                    setIsLoading(true);
                    const signedUrl = await getSignedUrlForDownload(selectedItem.path, false); // false = don't force download for preview
                    if (signedUrl) {
                        console.log("Using temporary signed URL for preview:", signedUrl);
                        setDisplayUrl(signedUrl);
                        setIsTemporaryUrl(true);
                    } else {
                        setError("Could not load preview (failed to get temporary link).");
                    }
                    setIsLoading(false);
                };
                fetchTemporaryUrl();
            }
        }
    }, [isOpen, selectedItem]); // Re-run when modal opens or item changes

    // Memoize content based on displayUrl to avoid re-renders
    const previewContent = useMemo(() => {
        if (isLoading) {
            return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 250 }}><CircularProgress /></Box>;
        }
        if (error) {
            return <Typography color="error" sx={{ textAlign: 'center', mt: 2, p: 2 }}>{error}</Typography>;
        }
        if (!selectedItem || !displayUrl) {
             return <Typography sx={{ textAlign: 'center', mt: 2, p: 2 }}>No preview available.</Typography>; // Handle case where URL is null
        }

        const extension = selectedItem.name.split('.').pop()?.toLowerCase();

        // Use displayUrl (public or signed) for src attributes
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension || '')) {
            return <img src={displayUrl} alt={selectedItem.name} className="preview-image" style={{ maxWidth: '100%', maxHeight: '60vh', display: 'block', margin: 'auto' }} />;
        } else if (['mp4', 'webm', 'ogv'].includes(extension || '')) {
            return (
                <video controls className="preview-video" style={{ maxWidth: '100%', maxHeight: '60vh', display: 'block', margin: 'auto' }}>
                    <source src={displayUrl} type={`video/${extension === 'ogv' ? 'ogg' : extension}`} />
                    Your browser does not support the video tag.
                </video>
            );
        } else if (['mp3', 'wav', 'ogg', 'aac'].includes(extension || '')) {
            return (
                <audio controls className="preview-audio" style={{ width: '100%', marginTop: '20px' }}>
                    <source src={displayUrl} type={`audio/${extension === 'aac' ? 'aac' : (extension === 'ogg' ? 'ogg' : extension)}`} />
                    Your browser does not support the audio tag.
                </audio>
            );
        } else if (extension === 'pdf') {
             // Embed PDF using iframe or embed tag
             return (
                <iframe
                    src={`${displayUrl}#view=fitH`} // Add fragment to help control view, might vary
                    title="PDF Preview"
                    style={{ width: '100%', height: '65vh', border: 'none' }}
                    // sandbox="allow-scripts allow-same-origin" // May restrict PDF functionality
                />
            );
        } else if (['txt', 'md', 'json', 'xml', 'html', 'css', 'js', 'log'].includes(extension || '')) {
            // Use iframe for text-based files - relies on browser rendering + Content-Type header
             return (
                <iframe
                    src={displayUrl}
                    title="Text Preview"
                    style={{ width: '100%', height: '65vh', border: '1px solid #ccc' }}
                    sandbox="allow-scripts allow-same-origin" // Sandboxing recommended
                />
            );
        } else {
            return (
                <div className="no-preview" style={{ textAlign: 'center', padding: '20px' }}>
                    <p>No preview available for this file type ({extension}).</p>
                    <p>Use the download button to access the file.</p>
                </div>
            );
        }
    }, [isLoading, error, selectedItem, displayUrl]); // Dependencies for memoization

    const handleDownloadClick = () => {
        if (selectedItem) {
            onDownload(selectedItem); // Call the passed download handler
        }
    }

    const handleCopyToClipboard = () => {
        if (displayUrl) {
             copyToClipboardLog(displayUrl, `Link copied! ${isTemporaryUrl ? '(Temporary)' : '(Public)'}`);
            //  addNotification(`Link copied! ${isTemporaryUrl ? '(Temporary link - expires)' : ''}`, 'success');
        } else {
             addNotification("No URL available to copy.", "warning");
        }
    }

    return (
        <Dialog open={isOpen} onClose={onClose} maxWidth="xs" fullWidth> {/* Use large for better previews */}
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
               <span> Preview: {selectedItem?.name}</span>
                <IconButton aria-label="close" onClick={onClose} sx={{ p: 1 }}>
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 2 }}> {/* Add dividers */}
                {previewContent}
            </DialogContent>
             {/* URL Display and Copy Section */}
             {(displayUrl || isLoading) && ( // Show even while loading URL
                 <Box sx={{ p: 2, borderTop: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 1}}>
                     <TextField
                         fullWidth
                         variant="outlined"
                         size="small"
                         label={isTemporaryUrl ? "Temporary Link (Expires)" : "Public Link"}
                         value={isLoading ? "Loading URL..." : (displayUrl || "N/A")}
                         InputProps={{
                             readOnly: true,
                         }}
                         title={displayUrl ?? ''} // Show full URL on hover
                         disabled={isLoading}
                     />
                     <Button
                         variant="outlined"
                         onClick={handleCopyToClipboard}
                         startIcon={<LinkIcon size={16} />}
                         disabled={!displayUrl || isLoading}
                         sx={{ flexShrink: 0 }} // Prevent button shrinking
                     >
                         Copy
                     </Button>
                 </Box>
             )}
            <DialogActions sx={{ p: 1, borderTop: '1px solid #eee' }}>
                <Button onClick={onClose}>
                    Close
                </Button>
                <Button
                    onClick={handleDownloadClick}
                    variant="contained"
                    color="primary"
                    disabled={!selectedItem || selectedItem.isDirectory || isLoading} // Disable if loading URL too
                >
                    Download
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default PreviewModal;