// src/graphql/mutations/user.mutations.ts
import { gql } from '@apollo/client';
import { USER_FIELDS } from '@graphql/fragments';

// Create this fragment if you don't have it
export const AUTH_PAYLOAD_FIELDS = gql`
  ${USER_FIELDS}
  fragment AuthPayloadFields on AuthPayload {
    token
    user {
      ...UserFields
    }
  }
`;

/** Register a new user. Returns token and user object. */
export const REGISTER_USER = gql`
  ${AUTH_PAYLOAD_FIELDS}
  mutation RegisterUser($input: UserInput!) {
    registerUser(input: $input) {
      ...AuthPayloadFields
    }
  }
`;

/** Login a user. Returns token and user object. */
export const LOGIN_USER = gql`
  ${AUTH_PAYLOAD_FIELDS}
  mutation LoginUser($input: LoginInput!) {
    loginUser(input: $input) {
      ...AuthPayloadFields
    }
  }
`;

/** Update the currently logged-in user's profile. */
export const UPDATE_LOGGED_IN_USER = gql`
  ${USER_FIELDS}
  mutation UpdateLoggedInUser($input: UserUpdateInput!) {
    updateUser(input: $input) { # This is for self-update in user.js
      ...UserFields
    }
  }
`;

/** Allows an admin to update another user's profile details. */
export const ADMIN_UPDATE_USER = gql`
  ${USER_FIELDS}
  mutation AdminUpdateUser($id: ID!, $input: AdminUserUpdateInput!) { # Use the correct input type
    adminUpdateUser(id: $id, input: $input) {
      ...UserFields
    }
  }
`;

/** Allows a SUPER_ADMIN to delete a user. */
export const ADMIN_DELETE_USER = gql`
  mutation AdminDeleteUser($id: ID!) {
    adminDeleteUser(id: $id) # Returns Boolean!
  }
`;

// --- Mutations missing in user.js for Admin management ---
// These would typically be needed for an admin panel:

// Placeholder - Requires backend implementation
// export const ADMIN_UPDATE_USER = gql`
//   ${USER_FIELDS}
//   mutation AdminUpdateUser($id: ID!, $input: UserUpdateInput!) {
//     adminUpdateUser(id: $id, input: $input) {
//       ...UserFields
//     }
//   }
// `;

// Placeholder - Requires backend implementation
// export const ADMIN_DELETE_USER = gql`
//   mutation AdminDeleteUser($id: ID!) {
//     adminDeleteUser(id: $id) # Returns boolean
//   }
// `;


// --- Other User mutations from user.js (keep if needed elsewhere) ---
/*
export const RATE_MOVIE = gql`
  # Assuming USER_RATING_FIELDS fragment exists
  mutation RateMovie($input: RatingInput!) {
    rateMovie(input: $input) {
      # ...UserRatingFields
      id
      rating
      updated_at
      movie { id title } # Example
    }
  }
`;

export const DELETE_RATING = gql`
  mutation DeleteRating($movie_id: ID!) {
    deleteRating(movie_id: $movie_id)
  }
`;

export const ADD_MOVIE_TO_LIST = gql`
 # Assuming USER_LIST_FIELDS fragment exists
  mutation AddMovieToList($movie_id: ID!, $listType: ListType!) {
    addMovieToList(movie_id: $movie_id, listType: $listType) {
      # ...UserListFields
      id
      list_type
    }
  }
`;

export const REMOVE_MOVIE_FROM_LIST = gql`
 # Assuming USER_LIST_FIELDS fragment exists
  mutation RemoveMovieFromList($movie_id: ID!, $listType: ListType!) {
    removeMovieFromList(movie_id: $movie_id, listType: $listType) {
       # ...UserListFields
       id
       list_type
    }
  }
`;
*/