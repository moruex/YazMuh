// src/graphql/queries/news.queries.ts
import { gql } from '@apollo/client';
import { NEWS_FIELDS } from '../fragments';

/** Fetches a list of news articles with pagination, movie filter, and search. */
export const GET_NEWS_LIST = gql`
  ${NEWS_FIELDS} # Ensure this fragment includes all needed fields for the table/view
  query GetNewsList(
      $limit: Int,
      $offset: Int,
      $movieId: ID,
      $search: String # Add search variable
    ) {
    newsList(
        limit: $limit,
        offset: $offset,
        movieId: $movieId,
        search: $search # Pass search variable
    ) {
        ...NewsFields
    }
    # Fetch total count using the same filters
    newsCount(
        movieId: $movieId,
        search: $search
    ) # Returns Int!
  }
`;

/** Fetches a single news article by ID. */
export const GET_NEWS = gql`
  ${NEWS_FIELDS}
  query GetNews($id: ID!) {
    newsArticle(id: $id) { # Query name matches backend
        ...NewsFields
    }
  }
`;