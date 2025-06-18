const gql = require('graphql-tag');
const { GraphQLError } = require('graphql');
const { rolesHierarchy } = require('../utils/authHelpers'); // For role validation

// Helper for admin permission check (reused from genre.js)
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
  type RecommendationSection {
    id: ID!
    title: String!
    description: String
    section_type: String!
    is_active: Boolean!
    display_order: Int
    created_at: String
    updated_at: String
    # Connections
    movies(limit: Int = 50, offset: Int = 0): [Movie!]!
    movieCount: Int!
  }

  input CreateRecommendationSectionInput {
    title: String!
    description: String
    section_type: String!
    is_active: Boolean!
    display_order: Int
  }

  input UpdateRecommendationSectionInput {
    title: String
    description: String
    section_type: String
    is_active: Boolean
    display_order: Int
  }

  # --- Extend the base Query type ---
  extend type Query {
    recommendationSection(id: ID!): RecommendationSection
    recommendationSections(onlyActive: Boolean = true): [RecommendationSection!]!
  }

  # --- Extend the base Mutation type ---
  extend type Mutation {
    createRecommendationSection(performingAdminId: ID!, input: CreateRecommendationSectionInput!): RecommendationSection!
    updateRecommendationSection(performingAdminId: ID!, id: ID!, input: UpdateRecommendationSectionInput!): RecommendationSection!
    deleteRecommendationSection(performingAdminId: ID!, id: ID!): Boolean!
    addMovieToSection(performingAdminId: ID!, sectionId: ID!, movieId: ID!, displayOrder: Int): RecommendationSection!
    removeMovieFromSection(performingAdminId: ID!, sectionId: ID!, movieId: ID!): RecommendationSection!
  }
