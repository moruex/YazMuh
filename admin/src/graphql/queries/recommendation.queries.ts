
// src/graphql/mutations/recommendation.mutations.ts
import { gql } from '@apollo/client';
import { RECOMMENDATION_SECTION_FIELDS } from '@graphql/fragments';


// Add Movie to Section
export const ADD_MOVIE_TO_SECTION = gql`
  ${RECOMMENDATION_SECTION_FIELDS}
  mutation AddMovieToSection($sectionId: ID!, $movieId: ID!, $displayOrder: Int) {
     addMovieToSection(sectionId: $sectionId, movieId: $movieId, displayOrder: $displayOrder) {
        ...RecommendationSectionFields # Return updated section
     }
  }
`;

// Remove Movie from Section
export const REMOVE_MOVIE_FROM_SECTION = gql`
   ${RECOMMENDATION_SECTION_FIELDS}
   mutation RemoveMovieFromSection($sectionId: ID!, $movieId: ID!) {
      removeMovieFromSection(sectionId: $sectionId, movieId: $movieId) {
          ...RecommendationSectionFields # Return updated section
      }
   }
`;