// src/graphql/mutations/genre.mutations.ts
import { gql } from '@apollo/client';
import { GENRE_FIELDS } from '../fragments';

/** Creates a new genre. */
export const CREATE_GENRE = gql`
  ${GENRE_FIELDS}
  mutation CreateGenre($performingAdminId: ID!, $input: CreateGenreInput!) {
    createGenre(performingAdminId: $performingAdminId, input: $input) {
      ...GenreFields
    }
  }
`;

/** Updates an existing genre. */
export const UPDATE_GENRE = gql`
  ${GENRE_FIELDS}
  mutation UpdateGenre($performingAdminId: ID!, $id: ID!, $input: UpdateGenreInput!) {
    updateGenre(performingAdminId: $performingAdminId, id: $id, input: $input) {
      ...GenreFields
    }
  }
`;

/** Deletes a genre by ID. */
export const DELETE_GENRE = gql`
  mutation DeleteGenre($performingAdminId: ID!, $id: ID!) {
    deleteGenre(performingAdminId: $performingAdminId, id: $id) # Returns Boolean!
  }
`;