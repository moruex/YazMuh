// src/schema/genre.js
// const { gql } = require('@apollo/server');
const gql = require('graphql-tag');
const { GraphQLError } = require('graphql');
const { rolesHierarchy } = require('../utils/authHelpers'); // For role validation

// Helper for admin permission check (can be centralized later)
async function checkAdminPermissionById(db, adminId, requiredRole = 'CONTENT_MODERATOR', action = 'perform this action') {
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
  type Genre {
    id: ID!
    name: String!
    slug: String!
    description: String
    image_url: String
    is_collection: Boolean
    # Connections
    movies(limit: Int = 10, offset: Int = 0): [Movie!]
    movie_count: Int!
  }

  input CreateGenreInput {
    name: String!
    description: String
    image_url: String
    is_collection: Boolean!
  }

  input UpdateGenreInput {
    name: String
    description: String
    image_url: String
    is_collection: Boolean
  }

  # --- Extend the base Query type ---
  extend type Query {
    genre(id: ID, slug: String): Genre
    genres(limit: Int = 20, offset: Int = 0, search: String, isCollection: Boolean): [Genre!]
    genreCount(search: String, isCollection: Boolean): Int!
  }

  # --- Extend the base Mutation type ---
  extend type Mutation {
    createGenre(performingAdminId: ID!, input: CreateGenreInput!): Genre!
    updateGenre(performingAdminId: ID!, id: ID!, input: UpdateGenreInput!): Genre!
    deleteGenre(performingAdminId: ID!, id: ID!): Boolean!
  }
`;

// --- Resolvers ---
const resolvers = {
  Query: {
    genre: async (_, { id, slug }, { db }) => {
      if (!id && !slug) throw new GraphQLError('Either id or slug must be provided.', { extensions: { code: 'BAD_USER_INPUT' } });
      let query = 'SELECT * FROM genres WHERE ';
      const params = [];
      if (id) {
        query += 'id = $1';
        params.push(id);
      } else if (slug) {
        query += 'slug = $1';
        params.push(slug);
      }
      const { rows } = await db.query(query, params);
      if (rows.length === 0) throw new GraphQLError('Genre not found.', { extensions: { code: 'NOT_FOUND' } });
      return rows[0];
    },
    genres: async (_, { limit, offset, search, isCollection }, { db }) => {
      let query = 'SELECT * FROM genres';
      const params = [];
      const conditions = [];
      let placeholderCount = 1;

      if (search) {
        conditions.push(`name ILIKE $${placeholderCount++}`);
        params.push(`%${search}%`);
      }
      if (isCollection !== undefined && isCollection !== null) {
        conditions.push(`is_collection = $${placeholderCount++}`);
        params.push(isCollection);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      query += ` ORDER BY name ASC LIMIT $${placeholderCount++} OFFSET $${placeholderCount++}`;
      params.push(limit, offset);
      const { rows } = await db.query(query, params);
      return rows;
    },
    genreCount: async (_, { search, isCollection }, { db }) => {
        let query = 'SELECT COUNT(*) AS count FROM genres';
        const params = [];
        const conditions = [];
        let placeholderCount = 1;

        if (search) {
            conditions.push(`name ILIKE $${placeholderCount++}`);
            params.push(`%${search}%`);
        }
        if (isCollection !== undefined && isCollection !== null) {
            conditions.push(`is_collection = $${placeholderCount++}`);
            params.push(isCollection);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        const { rows } = await db.query(query, params);
        return parseInt(rows[0].count, 10);
    },
  },
  Mutation: {
    createGenre: async (_, { performingAdminId, input }, { db }) => {
      await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'create genre');
      const { name, description, image_url, is_collection } = input;
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const { rows } = await db.query(
        'INSERT INTO genres (name, slug, description, image_url, is_collection) VALUES ($1, $2, $3, $4, $5 ) RETURNING *',
        [name, slug, description, image_url, is_collection]
      );
      return rows[0];
    },
    updateGenre: async (_, { performingAdminId, id, input }, { db }) => {
      await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'update genre');
      const { name, description, image_url, is_collection } = input;
      const updates = [];
      const params = [];
      let placeholderCount = 1;

      if (name !== undefined) {
        updates.push(`name = $${placeholderCount++}`);
        params.push(name);
        const newSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        updates.push(`slug = $${placeholderCount++}`);
        params.push(newSlug);
      }
      if (description !== undefined) {
        updates.push(`description = $${placeholderCount++}`);
        params.push(description);
      }
      if (image_url !== undefined) {
        updates.push(`image_url = $${placeholderCount++}`);
        params.push(image_url);
      }
      if (is_collection !== undefined) {
        updates.push(`is_collection = $${placeholderCount++}`);
        params.push(is_collection);
      }

      if (updates.length === 0) throw new GraphQLError('No update fields provided.', { extensions: { code: 'BAD_USER_INPUT' } });

      params.push(id);
      const query = `UPDATE genres SET ${updates.join(', ')} WHERE id = $${placeholderCount} RETURNING *`;
      const { rows } = await db.query(query, params);
      if (rows.length === 0) throw new GraphQLError('Genre not found or no changes made.', { extensions: { code: 'NOT_FOUND' } });
      return rows[0];
    },
    deleteGenre: async (_, { performingAdminId, id }, { db }) => {
      await checkAdminPermissionById(db, performingAdminId, 'ADMIN', 'delete genre');
      const { rowCount } = await db.query('DELETE FROM genres WHERE id = $1', [id]);
      if (rowCount === 0) throw new GraphQLError('Genre not found.', { extensions: { code: 'NOT_FOUND' } });
      return true;
    },
  },
  Genre: {
    movies: async (genre, { limit, offset }, { db }) => {
      const { rows } = await db.query(
        'SELECT m.* FROM movies m JOIN movie_genres mg ON m.id = mg.movie_id WHERE mg.genre_id = $1 ORDER BY m.release_date DESC, m.title ASC LIMIT $2 OFFSET $3',
        [genre.id, limit, offset]
      );
      return rows;
    },
    movie_count: async (genre, _, { db }) => {
        const { rows } = await db.query(
            'SELECT COUNT(*) AS count FROM movie_genres WHERE genre_id = $1',
            [genre.id]
        );
        return parseInt(rows[0].count, 10);
    },
  },
};

module.exports = { typeDefs, resolvers };
