// src/schema/scalars.js
const { GraphQLScalarType, Kind } = require('graphql');
const { GraphQLDateTime, GraphQLDate } = require('graphql-scalars');
// const { gql } = require('@apollo/server');
const gql = require('graphql-tag');

const typeDefs = gql`
  scalar Date # Corresponds to GraphQLDate from graphql-scalars
  scalar DateTime # Corresponds to GraphQLDateTime from graphql-scalars
  # scalar ByteArray # Removed as no longer used by User.avatar_url
`;

const resolvers = {
  // Use the scalars directly from graphql-scalars
  Date: GraphQLDate,
  DateTime: GraphQLDateTime,
  // ByteArray resolver removed
};

module.exports = { typeDefs, resolvers };