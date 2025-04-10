// src/schema/quiz.js
// const { gql, AuthenticationError, ForbiddenError, UserInputError } = require('apollo-server-express');
const { gql } = require('@apollo/server');
const { GraphQLError } = require('graphql');
// Remove admin helper if not used directly, assume admin check is done via context if needed
// const { _ensureAdminRole } = require('./admin');

// Helpers
const _ensureAdmin = (adminUser) => {
  if (!adminUser) throw new GraphQLError('Admin authentication required.', { extensions: { code: 'UNAUTHENTICATED' } });
};

const _ensureLoggedIn = (user) => { // Use user from context
    if (!user) throw new GraphQLError('You must be logged in.', { extensions: { code: 'UNAUTHENTICATED' } });
};

// Type Definitions (Simplified Quiz Structure)
const typeDefs = gql`
  scalar DateTime

  # Represents a single choice/option for a question
  type QuizChoice {
    id: ID!
    question_id: ID!
    choice_text: String!
    image_url: String
    created_at: DateTime!
  }

  # Represents a question for user preference analysis
  type QuizQuestion {
    id: ID!
    question_text: String!
    allowed_choices_count: Int! # How many choices user can select (>= 1)
    created_at: DateTime!
    # --- Relationships ---
    choices: [QuizChoice!]!
    user_answers: [UserQuizAnswer!]
  }

  # Represents a user's selection for a question choice
  type UserQuizAnswer {
    id: ID!
    user: User!
    question: QuizQuestion!
    choice: QuizChoice!
    answered_at: DateTime!
    # is_correct field removed
  }

  # Input for creating/updating a single choice
  input QuizChoiceInput {
    choice_text: String!
    image_url: String
    # No temp_id needed if not linking correct answers
    # id: ID # Optional: for updates (implement update mutation separately if needed)
  }

  # Input for creating a new preference quiz question
  input CreateQuizQuestionInput {
    question_text: String!
    allowed_choices_count: Int = 1 # Default to single choice
    choices: [QuizChoiceInput!]!    # Must provide choices
    # correct_choice_temp_ids removed
  }

   # Input for submitting user answers (preferences) to a question
  input SubmitUserAnswersInput {
    question_id: ID!
    choice_ids: [ID!]! # Array of choice IDs selected by the user
  }

  extend type Query {
    quizQuestions(limit: Int = 10, offset: Int = 0): [QuizQuestion!]!
    quizQuestion(id: ID!): QuizQuestion
    myQuizAnswers(questionId: ID): [UserQuizAnswer!]! # Get logged-in user's answers
    # Consider adding userQuizAnswers(userId: ID!, questionId: ID): [UserQuizAnswer!]! for admin use
  }

  extend type Mutation {
    # Requires admin auth
    createQuizQuestion(input: CreateQuizQuestionInput!): QuizQuestion!
    # UpdateQuizQuestion omitted for brevity

    # Requires logged-in user
    submitUserAnswers(input: SubmitUserAnswersInput!): [UserQuizAnswer!]!
  }
`;

