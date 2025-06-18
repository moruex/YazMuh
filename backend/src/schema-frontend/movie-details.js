const { GraphQLError } = require('graphql');
const gql = require('graphql-tag');
const { GraphQLDateTime, GraphQLDate } = require('graphql-scalars'); // Reuse scalars if needed

const typeDefs = gql`
  scalar Date
  scalar DateTime

  """
  Represents a person involved in a movie (e.g., director, actor).
  """
  type Person {
    id: ID!
    name: String!
    # Add other relevant fields like profile_picture_url if available
  }

  """
  Represents a movie genre.
  """
  type Genre {
    id: ID!
    name: String!
  }


  """
  Represents detailed information about a movie, tailored for the movie details page.
  Note: Some fields might differ from the main 'Movie' type if the detail page needs specific formatting or data.
  """
  type MovieDetail {
    id: ID!
    title: String!
    release_date: Date # Used to derive releaseYear in frontend
    plot_summary: String
    poster_url: String
    duration_minutes: Int # Used for duration string in frontend
    trailer_url: String
    avg_rating: Float # Site's average rating

    # --- Added Fields ---
    genres: [Genre!] # Requires join to genres table
    directors: [Person!] # Requires join to movie_persons and persons table (filtered by role)
    actors: [Person!] # Requires join to movie_persons and persons table (filtered by role)
    site_rating: Float # Placeholder, maps to avg_rating for now
    imdb_rating: Float # Placeholder, maps to avg_rating for now
    your_rating_placeholder: Float # Placeholder, maps to avg_rating for now
    # originalTitle: String # Assuming same as title for now unless DB differs
  }

  # Extend Query type
  extend type Query { # Use extend type Query if base Query is defined elsewhere
    """
    Fetches detailed information for a single movie by its ID.
    """
    movieDetails(id: ID!): MovieDetail
  }
`;

const resolvers = {
  // Add scalar resolvers if they weren't defined globally
  // Date: GraphQLDate,
  // DateTime: GraphQLDateTime,

  Query: {
    movieDetails: async (_, { id }, { db }) => {
      // Fetch core movie data
      const query = `
        SELECT
          id,
          title,
          release_date,
          plot_summary,
          poster_url,
          duration_minutes,
          trailer_url,
          avg_rating
          -- We will resolve genres, directors, actors separately below
          -- Map avg_rating to the new rating fields for now
          , avg_rating as site_rating
          , avg_rating as imdb_rating
          , avg_rating as your_rating_placeholder
        FROM movies
        WHERE id = $1`;
      const values = [id];

      try {
        console.log(`Executing movieDetails query for ID: ${id}`);
        const result = await db.query(query, values);
        const movie = result.rows[0];

        if (!movie) {
          // Throw a specific error if not found
           throw new GraphQLError('Movie not found', {
            extensions: { code: 'NOT_FOUND', argumentName: 'id' },
          });
        }
        console.log(`Found movie details for ID: ${id}`);
        // Movie object now contains the core fields and mapped ratings
        return movie;
      } catch (err) {
        // Catch specific errors like NOT_FOUND or re-throw others
        if (err instanceof GraphQLError && err.extensions?.code === 'NOT_FOUND') {
            throw err;
        }
         console.error(`Error fetching movie details for ID ${id}:`, err);
        throw new GraphQLError('Could not fetch movie details. Please try again later.', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' },
        });
      }
    },
  },

  // --- Type Resolvers (for fields not directly mapped from the initial query) ---
  MovieDetail: {
      // Resolver for genres
      genres: async (movie, _, { db, loaders }) => {
          // TODO: Implement DataLoader for genres if performance becomes an issue
          const genreQuery = `
              SELECT g.id, g.name
              FROM genres g
              JOIN movie_genres mg ON g.id = mg.genre_id
              WHERE mg.movie_id = $1
              ORDER BY g.name`;
          try {
              const result = await db.query(genreQuery, [movie.id]);
              return result.rows; // Return array of genre objects
          } catch (err) {
              console.error(`Error fetching genres for movie ID ${movie.id}:`, err);
              return []; // Return empty array on error
          }
      },

      // Resolver for directors
      directors: async (movie, _, { db, loaders }) => {
          // TODO: Implement DataLoader for persons if performance becomes an issue
           const directorsQuery = `
               SELECT p.id, p.name -- Select necessary person fields
               FROM persons p
               JOIN movie_persons mp ON p.id = mp.person_id
               WHERE mp.movie_id = $1 AND mp.role = $2 -- Filter by role
               ORDER BY p.name`; // Or order by significance if available
           try {
               // Assuming 'director' is the role identifier in your movie_persons table
               const result = await db.query(directorsQuery, [movie.id, 'director']);
               return result.rows;
           } catch (err) {
               console.error(`Error fetching directors for movie ID ${movie.id}:`, err);
               return []; // Return empty array on error
           }
      },

      // Resolver for actors
      actors: async (movie, _, { db, loaders }) => {
          // TODO: Implement DataLoader for persons if performance becomes an issue
           const actorsQuery = `
               SELECT p.id, p.name -- Select necessary person fields
               FROM persons p
               JOIN movie_persons mp ON p.id = mp.person_id
               WHERE mp.movie_id = $1 AND mp.role = $2 -- Filter by role
               ORDER BY mp.sort_order, p.name`; // Example ordering
           try {
                // Assuming 'actor' is the role identifier
               const result = await db.query(actorsQuery, [movie.id, 'actor']);
               return result.rows;
           } catch (err) {
               console.error(`Error fetching actors for movie ID ${movie.id}:`, err);
               return []; // Return empty array on error
           }
      },

      // releaseYear: (movie) => movie.release_date ? new Date(movie.release_date).getFullYear() : null,
      // duration: (movie) => movie.duration_minutes ? `${movie.duration_minutes} min` : null,
  }
};

module.exports = { typeDefs, resolvers };
