// src/graphql/queries/recommendation.queries.ts
import { gql } from '@apollo/client';
import { RECOMMENDATION_SECTION_FIELDS } from '@graphql/fragments';

/**
 * Add a movie to a recommendation section
 */
export const ADD_MOVIE_TO_SECTION = gql`
  ${RECOMMENDATION_SECTION_FIELDS}
  mutation AddMovieToSection($performingAdminId: ID!, $sectionId: ID!, $movieId: ID!, $displayOrder: Int) {
     addMovieToSection(performingAdminId: $performingAdminId, sectionId: $sectionId, movieId: $movieId, displayOrder: $displayOrder) {
        ...RecommendationSectionFields
     }
  }
`;

/**
 * Remove a movie from a recommendation section
 */
export const REMOVE_MOVIE_FROM_SECTION = gql`
   ${RECOMMENDATION_SECTION_FIELDS}
   mutation RemoveMovieFromSection($performingAdminId: ID!, $sectionId: ID!, $movieId: ID!) {
      removeMovieFromSection(performingAdminId: $performingAdminId, sectionId: $sectionId, movieId: $movieId) {
          ...RecommendationSectionFields
      }
   }
`;

/**
 * Create a new recommendation section
 */
export const CREATE_RECOMMENDATION_SECTION = gql`
  mutation CreateRecommendationSection($input: RecommendationSectionInput!) {
    createRecommendationSection(input: $input) {
      id
      title
      section_type
      description
      display_order
      is_active
    }
  }
`;

/**
 * Update an existing recommendation section
 */
export const UPDATE_RECOMMENDATION_SECTION = gql`
  mutation UpdateRecommendationSection($id: ID!, $input: RecommendationSectionUpdateInput!) {
    updateRecommendationSection(id: $id, input: $input) {
      id
      title
      section_type
      description
      display_order
      is_active
    }
  }
`;

/**
 * Delete a recommendation section
 */
export const DELETE_RECOMMENDATION_SECTION = gql`
  mutation DeleteRecommendationSection($id: ID!) {
    deleteRecommendationSection(id: $id) {
        success
        message
    }
  }
`;

export const ADD_MOVIE_TO_RECOMMENDATION_SECTION = gql`
  mutation AddMovieToRecommendationSection($sectionId: ID!, $movieId: ID!) {
    addMovieToRecommendationSection(section_id: $sectionId, movie_id: $movieId) {
      id
      section_id
      movie_id
      display_order
      added_at
    }
  }
`;

export const REMOVE_MOVIE_FROM_RECOMMENDATION_SECTION = gql`
  mutation RemoveMovieFromRecommendationSection($sectionId: ID!, $movieId: ID!) {
    removeMovieFromRecommendationSection(section_id: $sectionId, movie_id: $movieId) {
      success
      message
    }
  }
`;

export const UPDATE_MOVIE_ORDER_IN_RECOMMENDATION_SECTION = gql`
  mutation UpdateMovieOrderInRecommendationSection(
    $sectionId: ID!,
    $movieIds: [ID!]! # Ordered list of movie IDs representing the new order
  ) {
    updateMovieOrderInRecommendationSection(
      section_id: $sectionId,
      movie_ids: $movieIds
    ) {
      success
      message
      # Optionally return the updated section with movies
      # section { ...RecommendationSectionFields }
    }
  }
`;