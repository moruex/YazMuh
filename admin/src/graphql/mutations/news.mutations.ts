// src/graphql/mutations/news.mutations.ts
import { gql } from '@apollo/client';
import { NEWS_FIELDS } from '../fragments';

/** Creates a new news article. */
export const CREATE_NEWS_ARTICLE = gql`
  ${NEWS_FIELDS}
  mutation CreateNewsArticle($performingAdminId: ID!, $input: CreateNewsArticleInput!) {
    createNewsArticle(performingAdminId: $performingAdminId, input: $input) {
      ...NewsFields
    }
  }
`;

/** Updates an existing news article. */
export const UPDATE_NEWS_ARTICLE = gql`
  ${NEWS_FIELDS}
  mutation UpdateNewsArticle($performingAdminId: ID!, $id: ID!, $input: UpdateNewsArticleInput!) {
    updateNewsArticle(performingAdminId: $performingAdminId, id: $id, input: $input) {
      ...NewsFields
    }
  }
`;

/** Deletes a news article by ID. */
export const DELETE_NEWS_ARTICLE = gql`
  mutation DeleteNewsArticle($performingAdminId: ID!, $id: ID!) {
    deleteNewsArticle(performingAdminId: $performingAdminId, id: $id)
  }
`;

/** Publishes a news article. */
export const PUBLISH_NEWS_ARTICLE = gql`
  ${NEWS_FIELDS}
  mutation PublishNewsArticle($performingAdminId: ID!, $id: ID!) {
    publishNewsArticle(performingAdminId: $performingAdminId, id: $id) {
      ...NewsFields
    }
  }
`;

/** Unpublishes a news article. */
export const UNPUBLISH_NEWS_ARTICLE = gql`
  ${NEWS_FIELDS}
  mutation UnpublishNewsArticle($performingAdminId: ID!, $id: ID!) {
    unpublishNewsArticle(performingAdminId: $performingAdminId, id: $id) {
      ...NewsFields
    }
  }
`;