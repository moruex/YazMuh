// CensorCommentModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button,
  CircularProgress, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, Alert, Box, IconButton, Typography
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { useQuery, useMutation, ApolloError } from '@apollo/client';
import { GET_CENSORSHIP_REASONS, CENSOR_COMMENT, UNCENSOR_COMMENT } from '@graphql/index'; // Adjust path
import type { ApiComment, ApiCensorshipReason, CensorCommentInput } from "@interfaces/index"; // Use ApiComment

interface CensorCommentModalProps {
  open: boolean;
  onClose: () => void;
  // onSubmit removed - logic handled internally by mutations
  comment: ApiComment; // Use API interface
}

export const CensorCommentModal = ({
  open,
  onClose,
  comment,
}: CensorCommentModalProps) => {
  // Determine initial action based on comment's current state
  const [action, setAction] = useState<'censor' | 'uncensor'>(comment.is_currently_censored ? 'uncensor' : 'censor');
  const [reasonCode, setReasonCode] = useState<string>(''); // Store the reason_code
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [mutationError, setMutationError] = useState<string | null>(null);

  // Fetch Censorship Reasons
  const { data: reasonsData, loading: loadingReasons, error: reasonsError } = useQuery<{ censorshipReasons: ApiCensorshipReason[] }>(
      GET_CENSORSHIP_REASONS,
      {
          variables: { activeOnly: true }, // Fetch only active reasons
          skip: !open, // Don't fetch if modal isn't open
          fetchPolicy: 'cache-and-network',
      }
  );
  const censorReasonOptions = reasonsData?.censorshipReasons || [];

  // Censor Mutation
  const [censorCommentMutation, { loading: isCensoring }] = useMutation(CENSOR_COMMENT, {
      onCompleted: () => {
          setMutationError(null);
          onClose(); // Close modal on success
      },
      onError: (error: ApolloError) => {
          console.error("Error censoring comment:", error);
          setMutationError(error.graphQLErrors?.[0]?.message || error.message || "Failed to censor comment.");
      },
      // Update cache to reflect censored status immediately
      update(cache, { data: { censorComment: updatedComment } }) {
        if (!updatedComment) return;
        cache.modify({
            id: cache.identify(updatedComment),
            fields: {
                is_currently_censored() { return true; },
                updated_at() { return updatedComment.updated_at; } // Update timestamp
                // Optionally update content if backend replaces it
                // content() { return '[censored]' }
            }
        })
      }
  });

  // Uncensor Mutation
  const [uncensorCommentMutation, { loading: isUncensoring }] = useMutation(UNCENSOR_COMMENT, {
       onCompleted: () => {
          setMutationError(null);
          onClose(); // Close modal on success
      },
      onError: (error: ApolloError) => {
          console.error("Error uncensoring comment:", error);
          setMutationError(error.graphQLErrors?.[0]?.message || error.message || "Failed to uncensor comment.");
      },
      // Update cache to reflect uncensored status immediately
       update(cache, { data: { uncensorComment: updatedComment } }) {
         if (!updatedComment) return;
         cache.modify({
            id: cache.identify(updatedComment),
            fields: {
                is_currently_censored() { return false; },
                 updated_at() { return updatedComment.updated_at; }
                // Optionally restore original content if backend doesn't
                // content(originalContentFromLog) { return originalContentFromLog }
            }
         })
      }
  });

  const isLoading = isCensoring || isUncensoring;

  // Reset state when modal opens or comment changes
  useEffect(() => {
    if (open) {
        setAction(comment.is_currently_censored ? 'uncensor' : 'censor');
        setReasonCode(''); // Reset reason on open
        setAdminNotes('');
        setMutationError(null);
    }
  }, [comment, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMutationError(null);
    const adminId = localStorage.getItem('adminId'); // Get adminId

    if (!adminId) { // Check if adminId exists
        setMutationError('Admin ID not found. Please ensure you are logged in as an admin.');
        return;
    }

    if (action === 'censor') {
        if (!reasonCode) {
            setMutationError("Please select a reason for censorship.");
            return;
        }
        const input: CensorCommentInput = {
            reason_code: reasonCode,
            admin_notes: adminNotes.trim() || null, // Send null if empty
        };
        await censorCommentMutation({ variables: { performingAdminId: adminId, commentId: comment.id, input } });
    } else { // action === 'uncensor'
        await uncensorCommentMutation({ variables: { performingAdminId: adminId, commentId: comment.id } });
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm" // Adjusted size
      fullWidth
      className="censor-modal" // Keep existing class if needed
      aria-labelledby="censor-comment-dialog-title"
    >
      <DialogTitle id="censor-comment-dialog-title" className="dialog-title">
        Moderate Comment (ID: {comment?.id})
         <IconButton onClick={onClose} className="modal-close-button" aria-label="close" sx={{ position: 'absolute', right: 8, top: 8 }}>
          <Close />
        </IconButton>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent dividers>
          {mutationError && <Alert severity="error" sx={{ mb: 2 }}>{mutationError}</Alert>}
          <Box mb={2} p={1.5} border={1} borderColor="divider" borderRadius={1}>
             <Typography variant="overline" display="block" gutterBottom>Original Comment:</Typography>
             <Typography variant="body2" sx={{ maxHeight: 150, overflowY: 'auto' }}>{comment?.content}</Typography>
          </Box>

          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <FormLabel component="legend">Action</FormLabel>
            <RadioGroup
              row // Display radios horizontally
              value={action}
              onChange={(e) => setAction(e.target.value as 'censor' | 'uncensor')}
            >
              <FormControlLabel
                value="censor"
                control={<Radio />}
                label="Censor"
                disabled={comment.is_currently_censored || isLoading} // Can't censor if already censored
              />
              <FormControlLabel
                value="uncensor"
                control={<Radio />}
                label="Uncensor"
                disabled={!comment.is_currently_censored || isLoading} // Can't uncensor if not censored
              />
            </RadioGroup>
          </FormControl>

          {action === 'censor' && (
            <Box className="reason-section">
              {loadingReasons && <CircularProgress size={24} />}
              {reasonsError && <Alert severity="warning" sx={{ mb: 1 }}>Could not load reasons: {reasonsError.message}</Alert>}
              {!loadingReasons && !reasonsError && censorReasonOptions.length === 0 && <Alert severity="info">No censorship reasons found.</Alert>}

              {!loadingReasons && censorReasonOptions.length > 0 && (
                  <FormControl component="fieldset" required error={!reasonCode && !!mutationError}>
                      <FormLabel component="legend">Reason *</FormLabel>
                      <RadioGroup
                          value={reasonCode}
                          onChange={(e) => setReasonCode(e.target.value)}
                      >
                      {censorReasonOptions.map(option => (
                          <FormControlLabel
                              key={option.reason_code}
                              value={option.reason_code}
                              control={<Radio size="small" />}
                              label={`${option.reason_code}: ${option.description}`}
                          />
                      ))}
                      </RadioGroup>
                  </FormControl>
              )}

              <TextField
                label="Admin Notes (Optional)"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                fullWidth
                multiline
                rows={2}
                margin="normal"
                variant="outlined"
                disabled={isLoading}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions className="dialog-actions">
          <Button onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color={action === 'censor' ? 'error' : 'primary'}
            disabled={isLoading || (action === 'censor' && !reasonCode)}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? 'Processing...' : action === 'censor' ? 'Confirm Censor' : 'Confirm Uncensor'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};