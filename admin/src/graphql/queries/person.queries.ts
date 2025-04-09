import { gql } from '@apollo/client';
import { MOVIE_CORE_FIELDS, PERSON_FIELDS } from '../fragments'; // Assuming fragments are in correct relative path

/** Fetches a list of persons with pagination and search. */
export const GET_PERSONS = gql`
 ${PERSON_FIELDS}
 query GetPersons($limit: Int, $offset: Int, $search: String) {
    persons(limit: $limit, offset: $offset, search: $search) {
        ...PersonFields
    }
 }
`;

/** Fetches the total count of persons for pagination. */
export const GET_PERSON_COUNT = gql`
 query GetPersonCount($search: String) {
    personCount(search: $search)
 }
`;


/** Fetches a single person by ID, including their movie roles (if needed elsewhere). */
// Keep GET_PERSON if you need detailed view later, otherwise it's not used by ActorsPage
// import { MOVIE_CORE_FIELDS } from '../fragments'; // Add if GET_PERSON is used and needs movie details
export const GET_PERSON = gql`
  ${PERSON_FIELDS}
  # ${MOVIE_CORE_FIELDS} # Uncomment if needed
  query GetPerson($id: ID!) {
    person(id: $id) {
      ...PersonFields
      # movie_roles { # Example: Fetch roles if needed on a detail page
      #   id
      #   role_type
      #   character_name
      #   movie {
      #       ...MovieCoreFields
      #   }
      # }
    }
  }
`;