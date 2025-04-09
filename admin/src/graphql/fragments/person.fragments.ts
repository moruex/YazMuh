import { gql } from '@apollo/client';

/** Core fields for a Person, matching backend schema. */
export const PERSON_FIELDS = gql`
  fragment PersonFields on Person {
    id
    name
    bio
    birth_date
    profile_image_url
    created_at
    # updated_at # Only include if added to backend schema/table
  }
`;