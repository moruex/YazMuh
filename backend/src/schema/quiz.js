// src/schema/quiz.js
// const { gql, AuthenticationError, ForbiddenError, UserInputError } = require('apollo-server-express');
const gql = require('graphql-tag');
const { GraphQLError } = require('graphql');
// Import helpers
const { ensureAdmin, ensureLoggedIn, rolesHierarchy } = require('../utils/authHelpers');
// Remove admin helper if not used directly, assume admin check is done via context if needed
// const { _ensureAdminRole } = require('./admin');

// Helper for admin permission check
async function checkAdminPermissionById(db, adminId, requiredRole = 'CONTENT_MODERATOR', action = 'perform this action') {
    // Skip authentication check when adminId is "1" (our default value)
    if (adminId === "1") {
        return true;
    }
    
    if (!adminId) {
        throw new GraphQLError('Admin ID required for this action.', { extensions: { code: 'UNAUTHENTICATED' } });
    }
    const { rows } = await db.query('SELECT role FROM admins WHERE id = $1', [adminId]);
    if (rows.length === 0) {
        throw new GraphQLError('Admin performing action not found.', { extensions: { code: 'FORBIDDEN' } });
    }
    const adminRoleDB = rows[0].role;
    const userLevel = rolesHierarchy[adminRoleDB] || 0;
    const requiredLevel = rolesHierarchy[requiredRole] || 0;

    if (userLevel < requiredLevel) {
        throw new GraphQLError(`You do not have permission to ${action}. Requires ${requiredRole} role or higher.`, { extensions: { code: 'FORBIDDEN' } });
    }
    return true; 
}

// HELPER: Slugify function
const slugify = (text) => {
  if (!text) return '';
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
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
    allowed_choices_count: Int! # Add this field to match frontend expectations
    # Connections
    choices(orderBy: String = "id_asc"): [QuizChoice!]
    created_at: DateTime!
    # --- Relationships ---
    user_answers: [UserQuizAnswer!]
  }

  # Represents a user's selection for a question choice
  type UserQuizAnswer {
    id: ID!
    attempt_id: ID!
    question_id: ID!
    chosen_choice_ids: [ID!]!
    # Connections
    question: QuizQuestion!
    # chosen_choices: [QuizChoice!]!
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
    allowed_choices_count: Int
    choices: [CreateQuizChoiceInput!] # Nested creation of choices
  }

   # Input for submitting user answers (preferences) to a question
  input SubmitUserAnswersInput {
    question_id: ID!
    choice_ids: [ID!]! # Array of choice IDs selected by the user
  }

  type Quiz {
    id: ID!
    title: String!
    slug: String!
    description: String
    status: String! # DRAFT, PUBLISHED, ARCHIVED
    created_at: DateTime!
    updated_at: DateTime!
    # Connections
    questions(orderBy: String = "order_index_asc"): [QuizQuestion!]
    question_count: Int!
    # User specific - requires userId
    is_attempted_by_me(userId: ID!): Boolean 
    my_last_attempt(userId: ID!): QuizAttempt
    my_best_score(userId: ID!): Float # Percentage
    average_score: Float # Average score of all attempts
    total_attempts: Int!
  }

  # Represents a user's attempt at a quiz
  type QuizAttempt {
    id: ID!
    user_id: ID!
    quiz_id: ID!
    started_at: DateTime!
    completed_at: DateTime
    score: Float # Could be raw score or percentage
    # Connections
    answers: [UserQuizAnswer!]
    quiz: Quiz!
    user: User! # Expose public part of user
  }

  input CreateQuizInput {
    title: String!
    description: String
    status: String = "DRAFT"
  }

  input UpdateQuizInput {
    title: String
    description: String
    status: String
  }

  input UpdateQuizQuestionInput {
    question_text: String
    allowed_choices_count: Int
    choices: [CreateQuizChoiceInput!] # Add choices field to match the resolver
  }
  
  input CreateQuizChoiceInput {
    # question_id is implicit when nested under CreateQuizQuestionInput
    choice_text: String!
    image_url: String
  }
  
  input UpdateQuizChoiceInput {
    choice_text: String
  }

  input QuizAnswerInput {
    question_id: ID!
    chosen_choice_ids: [ID!]! # Array for multiple choice, single element for single choice
  }

  input SubmitQuizAnswersInput {
    quiz_id: ID!
    answers: [QuizAnswerInput!]!
  }
  
  type QuizSubmissionResult {
      attempt: QuizAttempt!
      message: String!
  }

  extend type Query {
    quiz(id: ID, slug: String): Quiz
    quizzes(limit: Int = 10, offset: Int = 0, status: String = "PUBLISHED", search: String): [Quiz!]!
    quizCount(status: String = "PUBLISHED", search: String): Int!
    
    quizQuestion(id: ID!): QuizQuestion # For admin editing
    quizQuestions(limit: Int = 10, offset: Int = 0): [QuizQuestion!]! # Add this field for listing all questions
    # quizChoices(questionId: ID!): [QuizChoice!] # For admin editing

    # User-specific queries (require userId)
    myQuizAttempts(userId: ID!, quizId: ID, limit: Int = 10, offset: Int = 0): [QuizAttempt!]!
  }

  extend type Mutation {
    # Quiz Management (Admin restricted)
    createQuiz(performingAdminId: ID!, input: CreateQuizInput!): Quiz!
    updateQuiz(performingAdminId: ID!, id: ID!, input: UpdateQuizInput!): Quiz!
    deleteQuiz(performingAdminId: ID!, id: ID!): Boolean!
    publishQuiz(performingAdminId: ID!, id: ID!): Quiz!
    archiveQuiz(performingAdminId: ID!, id: ID!): Quiz!

    # Question Management (Admin restricted)
    createQuizQuestion(performingAdminId: ID!, input: CreateQuizQuestionInput!): QuizQuestion!
    updateQuizQuestion(performingAdminId: ID!, id: ID!, input: UpdateQuizQuestionInput!): QuizQuestion!
    deleteQuizQuestion(performingAdminId: ID!, id: ID!): Boolean!
    # Reorder questions might be a separate mutation or part of updateQuiz

    # Choice Management (Admin restricted)
    addChoiceToQuestion(performingAdminId: ID!, questionId: ID!, choiceText: String!): QuizChoice!
    updateQuizChoice(performingAdminId: ID!, id: ID!, input: UpdateQuizChoiceInput!): QuizChoice!
    deleteQuizChoice(performingAdminId: ID!, id: ID!): Boolean!

    # User Quiz Interaction (Requires userId)
    submitQuizAnswers(userId: ID!, input: SubmitQuizAnswersInput!): QuizSubmissionResult!
  }
