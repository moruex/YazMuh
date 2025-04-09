import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

interface CreateFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (folderName: string) => void;
    currentPath: string;
}

const CreateFolderModal: React.FC<CreateFolderModalProps> = ({ isOpen, onClose, onCreate, currentPath }) => {
    const [folderName, setFolderName] = useState('');

    const handleCreate = () => {
        onCreate(folderName);
        setFolderName('');
        onClose();
    };

    return (
        <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle className='dialog-title'>
                Create New Folder
                <IconButton onClick={onClose}>
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent className='dialog-content'>
                <p>Enter name for new folder in: {currentPath}</p>
                <TextField
                    sx={{ mt: 2 }}
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    placeholder="Folder name"
                    fullWidth
                />
            </DialogContent>
            <DialogActions className='dialog-actions'>
                <Button onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    onClick={handleCreate}
                    variant="contained"
                    color="primary">
                    Create
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateFolderModal;
