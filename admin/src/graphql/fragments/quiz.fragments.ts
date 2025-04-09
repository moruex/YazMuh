// src/graphql/fragments/quiz.fragments.ts
import { gql } from '@apollo/client';

/** Fields for a Quiz Choice. */
export const QUIZ_CHOICE_FIELDS = gql`
    fragment QuizChoiceFields on QuizChoice {
        id
        question_id # Link back to parent question
        choice_text
        image_url
        created_at
    }
`;

/** Fields for a Quiz Question, including its choices. */
export const QUIZ_QUESTION_FIELDS = gql`
    ${QUIZ_CHOICE_FIELDS} # Depends on choice fields
    fragment QuizQuestionFields on QuizQuestion {
        id
        question_text
        allowed_choices_count
        created_at
        choices { # All available choices for this question
            ...QuizChoiceFields
        }
        # user_answers are typically fetched separately based on user context
    }
`;

/** Fields for a User's submitted Quiz Answer. */
export const USER_QUIZ_ANSWER_FIELDS = gql`
    ${QUIZ_CHOICE_FIELDS} # Depends on choice fields
    fragment UserQuizAnswerFields on UserQuizAnswer {
        id
        answered_at
        user { id username } # Basic user info
        question { id question_text } # Basic question info
        choice { # The specific choice selected by the user
             ...QuizChoiceFields
        }
    }
`;