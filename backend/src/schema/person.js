// src/schema/person.js
// const { gql } = require('@apollo/server');
const gql = require('graphql-tag');
const { GraphQLError } = require('graphql'); // Import GraphQLError for standard errors
const { ensureAdmin } = require('../utils/authHelpers'); // Import helper

// --- GraphQL Definitions ---
const typeDefs = gql`
  type Person {
    id: ID!
    name: String!
    bio: String
    birth_date: Date
    profile_image_url: String
    created_at: DateTime!
    # --- Relationships ---
    movie_roles: [MoviePerson!] # Roles this person played (resolved below, assumes MoviePerson exists)
  }

  # Input for creating/updating persons
  input PersonInput {
    name: String!
    bio: String
    birth_date: Date
    profile_image_url: String
  }

  extend type Query {
    person(id: ID!): Person
    persons(
        limit: Int = 20,
        offset: Int = 0,
        search: String # Search by name
    ): [Person!]!
    personCount(search: String): Int! # <-- ADD THIS
  }

  extend type Mutation {
    createPerson(input: PersonInput!): Person!
    updatePerson(id: ID!, input: PersonInput!): Person
    deletePerson(id: ID!): Boolean!
  }
`;

// --- Resolvers ---
const resolvers = {
  Query: {
    person: async (_, { id }, context) => {
      // ... (existing implementation)
      const result = await context.db.query('SELECT * FROM persons WHERE id = $1', [id]);
      return result.rows[0] || null;
    },
    persons: async (_, { limit = 20, offset = 0, search }, context) => {
      // ... (existing implementation)
      let query = 'SELECT * FROM persons';
      const queryParams = [];
      let paramCounter = 1;

      if (search) {
        query += ` WHERE name ILIKE $${paramCounter++}`; // Case-insensitive search
        queryParams.push(`%${search}%`);
      }

      query += ` ORDER BY name LIMIT $${paramCounter++} OFFSET $${paramCounter++}`;
      queryParams.push(limit, offset);

      const result = await context.db.query(query, queryParams);
      return result.rows;
    },
    // --- ADD RESOLVER FOR personCount ---
    personCount: async (_, { search }, context) => {
        let query = 'SELECT COUNT(*) FROM persons';
        const queryParams = [];
        let paramCounter = 1;

        if (search) {
            query += ` WHERE name ILIKE $${paramCounter++}`;
            queryParams.push(`%${search}%`);
        }
        const result = await context.db.query(query, queryParams);
        return parseInt(result.rows[0].count, 10); // Ensure it returns a number
    }
  },
  Mutation: {
    // ... (createPerson, updatePerson, deletePerson - existing implementations are fine)
    createPerson: async (_, { input }, context) => {
      ensureAdmin(context.admin);
      const { db } = context;
      const { name, bio, birth_date, profile_image_url } = input;
      const query = `
        INSERT INTO persons (name, bio, birth_date, profile_image_url, created_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING *`;
      const values = [name, bio, birth_date, profile_image_url];
      const result = await db.query(query, values);
      return result.rows[0];
    },

    updatePerson: async (_, { id, input }, context) => {
      ensureAdmin(context.admin);
      const { db } = context;
      const updates = [];
      const values = [];
      let paramCounter = 1;

      // Use hasOwnProperty or check for undefined/null carefully
      if (input.name !== undefined && input.name !== null) { updates.push(`name = $${paramCounter++}`); values.push(input.name); }
      if (input.bio !== undefined) { updates.push(`bio = $${paramCounter++}`); values.push(input.bio); } // Allow null/empty string
      if (input.birth_date !== undefined) { updates.push(`birth_date = $${paramCounter++}`); values.push(input.birth_date); } // Allow null
      if (input.profile_image_url !== undefined) { updates.push(`profile_image_url = $${paramCounter++}`); values.push(input.profile_image_url); } // Allow null/empty string

       if (updates.length === 0) {
         // Optionally fetch and return existing if no updates provided
         const existing = await db.query('SELECT * FROM persons WHERE id = $1', [id]);
         return existing.rows[0] || null;
         // Or throw an error: throw new UserInputError('No update fields provided.');
       }

      values.push(id);
      const query = `UPDATE persons SET ${updates.join(', ')} WHERE id = $${paramCounter} RETURNING *`;
      const result = await db.query(query, values);
      return result.rows[0] || null;
    },

    deletePerson: async (_, { id }, context) => {
      ensureAdmin(context.admin);
       // Consider related data (movie_persons) if CASCADE isn't set up
      const { db } = context;
      const result = await db.query('DELETE FROM persons WHERE id = $1 RETURNING id', [id]);
       if (result.rowCount === 0) {
         // Return false instead of throwing an error, as schema expects Boolean!
         // Or throw a specific Apollo Error like UserInputError
         // throw new GraphQLError(`Person with ID ${id} not found.`, { extensions: { code: 'BAD_USER_INPUT'} });
         return false; // Align with Boolean! return type if not found is not an "error"
       }
      return true; // Successfully deleted
    },
  },
  Person: {
    // ... (movie_roles resolver)
    movie_roles: async (person, _, context) => {
        const result = await context.db.query(
            'SELECT * FROM movie_persons WHERE person_id = $1',
             [person.id]
          );
        return result.rows;
      },
  },
};

module.exports = { typeDefs, resolvers };