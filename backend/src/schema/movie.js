// src/schema/movie.js
// const { gql } = require('@apollo/server');
const gql = require('graphql-tag');
const { GraphQLError } = require('graphql');
const config = require('../config');
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
        // console.warn(`Permission denied: Admin ${adminId} (Role: ${adminRole}) attempted to ${action}. Required: ${requiredRole}.`);
        throw new GraphQLError(`You do not have permission to ${action}. Requires ${requiredRole} role or higher.`, { extensions: { code: 'FORBIDDEN' } });
    }
    return true; // Permission granted
}

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
  scalar JSON
  scalar DateTime

  enum MovieRatingSystem {
    MPA # USA
    BBFC # UK
    FSK # Germany
    CNC # France
    # Add other rating systems as needed
  }
  
  type Movie {
    id: ID!
    title: String!
    slug: String!
    plot_summary: String
    release_date: Date
    duration_minutes: Int
    poster_url: String
    created_at: DateTime!
    updated_at: DateTime!
    trailer_url: String
    movieq_rating: Float
    imdb_rating: Float
    letterboxd_rating: Float

    # User-specific fields - now require userId argument
    is_watched_by_me(userId: ID!): Boolean
    is_favorited_by_me(userId: ID!): Boolean
    user_rating(userId: ID!): Int # 0 if not rated by user

    # Connections
    genres: [Genre!]
    cast(limit: Int = 10): [MovieCastMember!]
    crew(limit: Int = 10): [MovieCrewMember!]
    production_companies: [ProductionCompany!]
    production_countries: [Country!]
    spoken_languages: [Language!]
    collections: [Collection!] # Collections this movie belongs to
    watch_providers: [MovieWatchProvider!]
    comments(limit: Int = 10, offset: Int = 0): [Comment!]
    related_movies(limit: Int = 5): [Movie!]
    alternative_titles(country_code: String): [AlternativeTitle!]
    images: MovieImages
    keywords: [Keyword!]
    recommendations(limit: Int = 10): [Movie!]
    similar(limit: Int = 10): [Movie!]
    translations: [Translation!]
    videos: [Video!]
    release_dates(country_code: String): [ReleaseDateInfo!]

    # Derived/Aggregated
    average_user_rating: Float
    total_user_ratings: Int!
    total_favorites: Int!
    total_watches: Int!
  }

  type MovieCastMember {
    id: ID! # This would be the person's ID
    person: Person!
    character_name: String
    cast_order: Int # Order in credits
    # movie_id: ID! # Redundant, accessed via Movie.cast
  }

  type MovieCrewMember {
    id: ID! # This would be the person's ID
    person: Person!
    job: String # e.g., Director, Writer
    department: String # e.g., Directing, Writing
    # movie_id: ID! # Redundant, accessed via Movie.crew
  }
  
  type ProductionCompany {
    id: ID!
    name: String!
    logo_path: String
    origin_country: String # ISO 3166-1 code
  }

  type Country {
    iso_3166_1: String! # Primary Key (e.g., "US")
    name: String!
    english_name: String
  }

  type Language {
    iso_639_1: String! # Primary Key (e.g., "en")
    name: String # Native name
    english_name: String!
  }

  type Collection { # For movie series/collections
    id: ID!
    name: String!
    slug: String!
    overview: String
    poster_path: String
    backdrop_path: String
    parts(limit: Int = 10, offset: Int = 0): [Movie!] # Movies in this collection
  }

  # For Watch Providers
  type WatchProvider {
    id: ID! # Corresponds to provider_id from DB
    name: String!
    logo_path: String
    display_priority: Int # Display priority from TMDB/justwatch
  }

  type MovieWatchProvider {
    provider: WatchProvider!
    link: String # URL to the movie on the provider's site
    # Types: flatrate, rent, buy
    stream_type: String # e.g., 'flatrate', 'rent', 'buy' 
    # movie_id: ID! # Redundant
    # provider_id: ID! # Redundant
  }

  type AlternativeTitle {
    iso_3166_1: String! # Country code
    title: String!
    type: String # e.g., "Director's Cut", "Dub"
  }

  type MovieImages {
    backdrops: [Image!]
    logos: [Image!]
    posters: [Image!]
  }

  type Image {
    aspect_ratio: Float
    height: Int
    iso_639_1: String # Language code if applicable
    file_path: String! # The path part of the URL
    vote_average: Float
    vote_count: Int
    width: Int
    image_type: String # E.g. BACKDROP, POSTER, LOGO
  }
  
  type Keyword {
    id: ID!
    name: String!
  }

  type Translation {
    iso_3166_1: String! # Country code
    iso_639_1: String! # Language code
    name: String! # Translated movie title
    english_name: String! # Translated movie title in English (for display)
    data: JSON # For overview, tagline etc. Example: {"overview": "...", "tagline": "..."}
  }

  type Video {
    id: String # TMDB video ID
    iso_639_1: String!
    iso_3166_1: String!
    name: String!
    key: String! # YouTube key, etc.
    site: String! # e.g., YouTube
    size: Int # e.g., 1080
    type: String! # e.g., Trailer, Teaser, Clip
    official: Boolean!
    published_at: DateTime
  }

  type ReleaseDateInfo {
    iso_3166_1: String! # Country code
    release_dates: [ReleaseDate!]!
  }

  type ReleaseDate {
    certification: String
    iso_639_1: String # Typically empty string if not language specific
    note: String
    release_date: DateTime!
    type: Int! # See TMDB API for type meanings (1: Premiere, 2: Theatrical (limited), etc.)
  }

  input MovieFilterInput {
    genreIds: [ID!]
    minReleaseYear: Int
    maxReleaseYear: Int
    minRuntime: Int
    maxRuntime: Int
    minMovieqRating: Float
    hasWatchProviderInCountry: String # ISO 3166-1 country code
  }

  enum MovieSortBy {
    RELEASE_DATE_DESC
    RELEASE_DATE_ASC
    POPULARITY_DESC
    POPULARITY_ASC
    VOTE_AVERAGE_DESC
    VOTE_AVERAGE_ASC
    TITLE_ASC
    TITLE_DESC
    # USER_RATING_DESC (requires userId) # Not implemented for general sort
  }

  input CreateMovieInput {
    title: String!
    overview: String # Will be mapped to plot_summary in DB
    release_date: Date
    runtime: Int # Will be mapped to duration_minutes in DB
    poster_path: String # Will be mapped to poster_url in DB
    trailer_url: String
    movieq_rating: Float
    imdb_rating: Float
    letterboxd_rating: Float
  }

  input UpdateMovieInput {
    title: String
    overview: String # Will be mapped to plot_summary in DB
    release_date: Date
    runtime: Int # Will be mapped to duration_minutes in DB
    poster_path: String # Will be mapped to poster_url in DB
    trailer_url: String
    movieq_rating: Float
    imdb_rating: Float
    letterboxd_rating: Float
  }
  
  # For linking movie to genres, people, etc.
  input MovieGenreLinkInput { movieId: ID!, genreId: ID! }
  input MoviePersonLinkInput { movieId: ID!, personId: ID!, role: String!, characterName: String, order: Int } # role for crew, character for cast
  
  input MovieWatchProviderInput {
    provider_id: ID! # The ID of the WatchProvider itself
    link: String!
    stream_type: String! # e.g. 'flatrate', 'rent', 'buy'
  }
  
  input MovieCollectionInput {
    movieId: ID!
    collectionId: ID!
  }

  extend type Query {
    movie(id: ID, slug: String): Movie
    movies(
        limit: Int = 20,
        offset: Int = 0,
        search: String,
        sortBy: MovieSortBy = RELEASE_DATE_DESC,
        filter: MovieFilterInput
    ): [Movie!]!
    movieCount(search: String, filter: MovieFilterInput): Int!

    # Collections
    collection(id: ID, slug: String): Collection
    collections(limit: Int = 10, offset: Int = 0, search: String): [Collection!]!

    # Production Companies
    productionCompany(id: ID!): ProductionCompany

    # Keywords
    keyword(id: ID!): Keyword
    keywords(search: String!, limit: Int = 10): [Keyword!] # Search for keywords

    # Watch Providers
    watchProvider(id: ID!): WatchProvider
    watchProviders(countryCode: String): [WatchProvider!] # List providers for a country
    
    # Generic person search (might be in person.js)
    # searchPeople(query: String!, limit: Int = 10): [Person!]

    getMovieRecommendationsFromAI(movieId: ID!, userId: ID): [Movie!] # userId is optional
  }

  extend type Mutation {
    # Core Movie mutations (Admin restricted)
    createMovie(performingAdminId: ID!, input: CreateMovieInput!): Movie!
    updateMovie(performingAdminId: ID!, id: ID!, input: UpdateMovieInput!): Movie!
    deleteMovie(performingAdminId: ID!, id: ID!): Boolean!

    # Linking mutations (Admin restricted)
    addGenreToMovie(performingAdminId: ID!, movieId: ID!, genreId: ID!): Movie!
    removeGenreFromMovie(performingAdminId: ID!, movieId: ID!, genreId: ID!): Movie!
    
    addCastMemberToMovie(performingAdminId: ID!, movieId: ID!, personId: ID!, characterName: String, castOrder: Int): MovieCastMember!
    updateCastMemberInMovie(performingAdminId: ID!, movieId: ID!, personId: ID!, characterName: String, castOrder: Int): MovieCastMember!
    removeCastMemberFromMovie(performingAdminId: ID!, movieId: ID!, personId: ID!): Boolean!

    addCrewMemberToMovie(performingAdminId: ID!, movieId: ID!, personId: ID!, job: String!, department: String!): MovieCrewMember!
    updateCrewMemberInMovie(performingAdminId: ID!, movieId: ID!, personId: ID!, job: String, department: String): MovieCrewMember!
    removeCrewMemberFromMovie(performingAdminId: ID!, movieId: ID!, personId: ID!): Boolean!

    addProductionCompanyToMovie(performingAdminId: ID!, movieId: ID!, companyId: ID!): Movie!
    removeProductionCompanyFromMovie(performingAdminId: ID!, movieId: ID!, companyId: ID!): Movie!
    
    # User actions (require userId)
    toggleFavoriteMovie(userId: ID!, movieId: ID!): Movie!
    toggleWatchMovie(userId: ID!, movieId: ID!): Movie! # Marks/unmarks as watched
    rateMovie(userId: ID!, movieId: ID!, rating: Int!): UserMovieRatingResponse! 

    # Collection mutations (Admin restricted)
    createCollection(performingAdminId: ID!, name: String!, overview: String, posterPath: String, backdropPath: String): Collection!
    updateCollection(performingAdminId: ID!, id: ID!, name: String, overview: String, posterPath: String, backdropPath: String): Collection!
    deleteCollection(performingAdminId: ID!, id: ID!): Boolean!
    addMovieToCollection(performingAdminId: ID!, movieId: ID!, collectionId: ID!): Collection!
    removeMovieFromCollection(performingAdminId: ID!, movieId: ID!, collectionId: ID!): Collection!
    
    # Watch Provider mutations (Admin restricted)
    # (Assuming WatchProvider list itself is managed or seeded separately)
    setMovieWatchProviders(performingAdminId: ID!, movieId: ID!, countryCode: String!, providers: [MovieWatchProviderInput!]!): Movie!
    clearMovieWatchProviders(performingAdminId: ID!, movieId: ID!, countryCode: String!): Movie!

    # Keyword mutations (Admin restricted)
    addKeywordToMovie(performingAdminId: ID!, movieId: ID!, keywordId: ID!): Movie! # Assumes keyword exists
    createAndAddKeywordToMovie(performingAdminId: ID!, movieId: ID!, keywordName: String!): Movie!
    removeKeywordFromMovie(performingAdminId: ID!, movieId: ID!, keywordId: ID!): Movie!

    # Image, Video, Translation, Release Date mutations (Admin restricted)
    # These can be complex, simplified here
    addMovieImage(performingAdminId: ID!, movieId: ID!, imageInput: ImageInput!): Movie!
    removeMovieImage(performingAdminId: ID!, movieId: ID!, imageFilePath: String!): Movie! # By file_path
    
    addMovieVideo(performingAdminId: ID!, movieId: ID!, videoInput: VideoInput!): Movie!
    removeMovieVideo(performingAdminId: ID!, movieId: ID!, videoTmdbId: String!): Movie!

  }

  input ImageInput { # Simplified for brevity
    file_path: String!
    image_type: String! # POSTER, BACKDROP, LOGO
    width: Int
    height: Int
    aspect_ratio: Float
    iso_639_1: String
  }
  input VideoInput { # Simplified
    name: String!
    key: String!
    site: String! # e.g., YouTube
    type: String! # e.g., Trailer
    official: Boolean = true
    size: Int = 1080
    iso_639_1: String = "en"
    iso_3166_1: String = "US"
    published_at: DateTime
  }

  type UserMovieRatingResponse {
    id: ID # This could be the movie ID or a specific rating ID, adjust as needed
    movieId: ID # ID of the movie that was rated
    rating: Int # The new rating, null if cleared
  }

