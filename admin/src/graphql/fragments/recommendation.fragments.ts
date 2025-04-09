// src/graphql/fragments/recommendation.fragments.ts
import { gql } from '@apollo/client';
import { MOVIE_CORE_FIELDS } from './movie.fragments'; // Re-use movie fragment

export const RECOMMENDATION_SECTION_FIELDS = gql`
  ${MOVIE_CORE_FIELDS}
  fragment RecommendationSectionFields on RecommendationSection {
    id
    title
    section_type
    description
    display_order
    is_active
    created_at
    updated_at
    movies(limit: 50, offset: 0) { # Fetch a decent number initially, adjust as needed
       ...MovieCoreFields
       # If MovieCoreFields doesn't have enough detail for display, add fields here
       # e.g., plot_summary (shortened)
    }
    movieCount # Total movies in this section
  }
`;
