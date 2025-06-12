import React, { useState, useEffect } from 'react';
import { CommentData, CommentInput, mdService } from '@src/services/mdService';
// import { useAuth } from '@src/context/AuthContext';
import './CommentsSection.css'; // We'll create this CSS file next
import { FaHeart, FaRegHeart, FaPaperPlane, FaReply, FaEdit, FaTrash } from 'react-icons/fa';
import { Link } from 'react-router-dom';

interface CommentItemProps {
  comment: CommentData;
  currentUserId?: string;
  movieId: string;
  onReply: (commentId: string, content: string) => Promise<void>;
  onLikeToggle: (commentId: string, isLiked: boolean) => Promise<void>;
  onEdit: (commentId: string, newContent: string) => Promise<void>; // Placeholder
  onDelete: (commentId: string) => Promise<void>; // Placeholder
  nestingLevel?: number;
}

const formatDateDistance = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  const weeks = Math.round(days / 7);
  const months = Math.round(days / 30.44); // Average days in month
  const years = Math.round(days / 365.25); // Account for leap years

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 5) return `${weeks}w ago`; // Up to 4 weeks
  if (months < 12) return `${months}mo ago`;
  return `${years}y ago`;
};


const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  movieId,
  onReply,
  onLikeToggle,
  onEdit,
  onDelete,
  nestingLevel = 0
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);

  const canEditOrDelete = currentUserId === comment.user.id;

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    await onReply(comment.id, replyText);
    setReplyText('');
    setIsReplying(false);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editText.trim()) return;
    await onEdit(comment.id, editText);
    setIsEditing(false);
  };
  
  return (
    <div className={`md-comment ${nestingLevel > 0 ? 'reply' : ''}`} style={{ marginLeft: `${nestingLevel * 20}px`}}>
      <div className="md-comment-header">
        <div className="md-comment-user">
          <img 
            src={comment.user.avatar_url || 'https://via.placeholder.com/40?text=User'} 
            alt={comment.user.username} 
            className="md-user-avatar" 
          />
          <Link to={`/user/${comment.user.username}`} className="md-username">{comment.user.username}</Link>
        </div>
        <span className="md-comment-date">{formatDateDistance(comment.created_at)}</span>
      </div>
      {isEditing ? (
        <form onSubmit={handleEditSubmit} className="md-comment-edit-form">
          <textarea 
            value={editText} 
            onChange={(e) => setEditText(e.target.value)} 
            className="md-comment-edit-textarea"
            rows={3}
          />
          <div className="md-comment-edit-actions">
            <button type="submit" className="md-comment-edit-button save">Save</button>
            <button type="button" onClick={() => setIsEditing(false)} className="md-comment-edit-button cancel">Cancel</button>
          </div>
        </form>
      ) : (
        <p className="md-comment-content">{comment.content}</p>
      )}
      
      <div className="md-comment-actions">
        {currentUserId && (
          <button 
            onClick={() => onLikeToggle(comment.id, !!comment.is_liked_by_me)} 
            className={`md-like-button ${comment.is_liked_by_me ? 'liked' : ''}`}
          >
            {comment.is_liked_by_me ? <FaHeart /> : <FaRegHeart />} {comment.likes_count}
          </button>
        )}
        {!currentUserId && <span><FaHeart style={{opacity: 0.7}} /> {comment.likes_count}</span>}

        {currentUserId && (
            <button onClick={() => setIsReplying(!isReplying)} className="md-reply-button">
                <FaReply /> Reply
            </button>
        )}
        {canEditOrDelete && !isEditing && (
          <>
            <button onClick={() => { setIsEditing(true); setEditText(comment.content); }} className="md-edit-button">
              <FaEdit /> Edit
            </button>
            <button onClick={() => onDelete(comment.id)} className="md-delete-button">
              <FaTrash /> Delete
            </button>
          </>
        )}
      </div>

      {isReplying && currentUserId && (
        <form onSubmit={handleReplySubmit} className="md-add-comment reply-form">
          <textarea
            placeholder={`Replying to ${comment.user.username}...`}
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
          />
          <button type="submit" className="md-submit-comment"><FaPaperPlane /> Post</button>
        </form>
      )}
      {comment.replies && comment.replies.length > 0 && (
        <div className="md-comment-replies">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              movieId={movieId}
              onReply={onReply}
              onLikeToggle={onLikeToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              nestingLevel={nestingLevel + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface CommentsSectionProps {
  movieId: string;
  initialComments?: CommentData[] | null; // Allow passing initial comments
}

const CommentsSection: React.FC<CommentsSectionProps> = ({ movieId, initialComments }) => {
  // const { user } = useAuth();
  // const currentUserId = user?.id;
  // Temporary placeholder for user and currentUserId
  const user: { id: string } = { id: '-1'}; // Minimal type for placeholder
  const currentUserId = user.id;
  const [comments, setComments] = useState<CommentData[]>(initialComments || []);
  const [newCommentText, setNewCommentText] = useState('');
  const [loading, setLoading] = useState<boolean>(!initialComments);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const COMMENTS_PER_PAGE = 5;

  // Fetch comments if not provided initially (or to refresh)
  // This useEffect is more for a standalone fetch if initialComments are not passed
  useEffect(() => {
    if (!initialComments && movieId) { // Only fetch if no initial comments and movieId is present
      setLoading(true);
      // This would typically be part of the movie details fetch, 
      // but if comments were a separate fetch, it would look like this:
      // extendedMdService.getCommentsForMovie(movieId, currentUserId) // Assuming such a function exists
      // .then(setComments)
      // .catch(err => setError("Failed to load comments."))
      // .finally(() => setLoading(false));
      // For now, we assume comments are passed via initialComments from MovieDetailsPage
      // If MovieDetailsPage re-fetches movie data including comments, it should update initialComments prop.
      setLoading(false); 
    }
    // If initialComments are provided, set them.
    if (initialComments) {
        setComments(initialComments);
        setLoading(false); 
    }

  }, [movieId, currentUserId, initialComments]);

  const handleAddComment = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    const contentToSubmit = parentId ? undefined : newCommentText; // Logic for main vs reply
    if (!currentUserId || !contentToSubmit || !contentToSubmit.trim()) {
        // setError("You must be logged in and enter text to comment."); // Keep error for missing text
        if (!contentToSubmit || !contentToSubmit.trim()) {
            setError("Please enter text to comment.");
        } else {
            setError("User context is not available. Please log in."); // More specific error
        }
        return;
    }

    const input: CommentInput = {
      userId: currentUserId,
      movieId: movieId,
      content: contentToSubmit,
      parentCommentId: parentId,
    };

    try {
      const newComment = await mdService.addComment(input);
      if (newComment) {
        if (parentId) {
          // Add reply to the correct parent comment
          setComments(prevComments => 
            prevComments.map(c => c.id === parentId ? {...c, replies: [...(c.replies || []), newComment]} : c)
          );
        } else {
          setComments(prevComments => [newComment, ...prevComments]);
        }
        setNewCommentText('');
        setError(null);
      } else {
        setError("Failed to post comment. Please try again.");
      }
    } catch (err) {
      console.error("Error posting comment:", err);
      setError("An error occurred while posting your comment.");
    }
  };

  const handleReply = async (commentId: string, content: string) => {
    if (!currentUserId || !content.trim()) return;
    const input: CommentInput = {
      userId: currentUserId,
      movieId: movieId,
      content: content,
      parentCommentId: commentId,
    };
    try {
      const newReply = await mdService.addComment(input);
      if (newReply) {
        // Function to recursively add reply
        const addReplyToComment = (commentsList: CommentData[], parentId: string, reply: CommentData): CommentData[] => {
            return commentsList.map(comment => {
                if (comment.id === parentId) {
                    return { ...comment, replies: [...(comment.replies || []), reply] };
                }
                if (comment.replies && comment.replies.length > 0) {
                    return { ...comment, replies: addReplyToComment(comment.replies, parentId, reply) };
                }
                return comment;
            });
        };
        setComments(prev => addReplyToComment(prev, commentId, newReply));
      }
    } catch (err) {
      console.error("Error posting reply:", err);
      setError("Failed to post reply.");
    }
  };

  const handleLikeToggle = async (commentId: string, isCurrentlyLiked: boolean) => {
    if (!currentUserId) return;
    try {
      let result;
      if (isCurrentlyLiked) {
        result = await mdService.unlikeComment(currentUserId, commentId);
      } else {
        result = await mdService.likeComment(currentUserId, commentId);
      }
      if (result) {
        // Function to recursively update like status
        const updateLikeStatus = (commentsList: CommentData[], targetId: string, likesCount: number, likedByMe: boolean): CommentData[] => {
            return commentsList.map(comment => {
                if (comment.id === targetId) {
                    return { ...comment, likes_count: likesCount, is_liked_by_me: likedByMe };
                }
                if (comment.replies && comment.replies.length > 0) {
                    return { ...comment, replies: updateLikeStatus(comment.replies, targetId, likesCount, likedByMe) };
                }
                return comment;
            });
        };
        setComments(prev => updateLikeStatus(prev, commentId, result.likes_count!, result.is_liked_by_me!));
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      setError("Failed to update like status.");
    }
  };

  const handleEditComment = async (commentId: string, newContent: string) => {
    try {
      const updatedComment = await mdService.updateComment(commentId, newContent);
      if (updatedComment) {
        setComments(prev =>
          prev.map(c =>
            c.id === commentId ? { ...c, content: updatedComment.content, updated_at: updatedComment.updated_at } : c
          )
        );
      }
    } catch (err) {
      console.error("Error updating comment:", err);
      setError("Failed to update comment.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUserId) return; // Ensure user is logged in to delete
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return; // User cancelled
    }

    try {
      const success = await mdService.deleteComment(commentId);
      if (success) {
        // Recursively remove the deleted comment and its replies
        const removeComment = (commentsList: CommentData[], targetId: string): CommentData[] => {
          return commentsList.filter(comment => {
            if (comment.id === targetId) return false;
            if (comment.replies && comment.replies.length > 0) {
              comment.replies = removeComment(comment.replies, targetId);
            }
            return true;
          });
        };
        setComments(prev => removeComment(prev, commentId));
      } else {
        setError("Failed to delete comment. Please try again.");
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      setError("An error occurred while deleting your comment.");
    }
  };

  // Pagination logic for top-level comments
  const topLevelComments = comments.filter(c => !c.parent_comment_id);
  const totalPages = Math.ceil(topLevelComments.length / COMMENTS_PER_PAGE);
  const paginatedComments = topLevelComments.slice(
    (currentPage - 1) * COMMENTS_PER_PAGE,
    currentPage * COMMENTS_PER_PAGE
  );

  if (loading) return <p className="md-comments-loading">Loading comments...</p>;
  // Error is handled locally within add/like actions, but a general fetch error could be shown here.

  return (
    <div className="md-comments-container">
      {error && <p className="md-comments-error">Error: {error}</p>}
      {currentUserId && (
        <form onSubmit={(e) => handleAddComment(e)} className="md-add-comment">
          <textarea
            placeholder="Add a public comment..."
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            rows={3}
          />
          <button type="submit" className="md-submit-comment"><FaPaperPlane /> Post Comment</button>
        </form>
      )}
      {!currentUserId && <p className="md-login-prompt">Please <Link to="/login">log in</Link> to post comments or like.</p>}

      {topLevelComments.length === 0 && !loading && <p>No comments yet. Be the first to comment!</p>}
      {paginatedComments.map(comment => (
        <CommentItem 
          key={comment.id} 
          comment={comment} 
          currentUserId={currentUserId} 
          movieId={movieId}
          onReply={handleReply}
          onLikeToggle={handleLikeToggle}
          onEdit={handleEditComment}
          onDelete={handleDeleteComment}
        />
      ))}
      {totalPages > 1 && (
        <div className="md-pagination">
          {[...Array(totalPages)].map((_, idx) => (
            <button
              key={idx}
              className={`md-page-number${currentPage === idx + 1 ? ' active' : ''}`}
              onClick={() => setCurrentPage(idx + 1)}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentsSection; 