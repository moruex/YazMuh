// src/graphql/queries/genre.queries.ts
import { gql } from '@apollo/client';
import { GENRE_FIELDS, MOVIE_CORE_FIELDS } from '../fragments'; // Assuming fragments are correct

/**
 * Fetches a list of genres with filtering, pagination, and the total count.
 */
export const GET_GENRES = gql`
  ${GENRE_FIELDS} # Ensure GENRE_FIELDS includes id, name, description, image_url, is_collection
  query GetGenres(
      $limit: Int,
      $offset: Int,
      $search: String,
      $isCollection: Boolean
    ) {
    # Fetch the list of genres matching criteria
    genres(
        limit: $limit,
        offset: $offset,
        search: $search,
        isCollection: $isCollection
    ) {
      ...GenreFields
      # movieCount # Optional: Uncomment if GENRE_FIELDS includes it and backend resolves it
    }
    # Fetch the total count matching the *same* criteria
    genreCount(
        search: $search,
        isCollection: $isCollection
    ) # Returns Int!
  }
`;

/** Fetches a single genre by ID, including a sample of its associated movies. */
export const GET_GENRE = gql`
 ${GENRE_FIELDS}
 ${MOVIE_CORE_FIELDS} # Include core movie fields for nested list
  query GetGenre($id: ID!) {
    genre(id: $id) {
      ...GenreFields
      # Optionally fetch movies here if needed on a single genre view
      movies(limit: 10) {
        ...MovieCoreFields
      }
      movieCount # Fetch count here if needed
    }
  }
`;