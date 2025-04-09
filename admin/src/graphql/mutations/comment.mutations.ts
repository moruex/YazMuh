// src/graphql/mutations/comment.mutations.ts
import { gql } from '@apollo/client';
import { COMMENT_FIELDS } from '../fragments'; // Import fragment

/** Deletes a comment by ID (Requires Ownership or Admin Role) */
export const DELETE_COMMENT = gql`
  mutation DeleteComment($id: ID!) {
    deleteComment(id: $id) # Returns Boolean!
  }
`;

/** Censors a comment (Admin Role Required) */
export const CENSOR_COMMENT = gql`
  ${COMMENT_FIELDS} # Return the updated comment
  mutation CensorComment($id: ID!, $input: CensorCommentInput!) {
    censorComment(id: $id, input: $input) {
      ...CommentFields
    }
  }
`;

/** Uncensors a comment (Admin Role Required) */
export const UNCENSOR_COMMENT = gql`
  ${COMMENT_FIELDS} # Return the updated comment
  mutation UncensorComment($id: ID!) {
    uncensorComment(id: $id) {
      ...CommentFields
    }
  }
`;

// Keep other mutations like CREATE, UPDATE, LIKE, UNLIKE if needed
// Example UPDATE_COMMENT
export const UPDATE_COMMENT = gql`
   ${COMMENT_FIELDS}
    mutation UpdateComment($id: ID!, $input: CommentUpdateInput!) {
        updateComment(id: $id, input: $input) {
            ...CommentFields
        }
    }
`;

/** Adds a comment as the acting admin (Admin Role Required) */
export const ADMIN_ADD_COMMENT = gql`
    ${COMMENT_FIELDS}
    mutation AdminAddComment($input: AdminAddCommentInput!) {
        adminAddComment(input: $input) {
            ...CommentFields
        }
    }
`;