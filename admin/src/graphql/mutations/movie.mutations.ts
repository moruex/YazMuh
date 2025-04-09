// src/graphql/mutations/movie.mutations.ts
import { gql } from '@apollo/client';
import { MOVIE_DETAIL_FIELDS } from '../fragments';

/** Creates a new movie. Assumes input type handles relationships as needed. */
export const CREATE_MOVIE = gql`
  ${MOVIE_DETAIL_FIELDS}
  mutation CreateMovie($input: MovieInput!) {
    # Assumes mutation name 'createMovie' and input type 'MovieInput!'
    createMovie(input: $input) {
      ...MovieDetailFields
    }
  }
`;

/** Updates an existing movie. Verify 'MovieUpdateInput!' schema for relationship handling. */
export const UPDATE_MOVIE = gql`
  ${MOVIE_DETAIL_FIELDS}
  mutation UpdateMovie($id: ID!, $input: MovieUpdateInput!) {
    # Assumes mutation name 'updateMovie' and input type 'MovieUpdateInput!'
    # Relationship updates (genres, persons) depend heavily on the schema definition of MovieUpdateInput!
    updateMovie(id: $id, input: $input) {
      ...MovieDetailFields
    }
  }
`;

/** Deletes a movie by ID. */
export const DELETE_MOVIE = gql`
  mutation DeleteMovie($id: ID!) {
    # Assumes mutation name 'deleteMovie' and it returns Boolean! directly
    deleteMovie(id: $id)
  }
`;