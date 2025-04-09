// src/graphql/fragments/admin.fragments.ts
import { gql } from '@apollo/client';
import { USER_FIELDS } from './user.fragments';

/** Fields for an Admin, including nested User details. */
export const ADMIN_FIELDS = gql`
  ${USER_FIELDS}
  fragment AdminFields on Admin {
    id
    username
    role
    createdAt
    updatedAt
    user {
      ...UserFields
    }
  }
`;