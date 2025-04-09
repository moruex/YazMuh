// src/graphql/queries/comment.queries.ts
import { gql } from '@apollo/client';
import { COMMENT_FIELDS, CENSORSHIP_REASON_FIELDS } from '../fragments'; // Adjust path

/** Fetches comments with filtering and pagination */
export const GET_COMMENTS = gql`
  ${COMMENT_FIELDS}
  query GetComments(
      $movieId: ID,
      $limit: Int = 10,
      $offset: Int = 0,
      $includeCensored: Boolean = false,
      $search: String
    ) {
    comments(
        movie_id: $movieId,
        limit: $limit,
        offset: $offset,
        include_censored: $includeCensored,
        search: $search
    ) {
      ...CommentFields
    }
    # Add count query if implemented in backend, e.g.:
    # commentCount(movie_id: $movieId, include_censored: $includeCensored, search: $search)
  }
`;

/** Fetches the available censorship reasons */
export const GET_CENSORSHIP_REASONS = gql`
  ${CENSORSHIP_REASON_FIELDS}
  query GetCensorshipReasons($activeOnly: Boolean = true) {
      censorshipReasons(activeOnly: $activeOnly) {
          ...CensorshipReasonFields
      }
  }
`;

// Optional: Query for a single comment if needed elsewhere
export const GET_COMMENT = gql`
  ${COMMENT_FIELDS}
  query GetComment($id: ID!) {
      comment(id: $id) {
          ...CommentFields
          # Fetch full replies if needed for detail view
          # replies { ...CommentFields }
      }
  }
`;