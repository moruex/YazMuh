// src/schema/comment.js
// const { gql } = require('@apollo/server');
const gql = require('graphql-tag');
const { GraphQLError } = require('graphql');
const { rolesHierarchy } = require('../utils/authHelpers'); // Only import rolesHierarchy

// --- GraphQL Definitions ---
const typeDefs = gql`
  scalar DateTime # Assume DateTime scalar is defined

  # Represents a standard user (linked from Comment)
  type User {
      id: ID!
      username: String!
      avatar_url: String
  }

   type Movie {
       id: ID!
       title: String!
       poster_url: String
   }

   type Admin {
     id: ID! 
     username: String!
   }

  type CensorshipReason {
      reason_code: String!
      description: String!
      is_active: Boolean!
  }

  type Comment {
    id: ID!
    user: User!      
    movie: Movie!      
    content: String!   
    parent_comment_id: ID 
    replies: [Comment!] 
    likes_count: Int!
    is_liked_by_me(userId: ID): Boolean # userId is now an argument to check for a specific user
    created_at: DateTime!
    updated_at: DateTime!
    is_currently_censored: Boolean!
  }

  input CommentInput {
    userId: ID! # Added: ID of the user creating the comment
    movieId: ID! # Renamed for clarity from movie_id
    content: String!
    parentCommentId: ID # Renamed for clarity
  }

  input CommentUpdateInput {
    content: String!
  }

  input CensorCommentInput {
    reason_code: String! 
    admin_notes: String  
  }

  input AdminAddCommentInput {
      performingAdminId: ID! # ID of the admin adding the comment
      movieId: ID!
      content: String!
      parentCommentId: ID
  }

  extend type Query {
    comments(
        movieId: ID, # Renamed for clarity
        limit: Int = 20,
        offset: Int = 0,
        include_censored: Boolean = false,
        search: String 
    ): [Comment!]!
    comment(id: ID!): Comment
    censorshipReasons(activeOnly: Boolean = true): [CensorshipReason!]!
  }

  extend type Mutation {
    createComment(input: CommentInput!): Comment!
    likeComment(userId: ID!, commentId: ID!): Comment! # Added userId, renamed id to commentId
    unlikeComment(userId: ID!, commentId: ID!): Comment! # Added userId, renamed id to commentId

    # Pass performingUserId or performingAdminId for authorization
    updateComment(performingActorId: ID!, commentId: ID!, input: CommentUpdateInput!): Comment!
    deleteComment(performingActorId: ID!, commentId: ID!): Boolean!

    # Admin-Only Mutations - require performingAdminId
    censorComment(performingAdminId: ID!, commentId: ID!, input: CensorCommentInput!): Comment!
    uncensorComment(performingAdminId: ID!, commentId: ID!): Comment!
    adminAddComment(input: AdminAddCommentInput!): Comment!
  }
`;

