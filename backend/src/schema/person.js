// src/schema/person.js
// const { gql } = require('@apollo/server');
const gql = require('graphql-tag');
const { GraphQLError } = require('graphql'); // Import GraphQLError for standard errors
const { ensureAdmin, rolesHierarchy } = require('../utils/authHelpers'); // Import helper

// Helper for admin permission check
async function checkAdminPermissionById(db, adminId, requiredRole = 'CONTENT_MODERATOR', action = 'perform this action') {
  if (!adminId) {
    throw new GraphQLError('Admin ID required for this action.', { extensions: { code: 'UNAUTHENTICATED' } });
  }
  const { rows } = await db.query('SELECT role FROM admins WHERE id = $1', [adminId]);
  if (rows.length === 0) {
    throw new GraphQLError('Admin performing action not found.', { extensions: { code: 'FORBIDDEN' } });
  }
  const adminRoleDB = rows[0].role; // Renamed to avoid conflict with requiredRole argument
  const userLevel = rolesHierarchy[adminRoleDB] || 0;
  const requiredLevel = rolesHierarchy[requiredRole] || 0;

  if (userLevel < requiredLevel) {
    throw new GraphQLError(`You do not have permission to ${action}. Requires ${requiredRole} role or higher.`, { extensions: { code: 'FORBIDDEN' } });
  }
  return true;
}

