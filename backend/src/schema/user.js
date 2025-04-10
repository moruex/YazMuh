// src/schema/user.js
const { gql } = require('@apollo/server');
const { GraphQLError } = require('graphql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// Assuming config is accessible or passed appropriately
// const config = require('../config');

// --- Config (ensure these are set in your environment) ---
const config = {
    jwtSecret: process.env.JWT_SECRET || 'YOUR_REALLY_SECRET_KEY_PLEASE_CHANGE',
    jwtExpiration: process.env.JWT_EXPIRATION || '1d'
};

// --- Helper Functions ---
const _ensureLoggedIn = (user) => {
    if (!user) {
        throw new GraphQLError('You must be logged in to perform this action.', {
            extensions: {
                code: 'UNAUTHENTICATED',
            },
        });
    }
};

// --- Admin Helper Functions (Copied from admin.js - REFACOR to shared util recommended) ---
const _ensureAdminLoggedIn = (context) => {
  if (!context.admin || !context.admin.id) {
    throw new GraphQLError('Admin authentication required. Please log in.', {
        extensions: {
            code: 'UNAUTHENTICATED',
        },
    });
  }
};

const _ensureAdminRole = (context, requiredRole = 'ADMIN') => {
  _ensureAdminLoggedIn(context); // First, ensure logged in as admin

  const adminUser = context.admin; // Contains { id, role }
  // Define hierarchy within this file or import from shared config
  const rolesHierarchy = { CONTENT_MODERATOR: 1, ADMIN: 2, SUPER_ADMIN: 3 };
  const userLevel = rolesHierarchy[adminUser.role] || 0;
  const requiredLevel = rolesHierarchy[requiredRole] || 0;

  if (userLevel < requiredLevel) {
    console.warn(`Authorization failed: Admin ${adminUser.id} (Role: ${adminUser.role}) attempted user management action requiring ${requiredRole}.`);
    throw new GraphQLError(`Insufficient privileges. Requires ${requiredRole} role or higher to manage users.`, {
        extensions: {
            code: 'FORBIDDEN',
        },
    });
  }
};
// --- End Admin Helper Functions ---


// --- GraphQL Definitions ---
const typeDefs = gql`
  scalar DateTime

  type User {
    id: ID!
    first_name: String
    last_name: String
    username: String!
    email: String!
    avatar_url: String
    bio: String
    created_at: DateTime
    updated_at: DateTime
    # --- Relationships (keep existing) ---
    lists: [UserList!]
    ratings: [UserRating!]
    comments: [Comment!]
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  # --- Other existing types (UserRating, UserList, ListType) ---
  type UserRating { # Keep existing
    id: ID!
    movie: Movie!
    rating: Int!
    created_at: DateTime!
    updated_at: DateTime!
   }

   type UserList { # Keep existing
    id: ID!
    list_type: ListType!
    created_at: DateTime!
    movies: [Movie!]
   }

   enum ListType { # Keep existing
    FAVORITES
    WATCHED
    WATCHLIST
   }
   # Assume Comment type exists
   # Assume Movie type exists

  # --- Input Types ---
  input UserInput { # For registerUser
    first_name: String
    last_name: String
    username: String!
    email: String!
    password: String!
    avatar_url: String # Make optional or ensure default
    bio: String
  }

  input UserUpdateInput { # For self-update (updateUser)
    first_name: String
    last_name: String
    username: String
    email: String
    password: String # For changing own password
    avatar_url: String
    bio: String
  }

  # NEW: Input for admin updating user profiles
  input AdminUserUpdateInput {
    first_name: String
    last_name: String
    username: String
    email: String
    # Password is intentionally omitted - Admins shouldn't set passwords directly.
    # Implement a separate password reset flow if needed.
    avatar_url: String
    bio: String
    # Could add fields like 'is_active', 'is_verified' if needed
  }


  input LoginInput { # Keep existing
    login: String!
    password: String!
  }

  input RatingInput { # Keep existing
    movie_id: ID!
    rating: Int!
  }

  # --- Extend base Query ---
  extend type Query {
    me: User # Keep existing
    user(id: ID, username: String): User # Keep existing
    users(limit: Int = 20, offset: Int = 0, search: String): [User!]! # Keep existing
    userCount(search: String): Int! # Keep existing
    userList(userId: ID!, listType: ListType!): UserList # Keep existing
  }

  # --- Extend base Mutation ---
  extend type Mutation {
    # Existing User Mutations
    registerUser(input: UserInput!): AuthPayload!
    loginUser(input: LoginInput!): AuthPayload!
    updateUser(input: UserUpdateInput!): User! # Self-update
    rateMovie(input: RatingInput!): UserRating!
    deleteRating(movie_id: ID!): Boolean!
    addMovieToList(movie_id: ID!, listType: ListType!): UserList!
    removeMovieFromList(movie_id: ID!, listType: ListType!): UserList!

    # --- NEW: Admin User Management Mutations ---
    adminUpdateUser(id: ID!, input: AdminUserUpdateInput!): User!
    adminDeleteUser(id: ID!): Boolean!
  }
`;

// --- Resolvers ---
const resolvers = {
  // Keep existing ListType, User, UserRating, UserList resolvers...
  ListType: {
    FAVORITES: 'favorites',
    WATCHED: 'watched',
    WATCHLIST: 'watchlist',
  },
  User: {
    // Direct maps should work for most fields now including avatar_url
    lists: async (user, _, { db }) => {
      const result = await db.query('SELECT * FROM user_lists WHERE user_id = $1', [user.id]);
      return result.rows;
    },
    ratings: async (user, _, { db }) => {
      const result = await db.query('SELECT * FROM user_ratings WHERE user_id = $1 ORDER BY updated_at DESC', [user.id]);
      return result.rows;
    },
    comments: async (user, _, { db }) => {
      // Add parent check if only fetching top-level comments here is desired
      const result = await db.query('SELECT * FROM comments WHERE user_id = $1 ORDER BY created_at DESC', [user.id]);
      return result.rows;
    },
  },

  UserRating: {
    movie: async (rating, _, { db, loaders }) => {
       // Use DataLoader if implemented for Movie
       if (loaders?.movieLoader) {
           return loaders.movieLoader.load(rating.movie_id);
       }
      const result = await db.query('SELECT * FROM movies WHERE id = $1', [rating.movie_id]);
      return result.rows[0];
    },
  },

  UserList: {
    list_type: (list) => list.list_type?.toUpperCase(),
    movies: async (list, _, { db, loaders }) => {
        // Consider DataLoader for movies within lists if performance is critical
      const result = await db.query(
        `SELECT m.*
         FROM movies m JOIN user_list_items uli ON m.id = uli.movie_id
         WHERE uli.list_id = $1 ORDER BY uli.added_at DESC`, // Example ordering
        [list.id]
      );
      return result.rows;
    },
  },

  Query: {
    // Keep existing me, user, users, userCount, userList resolvers...
    me: (_, __, { user }) => user || null,
    user: async (_, { id, username }, { db }) => {
        let query;
        let values;
        if (id) {
            query = 'SELECT * FROM users WHERE id = $1';
            values = [id];
        } else if (username) {
            query = 'SELECT * FROM users WHERE lower(username) = lower($1)';
            values = [username];
        } else {
            throw new GraphQLError('Either user ID or username must be provided.', {
                extensions: {
                    code: 'BAD_USER_INPUT',
                },
            });
        }
        const result = await db.query(query, values);
        if (!result.rows[0]) return null;
        const { password_hash, ...publicUser } = result.rows[0];
        return publicUser;
    },
     users: async (_, { limit = 20, offset = 0, search }, { db }) => {
        // Requires admin check? Decide based on app requirements.
        // Let's assume listing users is okay for now, or add _ensureAdminRole(context);
        let query = 'SELECT id, first_name, last_name, username, email, avatar_url, bio, created_at, updated_at FROM users'; // Explicitly exclude password_hash
        const values = [];
        let paramIndex = 1;
        if (search) {
            query += ` WHERE lower(username) LIKE lower($${paramIndex}) OR lower(email) LIKE lower($${paramIndex})`;
            values.push(`%${search}%`);
            paramIndex++;
        }
        query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        values.push(limit, offset);
        const result = await db.query(query, values);
        return result.rows; // Already excluded password hash
    },
    userCount: async (_, { search }, { db }) => {
        // Requires admin check?
        // Let's assume counting users is okay for now, or add _ensureAdminRole(context);
        let query = 'SELECT COUNT(*) FROM users';
        const values = [];
        if (search) {
            query += ' WHERE lower(username) LIKE lower($1) OR lower(email) LIKE lower($1)';
            values.push(`%${search}%`);
        }
        const result = await db.query(query, values);
        return parseInt(result.rows[0].count, 10);
    },
    userList: async (_, { userId, listType }, { db }) => {
      const dbListType = resolvers.ListType[listType];
      if (!dbListType) throw new GraphQLError(`Invalid list type: ${listType}`, {
        extensions: {
            code: 'BAD_USER_INPUT',
        },
      });
      const result = await db.query(
        'SELECT * FROM user_lists WHERE user_id = $1 AND list_type = $2',
        [userId, dbListType]
      );
      return result.rows[0] || null;
    },
  },

  Mutation: {
    registerUser: async (_, { input }, { db }) => {
      const { email, username, password, first_name, last_name, bio, avatar_url } = input;

      // Basic validation
      if (!password || password.length < 6) {
          throw new GraphQLError('Password must be at least 6 characters long.', {
              extensions: {
                  code: 'BAD_USER_INPUT',
              },
          });
      }
      if (!email || !username) {
           throw new GraphQLError('Email and Username are required.', {
               extensions: {
                   code: 'BAD_USER_INPUT',
               },
           });
      }
      // Add email format validation? URL validation for avatar_url?

      // Check for existing user (case-insensitive)
      const existingUser = await db.query(
        'SELECT id FROM users WHERE lower(email) = lower($1) OR lower(username) = lower($2)',
        [email, username]
      );
      if (existingUser.rows.length > 0) {
        throw new GraphQLError('User with this email or username already exists.', {
            extensions: {
                code: 'BAD_USER_INPUT',
            },
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12); // Use sufficient salt rounds

      // Insert user - Transaction handled by trigger 'create_default_lists_for_new_user' now
       const insertQuery = `
         INSERT INTO users (first_name, last_name, username, email, password_hash, avatar_url, bio, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`;
       const values = [first_name, last_name, username, email, passwordHash, avatar_url, bio];

       let newUser;
       try {
           const result = await db.query(insertQuery, values);
           newUser = result.rows[0];
           // Default lists are created by the trigger now.
       } catch (error) {
           console.error("Registration failed:", error);
            // Check specific DB errors (e.g., unique constraint)
            if (error.code === '23505') { // PostgreSQL unique violation
                throw new GraphQLError('User with this email or username already exists.', {
                    extensions: {
                        code: 'BAD_USER_INPUT',
                    },
                });
            }
           throw new GraphQLError("Failed to register user. Please try again.", {
               extensions: {
                   code: 'INTERNAL_SERVER_ERROR',
               },
           });
       }

      // Generate JWT token
      const tokenPayload = { userId: newUser.id, username: newUser.username }; // Use userId for consistency
      const token = jwt.sign(tokenPayload, config.jwtSecret, { expiresIn: config.jwtExpiration });

      const { password_hash, ...userForPayload } = newUser;
      return { token, user: userForPayload };
    },

    // <<< CORRECTED: Login via username OR email >>>
    loginUser: async (_, { input }, { db }) => {
      const { login, password } = input; // 'login' contains username or email

      if (!login || !password) {
           throw new GraphQLError('Login identifier and password are required.', {
               extensions: {
                   code: 'BAD_USER_INPUT',
               },
           });
      }

      // Find user by email OR username (case-insensitive)
      const result = await db.query(
        'SELECT * FROM users WHERE lower(email) = lower($1) OR lower(username) = lower($1)',
        [login]
      );
      const user = result.rows[0];

      if (!user) {
        throw new GraphQLError('Invalid credentials.', {
            extensions: {
                code: 'UNAUTHENTICATED',
            },
        }); // Generic error
      }

      // Compare submitted password with stored hash
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        throw new GraphQLError('Invalid credentials.', {
            extensions: {
                code: 'UNAUTHENTICATED',
            },
        }); // Generic error
      }

      // Generate JWT token
      const tokenPayload = { userId: user.id, username: user.username };
      const token = jwt.sign(tokenPayload, config.jwtSecret, { expiresIn: config.jwtExpiration });

      const { password_hash, ...userWithoutPassword } = user;
      return { token, user: userWithoutPassword };
    },

    updateUser: async (_, { input }, { user, db }) => {
      _ensureLoggedIn(user); // User must be logged in (from context)

      const updates = [];
      const values = [];
      let paramCounter = 1;

      // Build dynamic SET clause, checking for undefined to allow setting nulls
      if (input.first_name !== undefined) { updates.push(`first_name = $${paramCounter++}`); values.push(input.first_name); }
      if (input.last_name !== undefined) { updates.push(`last_name = $${paramCounter++}`); values.push(input.last_name); }
      if (input.bio !== undefined) { updates.push(`bio = $${paramCounter++}`); values.push(input.bio); }
      if (input.avatar_url !== undefined) {
          // Add URL validation if needed
          updates.push(`avatar_url = $${paramCounter++}`); values.push(input.avatar_url);
      }

      // Check uniqueness if username/email are being changed
      if (input.username !== undefined && input.username.toLowerCase() !== user.username.toLowerCase()) {
         if (!input.username) throw new GraphQLError('Username cannot be empty.', {
             extensions: {
                 code: 'BAD_USER_INPUT',
             },
         });
         const existing = await db.query('SELECT id FROM users WHERE lower(username) = lower($1) AND id != $2', [input.username, user.id]);
         if (existing.rows.length > 0) throw new GraphQLError('Username already taken.', {
             extensions: {
                 code: 'BAD_USER_INPUT',
             },
         });
         updates.push(`username = $${paramCounter++}`); values.push(input.username);
      }
      if (input.email !== undefined && input.email.toLowerCase() !== user.email.toLowerCase()) {
         if (!input.email) throw new GraphQLError('Email cannot be empty.', {
             extensions: {
                 code: 'BAD_USER_INPUT',
             },
         });
         // Add email format validation
         const existing = await db.query('SELECT id FROM users WHERE lower(email) = lower($1) AND id != $2', [input.email, user.id]);
         if (existing.rows.length > 0) throw new GraphQLError('Email already taken.', {
             extensions: {
                 code: 'BAD_USER_INPUT',
             },
         });
         updates.push(`email = $${paramCounter++}`); values.push(input.email);
      }

      // Handle password change
      if (input.password !== undefined) {
         if (!input.password || input.password.length < 6) { // Ensure password is not empty and meets length requirement
             throw new GraphQLError('New password must be at least 6 characters long.', {
                 extensions: {
                     code: 'BAD_USER_INPUT',
                 },
             });
         }
         const passwordHash = await bcrypt.hash(input.password, 12);
         updates.push(`password_hash = $${paramCounter++}`); values.push(passwordHash);
      }

      if (updates.length === 0) {
        // Nothing to update, return current user data
        const { password_hash, ...currentUserData } = user; // Use user from context
        return currentUserData;
      }

      // Add user ID for the WHERE clause (ALWAYS last parameter)
      values.push(user.id);

      // updated_at is handled by the trigger, no need to set manually

      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCounter} RETURNING *`;

      try {
            const result = await db.query(query, values);
            if (!result.rows[0]) throw new GraphQLError("Failed to update user or user not found.", {
                extensions: {
                    code: 'INTERNAL_SERVER_ERROR',
                },
            }); // Should be caught by _ensureLoggedIn

            const { password_hash, ...updatedUser } = result.rows[0];
            return updatedUser;
       } catch (error) {
            console.error("Error updating user:", error);
            if (error.code === '23505') { // Handle unique constraint violations
                if (error.constraint === 'users_username_key') throw new UserInputError('Username already taken.');
                if (error.constraint === 'users_email_key') throw new UserInputError('Email already taken.');
            }
            throw new Error("Failed to update user profile."); // Generic error
       }
    },

    rateMovie: async (_, { input }, { user, db }) => {
        // ... (Resolver remains largely the same, ensure trigger handles avg_rating) ...
        _ensureLoggedIn(user);
        const { movie_id, rating } = input;
        if (rating < 1 || rating > 10) {
            throw new UserInputError('Rating must be between 1 and 10.');
        }
        const movieExists = await db.query('SELECT id FROM movies WHERE id = $1', [movie_id]);
        if (movieExists.rows.length === 0) throw new UserInputError(`Movie with ID ${movie_id} not found.`);

        const query = `
            INSERT INTO user_ratings (user_id, movie_id, rating, created_at, updated_at)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, movie_id) DO UPDATE
            SET rating = EXCLUDED.rating, updated_at = CURRENT_TIMESTAMP
            RETURNING *`;
        const values = [user.id, movie_id, rating];

        const result = await db.query(query, values);
        // The trigger 'update_movie_rating_after_user_rating' handles updating movies.avg_rating
        return result.rows[0];
    },

    deleteRating: async (_, { movie_id }, { user, db }) => {
        // ... (Resolver remains the same, trigger handles avg_rating) ...
        _ensureLoggedIn(user);
        const result = await db.query(
            'DELETE FROM user_ratings WHERE user_id = $1 AND movie_id = $2 RETURNING id',
            [user.id, movie_id]
        );
        // Trigger 'update_movie_rating_after_user_rating' handles updating movies.avg_rating
        return result.rowCount > 0;
    },

    addMovieToList: async (_, { movie_id, listType }, { user, db }) => {
        // ... (Resolver remains largely the same) ...
        _ensureLoggedIn(user);
        const dbListType = resolvers.ListType[listType];
        if (!dbListType) throw new UserInputError(`Invalid list type: ${listType}`);

        const movieExists = await db.query('SELECT id FROM movies WHERE id = $1', [movie_id]);
        if (movieExists.rows.length === 0) throw new UserInputError(`Movie with ID ${movie_id} not found.`);

        const listResult = await db.query(
            'SELECT id FROM user_lists WHERE user_id = $1 AND list_type = $2',
            [user.id, dbListType]
        );
        if (listResult.rows.length === 0) {
            throw new Error(`List type '${dbListType}' not found for this user. Should be created on registration.`);
        }
        const listId = listResult.rows[0].id;

        await db.query(
            `INSERT INTO user_list_items (list_id, movie_id, added_at)
             VALUES ($1, $2, CURRENT_TIMESTAMP)
             ON CONFLICT (list_id, movie_id) DO NOTHING`, // Ignore if already exists
            [listId, movie_id]
        );

        // Refetch the list to return it
        const updatedList = await db.query('SELECT * FROM user_lists WHERE id = $1', [listId]);
        return updatedList.rows[0]; // Should always exist
    },

    removeMovieFromList: async (_, { movie_id, listType }, { user, db }) => {
       // ... (Resolver remains largely the same) ...
       _ensureLoggedIn(user);
       const dbListType = resolvers.ListType[listType];
       if (!dbListType) throw new UserInputError(`Invalid list type: ${listType}`);

       const listResult = await db.query(
            'SELECT id FROM user_lists WHERE user_id = $1 AND list_type = $2',
            [user.id, dbListType]
       );
       if (listResult.rows.length === 0) {
            // If the list doesn't exist, can't remove from it. Return null or the list (which is null).
            return null;
       }
       const listId = listResult.rows[0].id;

       await db.query(
            'DELETE FROM user_list_items WHERE list_id = $1 AND movie_id = $2',
            [listId, movie_id]
       );

       // Refetch the list to return its current state
       const updatedList = await db.query('SELECT * FROM user_lists WHERE id = $1', [listId]);
       return updatedList.rows[0]; // Should still exist
    },

    // --- NEW Admin User Management Resolvers ---

    adminUpdateUser: async (_, { id, input }, context) => {
      _ensureAdminRole(context, 'ADMIN'); // Require at least ADMIN role

      const { db } = context;
      const { first_name, last_name, username, email, avatar_url, bio } = input;

      // Fetch the user being updated to check existence and for comparisons
      const { rows: existingUserRows } = await db.query('SELECT username, email FROM users WHERE id = $1', [id]);
      if (existingUserRows.length === 0) {
        throw new UserInputError(`User with ID ${id} not found.`);
      }
      const existingUser = existingUserRows[0];

      const updates = [];
      const values = [];
      let valueCounter = 1;

      // Build dynamic SET clause, checking for undefined/null based on input definition
      // Use !== undefined to allow setting fields explicitly to null if desired
      if (first_name !== undefined) { updates.push(`first_name = $${valueCounter++}`); values.push(first_name); }
      if (last_name !== undefined) { updates.push(`last_name = $${valueCounter++}`); values.push(last_name); }
      if (bio !== undefined) { updates.push(`bio = $${valueCounter++}`); values.push(bio); }
      if (avatar_url !== undefined) { updates.push(`avatar_url = $${valueCounter++}`); values.push(avatar_url); }

      // Check uniqueness if username/email are being changed
      if (username !== undefined && username.toLowerCase() !== existingUser.username.toLowerCase()) {
         if (!username) throw new UserInputError('Username cannot be empty.');
         const { rows: existingUsername } = await db.query('SELECT id FROM users WHERE lower(username) = lower($1) AND id != $2', [username, id]);
         if (existingUsername.length > 0) throw new UserInputError('Username already taken.');
         updates.push(`username = $${valueCounter++}`); values.push(username);
      }
      if (email !== undefined && email.toLowerCase() !== existingUser.email.toLowerCase()) {
         if (!email) throw new UserInputError('Email cannot be empty.');
         // Add email format validation if desired
         const { rows: existingEmail } = await db.query('SELECT id FROM users WHERE lower(email) = lower($1) AND id != $2', [email, id]);
         if (existingEmail.length > 0) throw new UserInputError('Email already taken.');
         updates.push(`email = $${valueCounter++}`); values.push(email);
      }

      if (updates.length === 0) {
        // If no fields to update were provided in the input
        // Return the existing user data without hitting the DB for an update
         const { password_hash, ...publicUser } = await db.query('SELECT * from users WHERE id = $1', [id]).then(res => res.rows[0]);
         return publicUser;
      }

      // Add updated_at trigger or manually update it
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id); // Add user ID for the WHERE clause

      const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = $${valueCounter} RETURNING *`;

      try {
            const { rows } = await db.query(updateQuery, values);
            if (!rows[0]) {
                // Should not happen if existence check passed, but handle defensively
                throw new Error("Failed to update user.");
            }
            console.log(`Admin ${context.admin.id} updated user ${id}`);
            const { password_hash, ...updatedUser } = rows[0];
            return updatedUser;
       } catch (error) {
            console.error(`Error updating user ${id} by admin ${context.admin.id}:`, error);
            if (error.code === '23505') { // Handle unique constraint violations
                if (error.constraint === 'users_username_key') throw new UserInputError('Username already taken.');
                if (error.constraint === 'users_email_key') throw new UserInputError('Email already taken.');
            }
             if (error instanceof UserInputError || error instanceof ForbiddenError) {
                throw error;
            }
            throw new Error("Failed to update user profile due to a server error.");
       }
    },

    adminDeleteUser: async (_, { id }, context) => {
      _ensureAdminRole(context, 'SUPER_ADMIN'); // Require SUPER_ADMIN for deletion

      const { db } = context;
      const adminId = context.admin.id;

       // 1. Prevent deleting oneself (admins should use deleteAdmin for that)
        // Fetch user to check if it's linked to the calling admin
        const { rows: userAdminLink } = await db.query('SELECT id FROM admins WHERE user_id = $1 AND id = $2', [id, adminId]);
        if (userAdminLink.length > 0) {
            throw new ForbiddenError("Admins cannot delete their own linked user account via this mutation. Use the specific admin deletion function.");
        }

      // 2. Check if the user being deleted is linked to *any* admin account
      //    Prevents orphaning admin records or unintended deletion of admins.
      const { rows: linkedAdmin } = await db.query('SELECT id FROM admins WHERE user_id = $1', [id]);
      if (linkedAdmin.length > 0) {
        throw new ForbiddenError(`User ${id} is linked to Admin account ${linkedAdmin[0].id}. Delete the admin account first via admin management.`);
      }

      // 3. Perform deletion (consider wrapping in transaction if cleaning related data manually)
      //    Assumes ON DELETE CASCADE is set for foreign keys in tables like
      //    user_ratings, user_lists, comments, etc., referencing users.id.
      //    If not, you MUST delete related records first within a transaction.
      try {
        // Optional: Start transaction
        // await db.query('BEGIN');

        // Optional: Delete related data if cascade is not set (Example)
        // await db.query('DELETE FROM comments WHERE user_id = $1', [id]);
        // await db.query('DELETE FROM user_ratings WHERE user_id = $1', [id]);
        // ... other tables

        // Delete the user
        const result = await db.query('DELETE FROM users WHERE id = $1', [id]);

        // Optional: Commit transaction
        // await db.query('COMMIT');

        if (result.rowCount > 0) {
          console.log(`Admin ${adminId} deleted user ${id}`);
          return true;
        } else {
           // User might have been deleted between check and delete, or never existed
          console.warn(`Admin ${adminId} attempted to delete user ${id}, but user was not found.`);
          return false; // Or throw UserInputError('User not found.')
        }
      } catch (error) {
          // Optional: Rollback transaction
          // await db.query('ROLLBACK');
          console.error(`Error deleting user ${id} by admin ${adminId}:`, error);
          // Check for specific DB errors (e.g., foreign key violation if cascade not set)
           if (error.code === '23503') { // Foreign key violation
                throw new Error('Cannot delete user: Related data exists (e.g., ratings, comments). Please ensure cascading delete is configured or manually clean up data.');
           }
           if (error instanceof ForbiddenError) {
                throw error;
           }
          throw new Error("Failed to delete user due to a server error.");
      }
    },
  },
};

module.exports = { typeDefs, resolvers };