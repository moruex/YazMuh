// src/schema/user.js
// const { gql } = require('@apollo/server');
const gql = require('graphql-tag');
const { GraphQLError } = require('graphql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// Import helpers from the new utility file
const { ensureLoggedIn, ensureAdminRole, rolesHierarchy } = require('../utils/authHelpers');
// Assuming config is accessible or passed appropriately
// const config = require('../config');

// --- Config (ensure these are set in your environment) ---
const config = {
    jwtSecret: process.env.JWT_SECRET || 'YOUR_REALLY_SECRET_KEY_PLEASE_CHANGE',
    jwtExpiration: process.env.JWT_EXPIRATION || '1d',
    bcryptSaltRounds: 12
};

// --- Helper Functions ---
async function checkAdminPermissionById(db, adminId, requiredRole = 'ADMIN', action = 'perform this action') {
    if (!adminId) {
        throw new GraphQLError('Admin ID required for this action.', { extensions: { code: 'UNAUTHENTICATED' } });
    }
    const { rows } = await db.query('SELECT role FROM admins WHERE id = $1', [adminId]);
    if (rows.length === 0) {
        throw new GraphQLError('Admin performing action not found.', { extensions: { code: 'FORBIDDEN' } });
    }
    const adminRole = rows[0].role;
    const userLevel = rolesHierarchy[adminRole] || 0;
    const requiredLevel = rolesHierarchy[requiredRole] || 0;

    if (userLevel < requiredLevel) {
        console.warn(`Permission denied: Admin ${adminId} (Role: ${adminRole}) attempted to ${action}. Required: ${requiredRole}.`);
        throw new GraphQLError(`You do not have permission to ${action}. Requires ${requiredRole} role or higher.`, { extensions: { code: 'FORBIDDEN' } });
    }
    return true; // Permission granted
}

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
    # --- Relationships ---
    movie_lists(listType: ListType): [UserMovieList!]
    ratings: [UserRating!]
    comments: [Comment!]
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  # --- Updated types for movie lists ---
  type UserMovieList {
    id: ID!
    user_id: ID!
    movie_id: ID!
    list_type: ListType!
    added_at: DateTime!
    movie: Movie!
  }

  type UserRating {
    id: ID!
    movie: Movie!
    rating: Int!
    created_at: DateTime!
    updated_at: DateTime!
  }

  enum ListType {
    FAVORITES
    WATCHED
    WATCHLIST
  }
  # Assume Comment type exists
  # Assume Movie type exists

  # --- Input Types ---
  input UserInput {
    first_name: String
    last_name: String
    username: String!
    email: String!
    password: String!
    avatar_url: String
    bio: String
  }

  input UserUpdateInput {
    first_name: String
    last_name: String
    username: String
    email: String
    password: String
    currentPassword: String
    avatar_url: String
    bio: String
  }

  input AdminUserUpdateInput {
    first_name: String
    last_name: String
    username: String
    email: String
    avatar_url: String
    bio: String
  }

  input LoginInput {
    login: String!
    password: String!
  }

  # --- Extend base Query ---
  extend type Query {
    me: User
    user(id: ID, username: String): User
    users(performingAdminId: ID, limit: Int = 20, offset: Int = 0, search: String): [User!]!
    userCount(performingAdminId: ID, search: String): Int!
    
    # Updated query for user movie lists - gets all lists by default or filtered by type
    userMovieLists(userId: ID!, listType: ListType): [UserMovieList!]!
    
    # Query to check if a movie is in a specific user list
    isMovieInUserList(userId: ID!, movieId: ID!, listType: ListType!): Boolean!
    
    # Query to fetch a user's rating for a movie
    userRating(userId: ID!, movieId: ID!): UserRating
  }

  # --- Extend base Mutation ---
  extend type Mutation {
    # User Mutations
    registerUser(input: UserInput!): User!
    loginUser(input: LoginInput!): AuthPayload!
    updateUser(userId: ID!, input: UserUpdateInput!): User!
    rateMovie(userId: ID!, movieId: ID!, rating: Int!): UserMovieRatingResponse!
    deleteRating(userId: ID!, movie_id: ID!): Boolean!
    
    # Updated list mutations
    addMovieToList(userId: ID!, movieId: ID!, listType: ListType!): UserMovieList!
    removeMovieFromList(userId: ID!, movieId: ID!, listType: ListType!): Boolean!

    # Admin User Management Mutations
    adminUpdateUser(performingAdminId: ID!, id: ID!, input: AdminUserUpdateInput!): User!
    adminDeleteUser(performingAdminId: ID!, id: ID!): Boolean!
    deleteMyAccount: Boolean!
  }

  type UserMovieRatingResponse {
    id: ID
    movieId: ID
    rating: Int
  }
`;

// --- Resolvers ---
const resolvers = {
  ListType: {
    FAVORITES: 'FAVORITES',
    WATCHED: 'WATCHED',
    WATCHLIST: 'WATCHLIST',
  },
  
  User: {
    movie_lists: async (user, { listType }, { db }) => {
      let query = 'SELECT * FROM user_movie_lists WHERE user_id = $1';
      const params = [user.id];
      
      // Add filter by list type if provided
      if (listType) {
        query += ' AND list_type = $2';
        params.push(resolvers.ListType[listType]); // Use the enum value
      }
      
      query += ' ORDER BY added_at DESC';
      
      const result = await db.query(query, params);
      return result.rows;
    },
    
    ratings: async (user, _, { db }) => {
      const result = await db.query('SELECT * FROM user_ratings WHERE user_id = $1 ORDER BY updated_at DESC', [user.id]);
      return result.rows;
    },
    
    comments: async (user, _, { db }) => {
      const result = await db.query('SELECT * FROM comments WHERE user_id = $1 ORDER BY created_at DESC', [user.id]);
      return result.rows;
    },
  },

  UserMovieList: {
    movie: async (userMovieList, _, { db, loaders }) => {
      // Use DataLoader if implemented
      if (loaders?.movieLoader) {
        return loaders.movieLoader.load(userMovieList.movie_id);
      }
      
      const result = await db.query('SELECT * FROM movies WHERE id = $1', [userMovieList.movie_id]);
      return result.rows[0] || null;
    }
  },

  UserRating: {
    movie: async (rating, _, { db, loaders }) => {
       // Use DataLoader if implemented
       if (loaders?.movieLoader) {
           return loaders.movieLoader.load(rating.movie_id);
       }
      const result = await db.query('SELECT * FROM movies WHERE id = $1', [rating.movie_id]);
      return result.rows[0];
    },
  },

  Query: {
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
                extensions: { code: 'BAD_USER_INPUT' },
            });
        }
        const result = await db.query(query, values);
        if (!result.rows[0]) return null;
        const { password_hash, ...publicUser } = result.rows[0];
        return publicUser;
    },
    
    users: async (_, { performingAdminId, limit = 20, offset = 0, search }, { db }) => {
        if (performingAdminId) {
            await checkAdminPermissionById(db, performingAdminId, 'ADMIN', 'list users');
        } else {
             throw new GraphQLError('Admin privileges required to list users.', { extensions: { code: 'FORBIDDEN' } });
        }
        let query = 'SELECT id, first_name, last_name, username, email, avatar_url, bio, created_at, updated_at FROM users';
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
        return result.rows;
    },
    
    userCount: async (_, { performingAdminId, search }, { db }) => {
        if (performingAdminId) {
             await checkAdminPermissionById(db, performingAdminId, 'ADMIN', 'count users');
        } else {
            throw new GraphQLError('Admin privileges required to count users.', { extensions: { code: 'FORBIDDEN' } });
        }
        let query = 'SELECT COUNT(*) FROM users';
        const values = [];
        if (search) {
            query += ' WHERE lower(username) LIKE lower($1) OR lower(email) LIKE lower($1)';
            values.push(`%${search}%`);
        }
        const result = await db.query(query, values);
        return parseInt(result.rows[0].count, 10);
    },
    
    // Updated list query
    userMovieLists: async (_, { userId, listType }, { db }) => {
      console.log('DEBUG: Querying user movie lists:', { userId, listType });
      
      let query = 'SELECT * FROM user_movie_lists WHERE user_id = $1';
      const params = [userId];
      
      if (listType) {
        query += ' AND list_type = $2';
        const typeValue = resolvers.ListType[listType];
        console.log(`Converting ${listType} to database value: ${typeValue}`);
        params.push(typeValue);
      }
      
      query += ' ORDER BY added_at DESC';
      const result = await db.query(query, params);
      console.log(`Found ${result.rows.length} user movie list items`);
      return result.rows;
    },
    
    // Check if a movie is in a specific list
    isMovieInUserList: async (_, { userId, movieId, listType }, { db }) => {
      console.log('DEBUG: Checking if movie is in user list:', { userId, movieId, listType });
      const typeValue = resolvers.ListType[listType];
      
      if (!typeValue) {
        throw new GraphQLError(`Invalid list type: ${listType}`, {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      
      const result = await db.query(
        'SELECT EXISTS(SELECT 1 FROM user_movie_lists WHERE user_id = $1 AND movie_id = $2 AND list_type = $3)',
        [userId, movieId, typeValue]
      );
      
      console.log(`Movie ${movieId} in ${listType} list for user ${userId}: ${result.rows[0].exists}`);
      return result.rows[0].exists;
    },
    
    // Query to fetch a user's rating for a movie
    userRating: async (_, { userId, movieId }, { db }) => {
      console.log('DEBUG: Fetching user rating:', { userId, movieId });
      
      if (!userId || !movieId) {
        throw new GraphQLError('Both userId and movieId are required', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }
      
      const result = await db.query(
        'SELECT * FROM user_ratings WHERE user_id = $1 AND movie_id = $2',
        [userId, movieId]
      );
      
      if (result.rows.length === 0) {
        console.log(`No rating found for movie ${movieId} by user ${userId}`);
        return null;
      }
      
      console.log(`Found rating for movie ${movieId} by user ${userId}: ${result.rows[0].rating}`);
      return result.rows[0];
    },
  },

  Mutation: {
    registerUser: async (_, { input }, { db }) => {
      const { email, username, password, first_name, last_name, bio, avatar_url } = input;

      // Basic validation
      if (!password || password.length < 6) {
          throw new GraphQLError('Password must be at least 6 characters long.', {
              extensions: { code: 'BAD_USER_INPUT' },
          });
      }
      
      if (!email || !username) {
           throw new GraphQLError('Email and Username are required.', {
               extensions: { code: 'BAD_USER_INPUT' },
           });
      }

      // Check for existing user (case-insensitive)
      const existingUser = await db.query(
        'SELECT id FROM users WHERE lower(email) = lower($1) OR lower(username) = lower($2)',
        [email, username]
      );
      
      if (existingUser.rows.length > 0) {
        throw new GraphQLError('User with this email or username already exists.', {
            extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, config.bcryptSaltRounds);

      // Insert user
      const insertQuery = `
         INSERT INTO users (first_name, last_name, username, email, password_hash, avatar_url, bio, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`;
      const values = [first_name, last_name, username, email, passwordHash, avatar_url, bio];

      let newUser;
      try {
        const result = await db.query(insertQuery, values);
        newUser = result.rows[0];
        
        // No need to create default lists anymore as they'll be handled on insertion
      } catch (error) {
        console.error("Registration failed:", error);
        if (error.code === '23505') {
          throw new GraphQLError('User with this email or username already exists.', {
            extensions: { code: 'BAD_USER_INPUT' },
          });
        }
        throw new GraphQLError("Failed to register user. Please try again.", {
           extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }

      const { password_hash, ...userForPayload } = newUser;
      return userForPayload;
    },

    loginUser: async (_, { input }, { db }) => {
      const { login, password } = input;

      if (!login || !password) {
        throw new GraphQLError('Login identifier and password are required.', {
           extensions: { code: 'BAD_USER_INPUT' },
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
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Compare submitted password with stored hash
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        throw new GraphQLError('Invalid credentials.', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      // Generate JWT token
      const tokenPayload = { userId: user.id, username: user.username };
      const token = jwt.sign(tokenPayload, config.jwtSecret, { expiresIn: config.jwtExpiration });

      const { password_hash, ...userWithoutPassword } = user;
      return { token, user: userWithoutPassword };
    },

    updateUser: async (_, { userId, input }, { db, user: contextUser }) => {
      if (!userId) {
        throw new GraphQLError('User ID is required for update.', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      const { rows: targetUserRows } = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
      if (targetUserRows.length === 0) {
        throw new GraphQLError('User to update not found.', { extensions: { code: 'NOT_FOUND' } });
      }
      const targetUser = targetUserRows[0];

      const updates = [];
      const values = [];
      let paramCounter = 1;

      if (input.first_name !== undefined) { updates.push(`first_name = $${paramCounter++}`); values.push(input.first_name); }
      if (input.last_name !== undefined) { updates.push(`last_name = $${paramCounter++}`); values.push(input.last_name); }
      if (input.bio !== undefined) { updates.push(`bio = $${paramCounter++}`); values.push(input.bio); }
      if (input.avatar_url !== undefined) { updates.push(`avatar_url = $${paramCounter++}`); values.push(input.avatar_url); }

      if (input.username !== undefined && input.username.toLowerCase() !== targetUser.username.toLowerCase()) {
         if (!input.username) throw new GraphQLError('Username cannot be empty.', {
           extensions: { code: 'BAD_USER_INPUT' },
         });
         const existing = await db.query('SELECT id FROM users WHERE lower(username) = lower($1) AND id != $2', [input.username, userId]);
         if (existing.rows.length > 0) throw new GraphQLError('Username already taken.', {
           extensions: { code: 'BAD_USER_INPUT' },
         });
         updates.push(`username = $${paramCounter++}`); values.push(input.username);
      }
      
      if (input.email !== undefined && input.email.toLowerCase() !== targetUser.email.toLowerCase()) {
         if (!input.email) throw new GraphQLError('Email cannot be empty.', {
           extensions: { code: 'BAD_USER_INPUT' },
         });
         const existing = await db.query('SELECT id FROM users WHERE lower(email) = lower($1) AND id != $2', [input.email, userId]);
         if (existing.rows.length > 0) throw new GraphQLError('Email already taken.', {
           extensions: { code: 'BAD_USER_INPUT' },
         });
         updates.push(`email = $${paramCounter++}`); values.push(input.email);
      }

      if (input.password !== undefined) {
         if (!input.currentPassword) {
            throw new GraphQLError('Current password is required to set a new password.', { extensions: { code: 'BAD_USER_INPUT' } });
         }
         const validPassword = await bcrypt.compare(input.currentPassword, targetUser.password_hash);
         if (!validPassword) {
            throw new GraphQLError('Incorrect current password.', { extensions: { code: 'UNAUTHENTICATED' }});
         }
         if (!input.password || input.password.length < 6) {
             throw new GraphQLError('New password must be at least 6 characters long.', {
               extensions: { code: 'BAD_USER_INPUT' },
             });
         }
         const passwordHash = await bcrypt.hash(input.password, config.bcryptSaltRounds);
         updates.push(`password_hash = $${paramCounter++}`); values.push(passwordHash);
      }

      if (updates.length === 0) {
        const { password_hash, ...currentUserData } = targetUser;
        return currentUserData;
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(userId);

      const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCounter} RETURNING *`;

      try {
        const result = await db.query(query, values);
        if (!result.rows[0]) throw new GraphQLError("Failed to update user.", {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });

        const { password_hash, ...updatedUser } = result.rows[0];
        return updatedUser;
      } catch (error) {
        console.error("Error updating user:", error);
        if (error.code === '23505') {
          if (error.constraint && error.constraint.includes('users_username_key')) throw new GraphQLError('Username already taken.', { extensions: { code: 'BAD_USER_INPUT' }});
          if (error.constraint && error.constraint.includes('users_email_key')) throw new GraphQLError('Email already taken.', { extensions: { code: 'BAD_USER_INPUT' }});
        }
        throw new GraphQLError("Failed to update user profile.", { extensions: { code: 'INTERNAL_SERVER_ERROR' }});
      }
    },

    rateMovie: async (_, { userId, movieId, rating }, { db }) => {
        if (!userId) throw new GraphQLError('User ID is required.', { extensions: { code: 'BAD_USER_INPUT' } });
        if (rating < 0 || rating > 10) {
            throw new GraphQLError('Rating must be between 0 and 10 (0 to clear).', { extensions: { code: 'BAD_USER_INPUT' } });
        }
        const movieExists = await db.query('SELECT id FROM movies WHERE id = $1', [movieId]);
        if (movieExists.rows.length === 0) throw new GraphQLError(`Movie with ID ${movieId} not found.`, { extensions: { code: 'NOT_FOUND' } });

        // Check if user exists
        const userExists = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
        if (userExists.rows.length === 0) throw new GraphQLError(`User with ID ${userId} not found.`, { extensions: { code: 'NOT_FOUND' } });

        if (rating === 0) {
            const deleteResult = await db.query('DELETE FROM user_ratings WHERE user_id = $1 AND movie_id = $2 RETURNING movie_id', [userId, movieId]);
            return { id: null, movieId: deleteResult.rowCount > 0 ? movieId : null, rating: null };
        } else {
            const query = `
                INSERT INTO user_ratings (user_id, movie_id, rating, created_at, updated_at)
                VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT (user_id, movie_id) DO UPDATE
                SET rating = EXCLUDED.rating, updated_at = CURRENT_TIMESTAMP
                RETURNING id, movie_id, rating`;
            const values = [userId, movieId, rating];

            const result = await db.query(query, values);
            if (result.rows.length > 0) {
                return { id: result.rows[0].id, movieId: result.rows[0].movie_id, rating: result.rows[0].rating };
            }
            throw new GraphQLError('Failed to save rating.', { extensions: { code: 'DATABASE_ERROR' } });
        }
    },

    deleteRating: async (_, { userId, movie_id }, { db }) => {
        if (!userId) throw new GraphQLError('User ID is required.', { extensions: { code: 'BAD_USER_INPUT' } });
        
        // Check if user exists
        const userExists = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
        if (userExists.rows.length === 0) throw new GraphQLError(`User with ID ${userId} not found.`, { extensions: { code: 'NOT_FOUND' } });

        const result = await db.query(
            'DELETE FROM user_ratings WHERE user_id = $1 AND movie_id = $2 RETURNING id',
            [userId, movie_id]
        );
        return result.rowCount > 0;
    },

    // Updated list mutations
    addMovieToList: async (_, { userId, movieId, listType }, { db }) => {
        if (!userId) throw new GraphQLError('User ID is required.', { extensions: { code: 'BAD_USER_INPUT' } });
        
        const typeValue = resolvers.ListType[listType];
        if (!typeValue) {
          throw new GraphQLError(`Invalid list type: ${listType}`, { 
            extensions: { code: 'BAD_USER_INPUT' } 
          });
        }

        const movieExists = await db.query('SELECT id FROM movies WHERE id = $1', [movieId]);
        if (movieExists.rows.length === 0) {
          throw new GraphQLError(`Movie with ID ${movieId} not found.`, { 
            extensions: { code: 'NOT_FOUND' } 
          });
        }
        
        // Check if user exists
        const userExists = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
        if (userExists.rows.length === 0) {
          throw new GraphQLError(`User with ID ${userId} not found.`, { 
            extensions: { code: 'NOT_FOUND' } 
          });
        }

        try {
          // Insert into the new unified table
          const query = `
            INSERT INTO user_movie_lists (user_id, movie_id, list_type, added_at)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, movie_id, list_type) 
            DO UPDATE SET added_at = CURRENT_TIMESTAMP
            RETURNING *`;
            
          const result = await db.query(query, [userId, movieId, typeValue]);
          
          if (result.rows.length === 0) {
            throw new GraphQLError('Failed to add movie to list.', { 
              extensions: { code: 'DATABASE_ERROR' } 
            });
          }
          
          return result.rows[0];
        } catch (error) {
          console.error(`Error adding movie ${movieId} to ${typeValue} list:`, error);
          throw new GraphQLError(`Failed to add movie to ${typeValue} list: ${error.message}`, { 
            extensions: { code: 'DATABASE_ERROR' } 
          });
        }
    },

    removeMovieFromList: async (_, { userId, movieId, listType }, { db }) => {
       if (!userId) {
         throw new GraphQLError('User ID is required.', { 
           extensions: { code: 'BAD_USER_INPUT' } 
         });
       }
       
       const typeValue = resolvers.ListType[listType];
       if (!typeValue) {
         throw new GraphQLError(`Invalid list type: ${listType}`, { 
           extensions: { code: 'BAD_USER_INPUT' } 
         });
       }

        // Check if user exists
        const userExists = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
        if (userExists.rows.length === 0) {
          throw new GraphQLError(`User with ID ${userId} not found.`, { 
            extensions: { code: 'NOT_FOUND' } 
          });
        }

       try {
         // Delete from the unified table
         const result = await db.query(
           'DELETE FROM user_movie_lists WHERE user_id = $1 AND movie_id = $2 AND list_type = $3 RETURNING id',
           [userId, movieId, typeValue]
         );
         
         return result.rowCount > 0;
       } catch (error) {
         console.error(`Error removing movie ${movieId} from ${typeValue} list:`, error);
         throw new GraphQLError(`Failed to remove movie from ${typeValue} list: ${error.message}`, {
           extensions: { code: 'DATABASE_ERROR' }
         });
       }
    },

    // Admin user mutations
    adminUpdateUser: async (_, { performingAdminId, id, input }, { db }) => {
      await checkAdminPermissionById(db, performingAdminId, 'ADMIN', 'update user profile');

      const { first_name, last_name, username, email, avatar_url, bio } = input;

      const { rows: existingUserRows } = await db.query('SELECT username, email FROM users WHERE id = $1', [id]);
      if (existingUserRows.length === 0) {
        throw new GraphQLError(`User with ID ${id} not found.`, { extensions: { code: 'NOT_FOUND' } });
      }
      const existingUser = existingUserRows[0];

      const updates = [];
      const values = [];
      let valueCounter = 1;

      if (first_name !== undefined) { updates.push(`first_name = $${valueCounter++}`); values.push(first_name); }
      if (last_name !== undefined) { updates.push(`last_name = $${valueCounter++}`); values.push(last_name); }
      if (bio !== undefined) { updates.push(`bio = $${valueCounter++}`); values.push(bio); }
      if (avatar_url !== undefined) { updates.push(`avatar_url = $${valueCounter++}`); values.push(avatar_url); }

      if (username !== undefined && username.toLowerCase() !== existingUser.username.toLowerCase()) {
         if (!username) throw new GraphQLError('Username cannot be empty.', { extensions: { code: 'BAD_USER_INPUT' } });
         const { rows: existingUsername } = await db.query('SELECT id FROM users WHERE lower(username) = lower($1) AND id != $2', [username, id]);
         if (existingUsername.length > 0) throw new GraphQLError('Username already taken.', { extensions: { code: 'BAD_USER_INPUT' } });
         updates.push(`username = $${valueCounter++}`); values.push(username);
      }
      if (email !== undefined && email.toLowerCase() !== existingUser.email.toLowerCase()) {
         if (!email) throw new GraphQLError('Email cannot be empty.', { extensions: { code: 'BAD_USER_INPUT' } });
         const { rows: existingEmail } = await db.query('SELECT id FROM users WHERE lower(email) = lower($1) AND id != $2', [email, id]);
         if (existingEmail.length > 0) throw new GraphQLError('Email already taken.', { extensions: { code: 'BAD_USER_INPUT' } });
         updates.push(`email = $${valueCounter++}`); values.push(email);
      }

      if (updates.length === 0) {
         const { rows: userToReturn } = await db.query('SELECT * from users WHERE id = $1', [id]);
         const { password_hash, ...publicUser } = userToReturn[0];
         return publicUser;
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = $${valueCounter} RETURNING *`;

      try {
            const { rows } = await db.query(updateQuery, values);
            if (!rows[0]) {
                throw new GraphQLError("Failed to update user.", { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
            console.log(`Admin ${performingAdminId} updated user ${id}`);
            const { password_hash, ...updatedUser } = rows[0];
            return updatedUser;
       } catch (error) {
            console.error(`Error updating user ${id} by admin ${performingAdminId}:`, error);
            if (error.code === '23505') {
                if (error.constraint && error.constraint.includes('users_username_key')) throw new GraphQLError('Username already taken.', { extensions: { code: 'BAD_USER_INPUT' } });
                if (error.constraint && error.constraint.includes('users_email_key')) throw new GraphQLError('Email already taken.', { extensions: { code: 'BAD_USER_INPUT' } });
            }
            if (error instanceof GraphQLError) throw error;
            throw new GraphQLError("Failed to update user profile due to a server error.", { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
       }
    },

    adminDeleteUser: async (_, { performingAdminId, id }, { db }) => {
      await checkAdminPermissionById(db, performingAdminId, 'SUPER_ADMIN', 'delete user');

        const { rows: userAdminLink } = await db.query('SELECT id FROM admins WHERE user_id = $1 AND id = $2', [id, performingAdminId]);
        const { rows: adminAccountOfUserToDelete } = await db.query('SELECT id, username FROM admins WHERE user_id = $1', [id]);

        if (adminAccountOfUserToDelete.length > 0) {
            // If the user being deleted is an admin, we must check if it's the performing admin
            const isAdminSelf = adminAccountOfUserToDelete.some(adminAcc => adminAcc.id.toString() === performingAdminId.toString());
            if (isAdminSelf) {
                 throw new GraphQLError("Super admins cannot delete their own associated user account directly. Manage admin accounts separately or use a dedicated function.", { extensions: { code: 'FORBIDDEN' } });
            } else {
                throw new GraphQLError(`User ${id} is linked to Admin account '${adminAccountOfUserToDelete[0].username}' (ID: ${adminAccountOfUserToDelete[0].id}). Delete the admin account first or use a different procedure.`, { extensions: { code: 'FORBIDDEN' } });
            }
        }

      try {
        const result = await db.query('DELETE FROM users WHERE id = $1', [id]);

        if (result.rowCount > 0) {
          console.log(`Admin ${performingAdminId} deleted user ${id}`);
          return true;
        } else {
          console.warn(`Admin ${performingAdminId} attempted to delete user ${id}, but user was not found.`);
          return false;
        }
      } catch (error) {
          console.error(`Error deleting user ${id} by admin ${performingAdminId}:`, error);
           if (error.code === '23503') { // Foreign key violation
                throw new GraphQLError('Cannot delete user: Related data exists (e.g., ratings, comments). Please ensure cascading delete is configured or manually clean up data.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
           }
           if (error instanceof GraphQLError) throw error;
          throw new GraphQLError("Failed to delete user due to a server error.", { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
    },

    deleteMyAccount: async (_, __, { db, user: contextUser }) => {
        if (!contextUser || !contextUser.id) {
            throw new GraphQLError('You must be logged in to delete your account.', { extensions: { code: 'UNAUTHENTICATED' } });
        }
        const userId = contextUser.id;

        // As a safety measure, prevent admin accounts from being deleted this way.
        const { rows: adminLink } = await db.query('SELECT id FROM admins WHERE user_id = $1', [userId]);
        if (adminLink.length > 0) {
            throw new GraphQLError('Admin accounts cannot be deleted through this method. Please contact a Super Admin.', { extensions: { code: 'FORBIDDEN' } });
        }

        try {
            const result = await db.query('DELETE FROM users WHERE id = $1', [userId]);
            if (result.rowCount > 0) {
                console.log(`User ${userId} has deleted their own account.`);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Error during account deletion for user ${userId}:`, error);
            if (error.code === '23503') { // Foreign key violation
                throw new GraphQLError('Cannot delete user as related data exists. Please ensure cascading delete is configured in the database schema.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
            }
            throw new GraphQLError('Failed to delete user due to a server error.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
        }
    },
  },
};

module.exports = { typeDefs, resolvers };