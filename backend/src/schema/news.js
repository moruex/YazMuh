// src/schema/news.js
// const { gql, AuthenticationError, ForbiddenError } = require('apollo-server-express');
const gql = require('graphql-tag');
const { GraphQLError } = require('graphql'); // Import GraphQLError
const { ensureAdmin } = require('../utils/authHelpers'); // Import helper

// --- GraphQL Definitions ---
const typeDefs = gql`
  # Ensure User type is defined elsewhere
  # type User { id: ID!, username: String!, isAdmin: Boolean, ... }
  # Ensure Movie type is defined elsewhere
  # type Movie { ... }
  # Ensure DateTime scalar is defined
  # scalar DateTime

  type News {
    id: ID!
    title: String!
    short_content: String # For previews
    content: String! # Full content (maybe markdown/html)
    author: User # Resolved below (assumes User type exists), nullable if system news
    image_url: String
    published_at: DateTime!
    created_at: DateTime!
    updated_at: DateTime!
    # --- Relationships ---
    movies: [Movie!] # Resolved below (assumes Movie type exists)
  }

  input NewsInput {
    title: String!
    short_content: String
    content: String!
    image_url: String
    published_at: DateTime # Optional: defaults to now if not provided
    movie_ids: [ID!] # IDs of movies to associate with this news
  }

   input NewsUpdateInput {
    title: String
    short_content: String
    content: String
    image_url: String
    published_at: DateTime
    movie_ids: [ID!] # To replace associated movies
  }

  # --- Extend base Query ---
  extend type Query {
    newsArticle(id: ID!): News
    newsList(
        limit: Int = 10,
        offset: Int = 0,
        movieId: ID,
        search: String # Added search argument
    ): [News!]!
    newsCount( # Added count query
        movieId: ID,
        search: String
    ): Int!
  }

  # --- Extend base Mutation ---
  extend type Mutation {
    # Requires admin auth
    createNews(input: NewsInput!): News!
    updateNews(id: ID!, input: NewsUpdateInput!): News
    deleteNews(id: ID!): Boolean!
  }
`;

