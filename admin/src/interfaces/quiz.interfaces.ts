// src/interfaces/quiz.interfaces.ts
// Ensure ApiUser is defined or import it if needed from user.interfaces.ts
// import type { ApiUser } from './user.interfaces';

/** Represents a Choice for a Quiz Question from the API. */
export interface ApiQuizChoice {
    __typename?: 'QuizChoice'; // Optional, from Apollo
    id: string;
    question_id: string; // Often present but maybe not needed directly in frontend if nested
    choice_text: string;
    image_url?: string | null;
    created_at: string; // Or DateTime scalar type
}

/** Represents a Quiz Question from the API, including its choices. */
export interface ApiQuizQuestion {
    __typename?: 'QuizQuestion'; // Optional, from Apollo
    id: string;
    question_text: string;
    allowed_choices_count: number;
    created_at: string; // Or DateTime scalar type
    choices: ApiQuizChoice[]; // Nested choices fetched via fragment
    // user_answers might be fetched separately if needed
}

// --- Input Types for Mutations ---

/** Input for creating/updating a single choice within a question input */
export interface ApiQuizChoiceInput {
    choice_text: string;
    image_url?: string | null;
    // id?: string; // Potentially needed for UPDATE mutation if choices can be updated individually
}

/** Input for creating a new quiz question */
export interface ApiCreateQuizQuestionInput {
    question_text: string;
    allowed_choices_count?: number | null; // Optional in backend, defaults to 1
    choices: ApiQuizChoiceInput[];
}

/** Input for updating a quiz question (ASSUMED - adjust based on backend implementation) */
export interface ApiUpdateQuizQuestionInput extends Partial<ApiCreateQuizQuestionInput> {
    // Might allow partial updates, structure depends on backend
    // Could also require all fields like CreateQuizQuestionInput
}


// User answer interface might not be needed for admin page
// export interface ApiUserQuizAnswer { ... }