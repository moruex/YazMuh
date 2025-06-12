// src/graphql/queries/admin.queries.ts
import { gql } from '@apollo/client';
import { ADMIN_FIELDS } from '../fragments';

/** Fetches the currently authenticated admin user. */
export const GET_CURRENT_ADMIN = gql`
    ${ADMIN_FIELDS}
    query GetCurrentAdmin($id: ID!) {
        admin(id: $id) {
            ...AdminFields
        }
    }
`;

/** Fetches a list of admins with pagination. */
export const GET_ADMINS = gql`
    ${ADMIN_FIELDS}
    query GetAdmins($limit: Int = 10, $offset: Int = 0, $search: String) {
        admins(limit: $limit, offset: $offset, search: $search) {
            ...AdminFields
        }
    }
`;

/** Fetches the total count of admin users. */
export const GET_ADMIN_COUNT = gql`
    query GetAdminCount {
        adminCount
    }
`;

/** Fetches a single admin by ID. */
export const GET_ADMIN = gql`
  ${ADMIN_FIELDS}
  query GetAdmin($id: ID!) {
    admin(id: $id) {
       ...AdminFields
    }
  }
`;