// src/graphql/mutations/admin.mutations.ts
import { gql } from '@apollo/client';
import { ADMIN_FIELDS } from '../fragments';

/** Allows the currently authenticated admin to update their own profile details. */
export const UPDATE_CURRENT_ADMIN_PROFILE = gql`
  ${ADMIN_FIELDS} # Return the updated admin object
  mutation UpdateCurrentAdminProfile($input: UpdateAdminSelfInput!) {
    # Assumes mutation name 'updateAdminSelf' and input type 'UpdateAdminSelfInput!'
    updateAdminSelf(input: $input) {
      ...AdminFields
    }
  }
`;

/** Creates a new Admin user (requires appropriate permissions). */
export const CREATE_ADMIN = gql`
    ${ADMIN_FIELDS}
    mutation CreateAdmin($input: CreateAdminInput!) {
        # Assumes mutation name 'createAdmin' and input type 'CreateAdminInput!'
        createAdmin(input: $input) {
            ...AdminFields
        }
    }
`;

/** Updates an existing Admin user by ID (requires appropriate permissions). */
export const UPDATE_ADMIN = gql`
    ${ADMIN_FIELDS}
    mutation UpdateAdmin($id: ID!, $input: UpdateAdminInput!) {
         # Assumes mutation name 'updateAdmin' and input type 'UpdateAdminInput!'
        updateAdmin(id: $id, input: $input) {
            ...AdminFields
        }
    }
`;

/** Deletes an Admin user by ID (requires appropriate permissions). */
export const DELETE_ADMIN = gql`
    mutation DeleteAdmin($id: ID!) {
        # Assumes mutation name 'deleteAdmin' and returns Boolean!
        deleteAdmin(id: $id)
    }
`;