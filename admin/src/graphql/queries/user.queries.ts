// src/graphql/queries/user.queries.ts
import { gql } from '@apollo/client';
import { USER_FIELDS } from '../fragments';
// import { COMMENT_FIELDS } from '../fragments'; // Import if fetching user comments

/** Fetches a list of users with optional pagination and search. */
export const GET_USERS = gql`
  ${USER_FIELDS}
  query GetUsers($limit: Int = 10, $offset: Int = 0, $search: String) {
    users(limit: $limit, offset: $offset, search: $search) {
      ...UserFields
    }
     # userCount(search: $search) # Add if schema supports count
  }
`;

/** Fetches a single user by ID, optionally including related data like comments. */
export const GET_USER = gql`
  ${USER_FIELDS}
  query GetUser($id: ID!) {
    user(id: $id) {
       ...UserFields
        # Optionally include related data for admin view:
        # comments(limit: 10) { ...CommentFields }
        # lists(limit: 5) { id list_type movieCount } # Example
    }
  }
`;

/** Fetches the total count of admin users. */
export const GET_USER_COUNT = gql`
    query GetUserCount {
        userCount
    }
`;