// HELPER: Slugify function
const slugify = (text) => {
  if (!text) return '';
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

// Add slugify function for handling null slugs
const generateMovieSlug = (title) => {
  if (!title) return 'unknown-movie';
  return slugify(title);
};

// --- GraphQL Definitions ---
const typeDefs = gql`
  type Person {
    id: ID!
    name: String!
    slug: String!
    biography: String
    birthday: Date # Using Date scalar (YYYY-MM-DD)
    profile_image_url: String # URL to profile image
    
    # Movie roles - relationships with movies
    actor_roles(limit: Int = 10, offset: Int = 0): [MovieRole!]
    director_roles(limit: Int = 10, offset: Int = 0): [MovieRole!]
  }
  
  # Movie role reference
  type MovieRole {
    movie: Movie!
    character_name: String
    job: String
    department: String
  }

  # Input for creating/updating persons
  input CreatePersonInput {
    name: String!
    biography: String
    birthday: Date
    profile_image_url: String
  }

  input UpdatePersonInput {
    name: String
    biography: String
    birthday: Date
    profile_image_url: String
  }

  extend type Query {
    person(id: ID, slug: String): Person
    people(
        limit: Int = 20, 
        offset: Int = 0, 
        search: String, 
        sortBy: String = "name", # name, popularity (if available), birthday
        sortOrder: String = "ASC" # ASC, DESC
    ): [Person!]!
    peopleCount(search: String): Int!
  }

  extend type Mutation {
    createPerson(performingAdminId: ID!, input: CreatePersonInput!): Person!
    updatePerson(performingAdminId: ID!, id: ID!, input: UpdatePersonInput!): Person!
    deletePerson(performingAdminId: ID!, id: ID!): Boolean!
    # Link person to movie cast/crew is handled in Movie schema
  }
`;

// --- Resolvers ---
const resolvers = {
  Query: {
    person: async (_, { id, slug }, { db }) => {
      if (!id && !slug) throw new GraphQLError('Either id or slug must be provided for a person.', { extensions: { code: 'BAD_USER_INPUT' } });
      let query = 'SELECT * FROM persons WHERE ';
      const params = [];
      if (id) {
        query += 'id = $1';
        params.push(id);
      } else {
        query += 'slug = $1';
        params.push(slug);
      }
      const { rows } = await db.query(query, params);
      if (rows.length === 0) throw new GraphQLError('Person not found.', { extensions: { code: 'NOT_FOUND' } });
      return rows[0];
    },
    people: async (_, { limit, offset, search, sortBy, sortOrder }, { db }) => {
      let query = 'SELECT * FROM persons';
      const params = [];
      let paramCount = 1;
      if (search) {
        query += ` WHERE name ILIKE $${paramCount++}`;
        params.push(`%${search}%`);
      }
      const validSortBy = ['name', 'birthday']; // Add popularity if you have it

      // Map GraphQL sort fields to DB column names
      let sortField = 'name';
      if (validSortBy.includes(sortBy)) {
        if (sortBy === 'birthday') {
          sortField = 'birth_date';
        } else {
          sortField = sortBy;
        }
      }

      const orderDirection = sortOrder === 'ASC' ? 'ASC' : 'DESC';
      query += ` ORDER BY ${sortField} ${orderDirection} NULLS LAST`;

      query += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
      params.push(limit, offset);
      const { rows } = await db.query(query, params);
      return rows;
    },
    peopleCount: async (_, { search }, { db }) => {
      let query = 'SELECT COUNT(*) FROM persons';
      const params = [];
      if (search) {
        query += ` WHERE name ILIKE $1`;
        params.push(`%${search}%`);
      }
      const { rows } = await db.query(query, params);
      return parseInt(rows[0].count, 10);
    }
  },
  Mutation: {
    createPerson: async (_, { performingAdminId, input }, { db }) => {
      await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'create person');
      const slug = slugify(input.name);
      const { rows } = await db.query(
        'INSERT INTO persons (name, slug, bio, birth_date, profile_image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [input.name, slug, input.biography, input.birthday, input.profile_image_url]
      );
      return rows[0];
    },
    updatePerson: async (_, { performingAdminId, id, input }, { db }) => {
      await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'update person');
      const updates = [];
      const params = [];
      let paramCount = 1;

      // Create a mapping for field conversions from GraphQL to DB
      const fieldMapping = {
        'biography': 'bio',
        'birthday': 'birth_date',
        'profile_image_url': 'profile_image_url'
      };

      Object.keys(input).forEach(key => {
        if (input[key] !== undefined) {
          // Use the mapping for special fields, otherwise use default conversion
          const dbKey = fieldMapping[key] || key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
          updates.push(`${dbKey} = $${paramCount++}`);
          params.push(input[key]);
        }
      });

      if (input.name) {
        updates.push(`slug = $${paramCount++}`);
        params.push(slugify(input.name));
      }

      if (updates.length === 0) throw new GraphQLError('No update fields provided for person.', { extensions: { code: 'BAD_USER_INPUT' } });
      params.push(id);
      const query = `UPDATE persons SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
      const { rows } = await db.query(query, params);
      if (rows.length === 0) throw new GraphQLError('Person not found or no change made.', { extensions: { code: 'NOT_FOUND' } });
      return rows[0];
    },
    deletePerson: async (_, { performingAdminId, id }, { db }) => {
      await checkAdminPermissionById(db, performingAdminId, 'ADMIN', 'delete person');
      const { rowCount } = await db.query('DELETE FROM persons WHERE id = $1', [id]);
      if (rowCount === 0) throw new GraphQLError('Person not found.', { extensions: { code: 'NOT_FOUND' } });
      return true;
    },
  },
  Person: {
    // Add these field resolvers
    biography: (person) => person.bio,
    birthday: (person) => person.birth_date,
    
    // Movie roles resolvers
    actor_roles: async (person, { limit = 10, offset = 0 }, { db }) => {
      try {
        // Check if movie_person_roles table exists
        const tableCheck = await db.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'movie_person_roles'
          );
        `);
        
        if (!tableCheck.rows[0].exists) {
          console.warn('movie_person_roles table does not exist. Returning empty array.');
          return [];
        }
        
        // Get movies where this person is an actor
        const { rows } = await db.query(`
          SELECT m.id as movie_id, m.title as movie_title, m.slug as movie_slug,
                 m.poster_url, m.release_date, m.movieq_rating,
                 mpr.character_name, mpr.job, mpr.department
          FROM movies m
          JOIN movie_person_roles mpr ON m.id = mpr.movie_id
          WHERE mpr.person_id = $1 AND mpr.role_type = 'ACTOR'
          ORDER BY m.release_date DESC NULLS LAST
          LIMIT $2 OFFSET $3
        `, [person.id, limit, offset]);
        
        return rows.map(row => ({
          movie: { 
            id: row.movie_id, 
            title: row.movie_title,
            slug: row.movie_slug || generateMovieSlug(row.movie_title),
            poster_url: row.poster_url,
            release_date: row.release_date,
            movieq_rating: row.movieq_rating
          },
          character_name: row.character_name,
          job: 'Actor',
          department: 'Acting'
        }));
      } catch (error) {
        console.error('Error fetching actor roles:', error);
        return [];
      }
    },
    
    director_roles: async (person, { limit = 10, offset = 0 }, { db }) => {
      try {
        // Check if movie_person_roles table exists
        const tableCheck = await db.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'movie_person_roles'
          );
        `);
        
        if (!tableCheck.rows[0].exists) {
          console.warn('movie_person_roles table does not exist. Returning empty array.');
          return [];
        }
        
        // Get movies where this person is a director
        const { rows } = await db.query(`
          SELECT m.id as movie_id, m.title as movie_title, m.slug as movie_slug,
                 m.poster_url, m.release_date, m.movieq_rating,
                 mpr.job, mpr.department
          FROM movies m
          JOIN movie_person_roles mpr ON m.id = mpr.movie_id
          WHERE mpr.person_id = $1 AND mpr.role_type = 'CREW' 
                AND (mpr.job = 'Director' OR mpr.department = 'Directing')
          ORDER BY m.release_date DESC NULLS LAST
          LIMIT $2 OFFSET $3
        `, [person.id, limit, offset]);
        
        return rows.map(row => ({
          movie: { 
            id: row.movie_id, 
            title: row.movie_title,
            slug: row.movie_slug || generateMovieSlug(row.movie_title),
            poster_url: row.poster_url,
            release_date: row.release_date,
            movieq_rating: row.movieq_rating
          },
          character_name: null,
          job: row.job || 'Director',
          department: row.department || 'Directing'
        }));
      } catch (error) {
        console.error('Error fetching director roles:', error);
        return [];
      }
    }
  },
};

module.exports = { typeDefs, resolvers };