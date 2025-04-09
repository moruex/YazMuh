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
    poster_url
    release_date
    avg_rating
    duration_minutes
    genres { # REMOVED (limit: 3) argument here
        id
        name
        # You might want is_collection here too if relevant for lists
    }
  }
`;

/** Detailed movie fields, suitable for detail views or forms. */
export const MOVIE_DETAIL_FIELDS = gql`
  fragment MovieDetailFields on Movie {
    id
    title
    release_date
    plot_summary
    poster_url
    duration_minutes
    trailer_url
    avg_rating
    created_at
    updated_at
    genres { # No limit argument here either (matches schema)
      id
      name
      is_collection # Assuming Genre has this field
    }
    persons { # Movie-person links (roles)
      id
      role_type
      character_name
      person { # Nested person details
        id
        name
        profile_image_url
      }
    }
  }
`;