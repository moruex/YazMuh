import { gql } from '@apollo/client';

/** Core fields for a person */
export const PERSON_CORE_FIELDS = gql`
  fragment PersonCoreFields on Person {
    id
    name
    profile_image_url
    slug
  }
`;

/** Detailed fields for a person */
export const PERSON_DETAIL_FIELDS = gql`
  fragment PersonDetailFields on Person {
    id
    name
    biography
    birthday
    profile_image_url
    slug
  }
`;