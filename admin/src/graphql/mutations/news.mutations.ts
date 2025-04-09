// src/graphql/mutations/news.mutations.ts
import { gql } from '@apollo/client';
import { NEWS_FIELDS } from '../fragments';

/** Creates a new news article. */
export const CREATE_NEWS = gql`
  ${NEWS_FIELDS}
  mutation CreateNews($input: NewsInput!) {
    # Assumes mutation name 'createNews' and input type 'NewsInput!'
    createNews(input: $input) {
        ...NewsFields
    }
  }
`;

/** Updates an existing news article. */
export const UPDATE_NEWS = gql`
  ${NEWS_FIELDS}
  mutation UpdateNews($id: ID!, $input: NewsUpdateInput!) {
     # Assumes mutation name 'updateNews' and input type 'NewsUpdateInput!'
    updateNews(id: $id, input: $input) {
        ...NewsFields
    }
  }
`;

/** Deletes a news article by ID. */
export const DELETE_NEWS = gql`
  mutation DeleteNews($id: ID!) {
    # Assumes mutation name 'deleteNews' and returns Boolean! directly
    deleteNews(id: $id)
  }
`;