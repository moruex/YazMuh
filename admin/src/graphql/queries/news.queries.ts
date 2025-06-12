// src/graphql/queries/news.queries.ts
import { gql } from '@apollo/client';
import { NEWS_FIELDS } from '../fragments';

/** Fetches a list of news articles with pagination and filters. */
export const GET_NEWS_ARTICLES = gql`
  ${NEWS_FIELDS}
  query GetNewsArticles(
    $limit: Int = 10,
    $offset: Int = 0,
    $authorId: ID,
    $search: String,
    $sortBy: String = "published_at",
    $sortOrder: String = "DESC"
  ) {
    newsArticles(
      limit: $limit,
      offset: $offset,
      authorId: $authorId,
      search: $search,
      sortBy: $sortBy,
      sortOrder: $sortOrder
    ) {
      ...NewsFields
    }
    
    newsArticleCount(
      authorId: $authorId,
      search: $search
    )
  }
`;

/** Fetches a single news article by ID. */
export const GET_NEWS_ARTICLE = gql`
  ${NEWS_FIELDS}
  query GetNewsArticle($id: ID!) {
    newsArticle(id: $id) {
      ...NewsFields
    }
  }
`;

/** Fetches news categories. */
// export const GET_NEWS_CATEGORIES = gql`
//   query GetNewsCategories($limit: Int = 50, $offset: Int = 0) {
//     newsCategories(limit: $limit, offset: $offset) {
//       id
//       name
//       // slug
//       description
//     }
//   }
// `;