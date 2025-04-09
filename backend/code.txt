// This file structure represents the full GraphQL backend for MovieQ

// File: package.json
{
  "name": "movieq-backend",
  "version": "1.0.0",
  "description": "GraphQL API for MovieQ movie database website",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "apollo-server-express": "^3.12.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "graphql": "^16.6.0",
    "graphql-scalars": "^1.20.1",
    "graphql-upload": "^16.0.2",
    "jsonwebtoken": "^9.0.0",
    "pg": "^8.10.0",
    "pg-connection-string": "^2.5.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.22"
  }
}

// File: .env
PORT=4000
DATABASE_URL=postgres://user:password@hostname:port/dbname?sslmode=require
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRATION=24h

// File: index.js
const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');
const { graphqlUploadExpress } = require('graphql-upload');
const dotenv = require('dotenv');
const { makeExecutableSchema } = require('@graphql-tools/schema');
const { typeDefs } = require('./schema');
const { resolvers } = require('./resolvers');
const { context } = require('./context');

dotenv.config();

async function startServer() {
  const app = express();
  
  // Enable CORS
  app.use(cors());
  
  // Handle file uploads
  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }));
  
  // Create executable schema
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  
  // Create Apollo Server
  const server = new ApolloServer({
    schema,
    context,
    csrfPrevention: true,
    cache: 'bounded',
    plugins: [
      {
        async serverWillStart() {
          console.log('Server starting up!');
        },
      },
    ],
  });
  
  await server.start();
  
  // Apply middleware
  server.applyMiddleware({ app });
  
  // Start the server
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
  });
}

startServer().catch(err => {
  console.error('Error starting server:', err);
});

// File: context.js
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { parse } = require('pg-connection-string');

// Parse DB connection string
const config = parse(process.env.DATABASE_URL);

// Create a new pool instance
const pool = new Pool({
  user: config.user,
  password: config.password,
  host: config.host,
  port: config.port,
  database: config.database,
  ssl: config.ssl ? { rejectUnauthorized: false } : false
});

// Connect to the database
pool.connect()
  .then(() => console.log('Connected to PostgreSQL database'))
  .catch(err => console.error('Database connection error:', err));

// Context function for Apollo Server
const context = async ({ req }) => {
  // Get the user token from the headers
  const token = req.headers.authorization || '';
  
  // Try to retrieve a user with the token
  if (token) {
    try {
      const user = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
      // Add the user to the context
      return { user, db: pool };
    } catch (error) {
      console.error('Invalid token:', error);
    }
  }
  
  // Return the database connection even if no user was found
  return { user: null, db: pool };
};

module.exports = { context, pool };

// File: schema.js
const { gql } = require('apollo-server-express');
const { GraphQLUpload } = require('graphql-upload');
const { GraphQLDate, GraphQLDateTime } = require('graphql-scalars');

const typeDefs = gql`
  # Custom scalars
  scalar Upload
  scalar Date
  scalar DateTime
  scalar ByteArray

  # User types
  type User {
    id: ID!
    firstName: String
    lastName: String
    username: String!
    email: String!
    avatarImage: ByteArray
    bio: String
    createdAt: DateTime!
    updatedAt: DateTime!
    lists: [UserList!]
    ratings: [UserRating!]
    comments: [Comment!]
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  # Movie types
  type Movie {
    id: ID!
    title: String!
    releaseDate: Date
    plotSummary: String
    posterUrl: String
    durationMinutes: Int
    trailerUrl: String
    avgRating: Float
    createdAt: DateTime!
    updatedAt: DateTime!
    genres: [Genre!]
    persons: [MoviePerson!]
    comments: [Comment!]
    recommendations: [MovieRecommendation!]
    news: [News!]
  }

  type Genre {
    id: ID!
    name: String!
    description: String
    imageUrl: String
    isCollection: Boolean
    movies: [Movie!]
  }

  type Person {
    id: ID!
    name: String!
    bio: String
    birthDate: Date
    profileImageUrl: String
    createdAt: DateTime!
    movieRoles: [MoviePerson!]
  }

  type MoviePerson {
    id: ID!
    movie: Movie!
    person: Person!
    roleType: RoleType!
    characterName: String
    createdAt: DateTime!
  }

  enum RoleType {
    ACTOR
    DIRECTOR
    WRITER
    PRODUCER
    CINEMATOGRAPHER
    COMPOSER
  }

  # User actions
  type UserRating {
    id: ID!
    user: User!
    movie: Movie!
    rating: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type UserList {
    id: ID!
    user: User!
    listType: ListType!
    createdAt: DateTime!
    movies: [Movie!]
  }

  enum ListType {
    FAVORITES
    WATCHED
    WATCHLIST
  }

  # Comments
  type Comment {
    id: ID!
    user: User!
    movie: Movie!
    content: String!
    parentComment: Comment
    replies: [Comment!]
    likes: [CommentLike!]
    createdAt: DateTime!
    updatedAt: DateTime!
    likeCount: Int!
  }

  type CommentLike {
    id: ID!
    user: User!
    comment: Comment!
    createdAt: DateTime!
  }

  # News
  type News {
    id: ID!
    title: String!
    content: String!
    author: User
    imageUrl: String
    publishedAt: DateTime!
    updatedAt: DateTime!
    movies: [Movie!]
  }

  # Recommendations
  type MovieRecommendation {
    id: ID!
    sourceMovie: Movie!
    recommendedMovie: Movie!
    recommendationStrength: Float!
    createdAt: DateTime!
  }

  # Quiz
  type QuizQuestion {
    id: ID!
    questionText: String!
    answers: [QuizAnswer!]!
    createdAt: DateTime!
  }

  type QuizAnswer {
    id: ID!
    question: QuizQuestion!
    answerText: String!
    isCorrect: Boolean!
    createdAt: DateTime!
  }

  type UserQuizResult {
    id: ID!
    user: User!
    question: QuizQuestion!
    answer: QuizAnswer!
    answeredAt: DateTime!
  }

  # Inputs
  input UserInput {
    firstName: String
    lastName: String
    username: String!
    email: String!
    password: String!
    bio: String
  }

  input UserUpdateInput {
    firstName: String
    lastName: String
    username: String
    email: String
    password: String
    bio: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input MovieInput {
    title: String!
    releaseDate: Date
    plotSummary: String
    posterUrl: String
    durationMinutes: Int
    trailerUrl: String
  }

  input MovieUpdateInput {
    title: String
    releaseDate: Date
    plotSummary: String
    posterUrl: String
    durationMinutes: Int
    trailerUrl: String
  }

  input GenreInput {
    name: String!
    description: String
    imageUrl: String
    isCollection: Boolean
  }

  input PersonInput {
    name: String!
    bio: String
    birthDate: Date
    profileImageUrl: String
  }

  input MoviePersonInput {
    movieId: ID!
    personId: ID!
    roleType: RoleType!
    characterName: String
  }

  input RatingInput {
    movieId: ID!
    rating: Int!
  }

  input CommentInput {
    movieId: ID!
    content: String!
    parentCommentId: ID
  }

  input NewsInput {
    title: String!
    content: String!
    imageUrl: String
    movieIds: [ID!]
  }

  input QuizQuestionInput {
    questionText: String!
    answers: [QuizAnswerInput!]!
  }

  input QuizAnswerInput {
    answerText: String!
    isCorrect: Boolean
  }

  input QuizResultInput {
    questionId: ID!
    answerId: ID!
  }

  # Queries
  type Query {
    # User queries
    me: User
    user(id: ID!): User
    users(limit: Int, offset: Int): [User!]!
    
    # Movie queries
    movie(id: ID!): Movie
    movies(
      limit: Int, 
      offset: Int, 
      sortBy: String, 
      sortDirection: String, 
      genreId: ID,
      search: String
    ): [Movie!]!
    movieCount(genreId: ID, search: String): Int!
    
    # Genre queries
    genre(id: ID!): Genre
    genres: [Genre!]!
    
    # Person queries
    person(id: ID!): Person
    persons(limit: Int, offset: Int, search: String): [Person!]!
    
    # Comment queries
    movieComments(movieId: ID!, limit: Int, offset: Int): [Comment!]!
    
    # News queries
    newsArticle(id: ID!): News
    newsArticles(limit: Int, offset: Int): [News!]!
    
    # Quiz queries
    quizQuestions(limit: Int): [QuizQuestion!]!
    userQuizResults(userId: ID!): [UserQuizResult!]!
    
    # List queries
    userList(userId: ID!, listType: ListType!): UserList
    
    # Recommendation queries
    movieRecommendations(movieId: ID!, limit: Int): [Movie!]!
  }

  # Mutations
  type Mutation {
    # Auth mutations
    registerUser(input: UserInput!, avatar: Upload): AuthPayload!
    loginUser(input: LoginInput!): AuthPayload!
    updateUser(input: UserUpdateInput!, avatar: Upload): User!
    
    # Movie mutations
    createMovie(input: MovieInput!): Movie!
    updateMovie(id: ID!, input: MovieUpdateInput!): Movie!
    deleteMovie(id: ID!): Boolean!
    addMovieToGenre(movieId: ID!, genreId: ID!): Movie!
    removeMovieFromGenre(movieId: ID!, genreId: ID!): Movie!
    
    # Genre mutations
    createGenre(input: GenreInput!): Genre!
    updateGenre(id: ID!, input: GenreInput!): Genre!
    deleteGenre(id: ID!): Boolean!
    
    # Person mutations
    createPerson(input: PersonInput!): Person!
    updatePerson(id: ID!, input: PersonInput!): Person!
    deletePerson(id: ID!): Boolean!
    
    # MoviePerson mutations
    addPersonToMovie(input: MoviePersonInput!): MoviePerson!
    removePersonFromMovie(movieId: ID!, personId: ID!, roleType: RoleType!): Boolean!
    
    # Rating mutations
    rateMovie(input: RatingInput!): UserRating!
    deleteRating(movieId: ID!): Boolean!
    
    # List mutations
    addMovieToList(movieId: ID!, listType: ListType!): UserList!
    removeMovieFromList(movieId: ID!, listType: ListType!): UserList!
    
    # Comment mutations
    addComment(input: CommentInput!): Comment!
    updateComment(id: ID!, content: String!): Comment!
    deleteComment(id: ID!): Boolean!
    likeComment(commentId: ID!): CommentLike!
    unlikeComment(commentId: ID!): Boolean!
    
    # News mutations
    createNewsArticle(input: NewsInput!): News!
    updateNewsArticle(id: ID!, input: NewsInput!): News!
    deleteNewsArticle(id: ID!): Boolean!
    
    # Quiz mutations
    createQuizQuestion(input: QuizQuestionInput!): QuizQuestion!
    submitQuizResult(input: QuizResultInput!): UserQuizResult!
    
    # Recommendation mutations
    createRecommendation(sourceMovieId: ID!, recommendedMovieId: ID!, strength: Float!): MovieRecommendation!
  }
`;

