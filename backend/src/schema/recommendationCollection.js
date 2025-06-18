// backend/src/schema/recommendationCollection.js
const gql = require('graphql-tag');

const typeDefs = gql`
  type PublicRecommendationSection {
    id: ID!
    title: String!
    section_type: String! # e.g., ADMIN_DEFINED, LATEST, POPULAR
    description: String
    display_order: Int!
    is_active: Boolean!
    movies(limit: Int = 10, offset: Int = 0): [Movie!] # Fetches movies for this section
  }

  extend type Query {
    publicRecommendationSections(activeOnly: Boolean = true, limit: Int = 10, offset: Int = 0): [PublicRecommendationSection!]
    randomMovies(limit: Int = 12): [Movie!]
  }
`;

const resolvers = {
  Query: {
    publicRecommendationSections: async (_, { activeOnly = true, limit = 10, offset = 0 }, { db }) => {
      let query = 'SELECT * FROM recommendation_sections';
      const params = [];
      if (activeOnly) {
        query += ' WHERE is_active = true';
      }
      query += ' ORDER BY display_order ASC, title ASC';
      if (limit !== null && limit !== undefined) {
        params.push(limit);
        query += ` LIMIT $${params.length}`;
      }
      if (offset !== null && offset !== undefined) {
        params.push(offset);
        query += ` OFFSET $${params.length}`;
      }
      const { rows } = await db.query(query, params);
      return rows;
    },
    randomMovies: async (_, { limit = 12 }, { db }) => {
      const { rows } = await db.query('SELECT * FROM movies ORDER BY RANDOM() LIMIT $1', [limit]);
      return rows;
    },
  },
  PublicRecommendationSection: {
    movies: async (section, { limit = 10, offset = 0 }, { db }) => {
      let movieQuery = '';
      const movieParams = [];

      // For LATEST and POPULAR, first try to see if there are manually curated movies
      if (section.section_type === 'LATEST' || section.section_type === 'POPULAR') {
        const checkPinnedMoviesQuery = `
          SELECT m.* 
          FROM movies m
          JOIN recommendation_section_movies rsm ON m.id = rsm.movie_id
          WHERE rsm.section_id = $1
          ORDER BY rsm.display_order ASC
          LIMIT $2 OFFSET $3;
        `;
        const pinnedMoviesResult = await db.query(checkPinnedMoviesQuery, [section.id, limit, offset]);
        if (pinnedMoviesResult.rows.length > 0) {
          // console.log(`Returning ${pinnedMoviesResult.rows.length} pinned movies for section ${section.id} (${section.title})`);
          return pinnedMoviesResult.rows; // Return pinned movies if they exist
        }
        // If no pinned movies, fall through to dynamic fetching for these types below
      }

      // Dynamic fetching logic based on section_type
      if (section.section_type === 'LATEST') {
        movieParams.push(limit, offset);
        movieQuery = `SELECT m.* FROM movies m ORDER BY m.release_date DESC NULLS LAST, m.id LIMIT $1 OFFSET $2`;
      } else if (section.section_type === 'POPULAR') {
        movieParams.push(limit, offset);
        movieQuery = `SELECT m.* FROM movies m ORDER BY m.movieq_rating DESC NULLS LAST, m.id LIMIT $1 OFFSET $2`;
      } else if (section.section_type === 'RANDOM') { // For a section explicitly typed as RANDOM in DB
        movieParams.push(limit); 
        movieQuery = `SELECT m.* FROM movies m ORDER BY RANDOM() LIMIT $1`;
      } else if (['ADMIN_DEFINED', 'MOST_RATED', 'MOST_COMMENTED'].includes(section.section_type)) {
        movieParams.push(section.id, limit, offset);
        movieQuery = `SELECT m.* 
                        FROM movies m 
                        JOIN recommendation_section_movies rsm ON m.id = rsm.movie_id 
                        WHERE rsm.section_id = $1 
                        ORDER BY rsm.display_order ASC, m.id 
                        LIMIT $2 OFFSET $3`;
      } else {
        console.warn(`Unknown section_type: ${section.section_type} for section ID ${section.id} (${section.title}) - returning no movies.`);
        return [];
      }
      
      // This check might be redundant if all paths set movieQuery or return directly
      if (!movieQuery) {
        // console.warn(`MovieQuery was not set for section ${section.id} (${section.title}) with type ${section.section_type}`);
        return []; 
      }

      // console.log(`Executing dynamic query for section ${section.id} (${section.title}) of type ${section.section_type}: ${movieQuery} with params ${movieParams}`);
      const { rows } = await db.query(movieQuery, movieParams);
      // console.log(`Returned ${rows.length} dynamic movies for section ${section.id} (${section.title})`);
      return rows;
    },
  },
};

module.exports = { typeDefs, resolvers }; 