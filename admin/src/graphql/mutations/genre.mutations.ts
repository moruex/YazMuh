// src/graphql/mutations/genre.mutations.ts
import { gql } from '@apollo/client';
import { GENRE_FIELDS } from '../fragments';

/** Creates a new genre. */
export const CREATE_GENRE = gql`
  ${GENRE_FIELDS}
  mutation CreateGenre($input: GenreInput!) {
    # Assumes mutation name 'createGenre' and input type 'GenreInput!'
    createGenre(input: $input) {
      ...GenreFields
    }
  }
`;

/** Updates an existing genre. */
export const UPDATE_GENRE = gql`
  ${GENRE_FIELDS}
  mutation UpdateGenre($id: ID!, $input: GenreUpdateInput!) {
    # Assumes mutation name 'updateGenre' and input type 'GenreUpdateInput!' (or GenreInput!)
    updateGenre(id: $id, input: $input) {
      ...GenreFields
    }
  }
`;

/** Deletes a genre by ID. */
export const DELETE_GENRE = gql`
  mutation DeleteGenre($id: ID!) {
    # Assumes mutation name 'deleteGenre' and returns a payload { success, message }
    deleteGenre(id: $id) {
        success
        message
    }
  }
`;