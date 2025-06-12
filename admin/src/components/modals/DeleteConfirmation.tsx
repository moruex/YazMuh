import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, DialogContentText } from '@mui/material';

interface DeleteConfirmationProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({ open, onClose, onConfirm, title, message }) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            aria-labelledby="delete-confirmation-dialog-title"
            aria-describedby="delete-confirmation-dialog-description"
        >
            <DialogTitle className='dialog-title' id="delete-confirmation-dialog-title">
                {title}
                {!title && ' Confirm Delete'}
            </DialogTitle>
            <DialogContent className='dialog-content' sx={{ pb: 5}}>
                <DialogContentText id="delete-confirmation-dialog-description">
                    {message}
                    {!message && 'Are you sure you want to proceed with this deletion?'}
                </DialogContentText>
            </DialogContent>
            <DialogActions className='dialog-actions'>
                <Button onClick={onClose} color="primary">
                    Cancel
                </Button>
                <Button onClick={onConfirm} color="error" variant="contained">
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DeleteConfirmation;