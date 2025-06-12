// src/graphql/fragments/movie.fragments.ts
import { gql } from '@apollo/client';

/**
 * Core movie fields, suitable for list views.
 * Includes basic genre info for display.
 */
export const MOVIE_CORE_FIELDS = gql`
  fragment MovieCoreFields on Movie {
    id
    title
    slug
    poster_url
    release_date
    movieq_rating
    duration_minutes
    genres {
      id
      name
      is_collection
    }
  }
`;

/** Detailed movie fields, suitable for detail views or forms. */
export const MOVIE_DETAIL_FIELDS = gql`
  fragment MovieDetailFields on Movie {
    id
    title
    slug
    plot_summary
    release_date
    duration_minutes
    poster_url
    trailer_url
    movieq_rating
    imdb_rating
    letterboxd_rating
    updated_at
    genres {
      id
      name
      is_collection
    }
    cast(limit: 10) {
      id
      character_name
      cast_order
      person {
        id
        name
      }
    }
    crew(limit: 10) {
      id
      job
      department
      person {
        id
        name
      }
    }
  }
`;

/**
 * Fields for movie images
 */
export const MOVIE_IMAGES_FIELDS = gql`
  fragment MovieImagesFields on MovieImages {
    backdrops {
      file_path
      aspect_ratio
      height
      width
    }
    posters {
      file_path
      aspect_ratio
      height
      width
    }
  }
`;