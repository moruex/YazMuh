// src/graphql/queries/recommendation.queries.ts
import { gql } from '@apollo/client';
import { RECOMMENDATION_SECTION_FIELDS } from '@graphql/fragments';

/**
 * Get all recommendation sections
 */
export const GET_RECOMMENDATION_SECTIONS = gql`
  ${RECOMMENDATION_SECTION_FIELDS}
  query GetRecommendationSections($onlyActive: Boolean = true) {
    recommendations: recommendationSections(onlyActive: $onlyActive) {
       ...RecommendationSectionFields
    }
  }
`;

/**
 * Get a single recommendation section by ID
 */
export const GET_RECOMMENDATION_SECTION = gql`
  ${RECOMMENDATION_SECTION_FIELDS}
  query GetRecommendationSection($id: ID!) {
    recommendationSection(id: $id) {
       ...RecommendationSectionFields
    }
  }
`;