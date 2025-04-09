
// src/graphql/queries/recommendation.queries.ts
import { gql } from '@apollo/client';
import { RECOMMENDATION_SECTION_FIELDS } from '@graphql/fragments';

export const GET_RECOMMENDATION_SECTIONS = gql`
  ${RECOMMENDATION_SECTION_FIELDS}
  query GetRecommendationSections($onlyActive: Boolean = true) {
    recommendations: recommendationSections(onlyActive: $onlyActive) {
       ...RecommendationSectionFields
    }
  }
`;