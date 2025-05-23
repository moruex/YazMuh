// src/schema/movie.js
// const { gql } = require('@apollo/server');
const gql = require('graphql-tag');
const { GraphQLError } = require('graphql');
// Import helpers from the new utility file
const { ensureAdminRole, ensureLoggedIn } = require('../utils/authHelpers');

// --- Helper Functions ---
// (mapRoleTypeToGraphQL, mapGraphQLRoleToDB - keep as is)
const mapRoleTypeToGraphQL = (dbRole) => {
  const mapping = { actor: 'ACTOR', director: 'DIRECTOR', writer: 'WRITER', producer: 'PRODUCER', cinematographer: 'CINEMATOGRAPHER', composer: 'COMPOSER' };
  return dbRole ? mapping[dbRole.toLowerCase()] : null;
};
const mapGraphQLRoleToDB = (gqlRole) => {
  const mapping = { ACTOR: 'actor', DIRECTOR: 'director', WRITER: 'writer', PRODUCER: 'producer', CINEMATOGRAPHER: 'cinematographer', COMPOSER: 'composer' };
  return gqlRole ? mapping[gqlRole] : null;
};

// --- GraphQL Definitions ---
const typeDefs = gql`
  # Assume DateTime, Date, etc defined in scalars

  type Movie {
    id: ID!
    title: String!
    release_date: Date
    plot_summary: String
    poster_url: String
    duration_minutes: Int
    trailer_url: String
    avg_rating: Float # Calculated by DB trigger
    created_at: DateTime!
    updated_at: DateTime!
    # --- Relationships ---
    genres: [Genre!] # Resolved if Genre type is defined
    persons: [MoviePerson!] # Resolved below
    comments: [Comment!] # Resolved if Comment type is defined
    news: [News!] # Resolved if News type is defined
    # sections: [RecommendationSection!] # Relationship from Movie to Section (if needed)
  }

  type MoviePerson {
    id: ID!
    person: Person! # Resolved if Person type is defined
    role_type: RoleType!
    character_name: String
    created_at: DateTime!
  }

  enum RoleType { ACTOR, DIRECTOR, WRITER, PRODUCER, CINEMATOGRAPHER, COMPOSER }

  # Represents a curated section on the site (e.g., "Trending", "New Releases")
  type RecommendationSection {
    id: ID!
    title: String!
    section_type: RecommendationSectionType!
    description: String
    display_order: Int!
    is_active: Boolean!
    created_at: DateTime!
    updated_at: DateTime!
    # Movies within this section, ordered by their display_order in the section
    movies(limit: Int = 10, offset: Int = 0): [Movie!]!
    movieCount: Int!
  }

  enum RecommendationSectionType {
    ADMIN_DEFINED # Manually curated by admins
    LATEST        # Potentially auto-populated based on release_date
    POPULAR       # Potentially auto-populated based on views/ratings?
    MOST_RATED    # Potentially auto-populated based on avg_rating
    MOST_COMMENTED # Potentially auto-populated based on comment counts?
  }

  # Input for creating a recommendation section
  input CreateRecommendationSectionInput {
    title: String!
    section_type: RecommendationSectionType!
    description: String
    display_order: Int
    is_active: Boolean
  }

  # Input for updating a recommendation section
  input UpdateRecommendationSectionInput {
    title: String
    section_type: RecommendationSectionType
    description: String
    display_order: Int
    is_active: Boolean
  }

  # Input for managing movies within a section
  input UpdateSectionMovieInput {
     movie_id: ID!
     display_order: Int! # Required to set order
  }


  input MovieInput {
    title: String!
    release_date: Date
    plot_summary: String
    poster_url: String
    duration_minutes: Int
    trailer_url: String
    # Relationships (genres, persons) often handled via separate mutations
    # genreIds: [ID!]
    # personLinks: [PersonLinkInput!]
  }

  # input PersonLinkInput { personId: ID!, roleType: RoleType!, characterName: String }

  input MovieUpdateInput {
    title: String
    release_date: Date
    plot_summary: String
    poster_url: String
    duration_minutes: Int
    trailer_url: String
    # Relationships handled separately
  }

  # --- Extend base Query ---
  extend type Query {
    movie(id: ID!): Movie
    movies(
      limit: Int = 10
      offset: Int = 0
      sortBy: String = "release_date" # Allowed: title, release_date, avg_rating, created_at, updated_at, duration_minutes
      sortDirection: String = "DESC" # ASC or DESC
      genreId: ID
      search: String
    ): [Movie!]!
    movieCount(genreId: ID, search: String): Int!

    recommendationSections(onlyActive: Boolean = true): [RecommendationSection!]!
    recommendationSection(id: ID!): RecommendationSection
  }

  # --- Extend base Mutation ---
  extend type Mutation {
    # Core Movie mutations (likely require ADMIN)
    createMovie(input: MovieInput!): Movie!
    updateMovie(id: ID!, input: MovieUpdateInput!): Movie!
    deleteMovie(id: ID!): Boolean!

    # Linking mutations (likely require ADMIN) - Examples
    # addGenreToMovie(movieId: ID!, genreId: ID!): Movie!
    # removeGenreFromMovie(movieId: ID!, genreId: ID!): Movie!
    # addPersonToMovie(movieId: ID!, personId: ID!, roleType: RoleType!, characterName: String): Movie!
    # removePersonFromMovie(moviePersonId: ID!): Movie! # Use the join table ID

    # Recommendation Section Mutations (Require ADMIN)
    createRecommendationSection(input: CreateRecommendationSectionInput!): RecommendationSection!
    updateRecommendationSection(id: ID!, input: UpdateRecommendationSectionInput!): RecommendationSection!
    deleteRecommendationSection(id: ID!): Boolean!
    addMovieToSection(sectionId: ID!, movieId: ID!, displayOrder: Int): RecommendationSection! # Add with optional order
    removeMovieFromSection(sectionId: ID!, movieId: ID!): RecommendationSection!
    updateSectionMovies(sectionId: ID!, movies: [UpdateSectionMovieInput!]!): RecommendationSection! # Update order/content in bulk
  }
`;

