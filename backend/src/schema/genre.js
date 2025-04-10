// src/schema/genre.js
// const { gql } = require('@apollo/server');
const gql = require('graphql-tag');
const { GraphQLError } = require('graphql');

// --- Helper Functions ---
const _ensureAdmin = (adminUser) => {
  if (!adminUser) {
    throw new GraphQLError('Admin authentication required.', { extensions: { code: 'UNAUTHENTICATED' } });
  }
  // Add role check if needed
};

// --- GraphQL Definitions ---
const typeDefs = gql`
  type Genre {
    id: ID!
    name: String!
    description: String
    image_url: String
    is_collection: Boolean
    movies: [Movie!] # Assumes Movie type is defined elsewhere
    movieCount: Int # Optional: Add count if needed frequently
  }

  input GenreInput {
    name: String!
    description: String
    image_url: String
    is_collection: Boolean # Ensure this is handled in input
  }

  # Input type for updates (could be different if needed, but GenreInput often suffices)
  input GenreUpdateInput {
    name: String
    description: String
    image_url: String
    is_collection: Boolean
  }

  # --- Extend the base Query type ---
  extend type Query {
    genre(id: ID!): Genre
    genres(
        limit: Int,
        offset: Int,
        search: String,
        isCollection: Boolean # Filter: null/undefined = all, true = collections, false = genres
    ): [Genre!]! # Still returns a list of genres
    genreCount(
        search: String,
        isCollection: Boolean
    ): Int! # Returns the total count matching filters
  }

  # --- Extend the base Mutation type ---
  extend type Mutation {
    # Requires admin auth
    createGenre(input: GenreInput!): Genre!
    updateGenre(id: ID!, input: GenreUpdateInput!): Genre # Use specific update input
    deleteGenre(id: ID!): Boolean!
  }
`;

