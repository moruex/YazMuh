import { gql } from '@apollo/client';
import { QUIZ_QUESTION_FIELDS } from '../fragments'; // Adjust path if needed

/** Input type for creating a choice (matches backend) */
// No separate fragment needed, defined inline in mutation input type usually

/** Input type for creating a question (matches backend) */
// No separate fragment needed, defined inline in mutation input type usually


/** Creates a new quiz question (including its choices via nested input). */
export const CREATE_QUIZ_QUESTION = gql`
  ${QUIZ_QUESTION_FIELDS}
  mutation CreateQuizQuestion($input: CreateQuizQuestionInput!) {
    createQuizQuestion(input: $input) {
        ...QuizQuestionFields
    }
  }
`;

/** Updates an existing quiz question. (ASSUMED MUTATION) */
export const UPDATE_QUIZ_QUESTION = gql`
  ${QUIZ_QUESTION_FIELDS}
  # Assume input type is UpdateQuizQuestionInput, similar to Create but might allow partial updates
  mutation UpdateQuizQuestion($id: ID!, $input: CreateQuizQuestionInput!) { # Using Create input type as placeholder
    updateQuizQuestion(id: $id, input: $input) {
      ...QuizQuestionFields
    }
  }
`;

/** Deletes a quiz question by ID. (ASSUMED MUTATION) */
export const DELETE_QUIZ_QUESTION = gql`
  mutation DeleteQuizQuestion($id: ID!) {
    # Assume mutation name 'deleteQuizQuestion' and returns Boolean or ID
    deleteQuizQuestion(id: $id)
    # Example if it returns payload: { success message }
    # deleteQuizQuestion(id: $id) { success message }
  }
`;