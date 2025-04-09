// src/components/Comments/AddCommentModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
  CircularProgress, IconButton, Alert, Box
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useMutation, ApolloError } from '@apollo/client';
import { ADMIN_ADD_COMMENT, GET_COMMENTS } from '@graphql/index'; // Adjust path
import type { AdminAddCommentInput } from '@interfaces/index'; // Adjust path

interface AddCommentModalProps {
  open: boolean;
  onClose: () => void;
  // Pass current query variables to refetch correctly
  currentQueryVars: {
      // movieId: string;
      limit: number;
      offset: number;
      includeCensored: boolean;
      search: string;
  }
}

export const AddCommentModal = ({
  open,
  onClose,
  currentQueryVars
}: AddCommentModalProps) => {
  const [movieId, setMovieId] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [mutationError, setMutationError] = useState<string | null>(null);

  const [adminAddCommentMutation, { loading: isLoading }] = useMutation(ADMIN_ADD_COMMENT, {
      onCompleted: () => {
          setMutationError(null);
          setContent('');
          setMovieId('');
          onClose();
      },
      onError: (error: ApolloError) => {
          console.error("Error adding comment:", error);
          setMutationError(error.graphQLErrors?.[0]?.message || error.message || "Failed to add comment.");
      },
      // Refetch the main comments query with current variables after adding
      refetchQueries: [{
          query: GET_COMMENTS,
          variables: currentQueryVars
      }],
      awaitRefetchQueries: true, // Ensure refetch completes before onCompleted might fire other logic
  });

  useEffect(() => {
      if (open) {
          // Pre-fill movie ID if possible from context, otherwise leave blank
          setMovieId(currentQueryVars.movieId || ''); // Use movie ID from page context if available
          setContent('');
          setMutationError(null);
      }
  }, [open, currentQueryVars.movieId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMutationError(null);
    if (!movieId.trim() || !content.trim()) {
      setMutationError('Movie ID and Comment content are required.');
      return;
    }
    // Validate if Movie ID is a number/correct format if needed before sending
    // const parsedMovieId = parseInt(movieId.trim(), 10);
    // if (isNaN(parsedMovieId)) { ... }

    const input: AdminAddCommentInput = {
        movie_id: movieId.trim(), // Send as string as per GraphQL ID type usually
        content: content.trim(),
    };

    await adminAddCommentMutation({ variables: { input } });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth aria-labelledby="add-comment-dialog-title">
      <DialogTitle id="add-comment-dialog-title" className='dialog-title'>
        Admin Add New Comment
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }} aria-label="close">
          <Close />
        </IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {mutationError && <Alert severity="error" sx={{ mb: 2 }}>{mutationError}</Alert>}
          <TextField
            label="Movie ID *"
            value={movieId}
            onChange={(e) => setMovieId(e.target.value)}
            fullWidth
            required
            variant="outlined"
            placeholder="Enter the ID of the movie..."
            margin="normal"
            disabled={isLoading}
          />
          <TextField
            label="Comment Content *"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            fullWidth
            required
            multiline
            rows={4}
            variant="outlined"
            placeholder="Write the comment here..."
            margin="normal"
            disabled={isLoading}
          />
        </DialogContent>
        <DialogActions className='dialog-actions'>
          <Button onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isLoading || !movieId.trim() || !content.trim()}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? 'Posting...' : 'Post Comment'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};