// Resolvers (Simplified Quiz Structure)
const resolvers = {
  Query: {
    quizQuestions: async (_, { limit = 10, offset = 0 }, { db }) => {
      const { rows } = await db.query('SELECT * FROM quiz_questions ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);
      return rows;
    },
    quizQuestion: async (_, { id }, { db }) => {
        const { rows } = await db.query('SELECT * FROM quiz_questions WHERE id = $1', [id]);
        return rows[0] || null;
    },
    myQuizAnswers: async (_, { questionId }, { user, db }) => {
        _ensureLoggedIn(user);
        let query = 'SELECT * FROM user_quiz_answers WHERE user_id = $1';
        const values = [user.id];
        if (questionId) { query += ' AND question_id = $2'; values.push(questionId); }
        query += ' ORDER BY answered_at DESC';
        const { rows } = await db.query(query, values);
        return rows;
    },
  },

  Mutation: {
    createQuizQuestion: async (_, { input }, { admin, db }) => { // Use admin context
      _ensureAdmin(admin);
      const { question_text, allowed_choices_count = 1, choices } = input;

      // Validations
      if (!choices || choices.length < 1) { // Allow single choice questions for preference
           throw new GraphQLError('A quiz question must have at least one choice.', { extensions: { code: 'BAD_USER_INPUT' } });
      }
      if (allowed_choices_count < 1) {
           throw new GraphQLError('Allowed choices count must be at least 1.', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      // Database Transaction
      let questionId;
      await db.query('BEGIN');
      try {
        // 1. Insert question
        const { rows: questionRows } = await db.query(
          'INSERT INTO quiz_questions (question_text, allowed_choices_count) VALUES ($1, $2) RETURNING id',
          [question_text, allowed_choices_count]
        );
        questionId = questionRows[0].id;

        // 2. Insert choices
        for (const choiceInput of choices) {
          await db.query(
            'INSERT INTO quiz_choices (question_id, choice_text, image_url) VALUES ($1, $2, $3)',
            [questionId, choiceInput.choice_text, choiceInput.image_url]
          );
        }
        // 3. No need to insert into quiz_question_answers

        await db.query('COMMIT');

        // 4. Refetch the created question
        const { rows: finalQuestion } = await db.query('SELECT * FROM quiz_questions WHERE id = $1', [questionId]);
        if (!finalQuestion[0]) throw new Error("Failed to refetch created question.");
        return finalQuestion[0];

      } catch (error) {
        await db.query('ROLLBACK');
        console.error("Error creating quiz question:", error);
        throw new Error("Failed to create quiz question.");
      }
    },

    submitUserAnswers: async (_, { input }, { user, db }) => {
        _ensureLoggedIn(user);
        const { question_id, choice_ids } = input;

        if (!choice_ids || choice_ids.length === 0) throw new GraphQLError('At least one choice ID must be provided.', { extensions: { code: 'BAD_USER_INPUT' } });

        // Validation
        const { rows: questionRows } = await db.query('SELECT allowed_choices_count FROM quiz_questions WHERE id = $1', [question_id]);
        if (!questionRows[0]) throw new GraphQLError(`Quiz question ${question_id} not found.`, { extensions: { code: 'NOT_FOUND' } });
        const allowedCount = questionRows[0].allowed_choices_count;

        if (choice_ids.length > allowedCount) throw new GraphQLError(`Cannot select more than ${allowedCount} choice(s).`, { extensions: { code: 'BAD_USER_INPUT' } });
        // Check unique choice IDs submitted
        if (new Set(choice_ids).size !== choice_ids.length) throw new GraphQLError('Duplicate choice IDs submitted.', { extensions: { code: 'BAD_USER_INPUT' } });

        // Check if all submitted choice IDs are valid for the question
        const { rowCount: validChoicesCount } = await db.query(
            'SELECT id FROM quiz_choices WHERE question_id = $1 AND id = ANY($2::int[])',
            [question_id, choice_ids]
        );
        if (validChoicesCount !== choice_ids.length) throw new GraphQLError('One or more submitted choices are invalid for this question.', { extensions: { code: 'BAD_USER_INPUT' } });

        // Database Transaction
        const submittedAnswers = [];
        await db.query('BEGIN');
        try {
            // Delete previous answers for this user/question
            await db.query('DELETE FROM user_quiz_answers WHERE user_id = $1 AND question_id = $2', [user.id, question_id]);

            // Insert the new answers
            for (const choiceId of choice_ids) {
                const { rows: insertedRows } = await db.query(
                    `INSERT INTO user_quiz_answers (user_id, question_id, choice_id) VALUES ($1, $2, $3) RETURNING *`,
                    [user.id, question_id, choiceId]
                );
                submittedAnswers.push(insertedRows[0]);
            }

            await db.query('COMMIT');
            return submittedAnswers;

        } catch (error) {
            await db.query('ROLLBACK');
            console.error("Error submitting quiz answers:", error);
            throw new Error("Failed to submit quiz answers.");
        }
    },
  },

  // Field Resolvers
  QuizQuestion: {
    choices: async (question, _, { db }) => (await db.query('SELECT * FROM quiz_choices WHERE question_id = $1 ORDER BY created_at ASC', [question.id])).rows,
    // correct_choices resolver removed
    user_answers: async (question, _, { user, db }) => {
         if (!user) return [];
         return (await db.query('SELECT * FROM user_quiz_answers WHERE user_id = $1 AND question_id = $2', [user.id, question.id])).rows;
    }
  },

  // QuizChoice needs no specific resolvers

  UserQuizAnswer: {
    user: async (ans, _, { db, loaders }) => { /* ... fetch user ... */
        if (loaders?.userLoader) return loaders.userLoader.load(ans.user_id);
        const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [ans.user_id]); if (!rows[0]) return null; const { password_hash, ...u } = rows[0]; return u;
    },
    question: async (ans, _, { db, loaders }) => { /* ... fetch question ... */
        if (loaders?.quizQuestionLoader) return loaders.quizQuestionLoader.load(ans.question_id);
        return (await db.query('SELECT * FROM quiz_questions WHERE id = $1', [ans.question_id])).rows[0];
    },
    choice: async (ans, _, { db, loaders }) => { /* ... fetch choice ... */
        if (loaders?.quizChoiceLoader) return loaders.quizChoiceLoader.load(ans.choice_id);
        return (await db.query('SELECT * FROM quiz_choices WHERE id = $1', [ans.choice_id])).rows[0];
    },
  },
};

module.exports = { typeDefs, resolvers };