`;

// HELPER: Slugify function (simple version)
const slugify = (text) => {
  if (!text) return '';
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w-]+/g, '')       // Remove all non-word chars
    .replace(/--+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
};

const resolvers = {
  Query: {
    movie: async (_, { id, slug }, { db }) => {
      if (!id && !slug) throw new GraphQLError('Either id or slug must be provided for a movie.', { extensions: { code: 'BAD_USER_INPUT' } });
      let query = 'SELECT * FROM movies WHERE ';
      const params = [];
      if (id) {
        query += 'id = $1';
        params.push(id);
      } else if (slug) {
        query += 'slug = $1';
        params.push(slug);
      }
      const { rows } = await db.query(query, params);
      if (rows.length === 0) throw new GraphQLError('Movie not found.', { extensions: { code: 'NOT_FOUND' } });
      return rows[0];
    },
    movies: async (_, { limit = 20, offset = 0, search, sortBy = 'RELEASE_DATE_DESC', filter }, { db }) => {
      let query = 'SELECT DISTINCT m.* FROM movies m';
      const params = [];
      const conditions = [];
      let paramCount = 1;

      if (filter) {
        if (filter.genreIds && filter.genreIds.length > 0) {
          query += ` JOIN movie_genres mg ON m.id = mg.movie_id`;
          conditions.push(`mg.genre_id = ANY($${paramCount++}::int[])`);
          params.push(filter.genreIds);
        }
        if (filter.minReleaseYear) {
          conditions.push(`EXTRACT(YEAR FROM m.release_date) >= $${paramCount++}`);
          params.push(filter.minReleaseYear);
        }
        if (filter.maxReleaseYear) {
          conditions.push(`EXTRACT(YEAR FROM m.release_date) <= $${paramCount++}`);
          params.push(filter.maxReleaseYear);
        }
        if (filter.minRuntime) {
          conditions.push(`m.duration_minutes >= $${paramCount++}`);
          params.push(filter.minRuntime);
        }
        if (filter.maxRuntime) {
          conditions.push(`m.duration_minutes <= $${paramCount++}`);
          params.push(filter.maxRuntime);
        }
        if (filter.minMovieqRating) {
          conditions.push(`m.movieq_rating >= $${paramCount++}`);
          params.push(filter.minMovieqRating);
        }
        if (filter.hasWatchProviderInCountry) {
            // This requires joining movie_watch_providers and filtering by country_code
            query += ` JOIN movie_watch_providers mwp ON m.id = mwp.movie_id`;
            conditions.push(`mwp.country_iso_3166_1 = $${paramCount++}`);
            params.push(filter.hasWatchProviderInCountry);
        }
      }

      if (search) {
        conditions.push(`(m.title ILIKE $${paramCount} OR m.plot_summary ILIKE $${paramCount})`);
        params.push(`%${search}%`);
        paramCount++;
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      switch (sortBy) {
        case 'RELEASE_DATE_ASC': query += ' ORDER BY m.release_date ASC, m.title ASC'; break;
        case 'POPULARITY_DESC': query += ' ORDER BY m.movieq_rating DESC NULLS LAST, m.title ASC'; break;
        case 'POPULARITY_ASC': query += ' ORDER BY m.movieq_rating ASC NULLS FIRST, m.title ASC'; break;
        case 'VOTE_AVERAGE_DESC': query += ' ORDER BY m.movieq_rating DESC NULLS LAST, m.title ASC'; break;
        case 'VOTE_AVERAGE_ASC': query += ' ORDER BY m.movieq_rating ASC NULLS FIRST, m.title ASC'; break;
        case 'TITLE_ASC': query += ' ORDER BY m.title ASC'; break;
        case 'TITLE_DESC': query += ' ORDER BY m.title DESC'; break;
        case 'RELEASE_DATE_DESC':
        default: query += ' ORDER BY m.release_date DESC NULLS LAST, m.title ASC'; break;
      }

      query += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
      params.push(limit, offset);
      
      const { rows } = await db.query(query, params);
      return rows;
    },
    movieCount: async (_, { search, filter }, { db }) => {
        let query = 'SELECT COUNT(DISTINCT m.id) FROM movies m';
        const params = [];
        const conditions = [];
        let paramCount = 1;
  
        if (filter) {
          if (filter.genreIds && filter.genreIds.length > 0) {
            query += ` JOIN movie_genres mg ON m.id = mg.movie_id`;
            conditions.push(`mg.genre_id = ANY($${paramCount++}::int[])`);
            params.push(filter.genreIds);
          }
          if (filter.minReleaseYear) {
            conditions.push(`EXTRACT(YEAR FROM m.release_date) >= $${paramCount++}`);
            params.push(filter.minReleaseYear);
          }
          if (filter.maxReleaseYear) {
            conditions.push(`EXTRACT(YEAR FROM m.release_date) <= $${paramCount++}`);
            params.push(filter.maxReleaseYear);
          }
          if (filter.minRuntime) {
            conditions.push(`m.duration_minutes >= $${paramCount++}`);
            params.push(filter.minRuntime);
          }
          if (filter.maxRuntime) {
            conditions.push(`m.duration_minutes <= $${paramCount++}`);
            params.push(filter.maxRuntime);
          }
          if (filter.minMovieqRating) {
            conditions.push(`m.movieq_rating >= $${paramCount++}`);
            params.push(filter.minMovieqRating);
          }
          if (filter.hasWatchProviderInCountry) {
              query += ` JOIN movie_watch_providers mwp ON m.id = mwp.movie_id`;
              conditions.push(`mwp.country_iso_3166_1 = $${paramCount++}`);
              params.push(filter.hasWatchProviderInCountry);
          }
        }
  
        if (search) {
          conditions.push(`(m.title ILIKE $${paramCount} OR m.plot_summary ILIKE $${paramCount})`);
          params.push(`%${search}%`);
          paramCount++;
        }
  
        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }
        const { rows } = await db.query(query, params);
        return parseInt(rows[0].count, 10);
    },
    collection: async (_, { id, slug }, { db }) => {
        if (!id && !slug) throw new GraphQLError('Either id or slug must be provided for a collection.', { extensions: { code: 'BAD_USER_INPUT' } });
        let queryText = 'SELECT * FROM collections WHERE ';
        const params = [];
        if (id) {
            queryText += 'id = $1';
            params.push(id);
        } else {
            queryText += 'slug = $1';
            params.push(slug);
        }
        const { rows } = await db.query(queryText, params);
        if (rows.length === 0) throw new GraphQLError('Collection not found.', { extensions: { code: 'NOT_FOUND' } });
        return rows[0];
    },
    collections: async (_, { limit = 10, offset = 0, search }, { db }) => {
        let queryText = 'SELECT * FROM collections';
        const params = [];
        let paramCount = 1;
        if (search) {
            queryText += ` WHERE name ILIKE $${paramCount++}`;
            params.push(`%${search}%`);
        }
        queryText += ` ORDER BY name ASC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
        params.push(limit, offset);
        const { rows } = await db.query(queryText, params);
        return rows;
    },
    productionCompany: async (_, { id }, { db }) => {
        const { rows } = await db.query('SELECT * FROM production_companies WHERE id = $1', [id]);
        if (rows.length === 0) throw new GraphQLError('Production company not found.', { extensions: { code: 'NOT_FOUND' } });
        return rows[0];
    },
    keyword: async (_, { id }, { db }) => {
        const { rows } = await db.query('SELECT * FROM keywords WHERE id = $1', [id]);
        if (rows.length === 0) throw new GraphQLError('Keyword not found.', { extensions: { code: 'NOT_FOUND' } });
        return rows[0];
    },
    keywords: async (_, { search, limit = 10 }, { db }) => {
        if (!search) throw new GraphQLError('Search query is required for keywords.', { extensions: { code: 'BAD_USER_INPUT' } });
        const { rows } = await db.query('SELECT * FROM keywords WHERE name ILIKE $1 ORDER BY name ASC LIMIT $2', [`%${search}%`, limit]);
        return rows;
    },
    watchProvider: async (_, { id }, { db }) => {
        const { rows } = await db.query('SELECT * FROM watch_providers WHERE id = $1', [id]);
        if (rows.length === 0) throw new GraphQLError('Watch provider not found.', { extensions: { code: 'NOT_FOUND' } });
        return rows[0];
    },
    watchProviders: async (_, { countryCode }, { db }) => {
        // This might list ALL providers, or those active in a country if your DB supports that link
        let queryText = 'SELECT * FROM watch_providers ORDER BY display_priority ASC, name ASC';
        const params = [];
        // If you have a country link table, you'd join and filter here.
        // For now, returning all providers.
        const { rows } = await db.query(queryText, params);
        return rows;
    },
    getMovieRecommendationsFromAI: async (_, { movieId, userId }, { db }) => {
        // Placeholder for actual recommendation engine logic
        // For now, get movies with highest ratings
        const { rows } = await db.query(
           `SELECT m.*
            FROM movies m
            WHERE m.id != $1
            ORDER BY m.movieq_rating DESC NULLS LAST, m.title ASC
            LIMIT $2`,
            [movieId, 10]
        );
        return rows;
    },
  },
  Mutation: {
    createMovie: async (_, { performingAdminId, input }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'create movie');
        const slug = slugify(input.title);
        const { rows } = await db.query(
            `INSERT INTO movies (title, plot_summary, release_date, duration_minutes, poster_url, trailer_url, slug, movieq_rating, imdb_rating, letterboxd_rating)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [input.title, input.overview, input.release_date, input.runtime, input.poster_path, input.trailer_url, slug, input.movieq_rating, input.imdb_rating, input.letterboxd_rating]
        );
        return rows[0];
    },
    updateMovie: async (_, { performingAdminId, id, input }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'update movie');
        const updates = [];
        const params = [];
        let paramCount = 1;

        // Field name mapping from GraphQL to DB
        const fieldMapping = {
            'overview': 'plot_summary',
            'runtime': 'duration_minutes',
            'poster_path': 'poster_url',
        };

        Object.keys(input).forEach(key => {
            if (input[key] !== undefined) {
                // Skip fields we don't want in the database (tmdb_id, imdb_id, etc.)
                if (['backdrop_path', 'budget', 'revenue', 'status', 'tagline', 'tmdb_id', 
                     'imdb_id', 'popularity', 'vote_average', 'vote_count'].includes(key)) {
                    return;
                }
                
                // Use mapped field name if it exists, otherwise convert camelCase to snake_case
                const dbFieldName = fieldMapping[key] || key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
                updates.push(`${dbFieldName} = $${paramCount++}`);
                params.push(input[key]);
            }
        });
        if (input.title) { // If title changes, update slug
            updates.push(`slug = $${paramCount++}`);
            params.push(slugify(input.title));
        }

        if (updates.length === 0) throw new GraphQLError('No update fields provided for movie.', { extensions: { code: 'BAD_USER_INPUT' } });
        
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);
        const query = `UPDATE movies SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
        const { rows } = await db.query(query, params);
        if (rows.length === 0) throw new GraphQLError('Movie not found or no changes made.', { extensions: { code: 'NOT_FOUND' } });
        return rows[0];
    },
    deleteMovie: async (_, { performingAdminId, id }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'ADMIN', 'delete movie');
        // Consider related data: movie_genres, movie_cast, movie_crew, user_ratings, etc.
        // For simplicity, this example only deletes from the movies table.
        // A real app would need to handle or cascade these deletions.
        const { rowCount } = await db.query('DELETE FROM movies WHERE id = $1', [id]);
        if (rowCount === 0) throw new GraphQLError('Movie not found.', { extensions: { code: 'NOT_FOUND' } });
        return true;
    },
    addGenreToMovie: async (_, { performingAdminId, movieId, genreId }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'add genre to movie');
        await db.query('INSERT INTO movie_genres (movie_id, genre_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [movieId, genreId]);
        const { rows } = await db.query('SELECT * FROM movies WHERE id = $1', [movieId]);
        return rows[0];
    },
    removeGenreFromMovie: async (_, { performingAdminId, movieId, genreId }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'remove genre from movie');
        await db.query('DELETE FROM movie_genres WHERE movie_id = $1 AND genre_id = $2', [movieId, genreId]);
        const { rows } = await db.query('SELECT * FROM movies WHERE id = $1', [movieId]);
        return rows[0];
    },
    addCastMemberToMovie: async (_, { performingAdminId, movieId, personId, characterName, castOrder }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'add cast to movie');
        
        try {
            // Check if the movie_cast_members table exists
            const castTableCheck = await db.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'movie_cast_members'
                );
            `);
            
            // Check if movie_person_roles table exists
            const rolesTableCheck = await db.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'movie_person_roles'
                );
            `);
            
            // If roles table doesn't exist, create it
            if (!rolesTableCheck.rows[0].exists) {
                console.log('Creating movie_person_roles table');
                await db.query(`
                    CREATE TABLE movie_person_roles (
                        id SERIAL PRIMARY KEY,
                        movie_id INTEGER NOT NULL,
                        person_id INTEGER NOT NULL,
                        role_type TEXT NOT NULL,
                        character_name TEXT,
                        "order" INTEGER,
                        job TEXT,
                        department TEXT,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(movie_id, person_id, role_type)
                    )
                `);
            }
            
            // Use the movie_person_roles table for new entries
            const { rows } = await db.query(
                `INSERT INTO movie_person_roles 
                 (movie_id, person_id, role_type, character_name, "order") 
                 VALUES ($1, $2, 'ACTOR', $3, $4) 
                 ON CONFLICT (movie_id, person_id, role_type) 
                 DO UPDATE SET character_name = $3, "order" = $4
                 RETURNING person_id as id, character_name, "order" as cast_order`,
                [movieId, personId, characterName, castOrder]
            );
            
            // Get the person's name for the response
            const personResult = await db.query('SELECT name FROM persons WHERE id = $1', [personId]);
            const personName = personResult.rows.length > 0 ? personResult.rows[0].name : 'Unknown';
            
            return { 
                ...rows[0], 
                movieId,
                person: { id: personId, name: personName }
            };
        } catch (error) {
            console.error('Error adding cast member:', error);
            throw new GraphQLError(`Failed to add cast member: ${error.message}`, { 
                extensions: { code: 'DATABASE_ERROR' } 
            });
        }
    },
    updateCastMemberInMovie: async (_, { performingAdminId, movieId, personId, characterName, castOrder }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'update cast in movie');
        
        try {
            // Check if the movie_person_roles table exists (it should already exist from addCastMemberToMovie)
            const rolesTableCheck = await db.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'movie_person_roles'
                );
            `);
            
            if (!rolesTableCheck.rows[0].exists) {
                throw new GraphQLError('movie_person_roles table does not exist', { 
                    extensions: { code: 'DATABASE_ERROR' } 
                });
            }
            
            const updates = [];
            const params = [movieId, personId];
            let paramCount = 3;
            
            if (characterName !== undefined) { 
                updates.push(`character_name = $${paramCount++}`); 
                params.push(characterName); 
            }
            
            if (castOrder !== undefined) { 
                updates.push(`"order" = $${paramCount++}`); 
                params.push(castOrder); 
            }
            
            if (updates.length === 0) {
                throw new GraphQLError('No fields to update for cast member.', { 
                    extensions: { code: 'BAD_USER_INPUT' } 
                });
            }
            
            const query = `
                UPDATE movie_person_roles 
                SET ${updates.join(', ')} 
                WHERE movie_id = $1 AND person_id = $2 AND role_type = 'ACTOR' 
                RETURNING person_id as id, character_name, "order" as cast_order
            `;
            
            const { rows } = await db.query(query, params);
            
            if (rows.length === 0) {
                throw new GraphQLError('Cast member not found or no changes made.', { 
                    extensions: { code: 'NOT_FOUND' } 
                });
            }
            
            // Get the person's name for the response
            const personResult = await db.query('SELECT name FROM persons WHERE id = $1', [personId]);
            const personName = personResult.rows.length > 0 ? personResult.rows[0].name : 'Unknown';
            
            return { 
                ...rows[0], 
                movieId,
                person: { id: personId, name: personName }
            };
        } catch (error) {
            console.error('Error updating cast member:', error);
            throw new GraphQLError(`Failed to update cast member: ${error.message}`, { 
                extensions: { code: 'DATABASE_ERROR' } 
            });
        }
    },
    removeCastMemberFromMovie: async (_, { performingAdminId, movieId, personId }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'remove cast from movie');
        
        try {
            const { rowCount } = await db.query(
                'DELETE FROM movie_person_roles WHERE movie_id = $1 AND person_id = $2 AND role_type = $3', 
                [movieId, personId, 'ACTOR']
            );
            
            return rowCount > 0;
        } catch (error) {
            console.error('Error removing cast member:', error);
            throw new GraphQLError(`Failed to remove cast member: ${error.message}`, { 
                extensions: { code: 'DATABASE_ERROR' } 
            });
        }
    },

    addCrewMemberToMovie: async (_, { performingAdminId, movieId, personId, job, department }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'add crew to movie');
        
        try {
            // Check if movie_person_roles table exists (should be created in addCastMemberToMovie if needed)
            const rolesTableCheck = await db.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'movie_person_roles'
                );
            `);
            
            // If roles table doesn't exist, create it
            if (!rolesTableCheck.rows[0].exists) {
                console.log('Creating movie_person_roles table');
                await db.query(`
                    CREATE TABLE movie_person_roles (
                        id SERIAL PRIMARY KEY,
                        movie_id INTEGER NOT NULL,
                        person_id INTEGER NOT NULL,
                        role_type TEXT NOT NULL,
                        character_name TEXT,
                        "order" INTEGER,
                        job TEXT,
                        department TEXT,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE(movie_id, person_id, role_type)
                    )
                `);
            }
            
            // Use the movie_person_roles table
            const { rows } = await db.query(
                `INSERT INTO movie_person_roles 
                 (movie_id, person_id, role_type, job, department) 
                 VALUES ($1, $2, 'CREW', $3, $4) 
                 ON CONFLICT (movie_id, person_id, role_type) 
                 DO UPDATE SET job = $3, department = $4
                 RETURNING person_id as id, job, department`,
                [movieId, personId, job, department]
            );
            
            // Get the person's name for the response
            const personResult = await db.query('SELECT name FROM persons WHERE id = $1', [personId]);
            const personName = personResult.rows.length > 0 ? personResult.rows[0].name : 'Unknown';
            
            return { 
                ...rows[0], 
                movieId,
                person: { id: personId, name: personName }
            };
        } catch (error) {
            console.error('Error adding crew member:', error);
            throw new GraphQLError(`Failed to add crew member: ${error.message}`, { 
                extensions: { code: 'DATABASE_ERROR' } 
            });
        }
    },
    
    updateCrewMemberInMovie: async (_, { performingAdminId, movieId, personId, job, department }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'update crew in movie');
        
        try {
            const updates = [];
            const params = [movieId, personId];
            let paramCount = 3;
            
            if (job !== undefined) { 
                updates.push(`job = $${paramCount++}`); 
                params.push(job); 
            }
            
            if (department !== undefined) { 
                updates.push(`department = $${paramCount++}`); 
                params.push(department); 
            }
            
            if (updates.length === 0) {
                throw new GraphQLError('No fields to update for crew member.', { 
                    extensions: { code: 'BAD_USER_INPUT' } 
                });
            }
            
            const query = `
                UPDATE movie_person_roles 
                SET ${updates.join(', ')} 
                WHERE movie_id = $1 AND person_id = $2 AND role_type = 'CREW' 
                RETURNING person_id as id, job, department
            `;
            
            const { rows } = await db.query(query, params);
            
            if (rows.length === 0) {
                throw new GraphQLError('Crew member not found or no changes made.', { 
                    extensions: { code: 'NOT_FOUND' } 
                });
            }
            
            // Get the person's name for the response
            const personResult = await db.query('SELECT name FROM persons WHERE id = $1', [personId]);
            const personName = personResult.rows.length > 0 ? personResult.rows[0].name : 'Unknown';
            
            return { 
                ...rows[0], 
                movieId,
                person: { id: personId, name: personName }
            };
        } catch (error) {
            console.error('Error updating crew member:', error);
            throw new GraphQLError(`Failed to update crew member: ${error.message}`, { 
                extensions: { code: 'DATABASE_ERROR' } 
            });
        }
    },
    
    removeCrewMemberFromMovie: async (_, { performingAdminId, movieId, personId }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'remove crew from movie');
        
        try {
            const { rowCount } = await db.query(
                'DELETE FROM movie_person_roles WHERE movie_id = $1 AND person_id = $2 AND role_type = $3', 
                [movieId, personId, 'CREW']
            );
            
            return rowCount > 0;
        } catch (error) {
            console.error('Error removing crew member:', error);
            throw new GraphQLError(`Failed to remove crew member: ${error.message}`, { 
                extensions: { code: 'DATABASE_ERROR' } 
            });
        }
    },
    addProductionCompanyToMovie: async (_, { performingAdminId, movieId, companyId }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'add production company to movie');
        await db.query('INSERT INTO movie_production_companies (movie_id, company_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [movieId, companyId]);
        const { rows } = await db.query('SELECT * FROM movies WHERE id = $1', [movieId]);
        return rows[0];
    },
    removeProductionCompanyFromMovie: async (_, { performingAdminId, movieId, companyId }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'remove production company from movie');
        await db.query('DELETE FROM movie_production_companies WHERE movie_id = $1 AND company_id = $2', [movieId, companyId]);
        const { rows } = await db.query('SELECT * FROM movies WHERE id = $1', [movieId]);
        return rows[0];
    },
    toggleFavoriteMovie: async (_, { userId, movieId }, { db }) => {
        if (!userId) throw new GraphQLError('User ID is required to favorite a movie.', { extensions: { code: 'UNAUTHENTICATED' } });
        // Check if already favorited
        const favCheck = await db.query('SELECT id FROM user_favorite_movies WHERE user_id = $1 AND movie_id = $2', [userId, movieId]);
        if (favCheck.rows.length > 0) {
            // Unfavorite
            await db.query('DELETE FROM user_favorite_movies WHERE user_id = $1 AND movie_id = $2', [userId, movieId]);
        } else {
            // Favorite
            await db.query('INSERT INTO user_favorite_movies (user_id, movie_id) VALUES ($1, $2)', [userId, movieId]);
        }
        const { rows } = await db.query('SELECT * FROM movies WHERE id = $1', [movieId]);
        return rows[0];
    },
    toggleWatchMovie: async (_, { userId, movieId }, { db }) => {
        if (!userId) throw new GraphQLError('User ID is required to mark a movie as watched.', { extensions: { code: 'UNAUTHENTICATED' } });
        const watchCheck = await db.query('SELECT id FROM user_watched_movies WHERE user_id = $1 AND movie_id = $2', [userId, movieId]);
        if (watchCheck.rows.length > 0) {
            // Unmark
            await db.query('DELETE FROM user_watched_movies WHERE user_id = $1 AND movie_id = $2', [userId, movieId]);
        } else {
            // Mark as watched
            await db.query('INSERT INTO user_watched_movies (user_id, movie_id) VALUES ($1, $2)', [userId, movieId]);
        }
        const { rows } = await db.query('SELECT * FROM movies WHERE id = $1', [movieId]);
        return rows[0];
    },
    // Collection Mutations
    createCollection: async (_, { performingAdminId, name, overview, posterPath, backdropPath }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'create collection');
        const slug = slugify(name);
        const { rows } = await db.query(
            'INSERT INTO collections (name, slug, overview, poster_path, backdrop_path) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, slug, overview, posterPath, backdropPath]
        );
        return rows[0];
    },
    updateCollection: async (_, { performingAdminId, id, name, overview, posterPath, backdropPath }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'update collection');
        const updates = [];
        const params = [];
        let paramCount = 1;
        if (name !== undefined) { updates.push(`name = $${paramCount++}`); params.push(name); updates.push(`slug = $${paramCount++}`); params.push(slugify(name));}
        if (overview !== undefined) { updates.push(`overview = $${paramCount++}`); params.push(overview); }
        if (posterPath !== undefined) { updates.push(`poster_path = $${paramCount++}`); params.push(posterPath); }
        if (backdropPath !== undefined) { updates.push(`backdrop_path = $${paramCount++}`); params.push(backdropPath); }
        
        if (updates.length === 0) throw new GraphQLError('No fields to update for collection.', { extensions: { code: 'BAD_USER_INPUT' } });
        
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);
        const query = `UPDATE collections SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
        const { rows } = await db.query(query, params);
        if (rows.length === 0) throw new GraphQLError('Collection not found or no changes made.', { extensions: { code: 'NOT_FOUND' } });
        return rows[0];
    },
    deleteCollection: async (_, { performingAdminId, id }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'ADMIN', 'delete collection');
        // Also remove movies from this collection (movie_collections table)
        await db.query('DELETE FROM movie_collections WHERE collection_id = $1', [id]);
        const { rowCount } = await db.query('DELETE FROM collections WHERE id = $1', [id]);
        if (rowCount === 0) throw new GraphQLError('Collection not found.', { extensions: { code: 'NOT_FOUND' } });
        return true;
    },
    addMovieToCollection: async (_, { performingAdminId, movieId, collectionId }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'add movie to collection');
        await db.query('INSERT INTO movie_collections (movie_id, collection_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [movieId, collectionId]);
        const { rows } = await db.query('SELECT * FROM collections WHERE id = $1', [collectionId]); // Return the collection
        return rows[0];
    },
    removeMovieFromCollection: async (_, { performingAdminId, movieId, collectionId }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'remove movie from collection');
        await db.query('DELETE FROM movie_collections WHERE movie_id = $1 AND collection_id = $2', [movieId, collectionId]);
        const { rows } = await db.query('SELECT * FROM collections WHERE id = $1', [collectionId]);
        return rows[0];
    },
    setMovieWatchProviders: async (_, { performingAdminId, movieId, countryCode, providers }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'set movie watch providers');
        // Clear existing providers for this movie/country first
        await db.query('DELETE FROM movie_watch_providers WHERE movie_id = $1 AND country_iso_3166_1 = $2', [movieId, countryCode]);
        if (providers && providers.length > 0) {
            const providerValues = providers.map(p => `(${movieId}, ${p.provider_id}, '${countryCode}', '${p.link.replace(/'/g, "''")}', '${p.stream_type}')`).join(',');
            await db.query(`INSERT INTO movie_watch_providers (movie_id, provider_id, country_iso_3166_1, link, stream_type) VALUES ${providerValues}`);
        }
        const { rows } = await db.query('SELECT * FROM movies WHERE id = $1', [movieId]);
        return rows[0];
    },
    clearMovieWatchProviders: async (_, { performingAdminId, movieId, countryCode }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'clear movie watch providers');
        await db.query('DELETE FROM movie_watch_providers WHERE movie_id = $1 AND country_iso_3166_1 = $2', [movieId, countryCode]);
        const { rows } = await db.query('SELECT * FROM movies WHERE id = $1', [movieId]);
        return rows[0];
    },
    addKeywordToMovie: async (_, { performingAdminId, movieId, keywordId }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'add keyword to movie');
        await db.query('INSERT INTO movie_keywords (movie_id, keyword_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [movieId, keywordId]);
        const { rows } = await db.query('SELECT * FROM movies WHERE id = $1', [movieId]);
        return rows[0];
    },
    createAndAddKeywordToMovie: async (_, { performingAdminId, movieId, keywordName }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'create and add keyword');
        let keywordRes = await db.query('SELECT id FROM keywords WHERE name = $1', [keywordName]);
        let keywordId;
        if (keywordRes.rows.length > 0) {
            keywordId = keywordRes.rows[0].id;
        } else {
            keywordRes = await db.query('INSERT INTO keywords (name) VALUES ($1) RETURNING id', [keywordName]);
            keywordId = keywordRes.rows[0].id;
        }
        await db.query('INSERT INTO movie_keywords (movie_id, keyword_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [movieId, keywordId]);
        const { rows } = await db.query('SELECT * FROM movies WHERE id = $1', [movieId]);
        return rows[0];
    },
    removeKeywordFromMovie: async (_, { performingAdminId, movieId, keywordId }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'remove keyword from movie');
        await db.query('DELETE FROM movie_keywords WHERE movie_id = $1 AND keyword_id = $2', [movieId, keywordId]);
        const { rows } = await db.query('SELECT * FROM movies WHERE id = $1', [movieId]);
        return rows[0];
    },
    // Simplified image/video mutations
    addMovieImage: async (_, { performingAdminId, movieId, imageInput }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'add movie image');
        await db.query(
            'INSERT INTO movie_images (movie_id, file_path, image_type, width, height, aspect_ratio, iso_639_1) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (movie_id, file_path) DO NOTHING',
            [movieId, imageInput.file_path, imageInput.image_type, imageInput.width, imageInput.height, imageInput.aspect_ratio, imageInput.iso_639_1]
        );
        const { rows } = await db.query('SELECT * FROM movies WHERE id = $1', [movieId]);
        return rows[0];
    },
    removeMovieImage: async (_, { performingAdminId, movieId, imageFilePath }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'remove movie image');
        await db.query('DELETE FROM movie_images WHERE movie_id = $1 AND file_path = $2', [movieId, imageFilePath]);
        const { rows } = await db.query('SELECT * FROM movies WHERE id = $1', [movieId]);
        return rows[0];
    },
    addMovieVideo: async (_, { performingAdminId, movieId, videoInput }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'add movie video');
        await db.query(
            'INSERT INTO movie_videos (movie_id, tmdb_video_id, name, key, site, type, official, size, iso_639_1, iso_3166_1, published_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT (movie_id, tmdb_video_id) DO NOTHING',
            // Assuming videoInput.id from TMDB is passed as tmdb_video_id if the type Video has 'id' as its TMDB video id
            [movieId, videoInput.key, videoInput.name, videoInput.key, videoInput.site, videoInput.type, videoInput.official, videoInput.size, videoInput.iso_639_1, videoInput.iso_3166_1, videoInput.published_at]
        );
        const { rows } = await db.query('SELECT * FROM movies WHERE id = $1', [movieId]);
        return rows[0];
    },
    removeMovieVideo: async (_, { performingAdminId, movieId, videoTmdbId }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'remove movie video');
        await db.query('DELETE FROM movie_videos WHERE movie_id = $1 AND tmdb_video_id = $2', [movieId, videoTmdbId]);
        const { rows } = await db.query('SELECT * FROM movies WHERE id = $1', [movieId]);
        return rows[0];
    },
  },
  // Field Resolvers
  Movie: {
    is_watched_by_me: async (movie, { userId }, { db }) => {
      if (!userId) return null; // Or false, depending on desired behavior if no user
      const { rows } = await db.query('SELECT EXISTS (SELECT 1 FROM user_watched_movies WHERE user_id = $1 AND movie_id = $2)', [userId, movie.id]);
      return rows[0].exists;
    },
    is_favorited_by_me: async (movie, { userId }, { db }) => {
      if (!userId) return null;
      const { rows } = await db.query('SELECT EXISTS (SELECT 1 FROM user_favorite_movies WHERE user_id = $1 AND movie_id = $2)', [userId, movie.id]);
      return rows[0].exists;
    },
    user_rating: async (movie, { userId }, { db }) => {
      if (!userId) return null;
      const { rows } = await db.query('SELECT rating FROM user_ratings WHERE user_id = $1 AND movie_id = $2', [userId, movie.id]);
      return rows.length > 0 ? rows[0].rating : null; // Return null if not rated, or 0
    },
    genres: async (movie, _, { db }) => {
      const { rows } = await db.query('SELECT g.* FROM genres g JOIN movie_genres mg ON g.id = mg.genre_id WHERE mg.movie_id = $1 ORDER BY g.name ASC', [movie.id]);
      return rows;
    },
    cast: async (movie, { limit = 10 }, { db }) => {
      try {
        // Check if we have a movie_cast_members table
        const tableCheck = await db.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'movie_cast_members'
          );
        `);
        
        // If movie_cast_members table doesn't exist, use person roles from persons table
        if (!tableCheck.rows[0].exists) {
          console.warn('Table movie_cast_members does not exist. Using persons table with role filtering.');
          // Using movie_person_roles table that links movies to persons with roles
          const { rows } = await db.query(`
            SELECT p.id as person_id, p.name, mpr.character_name, mpr.order as cast_order
            FROM persons p
            JOIN movie_person_roles mpr ON p.id = mpr.person_id
            WHERE mpr.movie_id = $1 AND mpr.role_type = 'ACTOR'
            ORDER BY mpr.order ASC NULLS LAST, p.name ASC
            LIMIT $2
          `, [movie.id, limit]);
          
          return rows.map(row => ({ 
            id: row.person_id, 
            character_name: row.character_name || null, 
            cast_order: row.cast_order || 0,
            person: { id: row.person_id, name: row.name }
          }));
        }
        
        // Original implementation for movie_cast_members table
        const { rows } = await db.query(
          `SELECT p.id as person_id, mcm.character_name, mcm.order as cast_order
           FROM movie_cast_members mcm
           JOIN persons p ON mcm.person_id = p.id
           WHERE mcm.movie_id = $1 ORDER BY mcm.order ASC, p.name ASC LIMIT $2`,
          [movie.id, limit]
        );
        return rows.map(row => ({ id: row.person_id, character_name: row.character_name, cast_order: row.cast_order }));
      } catch (error) {
        console.error('Error fetching movie cast:', error.message);
        return [];
      }
    },
    crew: async (movie, { limit = 10 }, { db }) => {
      try {
        // Check if we have a movie_crew_members table  
        const tableCheck = await db.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'movie_crew_members'
          );
        `);
        
        // If movie_crew_members table doesn't exist, use person roles from persons table
        if (!tableCheck.rows[0].exists) {
          console.warn('Table movie_crew_members does not exist. Using persons table with role filtering.');
          // Using movie_person_roles table that links movies to persons with roles
          const { rows } = await db.query(`
            SELECT p.id as person_id, p.name, mpr.job, mpr.department
            FROM persons p
            JOIN movie_person_roles mpr ON p.id = mpr.person_id
            WHERE mpr.movie_id = $1 AND mpr.role_type = 'CREW'
            ORDER BY mpr.department ASC NULLS LAST, mpr.job ASC NULLS LAST, p.name ASC
            LIMIT $2
          `, [movie.id, limit]);
          
          return rows.map(row => ({ 
            id: row.person_id, 
            job: row.job || 'Director', 
            department: row.department || 'Directing',
            person: { id: row.person_id, name: row.name }
          }));
        }
        
        // Original implementation for movie_crew_members table
        const { rows } = await db.query(
          `SELECT p.id as person_id, mcm.job, mcm.department
           FROM movie_crew_members mcm
           JOIN persons p ON mcm.person_id = p.id
           WHERE mcm.movie_id = $1 ORDER BY mcm.department ASC, mcm.job ASC, p.name ASC LIMIT $2`,
          [movie.id, limit]
        );
        return rows.map(row => ({ id: row.person_id, job: row.job, department: row.department }));
      } catch (error) {
        console.error('Error fetching movie crew:', error.message);
        return [];
      }
    },
    production_companies: async (movie, _, { db }) => {
      const { rows } = await db.query(
        'SELECT pc.* FROM production_companies pc JOIN movie_production_companies mpc ON pc.id = mpc.company_id WHERE mpc.movie_id = $1 ORDER BY pc.name ASC',
        [movie.id]
      );
      return rows;
    },
    production_countries: async (movie, _, { db }) => {
        const { rows } = await db.query(
            'SELECT c.* FROM countries c JOIN movie_production_countries mpc ON c.iso_3166_1 = mpc.country_iso_3166_1 WHERE mpc.movie_id = $1 ORDER BY c.english_name ASC',
            [movie.id]
        );
        return rows;
    },
    spoken_languages: async (movie, _, { db }) => {
        const { rows } = await db.query(
            'SELECT l.* FROM languages l JOIN movie_spoken_languages msl ON l.iso_639_1 = msl.language_iso_639_1 WHERE msl.movie_id = $1 ORDER BY l.english_name ASC',
            [movie.id]
        );
        return rows;
    },
    collections: async (movie, _, { db }) => {
        const { rows } = await db.query(
            'SELECT c.* FROM collections c JOIN movie_collections mc ON c.id = mc.collection_id WHERE mc.movie_id = $1 ORDER BY c.name ASC',
            [movie.id]
        );
        return rows;
    },
    watch_providers: async (movie, _, { db }) => { // Needs country context, usually from query args or user context
        // For simplicity, fetching all for now. A real app would filter by country.
        // Example: 'SELECT mwp.*, wp.* FROM movie_watch_providers mwp JOIN watch_providers wp ON mwp.provider_id = wp.id WHERE mwp.movie_id = $1 AND mwp.country_iso_3166_1 = $2'
        const { rows } = await db.query(
            `SELECT 
                wp.id as provider_id, wp.name as provider_name, wp.logo_path as provider_logo_path, wp.display_priority,
                mwp.link, mwp.stream_type
             FROM movie_watch_providers mwp 
             JOIN watch_providers wp ON mwp.provider_id = wp.id 
             WHERE mwp.movie_id = $1 
             ORDER BY mwp.country_iso_3166_1, wp.display_priority ASC, wp.name ASC`, // Group by country if showing all
            [movie.id]
        );
        return rows.map(r => ({
            provider: { id: r.provider_id, name: r.provider_name, logo_path: r.provider_logo_path, display_priority: r.display_priority },
            link: r.link,
            stream_type: r.stream_type
        }));
    },
    comments: async (movie, { limit = 10, offset = 0 }, { db }) => {
        const { rows } = await db.query(
            'SELECT * FROM comments WHERE movie_id = $1 AND parent_comment_id IS NULL ORDER BY created_at DESC LIMIT $2 OFFSET $3',
            [movie.id, limit, offset]
        );
        return rows; // Assumes Comment type has its own resolvers for replies etc.
    },
    related_movies: async (movie, { limit = 5 }, { db }) => {
        // Placeholder: Simple related by genre. A real system would be more complex.
        const genreRes = await db.query('SELECT genre_id FROM movie_genres WHERE movie_id = $1 LIMIT 3', [movie.id]);
        if (genreRes.rows.length === 0) return [];
        const genreIds = genreRes.rows.map(r => r.genre_id);
        
        const { rows } = await db.query(
           `SELECT DISTINCT m.*
            FROM movies m
            JOIN movie_genres mg ON m.id = mg.movie_id
            WHERE mg.genre_id = ANY($1::int[]) AND m.id != $2
            ORDER BY m.movieq_rating DESC NULLS LAST, m.release_date DESC NULLS LAST
            LIMIT $3`,
            [genreIds, movie.id, limit]
        );
        return rows;
    },
    alternative_titles: async (movie, { country_code }, { db }) => {
        let query = 'SELECT * FROM movie_alternative_titles WHERE movie_id = $1';
        const params = [movie.id];
        if (country_code) {
            query += ' AND iso_3166_1 = $2';
            params.push(country_code);
        }
        query += ' ORDER BY iso_3166_1, type NULLS LAST';
        const { rows } = await db.query(query, params);
        return rows;
    },
    images: async (movie, _, { db }) => { // This resolver returns an object for MovieImages type
        const backdrops = await db.query("SELECT * FROM movie_images WHERE movie_id = $1 AND image_type = 'BACKDROP' ORDER BY vote_average DESC NULLS LAST, file_path", [movie.id]);
        const logos = await db.query("SELECT * FROM movie_images WHERE movie_id = $1 AND image_type = 'LOGO' ORDER BY vote_average DESC NULLS LAST, file_path", [movie.id]);
        const posters = await db.query("SELECT * FROM movie_images WHERE movie_id = $1 AND image_type = 'POSTER' ORDER BY vote_average DESC NULLS LAST, file_path", [movie.id]);
        return {
            backdrops: backdrops.rows,
            logos: logos.rows,
            posters: posters.rows,
        };
    },
    keywords: async (movie, _, { db }) => {
        const { rows } = await db.query(
            'SELECT k.* FROM keywords k JOIN movie_keywords mk ON k.id = mk.keyword_id WHERE mk.movie_id = $1 ORDER BY k.name ASC',
            [movie.id]
        );
        return rows;
    },
    recommendations: async (movie, { limit = 10 }, { db }) => {
        // Placeholder for actual recommendation engine logic (e.g. collaborative filtering, or from TMDB)
        // For now, similar to related_movies but could use a different source like a precomputed table.
        const { rows } = await db.query(
           `SELECT m.*
            FROM movies m
            WHERE m.id != $1 -- Placeholder: Just get other popular movies for now
            ORDER BY m.movieq_rating DESC NULLS LAST
            LIMIT $2`,
            [movie.id, limit]
        );
        return rows;
    },
    similar: async (movie, { limit = 10 }, { db }) => {
        // Fetch movies with shared genres, excluding the current movie.
        // Prioritize movies with more shared genres if possible (more complex query)
        // For now, any shared genre, ordered by rating and release date.
        const genreRes = await db.query(
            'SELECT genre_id FROM movie_genres WHERE movie_id = $1', 
            [movie.id]
        );
        if (genreRes.rows.length === 0) return [];
        const genreIds = genreRes.rows.map(r => r.genre_id);

        const query = `
            SELECT DISTINCT m.id, m.title, m.poster_url, m.movieq_rating, m.release_date, m.slug
            FROM movies m
            JOIN movie_genres mg ON m.id = mg.movie_id
            WHERE mg.genre_id = ANY($1::int[]) AND m.id != $2
            ORDER BY m.movieq_rating DESC NULLS LAST, m.release_date DESC NULLS LAST
            LIMIT $3
        `;
        const { rows } = await db.query(query, [genreIds, movie.id, limit]);
        return rows;
    },
    translations: async (movie, _, { db }) => {
        const { rows } = await db.query('SELECT * FROM movie_translations WHERE movie_id = $1 ORDER BY english_name ASC', [movie.id]);
        return rows;
    },
    videos: async (movie, _, { db }) => {
        const { rows } = await db.query('SELECT *, tmdb_video_id as id FROM movie_videos WHERE movie_id = $1 ORDER BY official DESC, published_at DESC NULLS LAST, type ASC, site ASC', [movie.id]);
        return rows;
    },
    release_dates: async (movie, { country_code }, { db }) => {
        // This resolver should group release dates by country
        let query = `
            SELECT country_iso_3166_1 as iso_3166_1, 
                   json_agg(json_build_object(
                       'certification', certification, 
                       'iso_639_1', iso_639_1, 
                       'note', note, 
                       'release_date', release_date, 
                       'type', type
                   ) ORDER BY release_date ASC, type ASC) as release_dates
            FROM movie_release_dates 
            WHERE movie_id = $1
        `;
        const params = [movie.id];
        if (country_code) {
            query += ' AND country_iso_3166_1 = $2';
            params.push(country_code);
        }
        query += ' GROUP BY country_iso_3166_1 ORDER BY country_iso_3166_1';
        const { rows } = await db.query(query, params);
        return rows;
    },
    average_user_rating: async (movie, _, { db }) => {
        const { rows } = await db.query('SELECT AVG(rating) as avg_rating FROM user_ratings WHERE movie_id = $1', [movie.id]);
        return rows[0].avg_rating ? parseFloat(rows[0].avg_rating.toFixed(2)) : null;
    },
    total_user_ratings: async (movie, _, { db }) => {
        const { rows } = await db.query('SELECT COUNT(*) as count FROM user_ratings WHERE movie_id = $1', [movie.id]);
        return parseInt(rows[0].count, 10);
    },
    total_favorites: async (movie, _, { db }) => {
        const { rows } = await db.query('SELECT COUNT(*) as count FROM user_favorite_movies WHERE movie_id = $1', [movie.id]);
        return parseInt(rows[0].count, 10);
    },
    total_watches: async (movie, _, { db }) => {
        const { rows } = await db.query('SELECT COUNT(*) as count FROM user_watched_movies WHERE movie_id = $1', [movie.id]);
        return parseInt(rows[0].count, 10);
    }
  },
  // Field resolvers for connected types
  MovieCastMember: {
    person: async (castMember, _, { db }) => {
      // castMember.id is person_id in this structure
      const { rows } = await db.query('SELECT * FROM persons WHERE id = $1', [castMember.id]);
      return rows[0];
    }
  },
  MovieCrewMember: {
    person: async (crewMember, _, { db }) => {
      // crewMember.id is person_id
      const { rows } = await db.query('SELECT * FROM persons WHERE id = $1', [crewMember.id]);
      return rows[0];
    }
  },
  Collection: {
    parts: async (collection, { limit = 10, offset = 0 }, { db }) => {
        const { rows } = await db.query(
            'SELECT m.* FROM movies m JOIN movie_collections mc ON m.id = mc.movie_id WHERE mc.collection_id = $1 ORDER BY m.release_date ASC, m.title ASC LIMIT $2 OFFSET $3',
            [collection.id, limit, offset]
        );
        return rows;
    }
  },
  // Scalar resolver for DateTime (if not using a library that provides one)
  // DateTime: new GraphQLScalarType({ ... }), // Defined globally or in scalars.js
  // JSON: GraphQLJSON, // Defined globally or in scalars.js
};

module.exports = { typeDefs, resolvers };