// --- Resolvers ---
const resolvers = {
  // Map GQL Enum to DB String and vice-versa if needed
  RecommendationSectionType: {
    ADMIN_DEFINED: 'ADMIN_DEFINED',
    LATEST: 'LATEST',
    POPULAR: 'POPULAR',
    MOST_RATED: 'MOST_RATED',
    MOST_COMMENTED: 'MOST_COMMENTED',
    // Ensure these match the CHECK constraint values in the DB
  },

  Query: {
    movie: async (_, { id }, { db, loaders }) => {
       if (loaders?.movieLoader) return loaders.movieLoader.load(id);
      const result = await context.db.query('SELECT * FROM movies WHERE id = $1', [id]);
      return result.rows[0] || null;
    },
    movies: async (_, { limit = 10, offset = 0, sortBy = 'release_date', sortDirection = 'DESC', genreId, search }, context) => {
      // Validate sortBy and sortDirection
      const allowedSortBy = ['title', 'release_date', 'avg_rating', 'created_at', 'updated_at', 'duration_minutes'];
      const safeSortBy = allowedSortBy.includes(sortBy) ? sortBy : 'release_date';
      const safeSortDirection = sortDirection?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      let queryParams = [limit, offset]; // Start with limit and offset params
      let paramCounter = 3; // Next available index is $3
      const whereConditions = [];
      const joinClauses = [];

      let query = `SELECT DISTINCT m.* FROM movies m`;

      if (genreId) {
        joinClauses.push(`JOIN movie_genres mg ON m.id = mg.movie_id`);
        whereConditions.push(`mg.genre_id = $${paramCounter++}`);
        queryParams.push(genreId);
      }
      if (search) {
        whereConditions.push(`m.title ILIKE $${paramCounter++}`);
        queryParams.push(`%${search}%`);
      }

      if (joinClauses.length > 0) query += ' ' + joinClauses.join(' ');
      if (whereConditions.length > 0) query += ' WHERE ' + whereConditions.join(' AND ');

      query += ` ORDER BY m.${safeSortBy} ${safeSortDirection} NULLS LAST`;
      query += ` LIMIT $1 OFFSET $2`; // Use $1 and $2 for limit/offset

      // Execute
      const result = await context.db.query(query, queryParams);
      return result.rows;
    },
    movieCount: async (_, { genreId, search }, context) => {
        // ... (Movie count logic remains the same) ...
        let queryParams = [];
        let paramCounter = 1;
        const whereConditions = [];
        const joinClauses = [];
        let query = `SELECT COUNT(DISTINCT m.id) FROM movies m`;
        if (genreId) {
            joinClauses.push(`JOIN movie_genres mg ON m.id = mg.movie_id`);
            whereConditions.push(`mg.genre_id = $${paramCounter++}`);
            queryParams.push(genreId);
        }
        if (search) {
            whereConditions.push(`m.title ILIKE $${paramCounter++}`);
            queryParams.push(`%${search}%`);
        }
        if (joinClauses.length > 0) query += ' ' + joinClauses.join(' ');
        if (whereConditions.length > 0) query += ' WHERE ' + whereConditions.join(' AND ');
        const result = await context.db.query(query, queryParams);
        return parseInt(result.rows[0].count, 10);
    },

    // <<< Recommendation Section Queries >>>
    recommendationSections: async (_, { onlyActive = true }, context) => {
        let query = 'SELECT * FROM recommendation_sections';
        const values = [];
        if (onlyActive) {
            query += ' WHERE is_active = TRUE';
        }
        query += ' ORDER BY display_order ASC, title ASC';
        const result = await context.db.query(query, values);
        return result.rows;
    },
    recommendationSection: async (_, { id }, context) => {
        const result = await context.db.query('SELECT * FROM recommendation_sections WHERE id = $1', [id]);
        return result.rows[0] || null;
    }
  },

  Mutation: {
    createMovie: async (_, { input }, context) => {
        ensureAdminRole(context.admin, 'CONTENT_MODERATOR'); // Use imported helper
        const { title, release_date, plot_summary, poster_url, duration_minutes, trailer_url } = input;
        // Add validation (e.g., URL format) if needed
        const query = `
            INSERT INTO movies (title, release_date, plot_summary, poster_url, duration_minutes, trailer_url, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING *`;
        const values = [title, release_date, plot_summary, poster_url, duration_minutes, trailer_url];
        const result = await context.db.query(query, values);
        return result.rows[0];
    },
    updateMovie: async (_, { id, input }, context) => {
        ensureAdminRole(context.admin, 'CONTENT_MODERATOR'); // Use imported helper
        const setClauses = [];
        const values = [];
        let paramCounter = 1;
        if (input.title !== undefined) { setClauses.push(`title = $${paramCounter++}`); values.push(input.title); }
        if (input.release_date !== undefined) { setClauses.push(`release_date = $${paramCounter++}`); values.push(input.release_date); }
        if (input.plot_summary !== undefined) { setClauses.push(`plot_summary = $${paramCounter++}`); values.push(input.plot_summary); }
        if (input.poster_url !== undefined) { setClauses.push(`poster_url = $${paramCounter++}`); values.push(input.poster_url); }
        if (input.duration_minutes !== undefined) { setClauses.push(`duration_minutes = $${paramCounter++}`); values.push(input.duration_minutes); }
        if (input.trailer_url !== undefined) { setClauses.push(`trailer_url = $${paramCounter++}`); values.push(input.trailer_url); }
        if (setClauses.length === 0) {
            const existing = await context.db.query('SELECT * FROM movies WHERE id = $1', [id]);
            if (existing.rows.length === 0) throw new GraphQLError(`Movie with ID ${id} not found.`, { extensions: { code: 'BAD_USER_INPUT' } });
            return existing.rows[0];
        }
        values.push(id); // Add ID for WHERE clause (trigger handles updated_at)
        const query = `UPDATE movies SET ${setClauses.join(', ')} WHERE id = $${paramCounter} RETURNING *`;
        const result = await context.db.query(query, values);
        if (result.rows.length === 0) throw new GraphQLError(`Movie with ID ${id} not found or update failed.`, { extensions: { code: 'BAD_USER_INPUT' } });
        return result.rows[0];
    },
    deleteMovie: async (_, { id }, context) => {
        ensureAdminRole(context.admin, 'ADMIN'); // Example: Require higher role for deletion
        // CASCADE should handle related data in join tables
        const result = await context.db.query('DELETE FROM movies WHERE id = $1 RETURNING id', [id]);
        if (result.rowCount === 0) {
            throw new GraphQLError(`Movie with ID ${id} not found.`, { extensions: { code: 'BAD_USER_INPUT' } });
        }
        return true;
    },

    // <<< Recommendation Section Mutations >>>
    createRecommendationSection: async (_, { input }, context) => {
        ensureAdminRole(context.admin, 'ADMIN'); // Example: Admin manages sections
        const { title, section_type, description, display_order = 0, is_active = true } = input;
        const dbSectionType = resolvers.RecommendationSectionType[section_type]; // Map enum if needed
        if (!dbSectionType) throw new GraphQLError(`Invalid section type: ${section_type}`, { extensions: { code: 'BAD_USER_INPUT' } });

        try {
            const query = `
                INSERT INTO recommendation_sections (title, section_type, description, display_order, is_active, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING *`;
            const values = [title, dbSectionType, description, display_order, is_active];
            const result = await context.db.query(query, values);
            return result.rows[0];
        } catch (err) {
             console.error("Error creating recommendation section:", err);
             if (err.code === '23505') throw new GraphQLError('Recommendation section title already exists.', { extensions: { code: 'BAD_USER_INPUT' } });
             if (err.code === '23514') throw new GraphQLError(`Invalid section type: ${dbSectionType}. Check DB constraints.`, { extensions: { code: 'BAD_USER_INPUT' } }); // Check constraint violation
             throw new Error('Failed to create recommendation section.');
        }
    },
    updateRecommendationSection: async (_, { id, input }, context) => {
        ensureAdminRole(context.admin, 'ADMIN');
        const setClauses = [];
        const values = [];
        let paramCounter = 1;

        if (input.title !== undefined) { setClauses.push(`title = $${paramCounter++}`); values.push(input.title); }
        if (input.section_type !== undefined) {
             const dbSectionType = resolvers.RecommendationSectionType[input.section_type];
             if (!dbSectionType) throw new GraphQLError(`Invalid section type: ${input.section_type}`, { extensions: { code: 'BAD_USER_INPUT' } });
             setClauses.push(`section_type = $${paramCounter++}`); values.push(dbSectionType);
        }
        if (input.description !== undefined) { setClauses.push(`description = $${paramCounter++}`); values.push(input.description); }
        if (input.display_order !== undefined) { setClauses.push(`display_order = $${paramCounter++}`); values.push(input.display_order); }
        if (input.is_active !== undefined) { setClauses.push(`is_active = $${paramCounter++}`); values.push(input.is_active); }

        if (setClauses.length === 0) {
            const existing = await context.db.query('SELECT * FROM recommendation_sections WHERE id = $1', [id]);
             if (!existing.rows[0]) throw new GraphQLError(`Recommendation section with ID ${id} not found.`, { extensions: { code: 'BAD_USER_INPUT' } });
             return existing.rows[0]; // Return existing if no changes
        }

        values.push(id); // Add ID for WHERE clause (trigger handles updated_at)
        const query = `UPDATE recommendation_sections SET ${setClauses.join(', ')} WHERE id = $${paramCounter} RETURNING *`;

        try {
            const result = await context.db.query(query, values);
            if (result.rows.length === 0) throw new GraphQLError(`Recommendation section with ID ${id} not found.`, { extensions: { code: 'BAD_USER_INPUT' } });
            return result.rows[0];
        } catch (err) {
             console.error("Error updating recommendation section:", err);
             if (err.code === '23505') throw new GraphQLError('Recommendation section title already exists.', { extensions: { code: 'BAD_USER_INPUT' } });
             if (err.code === '23514') throw new GraphQLError(`Invalid section type provided. Check DB constraints.`, { extensions: { code: 'BAD_USER_INPUT' } });
             throw new Error('Failed to update recommendation section.');
        }
    },
    deleteRecommendationSection: async (_, { id }, context) => {
        ensureAdminRole(context.admin, 'ADMIN');
        // CASCADE constraint on recommendation_section_movies handles movie links
        const result = await context.db.query('DELETE FROM recommendation_sections WHERE id = $1 RETURNING id', [id]);
        if (result.rowCount === 0) {
            throw new GraphQLError(`Recommendation section with ID ${id} not found.`, { extensions: { code: 'BAD_USER_INPUT' } });
        }
        return true;
    },
    addMovieToSection: async (_, { sectionId, movieId, displayOrder }, context) => {
        ensureAdminRole(context.admin, 'CONTENT_MODERATOR');
        // Check if section and movie exist
        const sectionExists = await context.db.query('SELECT id FROM recommendation_sections WHERE id = $1', [sectionId]);
        if (!sectionExists.rows[0]) throw new GraphQLError(`Recommendation section with ID ${sectionId} not found.`, { extensions: { code: 'BAD_USER_INPUT' } });
        const movieExists = await context.db.query('SELECT id FROM movies WHERE id = $1', [movieId]);
        if (!movieExists.rows[0]) throw new GraphQLError(`Movie with ID ${movieId} not found.`, { extensions: { code: 'BAD_USER_INPUT' } });

        let order = displayOrder;
        // If displayOrder is not provided, calculate the next available order
        if (order === undefined || order === null) {
            const maxOrderResult = await context.db.query('SELECT MAX(display_order) as max_order FROM recommendation_section_movies WHERE section_id = $1', [sectionId]);
            order = (maxOrderResult.rows[0]?.max_order ?? -1) + 1;
        }

        try {
            const query = `
                INSERT INTO recommendation_section_movies (section_id, movie_id, display_order, added_at)
                VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                ON CONFLICT (section_id, movie_id) DO UPDATE SET display_order = EXCLUDED.display_order -- Update order if exists
                RETURNING section_id`; // Return section_id to refetch parent
            await context.db.query(query, [sectionId, movieId, order]);
        } catch (err) {
             console.error("Error adding movie to section:", err);
             throw new Error('Failed to add movie to recommendation section.');
        }

        // Refetch the parent section
        const updatedSection = await context.db.query('SELECT * FROM recommendation_sections WHERE id = $1', [sectionId]);
        return updatedSection.rows[0]; // Assume it still exists
    },
    removeMovieFromSection: async (_, { sectionId, movieId }, context) => {
        ensureAdminRole(context.admin, 'CONTENT_MODERATOR');
        await context.db.query('DELETE FROM recommendation_section_movies WHERE section_id = $1 AND movie_id = $2', [sectionId, movieId]);
        // Refetch the parent section
        const updatedSection = await context.db.query('SELECT * FROM recommendation_sections WHERE id = $1', [sectionId]);
         if (!updatedSection.rows[0]) throw new GraphQLError(`Recommendation section with ID ${sectionId} not found.`, { extensions: { code: 'BAD_USER_INPUT' } });
        return updatedSection.rows[0];
    },
     updateSectionMovies: async (_, { sectionId, movies }, context) => {
        ensureAdminRole(context.admin, 'CONTENT_MODERATOR');
        // This is more complex - requires a transaction to potentially remove old movies
        // and update/insert new ones with specific orders.
        await context.db.query('BEGIN');
        try {
            // 1. Optional: Remove movies not in the input list (or handle orphans differently)
            // Get current movie IDs in the section
            const currentMoviesResult = await context.db.query('SELECT movie_id FROM recommendation_section_movies WHERE section_id = $1', [sectionId]);
            const currentMovieIds = currentMoviesResult.rows.map(r => r.movie_id.toString());
            const inputMovieIds = movies.map(m => m.movie_id.toString());
            const moviesToRemove = currentMovieIds.filter(id => !inputMovieIds.includes(id));

            if (moviesToRemove.length > 0) {
                 // Convert back to numbers if DB expects integers
                await context.db.query('DELETE FROM recommendation_section_movies WHERE section_id = $1 AND movie_id = ANY($2::int[])', [sectionId, moviesToRemove]);
            }

            // 2. Upsert the movies from the input list with new orders
            for (const movieInput of movies) {
                await context.db.query(`
                    INSERT INTO recommendation_section_movies (section_id, movie_id, display_order, added_at)
                    VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                    ON CONFLICT (section_id, movie_id) DO UPDATE
                    SET display_order = EXCLUDED.display_order`,
                    [sectionId, movieInput.movie_id, movieInput.display_order]
                );
            }
            await context.db.query('COMMIT');
        } catch (err) {
            await context.db.query('ROLLBACK');
            console.error("Error updating section movies:", err);
            throw new Error('Failed to update movies in recommendation section.');
        }

        // Refetch the updated section
        const updatedSection = await context.db.query('SELECT * FROM recommendation_sections WHERE id = $1', [sectionId]);
        if (!updatedSection.rows[0]) throw new GraphQLError(`Recommendation section with ID ${sectionId} not found.`, { extensions: { code: 'BAD_USER_INPUT' } });
        return updatedSection.rows[0];
    }
  },

  // --- Field Resolvers ---
  Movie: {
    // ... (genres, persons, comments, news resolvers remain the same) ...
    genres: async (movie, _, context) => {
      // Use DataLoader if implemented
      const result = await context.db.query('SELECT g.* FROM genres g JOIN movie_genres mg ON g.id = mg.genre_id WHERE mg.movie_id = $1 ORDER BY g.name', [movie.id]);
      return result.rows;
    },
    persons: async (movie, _, context) => {
      const result = await context.db.query('SELECT * FROM movie_persons WHERE movie_id = $1 ORDER BY display_order ASC', [movie.id]);
      return result.rows; // Resolved further by MoviePerson resolvers
    },
    comments: async (movie, _, context) => {
      // Fetch only top-level comments for a movie? Or all?
      const result = await context.db.query('SELECT * FROM comments WHERE movie_id = $1 AND parent_comment_id IS NULL ORDER BY created_at DESC', [movie.id]);
      return result.rows; // Resolved further by Comment resolvers (including replies)
    },
    news: async (movie, _, context) => {
      const result = await context.db.query('SELECT n.* FROM news n JOIN news_movies nm ON n.id = nm.news_id WHERE nm.movie_id = $1 ORDER BY n.published_at DESC', [movie.id]);
      return result.rows;
    },
  },

  MoviePerson: {
    person: async (moviePerson, _, context) => {
       const { db, loaders } = context;
       if (loaders?.personLoader) return loaders.personLoader.load(moviePerson.person_id);
      const result = await db.query('SELECT * FROM persons WHERE id = $1', [moviePerson.person_id]);
      return result.rows[0];
    },
    role_type: (moviePerson) => mapRoleTypeToGraphQL(moviePerson.role_type),
    // Direct maps: character_name, created_at
  },

  // <<< RecommendationSection Field Resolvers >>>
  RecommendationSection: {
    // Map section_type if DB value differs from GQL enum name
     section_type: (section) => section.section_type, // Assumes direct mapping works

     movies: async (section, { limit = 10, offset = 0 }, context) => {
         // Fetch movies linked to this section, ordered by their display order within the section
         const query = `
             SELECT m.*
             FROM movies m JOIN recommendation_section_movies rsm ON m.id = rsm.movie_id
             WHERE rsm.section_id = $1
             ORDER BY rsm.display_order ASC, rsm.added_at DESC
             LIMIT $2 OFFSET $3`;
         const values = [section.id, limit, offset];
         const result = await context.db.query(query, values);
         return result.rows;
      },
     movieCount: async (section, _, context) => {
        const result = await context.db.query('SELECT COUNT(*) FROM recommendation_section_movies WHERE section_id = $1', [section.id]);
        return parseInt(result.rows[0].count, 10);
     }
  }
};

module.exports = { typeDefs, resolvers };
