// src/interfaces/comment.interfaces.ts

// Assuming ApiUser and ApiMovieCore are defined elsewhere matching GraphQL User/Movie types
// Example:
export interface ApiUser {
    __typename?: 'User';
    id: string;
    username: string;
    avatar_url?: string | null;
  }
  export interface ApiMovieCore {
     __typename?: 'Movie';
    id: string;
    title: string;
  }
  
  
  /** Represents a Comment structure from the API based on COMMENT_FIELDS fragment */
  export interface ApiComment {
      __typename?: 'Comment';
      id: string;
      content: string;
      parent_comment_id?: string | null;
      likes_count: number;
      is_currently_censored: boolean;
      created_at: string; // Or Date object depending on scalar mapping
      updated_at: string; // Or Date object
      user: Pick<ApiUser, 'id' | 'username' | 'avatar_url'>;
      movie: Pick<ApiMovieCore, 'id' | 'title'>;
      // Replies array might be present depending on fragment used in query
      replies?: Pick<ApiComment, 'id' | 'content' | 'likes_count' | 'is_currently_censored' | 'created_at' | 'user'>[];
  }
  
  /** Represents a Censorship Reason from the API */
  export interface ApiCensorshipReason {
       __typename?: 'CensorshipReason';
      reason_code: string;
      description: string;
      is_active: boolean;
  }
  
  // --- Input Types for Mutations ---
  
  /** Input for the adminAddComment mutation */
  export interface AdminAddCommentInput {
      movie_id: string;
      content: string;
      parent_comment_id?: string | null; // Optional
  }
  
  /** Input for the updateComment mutation */
  export interface CommentUpdateInput {
      content: string;
  }
  
  /** Input for the censorComment mutation */
  export interface CensorCommentInput {
    reason_code: string;
    admin_notes?: string | null;
  }