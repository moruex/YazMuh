import { gql } from '@apollo/client';
import { PERSON_DETAIL_FIELDS } from '../fragments/person.fragments';

/** Creates a new person. */
export const CREATE_PERSON = gql`
  ${PERSON_DETAIL_FIELDS}
  mutation CreatePerson($performingAdminId: ID!, $input: CreatePersonInput!) {
    createPerson(performingAdminId: $performingAdminId, input: $input) {
      ...PersonDetailFields
    }
  }
`;

/** Updates an existing person. */
export const UPDATE_PERSON = gql`
  ${PERSON_DETAIL_FIELDS}
  mutation UpdatePerson($performingAdminId: ID!, $id: ID!, $input: UpdatePersonInput!) {
    updatePerson(performingAdminId: $performingAdminId, id: $id, input: $input) {
      ...PersonDetailFields
    }
  }
`;

/** Deletes a person by ID. */
export const DELETE_PERSON = gql`
  mutation DeletePerson($performingAdminId: ID!, $id: ID!) {
    deletePerson(performingAdminId: $performingAdminId, id: $id)
  }
`;