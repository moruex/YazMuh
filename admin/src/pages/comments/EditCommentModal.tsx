// src/components/Comments/EditCommentModal.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, CircularProgress, Alert, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useMutation, ApolloError } from '@apollo/client';
import { UPDATE_COMMENT } from '@graphql/index'; // Adjust path
import type { ApiComment, CommentUpdateInput } from '@interfaces/index'; // Adjust path

interface EditCommentModalProps {
  open: boolean;
  onClose: () => void;
  comment: ApiComment;
}

export const EditCommentModal = ({
  open,
  onClose,
  comment,
}: EditCommentModalProps) => {
  const [content, setContent] = useState('');
  const [mutationError, setMutationError] = useState<string | null>(null);

  const [updateCommentMutation, { loading: isLoading }] = useMutation(UPDATE_COMMENT, {
      onCompleted: () => {
          setMutationError(null);
          onClose();
      },
      onError: (error: ApolloError) => {
          console.error("Error updating comment:", error);
          setMutationError(error.graphQLErrors?.[0]?.message || error.message || "Failed to update comment.");
      }
      // Note: Cache updates automatically for modified fields if ID and __typename match
  });

  useEffect(() => {
    if (open && comment) {
      setContent(comment.content);
      setMutationError(null);
    }
  }, [comment, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMutationError(null);
    const adminId = localStorage.getItem('adminId'); // Get adminId to use as performingActorId

    if (!content.trim()) {
        setMutationError("Comment content cannot be empty.");
        return;
    }
    if (!adminId) { // Check if adminId exists
        setMutationError('Actor ID (Admin ID) not found. Please ensure you are logged in as an admin.');
        return;
    }
    // if (content.trim() === comment.content) { // This check might be too strict if only updated_at needs to change
    //     onClose(); 
    //     return;
    // }

    const input: CommentUpdateInput = { content: content.trim() };

    await updateCommentMutation({
        variables: {
            performingActorId: adminId, // Pass adminId as performingActorId
            commentId: comment.id, // Ensure field name is commentId
            input: input
        }
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      className="comment-modal" // Keep existing class if needed
      aria-labelledby="edit-comment-dialog-title"
    >
      <DialogTitle id="edit-comment-dialog-title" className="dialog-title">
        Edit Comment (ID: {comment?.id})
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }} aria-label="close">
          <Close />
        </IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {mutationError && <Alert severity="error" sx={{ mb: 2 }}>{mutationError}</Alert>}
          <TextField
            label="Comment Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            fullWidth
            required
            multiline
            rows={4}
            variant="outlined"
            disabled={isLoading}
            margin="normal"
          />
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isLoading || !content.trim()}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};