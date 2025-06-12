// src/context.js
const db = require('./db');

const createContext = async ({ req }) => {
    // Return the context object available to all resolvers
    return {
        db,     // The database query function/pool
        req,    // The raw request object (use sparingly)
    };
};

module.exports = { createContext };