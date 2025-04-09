import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { FileItem } from './interface'; // Use updated interface
import path from 'path-browserify'; // Needed if displaying path

interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedItem: FileItem | null;
    // Removed currentPath prop, info comes from selectedItem
}

// Helper to format size and date (could be moved to utils)
const formatFileSizeModal = (bytes: number | null): string => {
    if (bytes === null || bytes === undefined) return '-';
    if (bytes === 0) return '0 Bytes';
    const k = 1024; const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
const formatDateModal = (dateString: string | null): string => {
    if (!dateString) return '-';
    try { return new Date(dateString).toLocaleString(); }
    catch (e) { return dateString; }
};

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, selectedItem }) => {
    // Calculate display path inside the component
    const displayPath = selectedItem
        ? path.dirname(selectedItem.path.replace(/^\./, '')).replace(/^$/, '/') // Show '/' for root
        : '/';

    return (
        <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth='xs'>
            <DialogTitle className='dialog-title'>
                {selectedItem?.isDirectory ? 'Folder' : 'File'} Information
                <IconButton onClick={onClose}> {/* Added onClick to close button */}
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent className='dialog-content'>
                {selectedItem ? (
                    <ul className="file-details-list">
                        <li><span className="label">Name</span><span className="value">{selectedItem.name}</span></li>
                        <li><span className="label">Type</span><span className="value">{selectedItem.isDirectory ? "Folder" : "File"}</span></li>
                        <li><span className="label">Size</span><span className="value">{formatFileSizeModal(selectedItem.size)}</span></li>
                        <li><span className="label">Modified</span><span className="value">{formatDateModal(selectedItem.lastModified)}</span></li>
                        <li><span className="label">Location</span><span className="value">{displayPath}</span></li>
                        <li><span className="label">Full Path</span><span className="value">{selectedItem.path}</span></li>
                    </ul>
                ) : (
                    <p>No item selected.</p> // Handle case where selectedItem is null
                )}
            </DialogContent>
            <DialogActions className='dialog-actions'>
                <Button onClick={onClose}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default InfoModal;