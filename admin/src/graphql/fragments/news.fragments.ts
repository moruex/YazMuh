// src/graphql/fragments/news.fragments.ts
import { gql } from '@apollo/client';

/** Detailed fields for a News article, including author. */
export const NEWS_FIELDS = gql`
  fragment NewsFields on NewsArticle {
    id
    title
    # slug # Removed slug
    content
    excerpt # Mapped from short_content in resolver
    featured_image_url # Mapped from image_url in resolver
    # status # Removed status
    published_at
    # created_at # Removed created_at
    updated_at
    # view_count # Removed view_count
    # tags # Removed tags
    author {
      id
      username
    }
    # category { # Removed category block
    #   id
    #   name
    # }
  }
`;