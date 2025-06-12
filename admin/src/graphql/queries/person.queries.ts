import { gql } from '@apollo/client';
import { PERSON_CORE_FIELDS, PERSON_DETAIL_FIELDS } from '../fragments/person.fragments';

/**
 * Fetches persons for use in dropdowns with optional filtering
 */
export const GET_PERSONS = gql`
  ${PERSON_DETAIL_FIELDS}
  query GetPersons($search: String, $limit: Int = 20, $offset: Int = 0, $sortBy: String, $sortOrder: String) {
    people(search: $search, limit: $limit, offset: $offset, sortBy: $sortBy, sortOrder: $sortOrder) {
      ...PersonDetailFields
    }
    peopleCount(search: $search)
  }
`;

/**
 * Fetches a single person by ID
 */
export const GET_PERSON = gql`
  ${PERSON_DETAIL_FIELDS}
  query GetPerson($id: ID!) {
    person(id: $id) {
      ...PersonDetailFields
      actor_roles(limit: 10) {
        movie {
          id
          title
          release_date
          poster_url
        }
        character_name
      }
      director_roles(limit: 10) {
        movie {
          id
          title
          release_date
          poster_url
        }
        job
        department
      }
    }
  }
`;

/**
 * Fetches actors that can be added to a movie
 */
export const GET_ACTORS = gql`
  ${PERSON_CORE_FIELDS}
  query GetActors($search: String, $limit: Int = 20) {
    people(search: $search, limit: $limit) {
      ...PersonCoreFields
    }
  }
`;

/**
 * Fetches directors that can be added to a movie
 */
export const GET_DIRECTORS = gql`
  ${PERSON_CORE_FIELDS}
  query GetDirectors($search: String, $limit: Int = 20) {
    people(search: $search, limit: $limit) {
      ...PersonCoreFields
    }
  }
`;