// src/graphql/fragments/news.fragments.ts
import { gql } from '@apollo/client';

/** Detailed fields for a News article, including author and basic associated movie info. */
export const NEWS_FIELDS = gql`
  fragment NewsFields on News {
    id
    title
    short_content
    content
    image_url
    published_at
    created_at
    updated_at
    author { # Basic author info
      id
      username
    }
    movies { # Basic associated movie info
      id
      title
      # ...MovieCoreFields # Optional: Expand movie details here
    }
  }
`;