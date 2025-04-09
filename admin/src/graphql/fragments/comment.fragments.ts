// src/graphql/fragments/comment.fragments.ts
import { gql } from '@apollo/client';

// Fields for User and Movie when nested in Comment
// Adjust based on the actual fields available/needed in your User/Movie types
const NESTED_USER_FIELDS = gql`
    fragment NestedUserFields on User {
        id
        username
        avatar_url
    }
`;

const NESTED_MOVIE_FIELDS = gql`
    fragment NestedMovieFields on Movie {
        id
        title
    }
`;

/** Detailed fields for a Comment */
export const COMMENT_FIELDS = gql`
  ${NESTED_USER_FIELDS}
  ${NESTED_MOVIE_FIELDS}
  fragment CommentFields on Comment {
    id
    content
    parent_comment_id
    likes_count
    is_currently_censored
    created_at
    updated_at
    user {
      ...NestedUserFields
    }
    movie {
      ...NestedMovieFields
    }
    # Fetch replies without client-side limit argument
    # Add fields needed for replies display
    replies {
        id
        content
        likes_count
        is_currently_censored
        created_at
        user { ...NestedUserFields }
    }
  }
`;

/** Fields for Censorship Reasons */
export const CENSORSHIP_REASON_FIELDS = gql`
  fragment CensorshipReasonFields on CensorshipReason {
      reason_code
      description
      is_active
  }
`;