// src/context.js
const db = require('./db');
const { getUserFromToken } = require('./utils/auth');

const createContext = async ({ req }) => {
    // Get the authorization token from the headers
    const token = req.headers.authorization || '';

    // Verify the token and fetch the user
    const user = await getUserFromToken(token);

    // Return the context object available to all resolvers
    return {
        db,     // The database query function/pool
        user,   // The authenticated user object (or null if not logged in/invalid token)
        req,    // The raw request object (use sparingly)
    };
};

module.exports = { createContext };