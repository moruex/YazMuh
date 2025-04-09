import { gql } from '@apollo/client';
import { PERSON_FIELDS } from '../fragments';

/** Creates a new person. */
export const CREATE_PERSON = gql`
  ${PERSON_FIELDS}
  mutation CreatePerson($input: PersonInput!) {
    createPerson(input: $input) {
      ...PersonFields
    }
  }
`;

/** Updates an existing person. Uses PersonInput as per schema */
export const UPDATE_PERSON = gql`
  ${PERSON_FIELDS}
  mutation UpdatePerson($id: ID!, $input: PersonInput!) { # Changed input type name
    updatePerson(id: $id, input: $input) {
      ...PersonFields
    }
  }
`;

/** Deletes a person by ID. Returns Boolean! as per schema */
export const DELETE_PERSON = gql`
  mutation DeletePerson($id: ID!) {
    deletePerson(id: $id) # Changed return structure
  }
`;