module.exports = { typeDefs };

// File: resolvers.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GraphQLUpload } = require('graphql-upload');
const { GraphQLDate, GraphQLDateTime } = require('graphql-scalars');
const fs = require('fs');
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);

// Custom scalar resolvers
const resolvers = {
  Upload: GraphQLUpload,
  Date: GraphQLDate,
  DateTime: GraphQLDateTime,
  ByteArray: {
    serialize: value => Buffer.from(value).toString('base64'),
    parseValue: value => Buffer.from(value, 'base64'),
    parseLiteral: ast => {
      if (ast.kind === Kind.STRING) {
        return Buffer.from(ast.value, 'base64');
      }
      return null;
    }
  },
  RoleType: {
    ACTOR: 'actor',
    DIRECTOR: 'director',
    WRITER: 'writer',
    PRODUCER: 'producer',
    CINEMATOGRAPHER: 'cinematographer',
    COMPOSER: 'composer'
  },
  ListType: {
    FAVORITES: 'favorites',
    WATCHED: 'watched',
    WATCHLIST: 'watchlist'
  },

  // Query resolvers
  Query: {
    // User queries
    me: async (_, __, { user, db }) => {
      if (!user) return null;
      
      const result = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [user.id]
      );
      
      return result.rows[0];
    },
    
    user: async (_, { id }, { db }) => {
      const result = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [id]
      );
      
      return result.rows[0];
    },
    
    users: async (_, { limit = 10, offset = 0 }, { db }) => {
      const result = await db.query(
        'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );
      
      return result.rows;
    },
    
    // Movie queries
    movie: async (_, { id }, { db }) => {
      const result = await db.query(
        'SELECT * FROM movies WHERE id = $1',
        [id]
      );
      
      return result.rows[0];
    },
    
    movies: async (_, { limit = 10, offset = 0, sortBy = 'created_at', sortDirection = 'DESC', genreId, search }, { db }) => {
      let query = 'SELECT DISTINCT m.* FROM movies m';
      const queryParams = [];
      let paramCounter = 1;
      
      // Join with genres if filter by genre
      if (genreId) {
        query += ' JOIN movie_genres mg ON m.id = mg.movie_id';
      }
      
      // Where clause for filters
      const whereConditions = [];
      
      if (genreId) {
        whereConditions.push(`mg.genre_id = $${paramCounter++}`);
        queryParams.push(genreId);
      }
      
      if (search) {
        whereConditions.push(`m.title ILIKE $${paramCounter++}`);
        queryParams.push(`%${search}%`);
      }
      
      if (whereConditions.length > 0) {
        query += ' WHERE ' + whereConditions.join(' AND ');
      }
      
      // Add sorting
      query += ` ORDER BY m.${sortBy} ${sortDirection}`;
      
      // Add limit and offset
      query += ` LIMIT $${paramCounter++} OFFSET $${paramCounter++}`;
      queryParams.push(limit, offset);
      
      const result = await db.query(query, queryParams);
      return result.rows;
    },
    
    movieCount: async (_, { genreId, search }, { db }) => {
      let query = 'SELECT COUNT(DISTINCT m.id) FROM movies m';
      const queryParams = [];
      let paramCounter = 1;
      
      // Join with genres if filter by genre
      if (genreId) {
        query += ' JOIN movie_genres mg ON m.id = mg.movie_id';
      }
      
      // Where clause for filters
      const whereConditions = [];
      
      if (genreId) {
        whereConditions.push(`mg.genre_id = $${paramCounter++}`);
        queryParams.push(genreId);
      }
      
      if (search) {
        whereConditions.push(`m.title ILIKE $${paramCounter++}`);
        queryParams.push(`%${search}%`);
      }
      
      if (whereConditions.length > 0) {
        query += ' WHERE ' + whereConditions.join(' AND ');
      }
      
      const result = await db.query(query, queryParams);
      return parseInt(result.rows[0].count);
    },
    
    // Genre queries
    genre: async (_, { id }, { db }) => {
      const result = await db.query(
        'SELECT * FROM genres WHERE id = $1',
        [id]
      );
      
      return result.rows[0];
    },
    
    genres: async (_, __, { db }) => {
      const result = await db.query('SELECT * FROM genres ORDER BY name');
      return result.rows;
    },
    
    // Person queries
    person: async (_, { id }, { db }) => {
      const result = await db.query(
        'SELECT * FROM persons WHERE id = $1',
        [id]
      );
      
      return result.rows[0];
    },
    
    persons: async (_, { limit = 10, offset = 0, search }, { db }) => {
      let query = 'SELECT * FROM persons';
      const queryParams = [];
      let paramCounter = 1;
      
      if (search) {
        query += ` WHERE name ILIKE $${paramCounter++}`;
        queryParams.push(`%${search}%`);
      }
      
      query += ` ORDER BY name LIMIT $${paramCounter++} OFFSET $${paramCounter++}`;
      queryParams.push(limit, offset);
      
      const result = await db.query(query, queryParams);
      return result.rows;
    },
    
    // Comment queries
    movieComments: async (_, { movieId, limit = 10, offset = 0 }, { db }) => {
      const result = await db.query(
        `SELECT c.* 
         FROM comments c 
         WHERE c.movie_id = $1 AND c.parent_comment_id IS NULL 
         ORDER BY c.created_at DESC 
         LIMIT $2 OFFSET $3`,
        [movieId, limit, offset]
      );
      
      return result.rows;
    },
    
    // News queries
    newsArticle: async (_, { id }, { db }) => {
      const result = await db.query(
        'SELECT * FROM news WHERE id = $1',
        [id]
      );
      
      return result.rows[0];
    },
    
    newsArticles: async (_, { limit = 10, offset = 0 }, { db }) => {
      const result = await db.query(
        'SELECT * FROM news ORDER BY published_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );
      
      return result.rows;
    },
    
    // Quiz queries
    quizQuestions: async (_, { limit = 5 }, { db }) => {
      const result = await db.query(
        'SELECT * FROM quiz_questions ORDER BY RANDOM() LIMIT $1',
        [limit]
      );
      
      return result.rows;
    },
    
    userQuizResults: async (_, { userId }, { db }) => {
      const result = await db.query(
        'SELECT * FROM user_quiz_results WHERE user_id = $1',
        [userId]
      );
      
      return result.rows;
    },
    
    // Continuing from where the file was cut off
    // List queries
    userList: async (_, { userId, listType }, { db }) => {
      const result = await db.query(
        'SELECT * FROM user_lists WHERE user_id = $1 AND list_type = $2',
        [userId, listType.toLowerCase()]
      );
      
      return result.rows[0];
    },
    
    // Recommendation queries
    movieRecommendations: async (_, { movieId, limit = 5 }, { db }) => {
      const result = await db.query(
        `SELECT m.* FROM movies m
         JOIN movie_recommendations mr ON m.id = mr.recommended_movie_id
         WHERE mr.source_movie_id = $1
         ORDER BY mr.recommendation_strength DESC
         LIMIT $2`,
        [movieId, limit]
      );
      
      return result.rows;
    }
  },
  
  // Mutation resolvers
  Mutation: {
    // Auth mutations
    registerUser: async (_, { input, avatar }, { db }) => {
      // Check if user with email or username already exists
      const existingUser = await db.query(
        'SELECT * FROM users WHERE email = $1 OR username = $2',
        [input.email, input.username]
      );
      
      if (existingUser.rows.length > 0) {
        throw new Error('User with this email or username already exists');
      }
      
      // Hash the password
      const passwordHash = await bcrypt.hash(input.password, 10);
      
      // Process avatar if provided
      let avatarData = null;
      if (avatar) {
        const { createReadStream, filename, mimetype } = await avatar;
        const stream = createReadStream();
        // Convert stream to buffer to store in database
        const chunks = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        avatarData = Buffer.concat(chunks);
      }
      
      // Insert new user
      const result = await db.query(
        `INSERT INTO users (
          first_name, 
          last_name, 
          username, 
          email, 
          password_hash, 
          avatar_image, 
          bio, 
          created_at, 
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
        RETURNING *`,
        [
          input.firstName, 
          input.lastName, 
          input.username, 
          input.email, 
          passwordHash, 
          avatarData, 
          input.bio
        ]
      );
      
      const user = result.rows[0];
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION }
      );
      
      return {
        token,
        user
      };
    },
    
    loginUser: async (_, { input }, { db }) => {
      // Find user by email
      const result = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [input.email]
      );
      
      const user = result.rows[0];
      
      if (!user) {
        throw new Error('No user found with this email');
      }
      
      // Verify password
      const valid = await bcrypt.compare(input.password, user.password_hash);
      
      if (!valid) {
        throw new Error('Invalid password');
      }
      
      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION }
      );
      
      return {
        token,
        user
      };
    },
    
    updateUser: async (_, { input, avatar }, { user, db }) => {
      if (!user) {
        throw new Error('You must be logged in to update your profile');
      }
      
      // Start building query
      const updates = [];
      const values = [];
      let paramCounter = 1;
      
      // Add fields to update
      if (input.firstName !== undefined) {
        updates.push(`first_name = $${paramCounter++}`);
        values.push(input.firstName);
      }
      
      if (input.lastName !== undefined) {
        updates.push(`last_name = $${paramCounter++}`);
        values.push(input.lastName);
      }
      
      if (input.username !== undefined) {
        // Check if username is already taken
        const existingUser = await db.query(
          'SELECT * FROM users WHERE username = $1 AND id != $2',
          [input.username, user.id]
        );
        
        if (existingUser.rows.length > 0) {
          throw new Error('Username is already taken');
        }
        
        updates.push(`username = $${paramCounter++}`);
        values.push(input.username);
      }
      
      if (input.email !== undefined) {
        // Check if email is already taken
        const existingUser = await db.query(
          'SELECT * FROM users WHERE email = $1 AND id != $2',
          [input.email, user.id]
        );
        
        if (existingUser.rows.length > 0) {
          throw new Error('Email is already taken');
        }
        
        updates.push(`email = $${paramCounter++}`);
        values.push(input.email);
      }
      
      if (input.password !== undefined) {
        const passwordHash = await bcrypt.hash(input.password, 10);
        updates.push(`password_hash = $${paramCounter++}`);
        values.push(passwordHash);
      }
      
      if (input.bio !== undefined) {
        updates.push(`bio = $${paramCounter++}`);
        values.push(input.bio);
      }
      
      // Process avatar if provided
      if (avatar) {
        const { createReadStream } = await avatar;
        const stream = createReadStream();
        // Convert stream to buffer
        const chunks = [];
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        const avatarData = Buffer.concat(chunks);
        
        updates.push(`avatar_image = $${paramCounter++}`);
        values.push(avatarData);
      }
      
      // Add updated_at field
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      
      // If nothing to update, return current user
      if (updates.length === 1) { // Only updated_at
        const result = await db.query(
          'SELECT * FROM users WHERE id = $1',
          [user.id]
        );
        return result.rows[0];
      }
      
      // Build and execute query
      values.push(user.id);
      const query = `
        UPDATE users 
        SET ${updates.join(', ')} 
        WHERE id = $${paramCounter} 
        RETURNING *
      `;
      
      const result = await db.query(query, values);
      return result.rows[0];
    },
    
    // Movie mutations
    createMovie: async (_, { input }, { user, db }) => {
      // Check if user is authorized (admin only operation)
      if (!user) {
        throw new Error('You must be logged in to create a movie');
      }
      
      // TODO: Add admin check if needed
      
      const result = await db.query(
        `INSERT INTO movies (
          title, 
          release_date, 
          plot_summary, 
          poster_url, 
          duration_minutes, 
          trailer_url, 
          created_at, 
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
        RETURNING *`,
        [
          input.title,
          input.releaseDate,
          input.plotSummary,
          input.posterUrl,
          input.durationMinutes,
          input.trailerUrl
        ]
      );
      
      return result.rows[0];
    },
    
    updateMovie: async (_, { id, input }, { user, db }) => {
      // Check if user is authorized (admin only operation)
      if (!user) {
        throw new Error('You must be logged in to update a movie');
      }
      
      // TODO: Add admin check if needed
      
      // Start building query
      const updates = [];
      const values = [];
      let paramCounter = 1;
      
      // Add fields to update
      if (input.title !== undefined) {
        updates.push(`title = $${paramCounter++}`);
        values.push(input.title);
      }
      
      if (input.releaseDate !== undefined) {
        updates.push(`release_date = $${paramCounter++}`);
        values.push(input.releaseDate);
      }
      
      if (input.plotSummary !== undefined) {
        updates.push(`plot_summary = $${paramCounter++}`);
        values.push(input.plotSummary);
      }
      
      if (input.posterUrl !== undefined) {
        updates.push(`poster_url = $${paramCounter++}`);
        values.push(input.posterUrl);
      }
      
      if (input.durationMinutes !== undefined) {
        updates.push(`duration_minutes = $${paramCounter++}`);
        values.push(input.durationMinutes);
      }
      
      if (input.trailerUrl !== undefined) {
        updates.push(`trailer_url = $${paramCounter++}`);
        values.push(input.trailerUrl);
      }
      
      // Add updated_at field
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      
      // If nothing to update, return current movie
      if (updates.length === 1) { // Only updated_at
        const result = await db.query(
          'SELECT * FROM movies WHERE id = $1',
          [id]
        );
        return result.rows[0];
      }
      
      // Build and execute query
      values.push(id);
      const query = `
        UPDATE movies 
        SET ${updates.join(', ')} 
        WHERE id = $${paramCounter} 
        RETURNING *
      `;
      
      const result = await db.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Movie not found');
      }
      
      return result.rows[0];
    },
    
    deleteMovie: async (_, { id }, { user, db }) => {
      // Check if user is authorized (admin only operation)
      if (!user) {
        throw new Error('You must be logged in to delete a movie');
      }
      
      // TODO: Add admin check if needed
      
      // Check if movie exists
      const movie = await db.query(
        'SELECT * FROM movies WHERE id = $1',
        [id]
      );
      
      if (movie.rows.length === 0) {
        throw new Error('Movie not found');
      }
      
      // Delete movie
      await db.query(
        'DELETE FROM movies WHERE id = $1',
        [id]
      );
      
      return true;
    },
    
    addMovieToGenre: async (_, { movieId, genreId }, { user, db }) => {
      // Check if user is authorized (admin only operation)
      if (!user) {
        throw new Error('You must be logged in to add a movie to a genre');
      }
      
      // TODO: Add admin check if needed
      
      // Check if movie and genre exist
      const movie = await db.query(
        'SELECT * FROM movies WHERE id = $1',
        [movieId]
      );
      
      if (movie.rows.length === 0) {
        throw new Error('Movie not found');
      }
      
      const genre = await db.query(
        'SELECT * FROM genres WHERE id = $1',
        [genreId]
      );
      
      if (genre.rows.length === 0) {
        throw new Error('Genre not found');
      }
      
      // Add movie to genre
      await db.query(
        'INSERT INTO movie_genres (movie_id, genre_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [movieId, genreId]
      );
      
      return movie.rows[0];
    },
    
    removeMovieFromGenre: async (_, { movieId, genreId }, { user, db }) => {
      // Check if user is authorized (admin only operation)
      if (!user) {
        throw new Error('You must be logged in to remove a movie from a genre');
      }
      
      // TODO: Add admin check if needed
      
      // Check if movie exists
      const movie = await db.query(
        'SELECT * FROM movies WHERE id = $1',
        [movieId]
      );
      
      if (movie.rows.length === 0) {
        throw new Error('Movie not found');
      }
      
      // Remove movie from genre
      await db.query(
        'DELETE FROM movie_genres WHERE movie_id = $1 AND genre_id = $2',
        [movieId, genreId]
      );
      
      return movie.rows[0];
    },
    
    // Genre mutations
    createGenre: async (_, { input }, { user, db }) => {
      // Check if user is authorized (admin only operation)
      if (!user) {
        throw new Error('You must be logged in to create a genre');
      }
      
      // TODO: Add admin check if needed
      
      // Check if genre with same name already exists
      const existingGenre = await db.query(
        'SELECT * FROM genres WHERE name = $1',
        [input.name]
      );
      
      if (existingGenre.rows.length > 0) {
        throw new Error('Genre with this name already exists');
      }
      
      const result = await db.query(
        'INSERT INTO genres (name, description, image_url, is_collection) VALUES ($1, $2, $3, $4) RETURNING *',
        [input.name, input.description, input.imageUrl, input.isCollection]
      );
      
      return result.rows[0];
    },
    
    updateGenre: async (_, { id, input }, { user, db }) => {
      // Check if user is authorized (admin only operation)
      if (!user) {
        throw new Error('You must be logged in to update a genre');
      }
      
      // TODO: Add admin check if needed
      
      // Start building query
      const updates = [];
      const values = [];
      let paramCounter = 1;
      
      // Add fields to update
      if (input.name !== undefined) {
        // Check if genre with same name already exists
        const existingGenre = await db.query(
          'SELECT * FROM genres WHERE name = $1 AND id != $2',
          [input.name, id]
        );
        
        if (existingGenre.rows.length > 0) {
          throw new Error('Genre with this name already exists');
        }
        
        updates.push(`name = $${paramCounter++}`);
        values.push(input.name);
      }
      
      if (input.description !== undefined) {
        updates.push(`description = $${paramCounter++}`);
        values.push(input.description);
      }
      
      if (input.imageUrl !== undefined) {
        updates.push(`image_url = $${paramCounter++}`);
        values.push(input.imageUrl);
      }
      
      if (input.isCollection !== undefined) {
        updates.push(`is_collection = $${paramCounter++}`);
        values.push(input.isCollection);
      }
      
      // If nothing to update, return current genre
      if (updates.length === 0) {
        const result = await db.query(
          'SELECT * FROM genres WHERE id = $1',
          [id]
        );
        
        if (result.rows.length === 0) {
          throw new Error('Genre not found');
        }
        
        return result.rows[0];
      }
      
      // Build and execute query
      values.push(id);
      const query = `
        UPDATE genres 
        SET ${updates.join(', ')} 
        WHERE id = $${paramCounter} 
        RETURNING *
      `;
      
      const result = await db.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Genre not found');
      }
      
      return result.rows[0];
    },
    
    deleteGenre: async (_, { id }, { user, db }) => {
      // Check if user is authorized (admin only operation)
      if (!user) {
        throw new Error('You must be logged in to delete a genre');
      }
      
      // TODO: Add admin check if needed
      
      // Check if genre exists
      const genre = await db.query(
        'SELECT * FROM genres WHERE id = $1',
        [id]
      );
      
      if (genre.rows.length === 0) {
        throw new Error('Genre not found');
      }
      
      // Delete genre
      await db.query(
        'DELETE FROM genres WHERE id = $1',
        [id]
      );
      
      return true;
    },
    
    // Person mutations
    createPerson: async (_, { input }, { user, db }) => {
      // Check if user is authorized (admin only operation)
      if (!user) {
        throw new Error('You must be logged in to create a person');
      }
      
      // TODO: Add admin check if needed
      
      const result = await db.query(
        'INSERT INTO persons (name, bio, birth_date, profile_image_url, created_at) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING *',
        [input.name, input.bio, input.birthDate, input.profileImageUrl]
      );
      
      return result.rows[0];
    },
    
    updatePerson: async (_, { id, input }, { user, db }) => {
      // Check if user is authorized (admin only operation)
      if (!user) {
        throw new Error('You must be logged in to update a person');
      }
      
      // TODO: Add admin check if needed
      
      // Start building query
      const updates = [];
      const values = [];
      let paramCounter = 1;
      
      // Add fields to update
      if (input.name !== undefined) {
        updates.push(`name = $${paramCounter++}`);
        values.push(input.name);
      }
      
      if (input.bio !== undefined) {
        updates.push(`bio = $${paramCounter++}`);
        values.push(input.bio);
      }
      
      if (input.birthDate !== undefined) {
        updates.push(`birth_date = $${paramCounter++}`);
        values.push(input.birthDate);
      }
      
      if (input.profileImageUrl !== undefined) {
        updates.push(`profile_image_url = $${paramCounter++}`);
        values.push(input.profileImageUrl);
      }
      
      // If nothing to update, return current person
      if (updates.length === 0) {
        const result = await db.query(
          'SELECT * FROM persons WHERE id = $1',
          [id]
        );
        
        if (result.rows.length === 0) {
          throw new Error('Person not found');
        }
        
        return result.rows[0];
      }
      
      // Build and execute query
      values.push(id);
      const query = `
        UPDATE persons 
        SET ${updates.join(', ')} 
        WHERE id = $${paramCounter} 
        RETURNING *
      `;
      
      const result = await db.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Person not found');
      }
      
      return result.rows[0];
    },
    
    deletePerson: async (_, { id }, { user, db }) => {
      // Check if user is authorized (admin only operation)
      if (!user) {
        throw new Error('You must be logged in to delete a person');
      }
      
      // TODO: Add admin check if needed
      
      // Check if person exists
      const person = await db.query(
        'SELECT * FROM persons WHERE id = $1',
        [id]
      );
      
      if (person.rows.length === 0) {
        throw new Error('Person not found');
      }
      
      // Delete person
      await db.query(
        'DELETE FROM persons WHERE id = $1',
        [id]
      );
      
      return true;
    },
    
    // MoviePerson mutations
    addPersonToMovie: async (_, { input }, { user, db }) => {
      // Check if user is authorized (admin only operation)
      if (!user) {
        throw new Error('You must be logged in to add a person to a movie');
      }
      
      // TODO: Add admin check if needed
      
      // Check if movie and person exist
      const movie = await db.query(
        'SELECT * FROM movies WHERE id = $1',
        [input.movieId]
      );
      
      if (movie.rows.length === 0) {
        throw new Error('Movie not found');
      }
      
      const person = await db.query(
        'SELECT * FROM persons WHERE id = $1',
        [input.personId]
      );
      
      if (person.rows.length === 0) {
        throw new Error('Person not found');
      }
      
      // Add person to movie
      const result = await db.query(
        `INSERT INTO movie_persons (
          movie_id, 
          person_id, 
          role_type, 
          character_name, 
          created_at
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) 
        RETURNING *`,
        [
          input.movieId, 
          input.personId, 
          input.roleType, 
          input.characterName
        ]
      );
      
      return result.rows[0];
    },
    
    removePersonFromMovie: async (_, { movieId, personId, roleType }, { user, db }) => {
      // Check if user is authorized (admin only operation)
      if (!user) {
        throw new Error('You must be logged in to remove a person from a movie');
      }
      
      // TODO: Add admin check if needed
      
      // Delete movie-person relationship
      await db.query(
        'DELETE FROM movie_persons WHERE movie_id = $1 AND person_id = $2 AND role_type = $3',
        [movieId, personId, roleType]
      );
      
      return true;
    },
    
    // Rating mutations
    rateMovie: async (_, { input }, { user, db }) => {
      if (!user) {
        throw new Error('You must be logged in to rate a movie');
      }
      
      // Check if movie exists
      const movie = await db.query(
        'SELECT * FROM movies WHERE id = $1',
        [input.movieId]
      );
      
      if (movie.rows.length === 0) {
        throw new Error('Movie not found');
      }
      
      // Check if user has already rated this movie
      const existingRating = await db.query(
        'SELECT * FROM user_ratings WHERE user_id = $1 AND movie_id = $2',
        [user.id, input.movieId]
      );
      
      if (existingRating.rows.length > 0) {
        // Update existing rating
        const result = await db.query(
          `UPDATE user_ratings 
           SET rating = $1, updated_at = CURRENT_TIMESTAMP 
           WHERE user_id = $2 AND movie_id = $3 
           RETURNING *`,
          [input.rating, user.id, input.movieId]
        );
        
        return result.rows[0];
      } else {
        // Create new rating
        const result = await db.query(
          `INSERT INTO user_ratings (
            user_id, 
            movie_id, 
            rating, 
            created_at, 
            updated_at
          ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
          RETURNING *`,
          [user.id, input.movieId, input.rating]
        );
        
        return result.rows[0];
      }
    },
    
    deleteRating: async (_, { movieId }, { user, db }) => {
      if (!user) {
        throw new Error('You must be logged in to delete a rating');
      }
      
      // Delete rating
      await db.query(
        'DELETE FROM user_ratings WHERE user_id = $1 AND movie_id = $2',
        [user.id, movieId]
      );
      
      return true;
    },
    
    // List mutations
    addMovieToList: async (_, { movieId, listType }, { user, db }) => {
      if (!user) {
        throw new Error('You must be logged in to add a movie to a list');
      }
      
      // Check if movie exists
      const movie = await db.query(
        'SELECT * FROM movies WHERE id = $1',
        [movieId]
      );
      
      if (movie.rows.length === 0) {
        throw new Error('Movie not found');
      }
      
      // Get user list
      const list = await db.query(
        'SELECT * FROM user_lists WHERE user_id = $1 AND list_type = $2',
        [user.id, listType.toLowerCase()]
      );
      
      if (list.rows.length === 0) {
        throw new Error('List not found');
      }
      
      // Add movie to list
      await db.query(
        `INSERT INTO user_list_items (
          list_id, 
          movie_id, 
          added_at
        ) VALUES ($1, $2, CURRENT_TIMESTAMP) 
        ON CONFLICT (list_id, movie_id) DO NOTHING`,
        [list.rows[0].id, movieId]
      );
      
      return list.rows[0];
    },
    
    removeMovieFromList: async (_, { movieId, listType }, { user, db }) => {
      if (!user) {
        throw new Error('You must be logged in to remove a movie from a list');
      }
      
      // Get user list
      const list = await db.query(
        'SELECT * FROM user_lists WHERE user_id = $1 AND list_type = $2',
        [user.id, listType.toLowerCase()]
      );
      
      if (list.rows.length === 0) {
        throw new Error('List not found');
      }
      
      // Remove movie from list
      await db.query(
        'DELETE FROM user_list_items WHERE list_id = $1 AND movie_id = $2',
        [list.rows[0].id, movieId]
      );
      
      return list.rows[0];
    },
    
    // Comment mutations
    addComment: async (_, { input }, { user, db }) => {
      if (!user) {
        throw new Error('You must be logged in to add a comment');
      }
      
      // Check if movie exists
      const movie = await db.query(
        'SELECT * FROM movies WHERE id = $1',
        [input.movieId]
      );
      
      if (movie.rows.length === 0) {
        throw new Error('Movie not found');
      }
      
      // Check if parent comment exists
      if (input.parentCommentId) {
        const parentComment = await db.query(
          'SELECT * FROM comments WHERE id = $1',
          [input.parentCommentId]
        );
        
        if (parentComment.rows.length === 0) {
          throw new Error('Parent comment not found');
        }
      }
      
      // Add comment
      const result = await db.query(
        `INSERT INTO comments (
          user_id, 
          movie_id, 
          content, 
          parent_comment_id, 
          created_at, 
          updated_at
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
        RETURNING *`,
        [
          user.id, 
          input.movieId, 
          input.content, 
          input.parentCommentId
        ]
      );
      
      return result.rows[0];
    },
    
    updateComment: async (_, { id, content }, { user, db }) => {
      if (!user) {
        throw new Error('You must be logged in to update a comment');
      }
      
      // Check if comment exists and belongs to user
      const comment = await db.query(
        'SELECT * FROM comments WHERE id = $1',
        [id]
      );
      
      if (comment.rows.length === 0) {
        throw new Error('Comment not found');
      }
      
      if (comment.rows[0].user_id !== user.id) {
        throw new Error('You can only update your own comments');
      }
      
      // Update comment
      const result = await db.query(
        `UPDATE comments 
         SET content = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING *`,
        [content, id]
      );
      
      return result.rows[0];
    },
    
    deleteComment: async (_, { id }, { user, db }) => {
      if (!user) {
        throw new Error('You must be logged in to delete a comment');
      }
      
      // Check if comment exists and belongs to user
      const comment = await db.query(
        'SELECT * FROM comments WHERE id = $1',
        [id]
      );
      
      if (comment.rows.length === 0) {
        throw new Error('Comment not found');
      }
      
      if (comment.rows[0].user_id !== user.id) {
        throw new Error('You can only delete your own comments');
      }
      
      // Delete comment
      await db.query(
        'DELETE FROM comments WHERE id = $1',
        [id]
      );
      
      return true;
    },
    
    likeComment: async (_, { commentId }, { user, db }) => {
      if (!user) {
        throw new Error('You must be logged in to like a comment');
      }
      
      // Check if comment exists
      const comment = await db.query(
        'SELECT * FROM comments WHERE id = $1',
        [commentId]
      );
      
      if (comment.rows.length === 0) {
        throw new Error('Comment not found');
      }
      
      // Check if user has already liked this comment
      const existingLike = await db.query(
        'SELECT * FROM comment_likes WHERE user_id = $1 AND comment_id = $2',
        [user.id, commentId]
      );
      
      if (existingLike.rows.length > 0) {
        return existingLike.rows[0];
      }
      
      // Add like
      const result = await db.query(
        `INSERT INTO comment_likes (
          user_id, 
          comment_id, 
          created_at
        ) VALUES ($1, $2, CURRENT_TIMESTAMP) 
        RETURNING *`,
        [user.id, commentId]
      );
      
      return result.rows[0];
    },
    
    unlikeComment: async (_, { commentId }, { user, db }) => {
      if (!user) {
        throw new Error('You must be logged in to unlike a comment');
      }
      
      // Delete like
      await db.query(
        'DELETE FROM comment_likes WHERE user_id = $1 AND comment_id = $2',
        [user.id, commentId]
      );
      
      return true;
    },
    
    // News mutations
    createNewsArticle: async (_, { input }, { user, db }) => {
      // Check if user is authorized (admin or author only operation)
      if (!user) {
        throw new Error('You must be logged in to create a news article');
      }
      
      // TODO: Add admin/author check if needed
      
      // Insert news article
      const result = await db.query(
        `INSERT INTO news (
          title, 
          content, 
          author_id, 
          image_url, 
          published_at, 
          updated_at
        ) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
        RETURNING *`,
        [
          input.title,
          input.content,
          user.id,
          input.imageUrl
        ]
      );
      
      const newsArticle = result.rows[0];
      
      // Add movie relationships if provided
      if (input.movieIds && input.movieIds.length > 0) {
        for (const movieId of input.movieIds) {
          await db.query(
            'INSERT INTO news_movies (news_id, movie_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [newsArticle.id, movieId]
          );
        }
      }
      
      return newsArticle;
    },
    
    updateNewsArticle: async (_, { id, input }, { user, db }) => {
      // Check if user is authorized (admin or author only operation)
      if (!user) {
        throw new Error('You must be logged in to update a news article');
      }
      
      // TODO: Add admin/author check if needed
      
      // Start building query
      const updates = [];
      const values = [];
      let paramCounter = 1;
      
      // Add fields to update
      if (input.title !== undefined) {
        updates.push(`title = $${paramCounter++}`);
        values.push(input.title);
      }
      
      if (input.content !== undefined) {
        updates.push(`content = $${paramCounter++}`);
        values.push(input.content);
      }
      
      if (input.imageUrl !== undefined) {
        updates.push(`image_url = $${paramCounter++}`);
        values.push(input.imageUrl);
      }
      
      // Add updated_at field
      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      
      // If nothing to update, return current news article
      if (updates.length === 1) { // Only updated_at
        const result = await db.query(
          'SELECT * FROM news WHERE id = $1',
          [id]
        );
        
        if (result.rows.length === 0) {
          throw new Error('News article not found');
        }
        
        return result.rows[0];
      }
      
      // Build and execute query
      values.push(id);
      const query = `
        UPDATE news 
        SET ${updates.join(', ')} 
        WHERE id = $${paramCounter} 
        RETURNING *
      `;
      
      const result = await db.query(query, values);
      const newsArticle = result.rows[0];
      
      if (!newsArticle) {
        throw new Error('News article not found');
      }
      
      // Update movie relationships if provided
      if (input.movieIds) {
        // First remove all existing movie relationships
        await db.query(
          'DELETE FROM news_movies WHERE news_id = $1',
          [id]
        );
        
        // Add new relationships
        if (input.movieIds.length > 0) {
          for (const movieId of input.movieIds) {
            await db.query(
              'INSERT INTO news_movies (news_id, movie_id) VALUES ($1, $2)',
              [id, movieId]
            );
          }
        }
      }
      
      return newsArticle;
    },
    
    deleteNewsArticle: async (_, { id }, { user, db }) => {
      // Check if user is authorized (admin or author only operation)
      if (!user) {
        throw new Error('You must be logged in to delete a news article');
      }
      
      // TODO: Add admin/author check if needed
      
      // Check if news article exists
      const newsArticle = await db.query(
        'SELECT * FROM news WHERE id = $1',
        [id]
      );
      
      if (newsArticle.rows.length === 0) {
        throw new Error('News article not found');
      }
      
      // Delete news article
      await db.query(
        'DELETE FROM news WHERE id = $1',
        [id]
      );
      
      return true;
    },
    
    // Quiz mutations
    createQuizQuestion: async (_, { input }, { user, db }) => {
      // Check if user is authorized (admin only operation)
      if (!user) {
        throw new Error('You must be logged in to create a quiz question');
      }
      
      // TODO: Add admin check if needed
      
      // Start transaction
      await db.query('BEGIN');
      
      try {
        // Insert question
        const questionResult = await db.query(
          'INSERT INTO quiz_questions (question_text, created_at) VALUES ($1, CURRENT_TIMESTAMP) RETURNING *',
          [input.questionText]
        );
        
        const question = questionResult.rows[0];
        
        // Insert answers
        const answers = [];
        for (const answerInput of input.answers) {
          const answerResult = await db.query(
            'INSERT INTO quiz_answers (question_id, answer_text, is_correct, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING *',
            [question.id, answerInput.answerText, answerInput.isCorrect || false]
          );
          
          answers.push(answerResult.rows[0]);
        }
        
        await db.query('COMMIT');
        
        return {
          ...question,
          answers
        };
      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }
    },
    
    submitQuizResult: async (_, { input }, { user, db }) => {
      if (!user) {
        throw new Error('You must be logged in to submit a quiz result');
      }
      
      // Check if question and answer exist and match
      const answer = await db.query(
        'SELECT * FROM quiz_answers WHERE id = $1 AND question_id = $2',
        [input.answerId, input.questionId]
      );
      
      if (answer.rows.length === 0) {
        throw new Error('Invalid answer for this question');
      }
      
      // Check if user has already answered this question
      const existingResult = await db.query(
        'SELECT * FROM user_quiz_results WHERE user_id = $1 AND question_id = $2',
        [user.id, input.questionId]
      );
      
      if (existingResult.rows.length > 0) {
        // Update existing result
        const result = await db.query(
          `UPDATE user_quiz_results 
           SET answer_id = $1, answered_at = CURRENT_TIMESTAMP 
           WHERE user_id = $2 AND question_id = $3 
           RETURNING *`,
          [input.answerId, user.id, input.questionId]
        );
        
        return result.rows[0];
      } else {
        // Create new result
        const result = await db.query(
          `INSERT INTO user_quiz_results (
            user_id, 
            question_id, 
            answer_id, 
            answered_at
          ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) 
          RETURNING *`,
          [user.id, input.questionId, input.answerId]
        );
        
        return result.rows[0];
      }
    },
    
    // Recommendation mutations
    createRecommendation: async (_, { sourceMovieId, recommendedMovieId, strength }, { user, db }) => {
      // Check if user is authorized (admin only operation)
      if (!user) {
        throw new Error('You must be logged in to create a recommendation');
      }
      
      // TODO: Add admin check if needed
      
      // Check if movies exist
      const sourceMovie = await db.query(
        'SELECT * FROM movies WHERE id = $1',
        [sourceMovieId]
      );
      
      if (sourceMovie.rows.length === 0) {
        throw new Error('Source movie not found');
      }
      
      const recommendedMovie = await db.query(
        'SELECT * FROM movies WHERE id = $1',
        [recommendedMovieId]
      );
      
      if (recommendedMovie.rows.length === 0) {
        throw new Error('Recommended movie not found');
      }
      
      // Check if recommendation already exists
      const existingRecommendation = await db.query(
        'SELECT * FROM movie_recommendations WHERE source_movie_id = $1 AND recommended_movie_id = $2',
        [sourceMovieId, recommendedMovieId]
      );
      
      if (existingRecommendation.rows.length > 0) {
        // Update existing recommendation
        const result = await db.query(
          `UPDATE movie_recommendations 
           SET recommendation_strength = $1, created_at = CURRENT_TIMESTAMP 
           WHERE source_movie_id = $2 AND recommended_movie_id = $3 
           RETURNING *`,
          [strength, sourceMovieId, recommendedMovieId]
        );
        
        return result.rows[0];
      } else {
        // Create new recommendation
        const result = await db.query(
          `INSERT INTO movie_recommendations (
            source_movie_id, 
            recommended_movie_id, 
            recommendation_strength, 
            created_at
          ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) 
          RETURNING *`,
          [sourceMovieId, recommendedMovieId, strength]
        );
        
        return result.rows[0];
      }
    }
  },
  
  // Field resolvers
  User: {
    lists: async (user, _, { db }) => {
      const result = await db.query(
        'SELECT * FROM user_lists WHERE user_id = $1',
        [user.id]
      );
      return result.rows;
    },
    
    ratings: async (user, _, { db }) => {
      const result = await db.query(
        'SELECT * FROM user_ratings WHERE user_id = $1',
        [user.id]
      );
      return result.rows;
    },
    
    comments: async (user, _, { db }) => {
      const result = await db.query(
        'SELECT * FROM comments WHERE user_id = $1',
        [user.id]
      );
      return result.rows;
    }
  },
  
  Movie: {
    genres: async (movie, _, { db }) => {
      const result = await db.query(
        `SELECT g.* FROM genres g
         JOIN movie_genres mg ON g.id = mg.genre_id
         WHERE mg.movie_id = $1`,
        [movie.id]
      );
      return result.rows;
    },
    
    persons: async (movie, _, { db }) => {
      const result = await db.query(
        'SELECT * FROM movie_persons WHERE movie_id = $1',
        [movie.id]
      );
      return result.rows;
    },
    
    comments: async (movie, _, { db }) => {
      const result = await db.query(
        'SELECT * FROM comments WHERE movie_id = $1 AND parent_comment_id IS NULL',
        [movie.id]
      );
      return result.rows;
    },
    
    recommendations: async (movie, _, { db }) => {
      const result = await db.query(
        `SELECT mr.* FROM movie_recommendations mr
         WHERE mr.source_movie_id = $1`,
        [movie.id]
      );
      return result.rows;
    },
    
    news: async (movie, _, { db }) => {
      const result = await db.query(
        `SELECT n.* FROM news n
         JOIN news_movies nm ON n.id = nm.news_id
         WHERE nm.movie_id = $1`,
        [movie.id]
      );
      return result.rows;
    }
  },
  
  Genre: {
    movies: async (genre, _, { db }) => {
      const result = await db.query(
        `SELECT m.* FROM movies m
         JOIN movie_genres mg ON m.id = mg.movie_id
         WHERE mg.genre_id = $1`,
        [genre.id]
      );
      return result.rows;
    }
  },
  
  Person: {
    movieRoles: async (person, _, { db }) => {
      const result = await db.query(
        'SELECT * FROM movie_persons WHERE person_id = $1',
        [person.id]
      );
      return result.rows;
    }
  },
  
  MoviePerson: {
    movie: async (moviePerson, _, { db }) => {
      const result = await db.query(
        'SELECT * FROM movies WHERE id = $1',
        [moviePerson.movie_id]
      );
      return result.rows[0];
    },
    
    person: async (moviePerson, _, { db }) => {
      const result = await db.query(
        'SELECT * FROM persons WHERE id = $1',
        [moviePerson.person_id]
      );
      return result.rows[0];
    }
  },
  
  UserRating: {
    user: async (rating, _, { db }) => {
      const result = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [rating.user_id]
      );
      return result.rows[0];
    },
    
    movie: async (rating, _, { db }) => {
      const result = await db.query(
        'SELECT * FROM movies WHERE id = $1',
        [rating.movie_id]
      );
      return result.rows[0];
    }
  },
  
  UserList: {
    user: async (list, _, { db }) => {
      const result = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [list.user_id]
      );
      return result.rows[0];
    },
    
    movies: async (list, _, { db }) => {
      const result = await db.query(
        `SELECT m.* FROM movies m
         JOIN user_list_items uli ON m.id = uli.movie_id
         WHERE uli.list_id = $1`,
        [list.id]
      );
      return result.rows;
    }
  },
  
  Comment: {
    user: async (comment, _, { db }) => {
      const result = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [comment.user_id]
      );
      return result.rows[0];
    },
    
    movie: async (comment, _, { db }) => {
      const result = await db.query(
        'SELECT * FROM movies WHERE id = $1',
        [comment.movie_id]
      );
      return result.rows[0];
    },
    
    parentComment: async (comment, _, { db }) => {
      if (!comment.parent_comment_id) return null;
      
      const result = await db.query(
        'SELECT * FROM comments WHERE id = $1',
        [comment.parent_comment_id]
      );
      return result.rows[0];
    },
    
    replies: async (comment, _, { db }) => {
      const result = await db.query(
        'SELECT * FROM comments WHERE parent_comment_id = $1',
        [comment.id]
      );
      return result.rows;
    },
    
    likes: async (comment, _, { db }) => {
      const result = await db.query(
        'SELECT * FROM comment_likes WHERE comment_id = $1',
        [comment.id]
      );
      return result.rows;
    },
    
    likeCount: async (comment, _, { db }) => {
      const result = await db.query(
        'SELECT COUNT(*) FROM comment_likes WHERE comment_id = $1',
        [comment.id]
      );
      return parseInt(result.rows[0].count);
    }
  },
  
  CommentLike: {
    user: async (like, _, { db }) => {
      const result = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [like.user_id]
      );
      return result.rows[0];
    },
    
    comment: async (like, _, { db }) => {
      const result = await db.query(
        'SELECT * FROM comments WHERE id = $1',
        [like.comment_id]
      );
      return result.rows[0];
    }
  },
  
  News: {
    author: async (news, _, { db }) => {
      if (!news.author_id) return null;
      
      const result = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [news.author_id]
      );
      return result.rows[0];
    },
    
    movies: async (news, _, { db }) => {
      const result = await db.query(
        `SELECT m.* FROM movies m
         JOIN news_movies nm ON m.id = nm.movie_id
         WHERE nm.news_id = $1`,
        [news.id]
      );
      return result.rows;
    }
  },
  
  MovieRecommendation: {
    sourceMovie: async (recommendation, _, { db }) => {
      const result = await db.query(
        'SELECT * FROM movies WHERE id = $1',
        [recommendation.source_movie_id]
      );
      return result.rows[0];
    },
    
    recommendedMovie: async (recommendation, _, { db }) => {
      const result = await db.query(
        'SELECT * FROM movies WHERE id = $1',
        [recommendation.recommended_movie_id]
      );
      return result.rows[0];
    }
  },
  
  QuizQuestion: {
    answers: async (question, _, { db }) => {
      const result = await db.query(
        'SELECT * FROM quiz_answers WHERE question_id = $1',
        [question.id]
      );
      return result.rows;
    }
  },
  
  QuizAnswer: {
    question: async (answer, _, { db }) => {
      const result = await db.query(
        'SELECT * FROM quiz_questions WHERE id = $1',
        [answer.question_id]
      );
      return result.rows[0];
    }
  },
  
  UserQuizResult: {
    user: async (result, _, { db }) => {
      const result = await db.query(
        'SELECT * FROM users WHERE id = $1',
        [result.user_id]
      );
      return result.rows[0];
    },
    
    question: async (result, _, { db }) => {
      const result = await db.query(
        'SELECT * FROM quiz_questions WHERE id = $1',
        [result.question_id]
      );
      return result.rows[0];
    },
    
    answer: async (result, _, { db }) => {
      const result = await db.query(
        'SELECT * FROM quiz_answers WHERE id = $1',
        [result.answer_id]
      );
      return result.rows[0];
    }
  }
};

module.exports = { resolvers };