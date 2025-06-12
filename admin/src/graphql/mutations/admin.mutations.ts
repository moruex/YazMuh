// src/graphql/mutations/admin.mutations.ts
import { gql } from '@apollo/client';
import { ADMIN_FIELDS } from '../fragments';

/** Allows the currently authenticated admin to update their own profile details. */
export const UPDATE_CURRENT_ADMIN_PROFILE = gql`
  ${ADMIN_FIELDS} # Return the updated admin object
  mutation UpdateCurrentAdminProfile($performingAdminId: ID!, $input: UpdateAdminSelfInput!) {
    # Now includes performingAdminId parameter
    updateAdminSelf(performingAdminId: $performingAdminId, input: $input) {
      ...AdminFields
    }
  }
`;

/** Creates a new Admin user (requires appropriate permissions). */
export const CREATE_ADMIN = gql`
    ${ADMIN_FIELDS}
    mutation CreateAdmin($performingAdminId: ID!, $input: CreateAdminInput!) {
        # Now includes performingAdminId parameter
        createAdmin(performingAdminId: $performingAdminId, input: $input) {
            ...AdminFields
        }
    }
`;

/** Updates an existing Admin user by ID (requires appropriate permissions). */
export const UPDATE_ADMIN = gql`
    ${ADMIN_FIELDS}
    mutation UpdateAdmin($performingAdminId: ID!, $id: ID!, $input: UpdateAdminInput!) {
         # Now includes performingAdminId parameter
        updateAdmin(performingAdminId: $performingAdminId, id: $id, input: $input) {
            ...AdminFields
        }
    }
`;

/** Deletes an Admin user by ID (requires appropriate permissions). */
export const DELETE_ADMIN = gql`
    mutation DeleteAdmin($performingAdminId: ID!, $id: ID!) {
        # Now includes performingAdminId parameter
        deleteAdmin(performingAdminId: $performingAdminId, id: $id)
    }
`;