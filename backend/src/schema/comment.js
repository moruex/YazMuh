// src/schema/comment.js
// const { gql } = require('@apollo/server');
const gql = require('graphql-tag');
const { GraphQLError } = require('graphql');
// Import helpers from the new utility file
const { ensureLoggedIn, ensureAdminRole } = require('../utils/authHelpers');

// --- Helper Functions ---
// Assume these are defined in a shared utility or passed via context setup
// If not, copy them here (as done in user.js previously)
// const { _ensureLoggedIn, _ensureAdminRole } = require('../utils/authHelpers');

// Placeholder if not imported/shared:
// const _ensureLoggedIn = (user) => {
//     if (!user) {
//         throw new GraphQLError('You must be logged in to comment.', { extensions: { code: 'UNAUTHENTICATED' } });
//     }
// };

const _ensureAdminRole = (context, requiredRole = 'CONTENT_MODERATOR') => {
    if (!context.admin || !context.admin.id) {
        throw new GraphQLError('Admin authentication required.', { extensions: { code: 'UNAUTHENTICATED' } });
    }
    const rolesHierarchy = { CONTENT_MODERATOR: 1, ADMIN: 2, SUPER_ADMIN: 3 }; // Define or import hierarchy
    const userLevel = rolesHierarchy[context.admin.role] || 0;
    const requiredLevel = rolesHierarchy[requiredRole] || 0;

    if (userLevel < requiredLevel) {
        console.warn(`Admin Authorization failed: Admin ${context.admin.id} (Role: ${context.admin.role}) attempted action requiring ${requiredRole}.`);
        throw new GraphQLError(`Insufficient privileges. Requires ${requiredRole} role or higher.`, { extensions: { code: 'FORBIDDEN' } });
    }
    // Return admin info if check passes, might be useful
    return context.admin;
};

// Optional: Admin check for deletion if needed
const _ensureAdminOrOwner = (actor, ownerId) => {
    if (!actor) {
        throw new GraphQLError('Authentication required.', { extensions: { code: 'UNAUTHENTICATED' } });
    }
    if (actor.type === 'admin') return; // Admins can always delete
    if (actor.type === 'user' && actor.id === ownerId) return; // Owner can delete

    throw new GraphQLError('You do not have permission to delete this comment.', { extensions: { code: 'FORBIDDEN' } });
};
// --- End Placeholder Helpers ---


