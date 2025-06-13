// src/pages/comments/CommentsPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { Button, CircularProgress, Box, Alert, debounce, Checkbox, FormControlLabel, TextField, InputAdornment } from '@mui/material';
import { Search, MessageSquarePlus } from 'lucide-react'; // Icons needed
import { useQuery, useMutation, ApolloError } from '@apollo/client';

// GraphQL Operations & Types - Adjust paths as needed
import {
    GET_COMMENTS,
    // GET_COMMENT_COUNT, // Add if/when you implement count query
    DELETE_COMMENT,
} from '@graphql/index';
import type { ApiComment } from '@interfaces/index';

// Child Components - Adjust paths as needed
import { CommentsTable } from './CommentsTable';
import { EditCommentModal } from './EditCommentModal';
import { CensorCommentModal } from './CensorCommentModal';
import { AddCommentModal } from './AddCommentModal';

export const CommentsPage: React.FC = () => {
    // State for pagination, filtering, modals
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [globalFilter, setGlobalFilter] = useState(''); // Input value for search
    const [debouncedFilter, setDebouncedFilter] = useState(''); // Debounced value for API query
    const [includeCensored, setIncludeCensored] = useState(false); // Filter toggle
    const [modalState, setModalState] = useState<{
        mode: 'add' | 'edit' | 'censor' | null;
        comment: ApiComment | null; // Holds the comment for edit/censor modals
    }>({ mode: null, comment: null });
    const [pageMutationError, setPageMutationError] = useState<string | null>(null); // Displays errors from delete action

    // Debounce search input to avoid excessive API calls
    const updateDebouncedFilter = useCallback(
        debounce((value: string) => {
            setDebouncedFilter(value);
            setPagination(p => ({ ...p, pageIndex: 0 })); // Reset to first page when search term changes
        }, 500), // 500ms delay
        [] // Empty dependency array as debounce setup doesn't change
    );

    // Effect to trigger debounced update when the raw filter changes
    useEffect(() => {
        updateDebouncedFilter(globalFilter);
    }, [globalFilter, updateDebouncedFilter]);


    // --- GraphQL Query for Comments ---
    // Fetches comments based on current state (pagination, filters, search)
    const { data: commentsData, loading: loadingComments, error: commentsError } = useQuery<{ comments: ApiComment[] /* ; commentCount?: number */ }>(
        GET_COMMENTS,
        {
            variables: {
                // movieId: null, // Omitting movie ID to fetch all comments
                limit: pagination.pageSize,
                offset: pagination.pageIndex * pagination.pageSize,
                includeCensored: includeCensored,
                search: debouncedFilter || null // Use debounced search term, pass null if empty
            },
            fetchPolicy: 'cache-and-network', // Ensures data is fetched but cache is checked first
            notifyOnNetworkStatusChange: true, // Helps update loading state on refetch/pagination
            onError: (err) => console.error("Error fetching comments:", err),
        }
    );

    const comments = commentsData?.comments || []; // Default to empty array if data is not yet available
    // *** IMPORTANT: Accurate pagination requires a total count from the backend ***
    // TODO: Replace this fallback with a real count from a backend `commentCount` query
    const totalCommentCount = comments.length ? (pagination.pageIndex * pagination.pageSize) + comments.length + (comments.length === pagination.pageSize ? 1 : 0) : 0; // Very rough fallback estimate
    console.warn("Using inaccurate fallback totalCommentCount. Implement backend count query.");
    const queryLoading = loadingComments;


    // --- Delete Mutation Hook ---
    // Handles deleting comments and updating the cache
    const [deleteCommentMutation, { loading: isDeleting }] = useMutation(DELETE_COMMENT, {
        onError: (error: ApolloError) => {
            console.error("Error deleting comment:", error);
            setPageMutationError(`Error deleting comment: ${error.graphQLErrors?.[0]?.message || error.message}`);
        },
        // Update Apollo cache directly for faster UI response after deletion
        update(cache, { data: { deleteComment: success } }, { variables }) {
            const commentId = variables?.commentId;
            if (success && commentId) {
                setPageMutationError(null); // Clear error on success
                const normalizedId = cache.identify({ id: commentId, __typename: 'Comment' }); // Get cache ID
                cache.evict({ id: normalizedId }); // Remove comment from cache
                cache.gc(); // Trigger garbage collection
                // TODO: Refetch count query here if using one, or decrement manually if feasible
            } else if (!success) {
                 setPageMutationError("Deletion failed on server.");
            }
        },
    });


    // --- Event Handlers ---
    // Update page index
    const handlePageChange = (newPage: number) => {
        if (newPage >= 0) { // Basic validation
             setPagination(prev => ({ ...prev, pageIndex: newPage }));
        }
    };

    // Update page size and reset to page 0
    const handleRowsPerPageChange = (newSize: number) => {
        setPagination({ pageIndex: 0, pageSize: newSize });
    };

    // Toggle censored filter and reset to page 0
    const handleToggleIncludeCensored = (event: React.ChangeEvent<HTMLInputElement>) => {
        setIncludeCensored(event.target.checked);
        setPagination(prev => ({ ...prev, pageIndex: 0 }));
    };

    // Modal Openers - set state to control which modal is shown
    const openAddModal = () => setModalState({ mode: 'add', comment: null });
    const openEditModal = (comment: ApiComment) => setModalState({ mode: 'edit', comment });
    const openCensorModal = (comment: ApiComment) => setModalState({ mode: 'censor', comment });

    // Modal Closer - reset modal state
    const closeModal = () => setModalState({ mode: null, comment: null });

    // Delete handler - shows confirmation and calls mutation
    const handleDelete = async (id: string) => {
        setPageMutationError(null); // Clear previous errors
        const adminId = localStorage.getItem('adminId'); // Get adminId

        if (!adminId) {
            setPageMutationError('Actor ID (Admin ID) not found. Please ensure you are logged in as an admin.');
            return;
        }

        if (window.confirm(`Delete comment ID ${id}? This cannot be undone.`)) {
            try {
                await deleteCommentMutation({ variables: { performingActorId: adminId, commentId: id } }); // Pass performingActorId and commentId
                // Outcome (success/error/cache update) handled by mutation hook options
            } catch (e) {
                // Catch potential network errors during the call itself
                console.error("Delete mutation call failed unexpectedly:", e);
                setPageMutationError("An unexpected error occurred while trying to delete.");
            }
        }
    };

    // Combined loading state for disabling UI elements during critical operations
    const isMutating = isDeleting; // Add other loading states here if needed

    // Prepare current query variables to pass to Add modal for refetching correctly
    const currentQueryVarsForRefetch = {
         // movieId: null, // Not filtering by movie
         limit: pagination.pageSize,
         offset: 0, // Always refetch first page after adding a comment
         includeCensored: includeCensored,
         search: debouncedFilter || null
     };


    return (
        // Main container for the page
        <div className="comments-management-container">
            {/* Header section with controls */}
            <div className="page-header">
                <TextField
                    placeholder="Search all comments or users..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)} // Update raw search term on change
                    variant="outlined"
                    size="small"
                    disabled={queryLoading || isMutating} // Disable while loading/mutating
                    InputProps={{
                        startAdornment: ( <InputAdornment position="start"><Search size={18} /></InputAdornment> ),
                    }}
                    sx={{ mr: 2, minWidth: '300px' }}
                />
                 <Box sx={{ flexGrow: 1 }} /> {/* Pushes items to the right */}
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={includeCensored}
                            onChange={handleToggleIncludeCensored}
                            disabled={queryLoading || isMutating}
                        />
                     }
                    label="Show Censored"
                    sx={{ mr: 2 }}
                />
                <Button
                    className="btn" // Keep custom class if needed
                    variant="contained"
                    color="primary"
                    onClick={openAddModal}
                    disabled={isMutating} // Disable button during delete etc.
                    startIcon={<MessageSquarePlus />}
                >
                    Add Comment
                </Button>
            </div>

            {/* Display loading indicator or errors */}
            {queryLoading && comments.length === 0 && <Box display="flex" justifyContent="center" p={3}><CircularProgress /></Box>}
            {commentsError && <Alert severity="error" sx={{ m: 2 }}>Error loading comments: {commentsError.message}</Alert>}
            {pageMutationError && <Alert severity="warning" sx={{ m: 2 }}>{pageMutationError}</Alert>}

            {/* Render the comments table */}
            <CommentsTable
                comments={comments}
                onEdit={openEditModal}
                onCensor={openCensorModal}
                onDelete={handleDelete}
                page={pagination.pageIndex}
                rowsPerPage={pagination.pageSize}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
                // Show loading overlay only when refetching/searching after initial data load
                isLoading={queryLoading && comments.length > 0}
                totalCount={totalCommentCount} // Pass the (potentially inaccurate) count
            />

            {/* Conditionally render modals based on state */}
            {modalState.mode === 'add' && (
                <AddCommentModal
                    open={true}
                    onClose={closeModal}
                    currentQueryVars={currentQueryVarsForRefetch} // Pass vars needed for refetching
                />
            )}
            {modalState.mode === 'edit' && modalState.comment && (
                <EditCommentModal
                    open={true}
                    onClose={closeModal}
                    comment={modalState.comment} // Pass the selected comment
                />
            )}
            {modalState.mode === 'censor' && modalState.comment && (
                <CensorCommentModal
                    open={true}
                    onClose={closeModal}
                    comment={modalState.comment} // Pass the selected comment
                />
            )}
        </div>
    );
};