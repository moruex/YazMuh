// src/graphql/queries/movie.queries.ts
import { gql } from '@apollo/client';
import { MOVIE_CORE_FIELDS, MOVIE_DETAIL_FIELDS } from '../fragments';

/** Fetches a list of movies with filtering, sorting, and pagination. Includes count. */
export const GET_MOVIES = gql`
  ${MOVIE_CORE_FIELDS}
  query GetMovies(
    $limit: Int = 10,
    $offset: Int = 0,
    $sortBy: String,
    $sortDirection: String,
    $genreId: ID,
    $search: String
  ) {
    movies(
      limit: $limit,
      offset: $offset,
      sortBy: $sortBy,
      sortDirection: $sortDirection,
      genreId: $genreId,
      search: $search
    ) {
      ...MovieCoreFields
    }
    movieCount(genreId: $genreId, search: $search) # Total count matching filters
  }
`;

/** Fetches a single movie by its ID with detailed information. */
export const GET_MOVIE = gql`
  ${MOVIE_DETAIL_FIELDS}
  query GetMovie($id: ID!) {
    movie(id: $id) {
      ...MovieDetailFields
    }
  }
`;