`;

// --- Resolvers ---
const resolvers = {
  Query: {
    recommendationSection: async (_, { id }, { db }) => {
      const { rows } = await db.query('SELECT * FROM recommendation_sections WHERE id = $1', [id]);
      if (rows.length === 0) throw new GraphQLError('Recommendation section not found.', { extensions: { code: 'NOT_FOUND' } });
      return rows[0];
    },
    recommendationSections: async (_, { onlyActive }, { db }) => {
      let query = 'SELECT * FROM recommendation_sections';
      const params = [];
      
      if (onlyActive) {
        query += ' WHERE is_active = $1';
        params.push(true);
      }
      
      query += ' ORDER BY display_order ASC, title ASC';
      const { rows } = await db.query(query, params);
      return rows;
    },
  },
  Mutation: {
    createRecommendationSection: async (_, { performingAdminId, input }, { db }) => {
      await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'create recommendation section');
      const { title, description, section_type, is_active, display_order } = input;
      
      // Find max display_order if not provided
      let finalDisplayOrder = display_order;
      if (finalDisplayOrder === undefined || finalDisplayOrder === null) {
        const { rows } = await db.query('SELECT MAX(display_order) as max_order FROM recommendation_sections');
        finalDisplayOrder = (rows[0].max_order || 0) + 1;
      }
      
      const { rows } = await db.query(
        'INSERT INTO recommendation_sections (title, description, section_type, is_active, display_order) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [title, description, section_type, is_active, finalDisplayOrder]
      );
      return rows[0];
    },
    updateRecommendationSection: async (_, { performingAdminId, id, input }, { db }) => {
      await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'update recommendation section');
      const { title, description, section_type, is_active, display_order } = input;
      
      const updates = [];
      const params = [];
      let placeholderCount = 1;

      if (title !== undefined) {
        updates.push(`title = $${placeholderCount++}`);
        params.push(title);
      }
      if (description !== undefined) {
        updates.push(`description = $${placeholderCount++}`);
        params.push(description);
      }
      if (section_type !== undefined) {
        updates.push(`section_type = $${placeholderCount++}`);
        params.push(section_type);
      }
      if (is_active !== undefined) {
        updates.push(`is_active = $${placeholderCount++}`);
        params.push(is_active);
      }
      if (display_order !== undefined) {
        updates.push(`display_order = $${placeholderCount++}`);
        params.push(display_order);
      }

      if (updates.length === 0) throw new GraphQLError('No update fields provided.', { extensions: { code: 'BAD_USER_INPUT' } });

      params.push(id);
      const query = `UPDATE recommendation_sections SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${placeholderCount} RETURNING *`;
      const { rows } = await db.query(query, params);
      if (rows.length === 0) throw new GraphQLError('Recommendation section not found or no changes made.', { extensions: { code: 'NOT_FOUND' } });
      return rows[0];
    },
    deleteRecommendationSection: async (_, { performingAdminId, id }, { db }) => {
      await checkAdminPermissionById(db, performingAdminId, 'ADMIN', 'delete recommendation section');
      
      // Begin transaction to remove movie associations first
      await db.query('BEGIN');
      try {
        // Delete any movie associations
        await db.query('DELETE FROM recommendation_section_movies WHERE section_id = $1', [id]);
        
        // Delete the section
        const { rowCount } = await db.query('DELETE FROM recommendation_sections WHERE id = $1', [id]);
        if (rowCount === 0) {
          await db.query('ROLLBACK');
          throw new GraphQLError('Recommendation section not found.', { extensions: { code: 'NOT_FOUND' } });
        }
        
        await db.query('COMMIT');
        return true;
      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }
    },
    addMovieToSection: async (_, { performingAdminId, sectionId, movieId, displayOrder }, { db }) => {
      await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'add movie to section');
      // Verify section exists
      const { rows: sectionRows } = await db.query('SELECT * FROM recommendation_sections WHERE id = $1', [sectionId]);
      if (sectionRows.length === 0) throw new GraphQLError('Recommendation section not found.', { extensions: { code: 'NOT_FOUND' } });
      
      // Verify movie exists
      const { rows: movieRows } = await db.query('SELECT * FROM movies WHERE id = $1', [movieId]);
      if (movieRows.length === 0) throw new GraphQLError('Movie not found.', { extensions: { code: 'NOT_FOUND' } });
      
      // Check if movie is already in section
      const { rows: existingRows } = await db.query(
        'SELECT * FROM recommendation_section_movies WHERE section_id = $1 AND movie_id = $2',
        [sectionId, movieId]
      );
      
      if (existingRows.length > 0) {
        // If movie is already in section, update display_order if provided
        if (displayOrder !== undefined && displayOrder !== null) {
          await db.query(
            'UPDATE recommendation_section_movies SET display_order = $1 WHERE section_id = $2 AND movie_id = $3',
            [displayOrder, sectionId, movieId]
          );
        }
      } else {
        // Find max display_order if not provided
        let finalDisplayOrder = displayOrder;
        if (finalDisplayOrder === undefined || finalDisplayOrder === null) {
          const { rows } = await db.query(
            'SELECT MAX(display_order) as max_order FROM recommendation_section_movies WHERE section_id = $1',
            [sectionId]
          );
          finalDisplayOrder = (rows[0].max_order || 0) + 1;
        }
        
        // Add movie to section
        await db.query(
          'INSERT INTO recommendation_section_movies (section_id, movie_id, display_order) VALUES ($1, $2, $3)',
          [sectionId, movieId, finalDisplayOrder]
        );
      }
      
      // Update section's updated_at timestamp
      await db.query('UPDATE recommendation_sections SET updated_at = NOW() WHERE id = $1', [sectionId]);
      
      // Return the updated section
      const { rows } = await db.query('SELECT * FROM recommendation_sections WHERE id = $1', [sectionId]);
      return rows[0];
    },
    removeMovieFromSection: async (_, { performingAdminId, sectionId, movieId }, { db }) => {
      await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'remove movie from section');
      // Verify section exists
      const { rows: sectionRows } = await db.query('SELECT * FROM recommendation_sections WHERE id = $1', [sectionId]);
      if (sectionRows.length === 0) throw new GraphQLError('Recommendation section not found.', { extensions: { code: 'NOT_FOUND' } });
      
      // Delete the association
      const { rowCount } = await db.query(
        'DELETE FROM recommendation_section_movies WHERE section_id = $1 AND movie_id = $2',
        [sectionId, movieId]
      );
      
      if (rowCount === 0) throw new GraphQLError('Movie not found in this section.', { extensions: { code: 'NOT_FOUND' } });
      
      // Update section's updated_at timestamp
      await db.query('UPDATE recommendation_sections SET updated_at = NOW() WHERE id = $1', [sectionId]);
      
      // Return the updated section
      const { rows } = await db.query('SELECT * FROM recommendation_sections WHERE id = $1', [sectionId]);
      return rows[0];
    },
  },
  RecommendationSection: {
    movies: async (section, { limit = 50, offset = 0 }, { db }) => {
      const { rows } = await db.query(
        `SELECT m.* FROM movies m 
         JOIN recommendation_section_movies rsm ON m.id = rsm.movie_id 
         WHERE rsm.section_id = $1 
         ORDER BY rsm.display_order ASC
         LIMIT $2 OFFSET $3`,
        [section.id, limit, offset]
      );
      return rows;
    },
    movieCount: async (section, _, { db }) => {
      const { rows } = await db.query(
        'SELECT COUNT(*) AS count FROM recommendation_section_movies WHERE section_id = $1',
        [section.id]
      );
      return parseInt(rows[0].count, 10);
    },
  },
};

module.exports = { typeDefs, resolvers }; 