// --- Resolvers ---
const resolvers = {
    Query: {
        comments: async (_, { movieId, limit = 20, offset = 0, include_censored = false, search = null }, { db }) => {
            let query = `
              SELECT c.* 
              FROM comments c 
              LEFT JOIN users u ON c.user_id = u.id 
              WHERE 1=1 
          `;
            const values = [];
            let paramIndex = 1;

            if (movieId) {
                query += ` AND c.movie_id = $${paramIndex++}`;
                values.push(movieId);
            }
            if (!include_censored) {
                query += ` AND c.is_currently_censored = FALSE`;
            }
            if (search && search.trim()) {
                query += ` AND (c.content ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex})`;
                values.push(`%${search.trim()}%`);
                paramIndex++;
            }
            query += ` ORDER BY c.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
            values.push(limit, offset);
            try {
                const result = await db.query(query, values);
                return result.rows;
            } catch (err) {
                console.error("Error fetching comments:", err);
                throw new GraphQLError("Failed to fetch comments.", { extensions: { code: 'INTERNAL_SERVER_ERROR'} });
            }
        },
        comment: async (_, { id }, { db }) => {
            const result = await db.query('SELECT * FROM comments WHERE id = $1', [id]);
            if (!result.rows[0]) {
                throw new GraphQLError('Comment not found.', { extensions: { code: 'NOT_FOUND' } });
            }
            return result.rows[0];
        },
        censorshipReasons: async (_, { activeOnly = true }, { db }) => {
            let query = 'SELECT reason_code, description, is_active FROM censorship_reasons';
            const values = [];
            if (activeOnly) {
                query += ' WHERE is_active = $1';
                values.push(true);
            }
            query += ' ORDER BY reason_code ASC';
            const result = await db.query(query, values);
            return result.rows;
        }
    },

    Mutation: {
        createComment: async (_, { input }, { db }) => {
            const { userId, movieId, content, parentCommentId } = input;
            // Authorization: You may want to verify the userId (e.g., if it matches an authenticated user if you add auth later)
            if (!userId) throw new GraphQLError('User ID is required to create a comment.', { extensions: { code: 'BAD_USER_INPUT' } });

            if (!content.trim()) {
                throw new GraphQLError('Comment content cannot be empty.', { extensions: { code: 'BAD_USER_INPUT' } });
            }
            const movieExists = await db.query('SELECT id FROM movies WHERE id = $1', [movieId]);
            if (movieExists.rows.length === 0) throw new GraphQLError('Movie not found.', { extensions: { code: 'BAD_USER_INPUT' } });

            if (parentCommentId) {
                const parentExists = await db.query('SELECT id FROM comments WHERE id = $1 AND movie_id = $2', [parentCommentId, movieId]);
                if (parentExists.rows.length === 0) throw new GraphQLError('Parent comment not found or does not belong to this movie.', { extensions: { code: 'BAD_USER_INPUT' } });
            }

            const query = `
                INSERT INTO comments (user_id, movie_id, content, parent_comment_id, created_at, updated_at)
                VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING *`;
            const values = [userId, movieId, content, parentCommentId];
            try {
                const result = await db.query(query, values);
                return result.rows[0];
            } catch (err) {
                console.error("Error creating comment:", err);
                throw new GraphQLError("Failed to create comment.", { extensions: { code: 'INTERNAL_SERVER_ERROR'} });
            }
        },

        likeComment: async (_, { userId, commentId }, { db }) => {
            // Authorization: Verify userId
            if (!userId) throw new GraphQLError('User ID is required to like a comment.', { extensions: { code: 'BAD_USER_INPUT' } });
            const commentExists = await db.query('SELECT id FROM comments WHERE id = $1', [commentId]);
            if (commentExists.rows.length === 0) throw new GraphQLError('Comment not found.', { extensions: { code: 'BAD_USER_INPUT' } });

            try {
                await db.query(
                    'INSERT INTO comment_likes (user_id, comment_id, created_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (user_id, comment_id) DO NOTHING',
                    [userId, commentId]
                );
                const updatedComment = await db.query('SELECT * FROM comments WHERE id = $1', [commentId]);
                return updatedComment.rows[0];
            } catch (err) {
                console.error("Error liking comment:", err);
                throw new GraphQLError("Failed to like comment.", { extensions: { code: 'INTERNAL_SERVER_ERROR'} });
            }
        },

        unlikeComment: async (_, { userId, commentId }, { db }) => {
            // Authorization: Verify userId
            if (!userId) throw new GraphQLError('User ID is required to unlike a comment.', { extensions: { code: 'BAD_USER_INPUT' } });
            const commentExists = await db.query('SELECT id FROM comments WHERE id = $1', [commentId]);
            if (commentExists.rows.length === 0) throw new GraphQLError('Comment not found.', { extensions: { code: 'BAD_USER_INPUT' } });

            try {
                await db.query(
                    'DELETE FROM comment_likes WHERE user_id = $1 AND comment_id = $2',
                    [userId, commentId]
                );
                const updatedComment = await db.query('SELECT * FROM comments WHERE id = $1', [commentId]);
                return updatedComment.rows[0];
            } catch (err) {
                console.error("Error unliking comment:", err);
                throw new GraphQLError("Failed to unlike comment.", { extensions: { code: 'INTERNAL_SERVER_ERROR'} });
            }
        },

        updateComment: async (_, { performingActorId, commentId, input }, { db }) => {
            // Authorization: Determine if performingActorId is the comment owner or a sufficient admin.
            if (!performingActorId) throw new GraphQLError('Actor ID is required to update a comment.', { extensions: { code: 'BAD_USER_INPUT' } });
            const { content } = input;
            if (!content.trim()) {
                throw new GraphQLError('Comment content cannot be empty.', { extensions: { code: 'BAD_USER_INPUT' } });
            }

            const commentResult = await db.query('SELECT user_id FROM comments WHERE id = $1', [commentId]);
            if (commentResult.rows.length === 0) {
                throw new GraphQLError('Comment not found.', { extensions: { code: 'NOT_FOUND' } });
            }
            const commentOwnerId = commentResult.rows[0].user_id;

            let canUpdate = false;
            if (performingActorId.toString() === commentOwnerId.toString()) {
                canUpdate = true;
            } else {
                const { rows: adminRows } = await db.query('SELECT role FROM admins WHERE id = $1 OR user_id = $1', [performingActorId]);
                if (adminRows.length > 0) {
                    const adminRole = adminRows[0].role;
                    const requiredLevel = rolesHierarchy['CONTENT_MODERATOR'] || 0;
                    const adminLevel = rolesHierarchy[adminRole] || 0;
                    if (adminLevel >= requiredLevel) {
                        canUpdate = true;
                    }
                }
            }

            if (!canUpdate) {
                throw new GraphQLError('You do not have permission to update this comment.', { extensions: { code: 'FORBIDDEN' } });
            }

            try {
                const query = `UPDATE comments SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`;
                const values = [content, commentId];
                const result = await db.query(query, values);
                return result.rows[0];
            } catch (err) {
                console.error("Error updating comment:", err);
                throw new GraphQLError("Failed to update comment.", { extensions: { code: 'INTERNAL_SERVER_ERROR'} });
            }
        },

        deleteComment: async (_, { performingActorId, commentId }, { db }) => {
            // Authorization: Determine if performingActorId is the comment owner or a sufficient admin.
            if (!performingActorId) throw new GraphQLError('Actor ID is required to delete a comment.', { extensions: { code: 'BAD_USER_INPUT' } });

            const { rows: comments } = await db.query('SELECT user_id FROM comments WHERE id = $1', [commentId]);
            if (comments.length === 0) {
                throw new GraphQLError('Comment not found.', { extensions: { code: 'NOT_FOUND' } });
            }
            const commentOwnerId = comments[0].user_id;

            let canDelete = false;
            if (performingActorId.toString() === commentOwnerId.toString()) {
                canDelete = true;
            } else {
                const { rows: adminRows } = await db.query('SELECT role FROM admins WHERE id = $1 OR user_id = $1', [performingActorId]);
                 if (adminRows.length > 0) {
                    const adminRole = adminRows[0].role;
                    // Assuming any admin can delete, or check specific role e.g. CONTENT_MODERATOR
                    const requiredLevel = rolesHierarchy['CONTENT_MODERATOR'] || 0; 
                    const adminLevel = rolesHierarchy[adminRole] || 0;
                    if (adminLevel >= requiredLevel) {
                        canDelete = true;
                    }
                }
            }

            if (!canDelete) {
                throw new GraphQLError('You do not have permission to delete this comment.', { extensions: { code: 'FORBIDDEN' } });
            }

            try {
                const result = await db.query('DELETE FROM comments WHERE id = $1 RETURNING id', [commentId]);
                return result.rowCount > 0;
            } catch (err) {
                console.error("Error deleting comment:", err);
                throw new GraphQLError("Failed to delete comment.", { extensions: { code: 'INTERNAL_SERVER_ERROR'} });
            }
        },

        censorComment: async (_, { performingAdminId, commentId, input }, { db }) => {
            // Authorization: Verify performingAdminId has at least CONTENT_MODERATOR role
            if (!performingAdminId) throw new GraphQLError('Admin ID is required.', { extensions: { code: 'BAD_USER_INPUT' } });
            const { rows: adminRows } = await db.query('SELECT role FROM admins WHERE id = $1', [performingAdminId]);
            if (adminRows.length === 0) throw new GraphQLError('Admin not found.', { extensions: { code: 'FORBIDDEN' } });
            const adminRole = adminRows[0].role;
            const requiredLevel = rolesHierarchy['CONTENT_MODERATOR'] || 0;
            const adminLevel = rolesHierarchy[adminRole] || 0;
            if (adminLevel < requiredLevel) {
                throw new GraphQLError('Insufficient privileges to censor comment.', { extensions: { code: 'FORBIDDEN' } });
            }

            const { reason_code, admin_notes } = input;
            const reasonResult = await db.query('SELECT 1 FROM censorship_reasons WHERE reason_code = $1 AND is_active = TRUE', [reason_code]);
            if (reasonResult.rows.length === 0) {
                throw new GraphQLError(`Invalid or inactive censorship reason code: ${reason_code}`, { extensions: { code: 'BAD_USER_INPUT' } });
            }

            const client = await db.connect();
            try {
                await client.query('BEGIN');
                const commentRes = await client.query('SELECT content FROM comments WHERE id = $1 FOR UPDATE', [commentId]);
                if (commentRes.rows.length === 0) {
                    throw new GraphQLError('Comment not found.', { extensions: { code: 'BAD_USER_INPUT' } });
                }
                const originalContent = commentRes.rows[0].content;
                const logQuery = `
                INSERT INTO comment_censorship_log
                    (comment_id, admin_id, reason_code, admin_notes, action_taken_at, original_content_snapshot)
                VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
            `;
                await client.query(logQuery, [commentId, performingAdminId, reason_code, admin_notes, originalContent]);
                const updateQuery = `UPDATE comments SET is_currently_censored = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *;`;
                const { rows: updatedCommentRows } = await client.query(updateQuery, [commentId]);
                await client.query('COMMIT');
                return updatedCommentRows[0];
            } catch (err) {
                await client.query('ROLLBACK');
                console.error(`Error censoring comment ${commentId} by admin ${performingAdminId}:`, err);
                if (err instanceof GraphQLError) throw err;
                throw new GraphQLError('Failed to censor comment.', { extensions: { code: 'INTERNAL_SERVER_ERROR'} });
            } finally {
                client.release();
            }
        },

        uncensorComment: async (_, { performingAdminId, commentId }, { db }) => {
            // Authorization: Verify performingAdminId has at least CONTENT_MODERATOR role
            if (!performingAdminId) throw new GraphQLError('Admin ID is required.', { extensions: { code: 'BAD_USER_INPUT' } });
            const { rows: adminRows } = await db.query('SELECT role FROM admins WHERE id = $1', [performingAdminId]);
            if (adminRows.length === 0) throw new GraphQLError('Admin not found.', { extensions: { code: 'FORBIDDEN' } });
            const adminRole = adminRows[0].role;
            const requiredLevel = rolesHierarchy['CONTENT_MODERATOR'] || 0;
            const adminLevel = rolesHierarchy[adminRole] || 0;
            if (adminLevel < requiredLevel) {
                throw new GraphQLError('Insufficient privileges to uncensor comment.', { extensions: { code: 'FORBIDDEN' } });
            }

            const checkRes = await db.query('SELECT is_currently_censored FROM comments WHERE id = $1', [commentId]);
            if (checkRes.rows.length === 0) {
                throw new GraphQLError('Comment not found.', { extensions: { code: 'BAD_USER_INPUT' } });
            }
            if (!checkRes.rows[0].is_currently_censored) {
                const currentComment = await db.query('SELECT * FROM comments WHERE id = $1', [commentId]);
                return currentComment.rows[0];
            }

            const client = await db.connect();
            try {
                await client.query('BEGIN');
                const updateQuery = `UPDATE comments SET is_currently_censored = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *;`;
                const { rows: updatedCommentRows } = await client.query(updateQuery, [commentId]);
                await client.query('COMMIT');
                return updatedCommentRows[0];
            } catch (err) {
                await client.query('ROLLBACK');
                console.error(`Error uncensoring comment ${commentId} by admin ${performingAdminId}:`, err);
                if (err instanceof GraphQLError) throw err;
                throw new GraphQLError('Failed to uncensor comment.', { extensions: { code: 'INTERNAL_SERVER_ERROR'} });
            } finally {
                client.release();
            }
        },

        adminAddComment: async (_, { input }, { db }) => {
            const { performingAdminId, movieId, content, parentCommentId } = input;
            // Authorization: Verify performingAdminId and their role (e.g., ADMIN or higher)
            if (!performingAdminId) throw new GraphQLError('Admin ID is required.', { extensions: { code: 'BAD_USER_INPUT' } });
            const { rows: adminRows } = await db.query('SELECT user_id, role FROM admins WHERE id = $1', [performingAdminId]);
            if (adminRows.length === 0) throw new GraphQLError('Admin not found.', { extensions: { code: 'FORBIDDEN' } });
            const adminRole = adminRows[0].role;
            const adminUserId = adminRows[0].user_id;
            const requiredLevel = rolesHierarchy['ADMIN'] || 0; // Example: ADMIN role to add comment as admin
            const adminLevel = rolesHierarchy[adminRole] || 0;
            if (adminLevel < requiredLevel) {
                throw new GraphQLError('Insufficient privileges to add comment as admin.', { extensions: { code: 'FORBIDDEN' } });
            }
            if (!adminUserId) {
                throw new GraphQLError("Admin account is not linked to a user account, cannot post comment.", { extensions: { code: 'FORBIDDEN' } });
            }

            if (!content.trim()) {
                throw new GraphQLError("Comment content cannot be empty.", { extensions: { code: 'BAD_USER_INPUT' } });
            }
            const movieExists = await db.query('SELECT id FROM movies WHERE id = $1', [movieId]);
            if (movieExists.rows.length === 0) throw new GraphQLError('Movie not found.', { extensions: { code: 'BAD_USER_INPUT' } });
            if (parentCommentId) {
                const parentExists = await db.query('SELECT id FROM comments WHERE id = $1 AND movie_id = $2', [parentCommentId, movieId]);
                if (parentExists.rows.length === 0) throw new GraphQLError('Parent comment not found or does not belong to this movie.', { extensions: { code: 'BAD_USER_INPUT' } });
            }

            const insertQuery = `
            INSERT INTO comments (user_id, movie_id, content, parent_comment_id, created_at, updated_at)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *`;
            const values = [adminUserId, movieId, content, parentCommentId];
            try  {
                const result = await db.query(insertQuery, values);
                return result.rows[0];
            } catch (err) {
                console.error("Error admin adding comment:", err);
                throw new GraphQLError("Failed to add comment as admin.", { extensions: { code: 'INTERNAL_SERVER_ERROR'} });
            }
        },
    },

    Comment: {
        user: async (comment, _, { db, loaders }) => {
            if (loaders?.userLoader) return loaders.userLoader.load(comment.user_id);
            const result = await db.query('SELECT id, username, avatar_url FROM users WHERE id = $1', [comment.user_id]);
            return result.rows[0];
        },
        movie: async (comment, _, { db, loaders }) => {
            if (loaders?.movieLoader) return loaders.movieLoader.load(comment.movie_id);
            const result = await db.query('SELECT id, title, poster_url FROM movies WHERE id = $1', [comment.movie_id]);
            return result.rows[0];
        },
        replies: async (comment, _, { db }) => {
            const result = await db.query(
                'SELECT * FROM comments WHERE parent_comment_id = $1 AND is_currently_censored = FALSE ORDER BY created_at ASC',
                [comment.id]
            );
            return result.rows;
        },
        likes_count: (comment) => comment.likes_count,
        is_liked_by_me: async (comment, { userId }, { db }) => { // userId is now an argument
            if (!userId) return false; // If no userId provided for the check, assume not liked
            const result = await db.query(
                'SELECT 1 FROM comment_likes WHERE comment_id = $1 AND user_id = $2 LIMIT 1',
                [comment.id, userId]
            );
            return result.rows.length > 0;
        },
    },
};

module.exports = { typeDefs, resolvers };
