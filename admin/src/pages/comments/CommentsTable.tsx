// src/components/Comments/CommentsTable.tsx
import React from 'react';
import { Edit, Trash2, Eye, EyeOff, MessageSquare, AlertTriangle } from "lucide-react";
import { Tooltip, Box, Typography, CircularProgress } from "@mui/material";
import type { ApiComment } from "@interfaces/index"; // Adjust path

interface CommentsTableProps {
  comments: ReadonlyArray<ApiComment>; // Input comments array
  onEdit: (comment: ApiComment) => void; // Callback when edit is clicked
  onCensor: (comment: ApiComment) => void; // Callback when censor/uncensor is clicked
  onDelete: (id: string) => void; // Callback when delete is clicked
  page: number; // Current page index (0-based)
  rowsPerPage: number; // Number of rows per page
  onPageChange: (newPage: number) => void; // Callback for page change
  onRowsPerPageChange: (rows: number) => void; // Callback for rows per page change
  isLoading?: boolean; // Optional flag for loading state overlay
  totalCount?: number; // Total number of comments (for pagination) - crucial for accuracy
}

export const CommentsTable = ({
  comments,
  onEdit,
  onCensor,
  onDelete,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  isLoading = false,
  totalCount = 0, // Default to 0 if not provided
}: CommentsTableProps) => {

  // Handler for the rows per page select dropdown
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(event.target.value, 10);
    onRowsPerPageChange(newSize); // Notify parent component to update state
  };

  // Determine the effective total count for pagination display
  // Use provided totalCount if > 0, otherwise fallback (which is inaccurate for API pagination)
  const effectiveTotalCount = totalCount > 0 ? totalCount : (isLoading ? 0 : comments.length);
  // Calculate total number of pages
  const pageCount = rowsPerPage > 0 ? Math.ceil(effectiveTotalCount / rowsPerPage) : 0;
  // Check if any data is currently displayed or available
  // const isEmpty = !isLoading && comments.length === 0 && totalCount === 0; // UNUSED

  // Calculate the range of items being shown (e.g., "1-10")
  const showingFrom = effectiveTotalCount === 0 ? 0 : page * rowsPerPage + 1;
  const showingTo = Math.min((page + 1) * rowsPerPage, effectiveTotalCount);

  // Determine if the 'Next' button should be disabled
  const isNextDisabled = isLoading || (page + 1 >= pageCount) || (!totalCount && comments.length < rowsPerPage && comments.length > 0);


  return (
    // Container for the table and pagination
    <div className="comments-table-container">
      {/* The main table structure */}
      <table className="main-table"> {/* Keep existing class for styling */}
        <thead>
          <tr>
            <th className="column-center">Author</th>
            <th>Comment</th>
            <th>Movie</th>
            <th className="mhide">Date</th>{/* mhide suggests hiding on mobile */}
            <th className="mhide">Stats</th>
            <th className="mhide">Status</th>
            <th className="column-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* Display loading spinner if initial fetch is loading */}
          {isLoading && comments.length === 0 ? (
            <tr>
              <td colSpan={7} className="loading-cell" style={{ textAlign: 'center', padding: '20px' }}>
                <CircularProgress size={24} /> Loading comments...
              </td>
            </tr>
          ) : /* Display no data message if fetch complete and no comments found */
            !isLoading && comments.length === 0 ? (
              <tr>
                <td colSpan={7} className="no-data-cell" style={{ textAlign: 'center', padding: '20px' }}>
                  No comments found.
                </td>
              </tr>
            ) : (
              /* Map over the comments array to render table rows */
              comments.map((comment) => (
                <tr key={comment.id} className={comment.is_currently_censored ? "censored-row" : ""}>
                  {/* Author Column */}
                  <td data-label="Author" className="author-cell">
                    <Box display="flex" alignItems="center" gap={1}>
                      <img
                        src={comment.user?.avatar_url || "https://via.placeholder.com/40/cccccc/808080?text=?"} // Fallback image
                        alt={comment.user?.username ?? 'User avatar'}
                        className="author-avatar" // CSS class for styling
                        width={32} height={32}
                        style={{ borderRadius: '50%', objectFit: 'cover' }}
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://via.placeholder.com/40/cccccc/808080?text=?"; }} // Handle broken images
                      />
                      <Typography variant="body2" component="span" noWrap title={comment.user?.username ?? 'Unknown'}>
                        {comment.user?.username ?? 'Unknown'}
                      </Typography>
                    </Box>
                  </td>
                  {/* Comment Content Column */}
                  <td data-label="Comment">
                    <div className="comment-content">
                      {comment.is_currently_censored ? (
                        <Tooltip title="This comment content is currently hidden.">
                          <span className="censored-text" style={{ fontStyle: 'italic', color: '#888' }}>
                            [Comment Censored]
                          </span>
                        </Tooltip>
                      ) : (
                        <Typography variant="body2" style={{ wordBreak: 'break-word' }}>{comment.content}</Typography>
                      )}
                      {/* Display "(edited)" badge if applicable */}
                      {comment.updated_at > comment.created_at && !comment.is_currently_censored && (
                        <Tooltip title={`Last updated: ${new Date(comment.updated_at).toLocaleString()}`}>
                          <Typography variant="caption" component="span" sx={{ ml: 1, color: 'text.secondary' }}>
                            (edited)
                          </Typography>
                        </Tooltip>
                      )}
                    </div>
                  </td>
                  {/* Movie Title Column */}
                  <td data-label="Movie" className="movie-cell">
                    <Typography variant="body2" className="movie-title" noWrap title={comment.movie?.title ?? 'N/A'}>
                      {comment.movie?.title ?? 'N/A'}
                    </Typography>
                  </td>
                  {/* Date Column */}
                  <td data-label="Date" className="date-cell mhide">
                    <Tooltip title={new Date(comment.created_at).toLocaleString()}>
                      <Typography variant="body2">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </Typography>
                    </Tooltip>
                  </td>
                  {/* Stats Column */}
                  <td data-label="Stats" className="stats-cell mhide">
                    <Box display="flex" gap={1.5}>
                      <Tooltip title={`${comment.replies?.length ?? '?'} Replies (Loaded)`}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <MessageSquare size={14} />
                          <Typography variant="body2">{comment.replies?.length ?? '?'}</Typography>
                        </Box>
                      </Tooltip>
                      <Tooltip title={`${comment.likes_count} Likes`}>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>♥</Typography>
                          <Typography variant="body2">{comment.likes_count}</Typography>
                        </Box>
                      </Tooltip>
                    </Box>
                  </td>
                  {/* Status Column */}
                  <td data-label="Status" className="status-cell mhide">
                    {comment.is_currently_censored ? (
                      <Typography component="span" className="status-badge censored" sx={{ color: 'warning.main', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                        <AlertTriangle size={14} /> Censored
                      </Typography>
                    ) : (
                      <Typography component="span" className="status-badge visible" sx={{ color: 'success.main' }}>
                        Visible
                      </Typography>
                    )}
                  </td>
                  {/* Actions Column */}
                  <td data-label="Actions" className="column-actions">
                    <div className="main-action-buttons"> {/* Keep button container class */}
                      <Tooltip title="Edit Comment">
                        <span> {/* Span wrapper needed for tooltip on disabled button */}
                          <button
                            onClick={() => onEdit(comment)}
                            className="main-btn main-btn-icon rename" // Keep button classes
                            disabled={comment.is_currently_censored || isLoading} // Disable edit if censored or loading
                          >
                            <Edit size={16} />
                          </button>
                        </span>
                      </Tooltip>
                      <Tooltip title={comment.is_currently_censored ? "Review/Uncensor" : "Censor Comment"}>
                        <button
                          onClick={() => onCensor(comment)}
                          className={`main-btn main-btn-icon ${comment.is_currently_censored ? 'info' : 'warning'}`} // Dynamic class example
                          disabled={isLoading} // Disable during loading
                        >
                          {comment.is_currently_censored ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                      </Tooltip>
                      <Tooltip title="Delete Comment">
                        <button
                          onClick={() => onDelete(comment.id)}
                          className="main-btn main-btn-icon delete"
                          disabled={isLoading} // Disable during loading
                        >
                          <Trash2 size={16} />
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))
            )}
        </tbody>
      </table>

      {/* Pagination Controls - Show only if needed */}

      <div className="comments-pagination-controls"> {/* Use your specific class */}
        <div className="rows-per-page">
          <span>Rows per page:</span>
          <select value={rowsPerPage} onChange={handleRowsPerPageChange} disabled={isLoading} >
            {[5, 10, 25, 50].map(option => (<option key={option} value={option}>{option}</option>))}
          </select>
        </div>
        {/* Show range only if count is somewhat known */}
        {(effectiveTotalCount > 0) && (
          <div className="page-info">
            Showing {showingFrom}-{showingTo} of {effectiveTotalCount}
            {/* Add warning if count is estimated */}
            {!totalCount && <Tooltip title="Total count estimated based on current data. Implement backend count query for accuracy."><span style={{ marginLeft: '5px', color: 'orange' }}>*</span></Tooltip>}
          </div>
        )}
        <div className="page-navigation">
          <button onClick={() => onPageChange(page - 1)} disabled={page === 0 || isLoading} > Previous </button>
          <span> Page {page + 1} {pageCount > 0 ? `of ${pageCount}` : ''} </span>
          <button onClick={() => onPageChange(page + 1)} disabled={isNextDisabled} > Next </button>
        </div>
      </div>
    </div>
  );
};