// --- GraphQL Definitions ---
const typeDefs = gql`
  scalar DateTime # Assume DateTime scalar is defined

  # Represents a standard user (linked from Comment)
  type User {
      id: ID!
      username: String!
      avatar_url: String
      # Add other fields admins might see
  }

   # Represents a movie (linked from Comment)
   type Movie {
       id: ID!
       title: String!
       poster_url: String
   }

   # Represents an Admin user (linked from CommentCensorshipLog)
   type Admin {
     id: ID! # Assuming INTEGER ID based on schema
     username: String!
   }

  # Type for predefined censorship reasons
  type CensorshipReason {
      reason_code: String!
      description: String!
      is_active: Boolean!
  }

  # Optional: Type to represent a log entry (if needed for specific queries)
  # type CommentCensorshipLog {
  #   id: ID!
  #   comment_id: ID!
  #   admin: Admin!
  #   reason: CensorshipReason!
  #   admin_notes: String
  #   action_taken_at: DateTime!
  #   original_content_snapshot: String
  # }

  type Comment {
    id: ID!
    user: User!        # User who posted
    movie: Movie!      # Movie commented on
    content: String!   # Current content (may be original or placeholder)
    parent_comment_id: ID # For replies
    replies: [Comment!] # Direct replies
    likes_count: Int!
    is_liked_by_me: Boolean # Specific to the requesting user
    created_at: DateTime!
    updated_at: DateTime!

    # Censorship Status
    is_currently_censored: Boolean! # The flag from the DB
    # Optional: Resolve censorship details on demand
    # censorship_details: CommentCensorshipLog # Fetches the latest log entry if censored
  }

  # Input for creating a new comment
  input CommentInput {
    movie_id: ID!
    content: String!
    parent_comment_id: ID # Optional: for creating a reply
  }

  # Input for a user updating their OWN comment
  input CommentUpdateInput {
    content: String!
  }

  # Input for an admin censoring a comment
  input CensorCommentInput {
    reason_code: String! # Code from censorship_reasons table
    admin_notes: String  # Optional notes from the admin
  }

  # --- NEW: Input for Admin adding a comment ---
  # Links comment to the admin's user_id
  input AdminAddCommentInput {
      movie_id: ID!
      content: String!
      parent_comment_id: ID # Optional for replies
  }

  # --- Extend base Query ---
  extend type Query {
    comments(
        movie_id: ID,
        limit: Int = 20,
        offset: Int = 0,
        include_censored: Boolean = false,
        search: String # <-- ADDED search argument
    ): [Comment!]!

    comment(id: ID!): Comment
    censorshipReasons(activeOnly: Boolean = true): [CensorshipReason!]!
    # Optional: Add commentCount query with search filter
    # commentCount(movie_id: ID!, include_censored: Boolean = false, search: String): Int!
  }

  # --- Extend base Mutation ---
  extend type Mutation {
    # User Mutations
    createComment(input: CommentInput!): Comment!
    likeComment(id: ID!): Comment!
    unlikeComment(id: ID!): Comment!

    # User OR Admin Mutations
    updateComment(id: ID!, input: CommentUpdateInput!): Comment!
    deleteComment(id: ID!): Boolean!

    # Admin-Only Mutations
    censorComment(id: ID!, input: CensorCommentInput!): Comment!
    uncensorComment(id: ID!): Comment!
    adminAddComment(input: AdminAddCommentInput!): Comment! # <-- ADDED Mutation
  }
`;