`;

// Resolvers (Simplified Quiz Structure)
const resolvers = {
  Query: {
    quiz: async (_, { id, slug }, { db }) => {
      if (!id && !slug) throw new GraphQLError('Either id or slug must be provided for a quiz.', { extensions: { code: 'BAD_USER_INPUT' } });
      let queryText = 'SELECT * FROM quizzes WHERE ';
      const params = [];
      if (id) { queryText += 'id = $1'; params.push(id); }
      else { queryText += 'slug = $1'; params.push(slug); }
      const { rows } = await db.query(queryText, params);
      if (rows.length === 0) throw new GraphQLError('Quiz not found.', { extensions: { code: 'NOT_FOUND' } });
      return rows[0];
    },
    quizzes: async (_, { limit, offset, status, search }, { db }) => {
      let queryText = 'SELECT * FROM quizzes';
      const conditions = [];
      const params = [];
      let paramCount = 1;
      if (status) { conditions.push(`status = $${paramCount++}`); params.push(status); }
      if (search) { conditions.push(`(title ILIKE $${paramCount} OR description ILIKE $${paramCount})`); params.push(`%${search}%`); paramCount++;}
      if (conditions.length > 0) queryText += ' WHERE ' + conditions.join(' AND ');
      queryText += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
      params.push(limit, offset);
      const { rows } = await db.query(queryText, params);
      return rows;
    },
    quizCount: async (_, { status, search }, { db }) => {
        let queryText = 'SELECT COUNT(*) FROM quizzes';
        const conditions = [];
        const params = [];
        let paramCount = 1;
        if (status) { conditions.push(`status = $${paramCount++}`); params.push(status); }
        if (search) { conditions.push(`(title ILIKE $${paramCount} OR description ILIKE $${paramCount})`); params.push(`%${search}%`); paramCount++; }
        if (conditions.length > 0) queryText += ' WHERE ' + conditions.join(' AND ');
        const { rows } = await db.query(queryText, params);
        return parseInt(rows[0].count, 10);
    },
    quizQuestion: async (_, { id }, { db }) => { // Should be admin only or limited context
        const { rows } = await db.query('SELECT * FROM quiz_questions WHERE id = $1', [id]);
        if (rows.length === 0) throw new GraphQLError('Quiz question not found.', { extensions: { code: 'NOT_FOUND' } });
        return rows[0];
    },
    quizQuestions: async (_, { limit, offset }, { db }) => {
        const { rows } = await db.query('SELECT * FROM quiz_questions ORDER BY id DESC LIMIT $1 OFFSET $2', [limit, offset]);
        return rows;
    },
    myQuizAttempts: async (_, { userId, quizId, limit, offset }, { db }) => {
        if (!userId) throw new GraphQLError('User ID is required to fetch quiz attempts.', { extensions: { code: 'UNAUTHENTICATED' } });
        let queryText = 'SELECT * FROM quiz_attempts WHERE user_id = $1';
        const params = [userId];
        let paramCount = 2;
        if (quizId) { queryText += ` AND quiz_id = $${paramCount++}`; params.push(quizId); }
        queryText += ` ORDER BY started_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
        params.push(limit, offset);
        const { rows } = await db.query(queryText, params);
        return rows;
    }
  },

  Mutation: {
    createQuiz: async (_, { performingAdminId, input }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'create quiz');
        const slug = slugify(input.title);
        const { rows } = await db.query(
            'INSERT INTO quizzes (title, slug, description, status, created_by_admin_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [input.title, slug, input.description, input.status, performingAdminId]
        );
        return rows[0];
    },
    updateQuiz: async (_, { performingAdminId, id, input }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'update quiz');
        const updates = [];
        const params = [];
        let paramCount = 1;
        if (input.title !== undefined) { updates.push(`title = $${paramCount++}`); params.push(input.title); updates.push(`slug = $${paramCount++}`); params.push(slugify(input.title));}
        if (input.description !== undefined) { updates.push(`description = $${paramCount++}`); params.push(input.description); }
        if (input.status !== undefined) { updates.push(`status = $${paramCount++}`); params.push(input.status); }
        if (updates.length === 0) throw new GraphQLError('No update fields provided.', { extensions: { code: 'BAD_USER_INPUT' } });
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        params.push(id);
        const query = `UPDATE quizzes SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
        const { rows } = await db.query(query, params);
        if (rows.length === 0) throw new GraphQLError('Quiz not found or no changes made.', { extensions: { code: 'NOT_FOUND' } });
        return rows[0];
    },
    deleteQuiz: async (_, { performingAdminId, id }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'ADMIN', 'delete quiz');
        // Add checks for related data (attempts, questions) if not cascaded
        const { rowCount } = await db.query('DELETE FROM quizzes WHERE id = $1', [id]);
        if (rowCount === 0) throw new GraphQLError('Quiz not found.', { extensions: { code: 'NOT_FOUND' } });
        return true;
    },
    publishQuiz: async (_, { performingAdminId, id }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'publish quiz');
        const { rows } = await db.query("UPDATE quizzes SET status = 'PUBLISHED', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *", [id]);
        if (rows.length === 0) throw new GraphQLError('Quiz not found.', { extensions: { code: 'NOT_FOUND' } });
        return rows[0];
    },
    archiveQuiz: async (_, { performingAdminId, id }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'archive quiz');
        const { rows } = await db.query("UPDATE quizzes SET status = 'ARCHIVED', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *", [id]);
        if (rows.length === 0) throw new GraphQLError('Quiz not found.', { extensions: { code: 'NOT_FOUND' } });
        return rows[0];
    },
    createQuizQuestion: async (_, { performingAdminId, input }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'create quiz question');
        const { question_text, choices, allowed_choices_count } = input;
        
        // Insert the question
        const questionResult = await db.query(
            'INSERT INTO quiz_questions (question_text, allowed_choices_count) VALUES ($1, $2) RETURNING *',
            [question_text, allowed_choices_count || 1]
        );
        const question = questionResult.rows[0];
        
        // Insert choices if provided
        if (choices && choices.length > 0) {
            for (const choiceInput of choices) {
                await db.query(
                    'INSERT INTO quiz_choices (question_id, choice_text, image_url) VALUES ($1, $2, $3)',
                    [question.id, choiceInput.choice_text, choiceInput.image_url]
                );
            }
        }
        
        return question;
    },
    updateQuizQuestion: async (_, { performingAdminId, id, input }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'update quiz question');
        const { question_text, allowed_choices_count, choices } = input;
        
        // First check if the question exists
        const checkResult = await db.query('SELECT * FROM quiz_questions WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            throw new GraphQLError('Question not found.', { extensions: { code: 'NOT_FOUND' } });
        }
        
        let updatedQuestion = checkResult.rows[0];
        
        // Update question fields if provided
        const updates = [];
        const params = [];
        let paramCount = 1;
        
        if (question_text !== undefined) { updates.push(`question_text = $${paramCount++}`); params.push(question_text); }
        if (allowed_choices_count !== undefined) { updates.push(`allowed_choices_count = $${paramCount++}`); params.push(allowed_choices_count); }
        
        // Update question if there are fields to update
        if (updates.length > 0) {
            params.push(id);
            const query = `UPDATE quiz_questions SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
            const result = await db.query(query, params);
            updatedQuestion = result.rows[0];
        }
        
        // Update choices if provided
        if (choices && choices.length > 0) {
            // Delete existing choices
            await db.query('DELETE FROM quiz_choices WHERE question_id = $1', [id]);
            
            // Insert new choices
            for (const choiceInput of choices) {
                await db.query(
                    'INSERT INTO quiz_choices (question_id, choice_text, image_url) VALUES ($1, $2, $3)',
                    [id, choiceInput.choice_text, choiceInput.image_url]
                );
            }
        }
        
        return updatedQuestion;
    },
    deleteQuizQuestion: async (_, { performingAdminId, id }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'delete quiz question');
        // Also deletes choices due to ON DELETE CASCADE in DB schema for quiz_choices.question_id
        const { rowCount } = await db.query('DELETE FROM quiz_questions WHERE id = $1', [id]);
        if (rowCount === 0) throw new GraphQLError('Question not found.', { extensions: { code: 'NOT_FOUND' } });
        return true;
    },
    addChoiceToQuestion: async (_, { performingAdminId, questionId, choiceText }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'add choice to question');
        const { rows } = await db.query(
            'INSERT INTO quiz_choices (question_id, choice_text) VALUES ($1, $2) RETURNING *',
            [questionId, choiceText]
        );
        return rows[0];
    },
    updateQuizChoice: async (_, { performingAdminId, id, input }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'update quiz choice');
        const updates = [];
        const params = [];
        let paramCount = 1;
        if (input.choice_text !== undefined) { updates.push(`choice_text = $${paramCount++}`); params.push(input.choice_text); }
        if (updates.length === 0) throw new GraphQLError('No update fields for choice.', { extensions: { code: 'BAD_USER_INPUT' } });
        params.push(id);
        const query = `UPDATE quiz_choices SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
        const { rows } = await db.query(query, params);
        if (rows.length === 0) throw new GraphQLError('Choice not found or no change.', { extensions: { code: 'NOT_FOUND' } });
        return rows[0];
    },
    deleteQuizChoice: async (_, { performingAdminId, id }, { db }) => {
        await checkAdminPermissionById(db, performingAdminId, 'CONTENT_MODERATOR', 'delete quiz choice');
        const { rowCount } = await db.query('DELETE FROM quiz_choices WHERE id = $1', [id]);
        if (rowCount === 0) throw new GraphQLError('Choice not found.', { extensions: { code: 'NOT_FOUND' } });
        return true;
    },
    submitQuizAnswers: async (_, { userId, input }, { db }) => {
        if (!userId) throw new GraphQLError('User ID is required to submit quiz answers.', { extensions: { code: 'UNAUTHENTICATED' } });
        const { quiz_id, answers } = input;

        // Check if quiz is published
        const quizRes = await db.query('SELECT status FROM quizzes WHERE id = $1', [quiz_id]);
        if (quizRes.rows.length === 0) throw new GraphQLError('Quiz not found.', { extensions: { code: 'NOT_FOUND' }});
        if (quizRes.rows[0].status !== 'PUBLISHED') throw new GraphQLError('This quiz is not currently available for attempts.', { extensions: { code: 'BAD_USER_INPUT' }});

        // Create an attempt
        const attemptInsertResult = await db.query(
            'INSERT INTO quiz_attempts (user_id, quiz_id, started_at) VALUES ($1, $2, CURRENT_TIMESTAMP) RETURNING *',
            [userId, quiz_id]
        );
        let attemptResult = attemptInsertResult.rows[0];

        // Add answers
        for (const answer of answers) {
            await db.query(
                'INSERT INTO user_quiz_answers (attempt_id, question_id, chosen_choice_ids) VALUES ($1, $2, $3)',
                [attemptResult.id, answer.question_id, answer.chosen_choice_ids]
            );
        }
        
        // Since we don't have "correct" answers, calculate score based on completion
        const totalQuestionsRes = await db.query('SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = $1', [quiz_id]);
        const totalQuestions = parseInt(totalQuestionsRes.rows[0].count, 10);
        const answeredCount = answers.length;
        const score = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

        const finalAttemptUpdate = await db.query(
            'UPDATE quiz_attempts SET completed_at = CURRENT_TIMESTAMP, score = $1 WHERE id = $2 RETURNING *',
            [score, attemptResult.id]
        );
        attemptResult = finalAttemptUpdate.rows[0];
        
        return { attempt: attemptResult, message: "Quiz submitted successfully!" };
    },
  },

  // Field Resolvers
  QuizQuestion: {
    choices: async (question, { orderBy }, { db }) => {
      let queryText = 'SELECT id, question_id, choice_text, image_url FROM quiz_choices WHERE question_id = $1';
      if (orderBy === 'id_asc') queryText += ' ORDER BY id ASC';
      else queryText += ' ORDER BY id ASC'; // default
      const { rows } = await db.query(queryText, [question.id]);
      return rows;
    },
    user_answers: async (question, _, context) => {
         const { user, db } = context;
         if (!user) return [];
         return (await db.query('SELECT * FROM user_quiz_answers WHERE user_id = $1 AND question_id = $2', [user.id, question.id])).rows;
    }
  },

  // QuizChoice needs no specific resolvers

  UserQuizAnswer: {
    question: async (answer, _, context) => {
        const { rows } = await context.db.query('SELECT * FROM quiz_questions WHERE id = $1', [answer.question_id]);
        return rows[0];
    },
  },

  Quiz: {
    questions: async (quiz, { orderBy }, { db }) => {
      let query = 'SELECT * FROM quiz_questions WHERE quiz_id = $1';
      if (orderBy === 'order_index_asc') query += ' ORDER BY order_index ASC, id ASC';
      else query += ' ORDER BY id ASC'; // Default
      const { rows } = await db.query(query, [quiz.id]);
      return rows;
    },
    question_count: async (quiz, _, { db }) => {
        const { rows } = await db.query('SELECT COUNT(*) as count FROM quiz_questions WHERE quiz_id = $1', [quiz.id]);
        return parseInt(rows[0].count, 10);
    },
    is_attempted_by_me: async (quiz, { userId }, { db }) => {
        if (!userId) return null;
        const { rows } = await db.query('SELECT EXISTS (SELECT 1 FROM quiz_attempts WHERE user_id = $1 AND quiz_id = $2)', [userId, quiz.id]);
        return rows[0].exists;
    },
    my_last_attempt: async (quiz, { userId }, { db }) => {
        if (!userId) return null;
        const { rows } = await db.query('SELECT * FROM quiz_attempts WHERE user_id = $1 AND quiz_id = $2 ORDER BY started_at DESC LIMIT 1', [userId, quiz.id]);
        return rows.length > 0 ? rows[0] : null;
    },
    my_best_score: async (quiz, { userId }, { db }) => {
        if (!userId) return null;
        const { rows } = await db.query('SELECT MAX(score) as best_score FROM quiz_attempts WHERE user_id = $1 AND quiz_id = $2', [userId, quiz.id]);
        return rows.length > 0 && rows[0].best_score !== null ? parseFloat(rows[0].best_score) : null;
    },
    average_score: async (quiz, _, { db }) => {
        const { rows } = await db.query('SELECT AVG(score) as avg_score FROM quiz_attempts WHERE quiz_id = $1 AND score IS NOT NULL', [quiz.id]);
        return rows.length > 0 && rows[0].avg_score !== null ? parseFloat(rows[0].avg_score.toFixed(2)) : null;
    },
    total_attempts: async (quiz, _, { db }) => {
        const { rows } = await db.query('SELECT COUNT(*) as count FROM quiz_attempts WHERE quiz_id = $1', [quiz.id]);
        return parseInt(rows[0].count, 10);
    }
  },

  QuizAttempt: {
    answers: async (attempt, _, { db }) => {
        const { rows } = await db.query('SELECT * FROM user_quiz_answers WHERE attempt_id = $1 ORDER BY id ASC', [attempt.id]);
        return rows;
    },
    quiz: async (attempt, _, { db }) => {
        const { rows } = await db.query('SELECT * FROM quizzes WHERE id = $1', [attempt.quiz_id]);
        return rows[0];
    },
    user: async (attempt, _, { db }) => {
        const { rows } = await db.query('SELECT id, username, first_name, last_name, avatar_url FROM users WHERE id = $1', [attempt.user_id]);
        // Ensure this maps to UserPublicProfile or a similar limited type
        return rows[0]; 
    }
  },
};

module.exports = { typeDefs, resolvers };