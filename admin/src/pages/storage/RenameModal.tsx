import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import path from 'path';
import { FileItem } from './interface'; // Import shared interface

/* // Remove local definition
interface FileItem {
    name: string;
    isDirectory: boolean;
    size: number;
    lastModified: string;
}
*/

interface RenameModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRename: (newName: string) => void;
    selectedItem: FileItem | null;
}

const RenameModal: React.FC<RenameModalProps> = ({ isOpen, onClose, onRename, selectedItem }) => {
    const [newName, setNewName] = useState(selectedItem?.name);
    const [error, setError] = useState('');

    const handleRenameModal = () => {
        const trimmedValue = newName?.trim();
        if (!trimmedValue) {
            setError('Filename cannot be empty.');
            return;
        }
        // Handle path.basename for undefined case
        const originalFilename = path.basename(selectedItem?.name ?? '');
        if (trimmedValue === originalFilename) {
            onClose(); // No change
            return; // Exit early
        }
        
        onRename(trimmedValue);
        setNewName('');
        setError('');
        // onClose will likely be called by the parent after onRename completes
    };

    return (
        <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle className='dialog-title'>
                <b>Rename {selectedItem?.isDirectory ? 'Folder' : 'File'}</b>
            </DialogTitle>
            <DialogContent className='dialog-content'>
                <p>Enter new name for: {selectedItem?.name}</p>
                <TextField
                    sx={{ mt: 2}}
                    placeholder={selectedItem?.name}
                    value={newName || ''}
                    onChange={(e) => {
                        setNewName(e.target.value);
                        if (error) setError('');
                    }}
                    fullWidth
                    error={!!error}
                    helperText={error}
                />
            </DialogContent>
            <DialogActions className='dialog-actions'>
                <Button onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    onClick={handleRenameModal}
                    variant="contained"
                    color="primary"
                    disabled={!newName?.trim() || newName.trim() === path.basename(selectedItem?.name ?? '')}
                    >
                    Rename
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RenameModal;