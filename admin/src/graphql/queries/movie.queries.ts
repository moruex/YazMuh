// src/graphql/queries/movie.queries.ts
import { gql } from '@apollo/client';
import { MOVIE_CORE_FIELDS, MOVIE_DETAIL_FIELDS } from '../fragments';

/**
 * Fetches a list of movies with filtering, pagination, and the total count.
 */
export const GET_MOVIES = gql`
  ${MOVIE_CORE_FIELDS}
  query GetMovies(
    $limit: Int = 10,
    $offset: Int = 0,
    $search: String,
    $sortBy: MovieSortBy = RELEASE_DATE_DESC,
    $filter: MovieFilterInput
  ) {
    movies(
      limit: $limit,
      offset: $offset,
      search: $search,
      sortBy: $sortBy,
      filter: $filter
    ) {
      ...MovieCoreFields
    }
    movieCount(search: $search, filter: $filter)
  }
`;

/**
 * Fetches a single movie by ID with detailed information.
 */
export const GET_MOVIE = gql`
  ${MOVIE_DETAIL_FIELDS}
  query GetMovie($id: ID!) {
    movie(id: $id) {
      ...MovieDetailFields
    }
  }
`;

/**
 * Fetches a movie by TMDB ID (useful for imports or integration)
 */
export const GET_MOVIE_BY_TMDB_ID = gql`
  ${MOVIE_DETAIL_FIELDS}
  query GetMovieByTmdbId($tmdbId: Int!) {
    movie(tmdb_id: $tmdbId) {
      ...MovieDetailFields
    }
  }
`;

/**
 * Fetches available genres for categorizing movies
 */
export const GET_MOVIE_GENRES = gql`
  query GetMovieGenres {
    genres {
      id
      name
      is_collection
    }
  }
`;

/**
 * Searches for keywords based on a term
 */
export const SEARCH_KEYWORDS = gql`
  query SearchKeywords($term: String!, $limit: Int = 10) {
    keywords(search: $term, limit: $limit) {
      id
      name
    }
  }
`;

/**
 * Gets AI-generated movie recommendations (if supported)
 */
export const GET_AI_RECOMMENDATIONS = gql`
  ${MOVIE_CORE_FIELDS}
  query GetAIRecommendations($movieId: ID!) {
    getMovieRecommendationsFromAI(movieId: $movieId) {
      ...MovieCoreFields
    }
  }
`;