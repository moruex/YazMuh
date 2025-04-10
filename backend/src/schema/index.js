// src/schema/index.js
// const { gql } = require('apollo-server-express');
const { gql } = require('@apollo/server');
const { merge } = require('lodash');
const { makeExecutableSchema } = require('@graphql-tools/schema');

// Import definitions and resolvers
const { typeDefs: scalarTypeDefs, resolvers: scalarResolvers } = require('./scalars');
const { typeDefs: userTypeDefs, resolvers: userResolvers } = require('./user');
const { typeDefs: adminTypeDefs, resolvers: adminResolvers } = require('./admin');
const { typeDefs: movieTypeDefs, resolvers: movieResolvers } = require('./movie');
const { typeDefs: genreTypeDefs, resolvers: genreResolvers } = require('./genre');
const { typeDefs: personTypeDefs, resolvers: personResolvers } = require('./person');
const { typeDefs: commentTypeDefs, resolvers: commentResolvers } = require('./comment');
const { typeDefs: newsTypeDefs, resolvers: newsResolvers } = require('./news');
const { typeDefs: quizTypeDefs, resolvers: quizResolvers } = require('./quiz');
const { typeDefs: fileTypeDefs, resolvers: fileResolvers } = require('./file');

// Base types
const baseTypeDefs = gql`
  scalar DateTime
  scalar Date

  type Query { _empty: String }
  type Mutation { _empty: String }
`;

// Combine type definitions
const typeDefs = [
  baseTypeDefs,
  scalarTypeDefs,
  userTypeDefs,
  adminTypeDefs,
  movieTypeDefs,
  genreTypeDefs,
  personTypeDefs,
  commentTypeDefs,
  newsTypeDefs,
  quizTypeDefs,
  fileTypeDefs,
];

// Merge resolvers
const resolvers = merge(
  {},
  scalarResolvers,
  userResolvers,
  adminResolvers,
  movieResolvers,
  genreResolvers,
  personResolvers,
  commentResolvers,
  newsResolvers,
  quizResolvers,
  fileResolvers
);

// Create schema
const schema = makeExecutableSchema({
   typeDefs,
   resolvers,
});

module.exports = schema;