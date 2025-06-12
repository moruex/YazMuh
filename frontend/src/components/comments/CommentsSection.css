/* frontend/src/components/comments/CommentsSection.css */

.md-comments-container {
    margin-top: 20px;
    /* background-color: #1f232c; */ /* Darker background for the whole section */
    /* padding: 20px; */
    /* border-radius: 8px; */
}

.md-comments-loading,
.md-comments-error,
.md-login-prompt {
    padding: 15px;
    text-align: center;
    color: #a9a9a9;
    font-size: 16px;
}

.md-comments-error {
    color: #e53935; /* Red for errors */
}

.md-login-prompt a {
    color: #00aaff; /* Accent color for links */
    text-decoration: none;
}
.md-login-prompt a:hover {
    text-decoration: underline;
}

/* Add Comment Form */
.md-add-comment {
    margin-bottom: 25px;
    background-color: #282a32; /* From MovieDetailsPage.css */
    padding: 15px;
    border-radius: 10px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
}

.md-add-comment textarea {
    width: 100%;
    background-color: #1f232c; /* From MovieDetailsPage.css */
    padding: 12px 15px;
    border: 1px solid #3a3f51;
    border-radius: 5px;
    resize: vertical;
    font-family: inherit;
    font-size: 15px;
    color: #fff;
    box-sizing: border-box;
    min-height: 80px;
    margin-bottom: 10px;
}

.md-add-comment textarea:focus {
    outline: none;
    border-color: #00e054; /* Green focus, from MovieDetailsPage.css */
    box-shadow: 0 0 0 2px rgba(0, 224, 84, 0.2);
}

.md-submit-comment {
    display: flex;
    align-items: center;
    gap: 8px;
    width: fit-content;
    margin-left: auto;
    background-color: #008a35; /* Green, from MovieDetailsPage.css */
    color: white;
    border: none;
    border-radius: 5px;
    padding: 10px 18px;
    cursor: pointer;
    transition: background-color 0.3s;
    font-weight: bold;
    font-size: 14px;
}

.md-submit-comment:hover {
    background-color: #00a23f; /* Darker green */
}

/* Individual Comment Item */
.md-comment {
    border: 1px solid #3a3f51; /* From MovieDetailsPage.css */
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 15px;
    background-color: #282a32; /* From MovieDetailsPage.css */
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    transition: transform 0.2s, box-shadow 0.2s;
}

.md-comment.reply {
    /* Slightly different style for replies, e.g., smaller top margin or different border */
    margin-top: 10px;
    /* border-left: 3px solid #007bff; */ /* Example: accent border for replies */
}

.md-comment:hover {
    /* transform: translateY(-2px); */
    /* box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); */
}

.md-comment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    /* border-bottom: 1px solid #3a3f5175; */
    /* padding-bottom: 10px; */
}

.md-comment-user {
    display: flex;
    align-items: center;
    gap: 10px;
}

.md-user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid #4f5462;
}

.md-username {
    font-weight: 600;
    color: #e0e0e0;
    text-decoration: none;
    font-size: 15px;
}
.md-username:hover {
    color: #00aaff;
}

.md-comment-date {
    color: #888da8;
    font-size: 13px;
}

.md-comment-content {
    margin-bottom: 12px;
    line-height: 1.6;
    color: #dadada;
    font-size: 15px;
    white-space: pre-wrap; /* Preserve line breaks and spacing */
}

.md-comment-actions {
    display: flex;
    align-items: center;
    gap: 15px;
    /* border-top: 1px solid #3a3f5175; */
    /* padding-top: 10px; */
    font-size: 13px;
}

.md-like-button,
.md-reply-button,
.md-edit-button,
.md-delete-button {
    background: none;
    border: none;
    color: #a9b1d6; /* Lighter action color */
    cursor: pointer;
    display: inline-flex; /* Changed from flex */
    align-items: center;
    gap: 6px;
    padding: 5px 8px;
    transition: all 0.2s;
    border-radius: 4px;
    font-weight: 500;
}

.md-like-button:hover,
.md-reply-button:hover,
.md-edit-button:hover,
.md-delete-button:hover {
    color: #fff;
}

.md-like-button.liked,
.md-like-button.liked svg {
    color: #e53935; /* Red when liked */
}
.md-like-button:hover:not(.liked) {
    background-color: rgba(229, 57, 53, 0.1);
    color: #e53935;
}

.md-reply-button:hover {
    background-color: rgba(0, 123, 255, 0.1);
    color: #007bff;
}

.md-edit-button {
    margin-left: auto; /* Push edit/delete to the right */
}
.md-edit-button:hover {
    background-color: rgba(255, 183, 0, 0.1);
    color: #ffb700;
}

.md-delete-button:hover {
    background-color: rgba(211, 47, 47, 0.1);
    color: #d32f2f;
}

/* Reply Form (within CommentItem) */
.md-add-comment.reply-form {
    margin-top: 10px;
    margin-left: 0; /* Replies don't need extra left margin from parent form */
    padding: 10px;
    background-color: #2e3038; /* Slightly different bg for reply form */
}

.md-add-comment.reply-form textarea {
    min-height: 60px;
    font-size: 14px;
}

.md-add-comment.reply-form .md-submit-comment {
    padding: 8px 15px;
    font-size: 13px;
}

/* Comment Edit Form */
.md-comment-edit-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 5px 0 10px 0;
}

.md-comment-edit-textarea {
    width: 100%;
    background-color: #1f232c;
    padding: 10px;
    border: 1px solid #3a3f51;
    border-radius: 5px;
    resize: vertical;
    font-family: inherit;
    font-size: 15px;
    color: #fff;
    box-sizing: border-box;
    min-height: 70px;
}

.md-comment-edit-textarea:focus {
    outline: none;
    border-color: #00e054;
}

.md-comment-edit-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
}

.md-comment-edit-button {
    padding: 6px 12px;
    border-radius: 4px;
    border: none;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: background-color 0.2s;
}

.md-comment-edit-button.save {
    background-color: #008a35;
    color: white;
}
.md-comment-edit-button.save:hover { background-color: #00a23f; }

.md-comment-edit-button.cancel {
    background-color: #4a4e5f;
    color: #e0e0e0;
    /* border: 1px solid #5a5f73; */
}
.md-comment-edit-button.cancel:hover { background-color: #5a5f73; color: #fff; }

.md-comment-replies {
    margin-top: 10px;
    /* border-left: 2px solid #3a3f51; */ /* Visual cue for reply thread */
    /* padding-left: 15px; */ /* No, margin on item instead*/
}

/* Pagination Bar for Comments */
.md-pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin: 24px 0 0 0;
}

.md-page-number {
  background: #23272f;
  color: #a9a9a9;
  border: 1px solid #3a3f51;
  border-radius: 5px;
  padding: 7px 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}

.md-page-number:hover {
  background: #00e05433;
  color: #fff;
  border-color: #00e054;
}

.md-page-number.active, .md-page-number:active {
  background: #00e054;
  color: #fff;
  border-color: #00e054;
  cursor: default;
}

@media (max-width: 700px) {
  .md-pagination {
    gap: 4px;
  }
  .md-page-number {
    padding: 6px 10px;
    font-size: 13px;
  }
} 