// --- Resolvers ---
const resolvers = {
  Query: {
    newsArticle: async (_, { id }, { db }) => {
      const result = await db.query('SELECT * FROM news WHERE id = $1', [id]);
      return result.rows[0] || null;
    },
    // Updated newsList resolver
    newsList: async (_, { limit = 10, offset = 0, movieId, search }, { db }) => {
        let query = 'SELECT DISTINCT n.* FROM news n';
        const params = [];
        let paramIdx = 1;
        const joinClauses = [];
        const whereClauses = [];

        if (movieId) {
            joinClauses.push(`JOIN news_movies nm ON n.id = nm.news_id`);
            whereClauses.push(`nm.movie_id = $${paramIdx++}`);
            params.push(movieId);
        }
        if (search) {
            whereClauses.push(`(n.title ILIKE $${paramIdx} OR n.short_content ILIKE $${paramIdx} OR n.content ILIKE $${paramIdx})`);
            params.push(`%${search}%`);
            paramIdx++;
        }

        if(joinClauses.length > 0) query += ` ${joinClauses.filter((v, i, a) => a.indexOf(v) === i).join(' ')}`;
        if(whereClauses.length > 0) query += ` WHERE ${whereClauses.join(' AND ')}`;

        query += ` ORDER BY n.published_at DESC NULLS LAST, n.created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`; // Added fallback sort and NULLS LAST
        params.push(limit, offset);

        const result = await db.query(query, params);
        return result.rows;
    },
    // Added newsCount resolver
    newsCount: async (_, { movieId, search }, { db }) => {
        let query = 'SELECT COUNT(DISTINCT n.id) FROM news n';
        const params = [];
        let paramIdx = 1;
        const joinClauses = [];
        const whereClauses = [];

        if (movieId) {
            joinClauses.push(`JOIN news_movies nm ON n.id = nm.news_id`);
            whereClauses.push(`nm.movie_id = $${paramIdx++}`);
            params.push(movieId);
        }
         if (search) {
            whereClauses.push(`(n.title ILIKE $${paramIdx} OR n.short_content ILIKE $${paramIdx} OR n.content ILIKE $${paramIdx})`);
            params.push(`%${search}%`);
            paramIdx++;
        }

        if(joinClauses.length > 0) query += ` ${joinClauses.filter((v, i, a) => a.indexOf(v) === i).join(' ')}`;
        if(whereClauses.length > 0) query += ` WHERE ${whereClauses.join(' AND ')}`;

        const result = await db.query(query, params);
        return parseInt(result.rows[0].count, 10);
    },
  },

  Mutation: {
    createNews: async (_, { input }, { admin, db }) => {
      
      ensureAdmin(admin);

      const { title, short_content, content, image_url, published_at, movie_ids } = input;

      // Transaction remains a good idea
      await db.query('BEGIN');
      try {
          const query = `
            INSERT INTO news (title, short_content, content, image_url, published_at, author_id, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *`;
          const pubDate = published_at ? new Date(published_at) : new Date();
          // Now user.id can be safely accessed because _ensureAdmin passed
          const values = [title, short_content, content, image_url, pubDate, admin.id];
          const result = await db.query(query, values);
          const newNews = result.rows[0];

          // Link movies if provided
          if (movie_ids && movie_ids.length > 0) {
              for (const movieId of movie_ids) {
                  await db.query(
                    'INSERT INTO news_movies (news_id, movie_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                     [newNews.id, movieId]
                 );
              }
          }

          await db.query('COMMIT');
          return newNews; // Return the created news item
      } catch (error) {
          await db.query('ROLLBACK');
          console.error("Error creating news:", error);
          // Rethrow a more specific or the original error if helpful
          throw new Error(`Failed to create news article. ${error.message}`);
      }
    },

    updateNews: async (_, { id, input }, { admin, db }) => {
      
      ensureAdmin(admin);

       const setClauses = [];
       const values = [];
       let paramCounter = 1;

       await db.query('BEGIN');
       try {
            // Build dynamic SET clause
            if (input.title !== undefined) { setClauses.push(`title = $${paramCounter++}`); values.push(input.title); }
            // Allow setting short_content to null or empty string
            if (input.short_content !== undefined) { setClauses.push(`short_content = $${paramCounter++}`); values.push(input.short_content); }
            if (input.content !== undefined) { setClauses.push(`content = $${paramCounter++}`); values.push(input.content); }
             // Allow setting image_url to null or empty string
            if (input.image_url !== undefined) { setClauses.push(`image_url = $${paramCounter++}`); values.push(input.image_url); }
            if (input.published_at !== undefined) {
                const pubDate = input.published_at ? new Date(input.published_at) : null;
                setClauses.push(`published_at = $${paramCounter++}`);
                values.push(pubDate);
            }

            let updatedNews = null;

            // Update news item only if there are changes
            if (setClauses.length > 0) {
                setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
                values.push(id); // Add ID for the WHERE clause
                const updateQuery = `UPDATE news SET ${setClauses.join(', ')} WHERE id = $${paramCounter} RETURNING *`;
                const result = await db.query(updateQuery, values);
                if (result.rows.length === 0) throw new Error(`News article with ID ${id} not found.`);
                updatedNews = result.rows[0];
            } else {
                 // If no direct fields changed, fetch the current news item to return
                 const existingResult = await db.query('SELECT * FROM news WHERE id = $1', [id]);
                 if (existingResult.rows.length === 0) throw new Error(`News article with ID ${id} not found.`);
                 updatedNews = existingResult.rows[0];
            }

            // Handle movie associations (replace existing links) if movie_ids is provided
            if (input.movie_ids !== undefined) { // Check if the array itself is provided (even if empty)
                await db.query('DELETE FROM news_movies WHERE news_id = $1', [id]);
                if (input.movie_ids.length > 0) {
                    for (const movieId of input.movie_ids) {
                        await db.query(
                            'INSERT INTO news_movies (news_id, movie_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                            [id, movieId]
                        );
                    }
                }
                 // After updating links, we might want to refetch the news item if the resolver needs to return the movies field updated.
                 // However, returning updatedNews is usually sufficient unless the 'movies' field is requested in the *same* mutation response.
                 // If needed: updatedNews = (await db.query('SELECT * FROM news WHERE id = $1', [id])).rows[0];
            }

            await db.query('COMMIT');
            return updatedNews; // Return the updated news item

       } catch (error) {
            await db.query('ROLLBACK');
            console.error("Error updating news:", error);
            throw new Error(`Failed to update news article: ${error.message}`);
       }
    },

    deleteNews: async (_, { id }, { user, db }) => {
       await db.query('BEGIN');
       try {
           // Delete links first (important if no DB cascade constraint)
           await db.query('DELETE FROM news_movies WHERE news_id = $1', [id]);
           // Delete the news item
           const result = await db.query('DELETE FROM news WHERE id = $1 RETURNING id', [id]);
           await db.query('COMMIT');
           // Return true if deletion occurred, false otherwise
           return result.rowCount > 0;
       } catch (error) {
           await db.query('ROLLBACK');
            console.error("Error deleting news:", error);
            // Throw the error so GraphQL reports it
            throw new Error(`Failed to delete news article: ${error.message}`);
       }
    },
  },

  // --- Field Resolvers for News ---
  News: {
    author: async (news, _, { db }) => {
        if (!news.author_id) return null; // Handle news items potentially not having an author
        // Select only necessary, non-sensitive fields
        const result = await db.query('SELECT id, username, first_name, last_name, avatar_url FROM users WHERE id = $1', [news.author_id]);
        return result.rows[0] || null; // Return null if author user record deleted
    },
    movies: async (news, _, { db }) => {
        const result = await db.query(
            // Select necessary fields from movies
            `SELECT m.id, m.title, m.poster_url FROM movies m JOIN news_movies nm ON m.id = nm.movie_id WHERE nm.news_id = $1`,
             [news.id]
         );
        return result.rows;
    },
  },
};

module.exports = { typeDefs, resolvers };