// --- Resolvers ---
const resolvers = {
    Query: {
        comments: async (_, { movie_id = null, limit = 20, offset = 0, include_censored = false, search = null }, context) => { // Default movie_id to null
            // Base query
            let query = `
              SELECT c.*
              FROM comments c
              LEFT JOIN users u ON c.user_id = u.id -- Join users for search
              -- LEFT JOIN movies m ON c.movie_id = m.id -- Join movies if searching movie title
              WHERE 1=1 -- Start WHERE clause, always true
          `;
            const values = [];
            let paramIndex = 1; // Start parameter index at 1

            // Apply optional movie filter
            if (movie_id) {
                query += ` AND c.movie_id = $${paramIndex++}`;
                values.push(movie_id);
            }

            // Apply censorship filter
            if (!include_censored) {
                query += ` AND c.is_currently_censored = FALSE`;
            }

            // Apply search filter (case-insensitive)
            if (search && search.trim()) {
                query += ` AND (c.content ILIKE $${paramIndex} OR u.username ILIKE $${paramIndex})`;
                // Add movie title search if needed: AND m.title ILIKE $${paramIndex}
                values.push(`%${search.trim()}%`);
                paramIndex++;
            }

            // Add ordering, limit, offset
            query += ` ORDER BY c.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
            values.push(limit, offset);

            console.log("Executing GLOBAL comment query:", query, values); // Log for debugging
            try {
                const result = await context.db.query(query, values);
                return result.rows;
            } catch (err) {
                console.error("Error fetching comments:", err)
                throw new Error("Failed to fetch comments.")
            }
        },
        // Fetch a single comment
        comment: async (_, { id }, context) => {
            const result = await context.db.query('SELECT * FROM comments WHERE id = $1', [id]);
            if (!result.rows[0]) {
                throw new GraphQLError('Comment not found.', { extensions: { code: 'BAD_USER_INPUT' } });
            }
            // Optional: Check if censored and if user should see it?
            // For now, return regardless of censorship status, let client handle display
            return result.rows[0];
        },
        // Fetch censorship reasons
        censorshipReasons: async (_, { activeOnly = true }, context) => {
            let query = 'SELECT reason_code, description, is_active FROM censorship_reasons';
            const values = [];
            if (activeOnly) {
                query += ' WHERE is_active = $1';
                values.push(true);
            }
            query += ' ORDER BY reason_code ASC';
            const result = await context.db.query(query, values);
            return result.rows;
        }
    },

    Mutation: {
        // --- User Mutations ---
        createComment: async (_, { input }, { user, db: contextDb }) => {
            ensureLoggedIn(user); // Use imported helper
            const { movie_id, content, parent_comment_id } = input;

            if (!content.trim()) {
                throw new GraphQLError('Comment content cannot be empty.', { extensions: { code: 'BAD_USER_INPUT' } });
            }
            // Check movie exists
            const movieExists = await contextDb.query('SELECT id FROM movies WHERE id = $1', [movie_id]);
            if (movieExists.rows.length === 0) throw new GraphQLError('Movie not found.', { extensions: { code: 'BAD_USER_INPUT' } });

            // Check parent comment exists if provided (and belongs to the same movie)
            if (parent_comment_id) {
                const parentExists = await contextDb.query('SELECT id FROM comments WHERE id = $1 AND movie_id = $2', [parent_comment_id, movie_id]);
                if (parentExists.rows.length === 0) throw new GraphQLError('Parent comment not found or does not belong to this movie.', { extensions: { code: 'BAD_USER_INPUT' } });
            }

            // Insert the comment
            const query = `
        INSERT INTO comments (user_id, movie_id, content, parent_comment_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *`;
            const values = [user.id, movie_id, content, parent_comment_id];

            try {
                const result = await contextDb.query(query, values);
                // TODO: Publish subscription event if using subscriptions
                return result.rows[0];
            } catch (err) {
                console.error("Error creating comment:", err);
                throw new Error("Failed to create comment.");
            }
        },

        likeComment: async (_, { id }, { user, db: contextDb }) => {
            ensureLoggedIn(user);
            const commentExists = await contextDb.query('SELECT id FROM comments WHERE id = $1', [id]);
            if (commentExists.rows.length === 0) throw new GraphQLError('Comment not found.', { extensions: { code: 'BAD_USER_INPUT' } });

            try {
                await contextDb.query(
                    'INSERT INTO comment_likes (user_id, comment_id, created_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (user_id, comment_id) DO NOTHING',
                    [user.id, id]
                );
                // Refetch comment to return updated state (triggers handle count)
                const updatedComment = await contextDb.query('SELECT * FROM comments WHERE id = $1', [id]);
                return updatedComment.rows[0];
            } catch (err) {
                console.error("Error liking comment:", err);
                throw new Error("Failed to like comment.");
            }
        },

        unlikeComment: async (_, { id }, { user, db: contextDb }) => {
            ensureLoggedIn(user);
            const commentExists = await contextDb.query('SELECT id FROM comments WHERE id = $1', [id]);
            if (commentExists.rows.length === 0) throw new GraphQLError('Comment not found.', { extensions: { code: 'BAD_USER_INPUT' } });

            try {
                await contextDb.query(
                    'DELETE FROM comment_likes WHERE user_id = $1 AND comment_id = $2',
                    [user.id, id]
                );
                // Refetch comment
                const updatedComment = await contextDb.query('SELECT * FROM comments WHERE id = $1', [id]);
                return updatedComment.rows[0];
            } catch (err) {
                console.error("Error unliking comment:", err);
                throw new Error("Failed to unlike comment.");
            }
        },

        // --- User OR Admin Mutations ---
        updateComment: async (_, { id, input }, context) => {
            ensureLoggedIn(context.getCurrentActor()); // Use imported helper
            const { content } = input;

            if (!content.trim()) {
                throw new GraphQLError('Comment content cannot be empty.', { extensions: { code: 'BAD_USER_INPUT' } });
            }

            // 1. Fetch the comment to check ownership/existence
            const commentResult = await context.db.query('SELECT user_id FROM comments WHERE id = $1', [id]);
            if (commentResult.rows.length === 0) {
                throw new GraphQLError('Comment not found.', { extensions: { code: 'BAD_USER_INPUT' } });
            }
            const commentOwnerId = commentResult.rows[0].user_id;

            // 2. Authorization Check
            let canUpdate = false;
            let actingAdmin = null;
            // Check if logged-in user is the owner
            if (context.getCurrentActor().id === commentOwnerId) {
                canUpdate = true;
            }
            // If not the owner, check if an admin is acting
            else if (context.admin && context.admin.id) {
                try {
                    // Ensure admin has sufficient role (e.g., CONTENT_MODERATOR)
                    actingAdmin = ensureAdminRole(context.admin, 'CONTENT_MODERATOR');
                    canUpdate = true;
                    console.log(`Admin ${actingAdmin.id} authorized to update comment ${id}`);
                } catch (authError) {
                    // If admin check fails, and user is not owner, then forbid
                    if (!canUpdate) throw authError; // Re-throw if neither owner nor valid admin
                }
            }

            if (!canUpdate) {
                throw new GraphQLError('You do not have permission to update this comment.', { extensions: { code: 'FORBIDDEN' } });
            }

            // 3. Perform Update
            try {
                const query = `
                UPDATE comments
                SET content = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING *`;
                const values = [content, id];
                const result = await context.db.query(query, values);
                console.log(`Comment ${id} updated by ${context.getCurrentActor() ? `user ${context.getCurrentActor().id}` : `admin ${actingAdmin?.id}`}`);
                return result.rows[0];
            } catch (err) {
                console.error("Error updating comment:", err);
                throw new Error("Failed to update comment.");
            }
        },

        deleteComment: async (_, { id }, context) => {
            ensureLoggedIn(context.getCurrentActor()); // Use imported helper
            const { rows: comments } = await context.db.query('SELECT user_id FROM comments WHERE id = $1', [id]);
            if (comments.length === 0) {
                throw new GraphQLError('Comment not found.', { extensions: { code: 'NOT_FOUND' } });
            }
            _ensureAdminOrOwner(context.getCurrentActor(), comments[0].user_id); // Using local helper

            // 3. Perform Deletion
            // Assuming ON DELETE CASCADE handles comment_likes and comment_censorship_log.
            // If not, delete from those tables first within a transaction.
            try {
                const result = await context.db.query('DELETE FROM comments WHERE id = $1 RETURNING id', [id]);
                if (result.rowCount > 0) {
                    console.log(`Comment ${id} deleted by ${context.getCurrentActor() ? `user ${context.getCurrentActor().id}` : `admin ${context.admin?.id}`}`);
                    return true;
                } else {
                    // Should not happen if existence check passed unless race condition
                    console.warn(`Comment ${id} not found during delete operation.`);
                    return false;
                }
            } catch (err) {
                console.error("Error deleting comment:", err);
                // Check for specific DB errors like FK violations if cascade isn't set
                // if (err.code === '23503') { ... }
                throw new Error("Failed to delete comment.");
            }
        },

        // --- Admin-Only Mutations ---
        censorComment: async (_, { id, input }, context) => {
            const actingAdmin = ensureAdminRole(context.admin, 'CONTENT_MODERATOR');
            const { db } = context; // Assuming 'db' is the pg.Pool instance
            const { reason_code, admin_notes } = input;

            // Validate reason code
            const reasonResult = await db.query('SELECT 1 FROM censorship_reasons WHERE reason_code = $1 AND is_active = TRUE', [reason_code]);
            if (reasonResult.rows.length === 0) {
                throw new GraphQLError(`Invalid or inactive censorship reason code: ${reason_code}`, { extensions: { code: 'BAD_USER_INPUT' } });
            }

            // --- FIX: Use db.connect() to get a client from the pool ---
            const client = await db.connect();
            try {
                await client.query('BEGIN'); // Start transaction

                // 1. Get current content for snapshot and lock the row
                const commentRes = await client.query('SELECT content FROM comments WHERE id = $1 FOR UPDATE', [id]);
                if (commentRes.rows.length === 0) {
                    // Throw error inside transaction so it gets rolled back
                    throw new GraphQLError('Comment not found.', { extensions: { code: 'BAD_USER_INPUT' } });
                }
                const originalContent = commentRes.rows[0].content;

                // 2. Insert into log table
                const logQuery = `
                INSERT INTO comment_censorship_log
                    (comment_id, admin_id, reason_code, admin_notes, action_taken_at, original_content_snapshot)
                VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
            `;
                // Use actingAdmin.id (assuming it's the INTEGER admin ID from your schema)
                await client.query(logQuery, [id, actingAdmin.id, reason_code, admin_notes, originalContent]);

                // 3. Update the comment itself
                const updateQuery = `
                UPDATE comments
                SET is_currently_censored = TRUE,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *;
            `;
                const { rows: updatedCommentRows } = await client.query(updateQuery, [id]);

                await client.query('COMMIT'); // Commit transaction
                console.log(`Comment ${id} censored by admin ${actingAdmin.id} for reason ${reason_code}`);
                return updatedCommentRows[0];

            } catch (err) {
                await client.query('ROLLBACK'); // Rollback on error
                console.error(`Error censoring comment ${id} by admin ${actingAdmin.id}:`, err);
                // Re-throw specific errors or a generic one
                if (err instanceof GraphQLError) {
                    throw err;
                }
                throw new Error('Failed to censor comment due to a server error.');
            } finally {
                // --- Ensure client is always released back to the pool ---
                client.release();
            }
        },

        uncensorComment: async (_, { id }, context) => {
            const actingAdmin = ensureAdminRole(context.admin, 'CONTENT_MODERATOR');
            const { db } = context; // Assuming 'db' is the pg.Pool instance

            // Check if comment exists and is actually censored (can use pool directly for read)
            const checkRes = await db.query('SELECT is_currently_censored FROM comments WHERE id = $1', [id]);
            if (checkRes.rows.length === 0) {
                throw new GraphQLError('Comment not found.', { extensions: { code: 'BAD_USER_INPUT' } });
            }
            if (!checkRes.rows[0].is_currently_censored) {
                const currentComment = await db.query('SELECT * FROM comments WHERE id = $1', [id]);
                console.log(`Comment ${id} is already uncensored. Returning current state.`);
                return currentComment.rows[0];
            }

            // --- FIX: Use db.connect() to get a client from the pool ---
            const client = await db.connect();
            try {
                await client.query('BEGIN'); // Start transaction

                // 1. Update the comment status
                const updateQuery = `
                UPDATE comments
                SET is_currently_censored = FALSE,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
                RETURNING *;
            `;
                const { rows: updatedCommentRows } = await client.query(updateQuery, [id]);

                // 2. Optional: Add log entry for uncensoring
                // const logQuery = ` ... `;
                // await client.query(logQuery, [id, actingAdmin.id, 'UNCENSOR', 'Comment restored.']);

                await client.query('COMMIT'); // Commit transaction
                console.log(`Comment ${id} uncensored by admin ${actingAdmin.id}`);
                return updatedCommentRows[0];

            } catch (err) {
                await client.query('ROLLBACK'); // Rollback on error
                console.error(`Error uncensoring comment ${id} by admin ${actingAdmin.id}:`, err);
                // Re-throw specific errors or a generic one
                if (err instanceof GraphQLError) {
                    throw err;
                }
                throw new Error('Failed to uncensor comment due to a server error.');
            } finally {
                // --- Ensure client is always released back to the pool ---
                client.release();
            }
        },

        // --- NEW: Admin Add Comment Resolver ---
        adminAddComment: async (_, { input }, context) => {
            const actingAdmin = ensureAdminRole(context.admin, 'ADMIN'); // Example: ADMIN role to add comment as admin
            const { db } = context;
            const { movie_id, content, parent_comment_id } = input;

            if (!content.trim()) {
                throw new GraphQLError("Comment content cannot be empty.", { extensions: { code: 'BAD_USER_INPUT' } });
            }

            // 1. Get the admin's linked user_id
            const { rows: adminUserRows } = await db.query('SELECT user_id FROM admins WHERE id = $1', [actingAdmin.id]);
            if (adminUserRows.length === 0 || !adminUserRows[0].user_id) {
                throw new GraphQLError("Admin account is not linked to a user account.", { extensions: { code: 'FORBIDDEN' } });
                // Or potentially allow adding with a null user_id if schema permits & intended
            }
            const adminUserId = adminUserRows[0].user_id;

            // 2. Check movie exists
            const movieExists = await db.query('SELECT id FROM movies WHERE id = $1', [movie_id]);
            if (movieExists.rows.length === 0) throw new GraphQLError('Movie not found.', { extensions: { code: 'BAD_USER_INPUT' } });

            // 3. Check parent comment exists if provided
            if (parent_comment_id) {
                const parentExists = await db.query('SELECT id FROM comments WHERE id = $1 AND movie_id = $2', [parent_comment_id, movie_id]);
                if (parentExists.rows.length === 0) throw new GraphQLError('Parent comment not found or does not belong to this movie.', { extensions: { code: 'BAD_USER_INPUT' } });
            }

            // 4. Insert the comment using the admin's user_id
            const insertQuery = `
            INSERT INTO comments (user_id, movie_id, content, parent_comment_id, created_at, updated_at)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *`;
            const values = [adminUserId, movie_id, content, parent_comment_id];

            try  {
                const result = await db.query(insertQuery, values);
                console.log(`Admin ${actingAdmin.id} (User ${adminUserId}) added comment ${result.rows[0].id}`);
                return result.rows[0];
            } catch (err) {
                console.error("Error admin adding comment:", err);
                throw new Error("Failed to add comment.");
            }
        },
    },

    // --- Field Resolvers for Comment ---
    Comment: {
        // Resolve related User object
        user: async (comment, _, { db: contextDb, loaders }) => {
            if (loaders?.userLoader) return loaders.userLoader.load(comment.user_id);
            // Fallback query (exclude sensitive fields)
            const result = await contextDb.query('SELECT id, username, avatar_url FROM users WHERE id = $1', [comment.user_id]);
            return result.rows[0];
        },
        // Resolve related Movie object
        movie: async (comment, _, { db: contextDb, loaders }) => {
            if (loaders?.movieLoader) return loaders.movieLoader.load(comment.movie_id);
            // Fallback query
            const result = await contextDb.query('SELECT id, title, poster_url FROM movies WHERE id = $1', [comment.movie_id]);
            return result.rows[0];
        },
        // Resolve direct replies to this comment
        replies: async (comment, _, context) => {
            const result = await context.db.query(
                // Fetch non-censored replies by default
                'SELECT * FROM comments WHERE parent_comment_id = $1 AND is_currently_censored = FALSE ORDER BY created_at ASC',
                [comment.id]
            );
            return result.rows;
        },
        // Use the likes_count column directly (updated by trigger)
        likes_count: (comment) => comment.likes_count, // No need for extra query

        // Check if the current logged-in user liked this comment
        is_liked_by_me: async (comment, _, { user, db: contextDb }) => {
            if (!user || !user.id) return false; // Not logged in
            const result = await contextDb.query(
                'SELECT 1 FROM comment_likes WHERE comment_id = $1 AND user_id = $2 LIMIT 1',
                [comment.id, user.id]
            );
            return result.rows.length > 0;
        },

        // Optional: Resolve censorship details on demand
        // censorship_details: async (comment, _, context) => {
        //    if (!comment.is_currently_censored) return null;
        //    // Fetch the latest log entry for this comment
        //    const logResult = await context.db.query(`
        //        SELECT cl.*, r.description as reason_description, a.username as admin_username
        //        FROM comment_censorship_log cl
        //        JOIN censorship_reasons r ON cl.reason_code = r.reason_code
        //        JOIN admins a ON cl.admin_id = a.id
        //        WHERE cl.comment_id = $1
        //        ORDER BY cl.action_taken_at DESC
        //        LIMIT 1
        //    `, [comment.id]);
        //    // Format the result to match CommentCensorshipLog type if defined
        //    return logResult.rows[0] || null;
        

        // is_currently_censored: (comment) => comment.is_currently_censored // Direct mapping
        // created_at, updated_at should map directly too
    },
};

module.exports = { typeDefs, resolvers };
