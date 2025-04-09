import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';

interface FileItem {
    name: string;
    isDirectory: boolean;
    size: number;
    lastModified: string;
}

interface RenameModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRename: (newName: string) => void;
    selectedItem: FileItem | null;
}

const RenameModal: React.FC<RenameModalProps> = ({ isOpen, onClose, onRename, selectedItem }) => {
    const [newName, setNewName] = useState(selectedItem?.name);

    const handleRenameModal = () => {
        onRename(newName);
        setNewName('');
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
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    fullWidth
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
                    >
                    Rename
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RenameModal;