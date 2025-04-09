// src/graphql/fragments/genre.fragments.ts
import { gql } from '@apollo/client';

/** Detailed fields for a Genre. */
export const GENRE_FIELDS = gql`
  fragment GenreFields on Genre {
    id
    name
    description
    image_url
    is_collection
  }
`;