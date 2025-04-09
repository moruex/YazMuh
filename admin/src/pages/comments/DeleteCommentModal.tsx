import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';

interface DeleteCommentDialogProps {
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteCommentModal: React.FC<DeleteCommentDialogProps> = ({
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog open={true} onClose={onClose}>
      <DialogTitle>Confirm Delete</DialogTitle>
      <DialogContent>
        <p>Are you sure you want to delete this comment? This action cannot be undone.</p>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};