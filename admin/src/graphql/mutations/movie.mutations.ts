// src/graphql/mutations/movie.mutations.ts
import { gql } from '@apollo/client';
import { MOVIE_CORE_FIELDS, MOVIE_DETAIL_FIELDS } from '../fragments';

/**
 * Creates a new movie
 */
export const CREATE_MOVIE = gql`
  ${MOVIE_DETAIL_FIELDS}
  mutation CreateMovie($performingAdminId: ID!, $input: CreateMovieInput!) {
    createMovie(performingAdminId: $performingAdminId, input: $input) {
      ...MovieDetailFields
    }
  }
`;

/**
 * Updates an existing movie
 */
export const UPDATE_MOVIE = gql`
  ${MOVIE_DETAIL_FIELDS}
  mutation UpdateMovie($performingAdminId: ID!, $id: ID!, $input: UpdateMovieInput!) {
    updateMovie(performingAdminId: $performingAdminId, id: $id, input: $input) {
      ...MovieDetailFields
    }
  }
`;

/**
 * Deletes a movie
 */
export const DELETE_MOVIE = gql`
  mutation DeleteMovie($performingAdminId: ID!, $id: ID!) {
    deleteMovie(performingAdminId: $performingAdminId, id: $id)
  }
`;

/**
 * Adds a genre to a movie
 */
export const ADD_GENRE_TO_MOVIE = gql`
  ${MOVIE_CORE_FIELDS}
  mutation AddGenreToMovie($performingAdminId: ID!, $movieId: ID!, $genreId: ID!) {
    addGenreToMovie(performingAdminId: $performingAdminId, movieId: $movieId, genreId: $genreId) {
      ...MovieCoreFields
    }
  }
`;

/**
 * Removes a genre from a movie
 */
export const REMOVE_GENRE_FROM_MOVIE = gql`
  ${MOVIE_CORE_FIELDS}
  mutation RemoveGenreFromMovie($performingAdminId: ID!, $movieId: ID!, $genreId: ID!) {
    removeGenreFromMovie(performingAdminId: $performingAdminId, movieId: $movieId, genreId: $genreId) {
      ...MovieCoreFields
    }
  }
`;

/**
 * Removes a cast member (actor) from a movie
 */
export const REMOVE_CAST_MEMBER = gql`
  mutation RemoveCastMember($performingAdminId: ID!, $movieId: ID!, $personId: ID!) {
    removeCastMemberFromMovie(performingAdminId: $performingAdminId, movieId: $movieId, personId: $personId)
  }
`;

/**
 * Removes a crew member (director) from a movie
 */
export const REMOVE_CREW_MEMBER = gql`
  mutation RemoveCrewMember($performingAdminId: ID!, $movieId: ID!, $personId: ID!) {
    removeCrewMemberFromMovie(performingAdminId: $performingAdminId, movieId: $movieId, personId: $personId)
  }
`;

/** Add a cast member to a movie */
export const ADD_CAST_MEMBER = gql`
  mutation AddCastMember($performingAdminId: ID!, $movieId: ID!, $personId: ID!, $characterName: String, $castOrder: Int) {
    addCastMemberToMovie(
      performingAdminId: $performingAdminId, 
      movieId: $movieId, 
      personId: $personId, 
      characterName: $characterName, 
      castOrder: $castOrder
    ) {
      id
      person {
        id
        name
      }
      character_name
      cast_order
    }
  }
`;

/** Add a crew member to a movie */
export const ADD_CREW_MEMBER = gql`
  mutation AddCrewMember($performingAdminId: ID!, $movieId: ID!, $personId: ID!, $job: String!, $department: String!) {
    addCrewMemberToMovie(
      performingAdminId: $performingAdminId, 
      movieId: $movieId, 
      personId: $personId, 
      job: $job, 
      department: $department
    ) {
      id
      person {
        id
        name
      }
      job
      department
    }
  }
`;