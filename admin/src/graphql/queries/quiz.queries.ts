import { gql } from '@apollo/client';
import { QUIZ_QUESTION_FIELDS } from '../fragments'; // Adjust path if needed

/** Fetches a list of quiz questions with optional pagination. */
export const GET_QUIZ_QUESTIONS = gql`
  ${QUIZ_QUESTION_FIELDS}
  query GetQuizQuestions($limit: Int = 10, $offset: Int = 0) {
    quizQuestions(limit: $limit, offset: $offset) {
      # Fetch all fields defined in the fragment
      ...QuizQuestionFields
    }
    # Add count query if backend supports it and pagination is needed
    # quizQuestionCount
  }
`;

// Add GET_QUIZ_QUESTION_COUNT if backend supports it
// export const GET_QUIZ_QUESTION_COUNT = gql`...`;

// Keep GET_QUIZ_QUESTION if needed for a detail view later
// export const GET_QUIZ_QUESTION = gql`...`;

// --- END OF FILE quiz.queries.ts ---