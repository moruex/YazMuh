// src/graphql/fragments/user.fragments.ts
import { gql } from '@apollo/client';

/** Basic fields for a User. */
export const USER_FIELDS = gql`
  fragment UserFields on User {
    id
    first_name
    last_name
    username
    email
    avatar_url
    bio
    created_at
    updated_at
  }
`;