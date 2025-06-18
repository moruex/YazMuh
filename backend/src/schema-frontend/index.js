// src/frontend-schema/index.js
// const { gql } = require('@apollo/server');
const gql = require('graphql-tag');
const { merge } = require('lodash');
const { makeExecutableSchema } = require('@graphql-tools/schema');

const { typeDefs: recommendationTypeDefs, resolvers: recommendationResolvers } = require('./recommendations');
const { typeDefs: movieDetailsTypeDefs, resolvers: movieDetailsResolvers } = require('./movie-details');


//  Base types
const baseTypeDefs = gql`
  scalar DateTime
  scalar Date

  type Query { _empty: String }
  type Mutation { _empty: String }
`;

// Combine type definitions
const typeDefs = [
    baseTypeDefs,
    recommendationTypeDefs,
    movieDetailsTypeDefs,
];

// Merge resolvers
const resolvers = merge(
    recommendationResolvers,
    movieDetailsResolvers,
);

// Create schema
const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
});

module.exports = schema;
