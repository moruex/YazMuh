const { GraphQLError } = require('graphql');
const { GraphQLDateTime, GraphQLDate } = require('graphql-scalars'); // For handling Date/DateTime scalars
const gql = require('graphql-tag');

const typeDefs = gql`
  # Base Scalar Types (ensure Date/DateTime are handled if not using default ISO strings)
  scalar Date
  scalar DateTime

  """
  Represents a movie in the system. Fields relevant for recommendation cards.
  """
  type Movie {
    id: ID!
    title: String!
    release_date: Date
    poster_url: String
    avg_rating: Float
    # Add other fields if MovieCard4 needs them (e.g., plot_summary)
    # plot_summary: String
  }

  """
  Base Query type extended with recommendation queries.
  """
  type Query {
    _empty: String # Placeholder to allow extending

    """
    Fetches a list of the most recently released movies.
    Filters out movies without a release date.
    """
    newReleaseMovies(
      limit: Int = 10
      offset: Int = 0 # Added offset for potential pagination
    ): [Movie!]!

    """
    Fetches a list of popular movies, typically ordered by average rating.
    """
    popularMovies(
      limit: Int = 10
      offset: Int = 0 # Added offset for potential pagination
    ): [Movie!]!
  }

  # No mutations needed for this specific read-only recommendation feature
  # type Mutation {
  #   _empty: String
  # }
`;

const resolvers = {
  // --- Scalar Resolvers ---
  Date: GraphQLDate,
  DateTime: GraphQLDateTime,

  // --- Query Resolvers ---
  Query: {
    newReleaseMovies: async (_, { limit = 10, offset = 0 }, { db }) => {
      // Order by release_date DESC, ensuring date is not null
      const query = `
        SELECT id, title, release_date, poster_url, avg_rating
        FROM movies
        WHERE release_date IS NOT NULL
        ORDER BY release_date DESC
        LIMIT $1 OFFSET $2`;
      const values = [limit, offset];
      try {
        console.log(`Executing newReleaseMovies query with limit: ${limit}, offset: ${offset}`);
        const result = await db.query(query, values);
         console.log(`Found ${result.rows.length} new release movies.`);
        return result.rows;
      } catch (err) {
        console.error("Error fetching new release movies:", err);
        throw new GraphQLError("Could not fetch new releases. Please try again later.", {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },

    popularMovies: async (_, { limit = 10, offset = 0 }, { db }) => {
      // Order by average rating DESC. Handle potential NULLs.
      const query = `
        SELECT id, title, release_date, poster_url, avg_rating
        FROM movies
        ORDER BY avg_rating DESC NULLS LAST
        LIMIT $1 OFFSET $2`;
      const values = [limit, offset];
       try {
        console.log(`Executing popularMovies query with limit: ${limit}, offset: ${offset}`);
        const result = await db.query(query, values);
         console.log(`Found ${result.rows.length} popular movies.`);
        return result.rows;
      } catch (err) {
        console.error("Error fetching popular movies:", err);
        throw new GraphQLError("Could not fetch popular movies. Please try again later.", {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },

  // --- Type Resolvers (if needed, e.g., if Movie fields didn't map directly) ---
  // Movie: {
  //   // Example: if poster_url was stored as 'posterPath' in DB
  //   poster_url: (movie) => movie.posterPath,
  // },
};

module.exports = { typeDefs, resolvers };