// --- Resolvers ---
const resolvers = {
  Query: {
    genre: async (_, { id }, { db }) => {
      const result = await db.query('SELECT * FROM genres WHERE id = $1', [id]);
      return result.rows[0] || null;
    },
    // Updated genres resolver with filtering and pagination
    genres: async (_, { limit, offset, search, isCollection }, { db }) => {
      let query = 'SELECT * FROM genres';
      const values = [];
      const conditions = [];
      let paramCounter = 1;

      if (search) {
        conditions.push(`(name ILIKE $${paramCounter} OR description ILIKE $${paramCounter})`);
        values.push(`%${search}%`);
        paramCounter++;
      }
      if (isCollection !== undefined && isCollection !== null) {
        conditions.push(`is_collection = $${paramCounter}`);
        values.push(isCollection);
        paramCounter++;
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += ' ORDER BY name'; // Default sorting

      if (limit !== undefined && limit !== null) {
        query += ` LIMIT $${paramCounter}`;
        values.push(limit);
        paramCounter++;
      }
      if (offset !== undefined && offset !== null) {
        query += ` OFFSET $${paramCounter}`;
        values.push(offset);
        paramCounter++;
      }

      // console.log("Executing Genres Query:", query, values); // Debugging
      const result = await db.query(query, values);
      return result.rows;
    },
    // Resolver for genreCount
    genreCount: async (_, { search, isCollection }, { db }) => {
        let query = 'SELECT COUNT(*) FROM genres';
        const values = [];
        const conditions = [];
        let paramCounter = 1;

        if (search) {
            conditions.push(`(name ILIKE $${paramCounter} OR description ILIKE $${paramCounter})`);
            values.push(`%${search}%`);
            paramCounter++;
        }
        if (isCollection !== undefined && isCollection !== null) {
            conditions.push(`is_collection = $${paramCounter}`);
            values.push(isCollection);
            paramCounter++;
        }

        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(' AND ')}`;
        }

        // console.log("Executing Genre Count Query:", query, values); // Debugging
        const result = await db.query(query, values);
        return parseInt(result.rows[0].count, 10); // Ensure it's an integer
    },
  },
  Mutation: {
    createGenre: async (_, { input }, { admin, db }) => {
      _ensureAdmin(admin);
      const { name, description, image_url, is_collection } = input;
      // Explicitly default is_collection if not provided or null
      const isCollectionValue = is_collection === true;
      const query = `
        INSERT INTO genres (name, description, image_url, is_collection)
        VALUES ($1, $2, $3, $4) RETURNING *`;
      const values = [name, description, image_url, isCollectionValue];
      try {
        const result = await db.query(query, values);
        return result.rows[0];
      } catch (error) {
        console.error("Error creating genre:", error);
        if (error.code === '23505') { // Unique violation for name
          throw new GraphQLError('Genre name already exists.', { extensions: { code: 'BAD_USER_INPUT' } });
        }
        throw new Error("Failed to create genre.");
      }
    },

    updateGenre: async (_, { id, input }, { admin, db }) => {
      _ensureAdmin(admin);
      const updates = [];
      const values = [];
      let paramCounter = 1;

      // Check each field in the input and add to query if present
      if (input.name !== undefined && input.name !== null) { updates.push(`name = $${paramCounter++}`); values.push(input.name); }
      if (input.description !== undefined) { updates.push(`description = $${paramCounter++}`); values.push(input.description); } // Allow null description
      if (input.image_url !== undefined) { updates.push(`image_url = $${paramCounter++}`); values.push(input.image_url); } // Allow null image_url
      if (input.is_collection !== undefined && input.is_collection !== null) { updates.push(`is_collection = $${paramCounter++}`); values.push(input.is_collection); }

      if (updates.length === 0) {
        // No fields to update, just fetch and return existing
        const existing = await db.query('SELECT * FROM genres WHERE id = $1', [id]);
        return existing.rows[0] || null;
      }

      values.push(id); // Add the ID for the WHERE clause
      const query = `UPDATE genres SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCounter} RETURNING *`;
      // console.log("Executing Update Genre Query:", query, values); // Debugging
      const result = await db.query(query, values);
      if (result.rows.length === 0) {
        throw new GraphQLError(`Genre with ID ${id} not found.`, { extensions: { code: 'BAD_USER_INPUT' } });
      }
      return result.rows[0];
    },

    deleteGenre: async (_, { id }, { admin, db }) => {
      _ensureAdmin(admin);
       // BEFORE deleting, check if any movies are using this genre
      const movieCheck = await db.query('SELECT 1 FROM movie_genres WHERE genre_id = $1 LIMIT 1', [id]);
      if (movieCheck.rowCount > 0) {
          throw new Error(`Cannot delete genre (ID: ${id}) because it is still associated with movies.`);
          // Or you could decide to detach movies first, depending on desired behavior
      }

      const result = await db.query('DELETE FROM genres WHERE id = $1 RETURNING id', [id]);
      if (result.rowCount === 0) {
        throw new GraphQLError(`Genre with ID ${id} not found.`, { extensions: { code: 'BAD_USER_INPUT' } });
      }
      return true;
    },
  },
  // --- Field Resolvers for Genre ---
  Genre: {
    // Resolve the 'movies' field for a Genre
    movies: async (genre, _, { db }) => {
      // Add LIMIT if needed for performance in specific views
      const result = await db.query(
        `SELECT m.* FROM movies m JOIN movie_genres mg ON m.id = mg.movie_id WHERE mg.genre_id = $1`,
        [genre.id]
      );
      return result.rows;
    },
     // Optional: Resolve movieCount dynamically if not stored on genre table
     movieCount: async (genre, _, { db }) => {
        const result = await db.query('SELECT COUNT(*) FROM movie_genres WHERE genre_id = $1', [genre.id]);
        return parseInt(result.rows[0].count, 10);
     }
  },
};

module.exports = { typeDefs, resolvers };