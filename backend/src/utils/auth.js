// src/utils/auth.js
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db'); // To fetch user details after verifying token

const getUserFromToken = async (token) => {
    if (!token) {
        return null;
    }
    // Remove 'Bearer ' prefix if present
    const actualToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    try {
        const decoded = jwt.verify(actualToken, config.jwtSecret);

        // Token is valid, fetch user from DB based on decoded ID
        // Select only necessary, non-sensitive fields
        const result = await db.query(
            'SELECT id, email, username, first_name, last_name, bio, avatar_image, created_at, updated_at FROM users WHERE id = $1',
            [decoded.id]
        );

        if (!result.rows[0]) {
            console.warn(`User ${decoded.id} from valid token not found in DB.`);
            return null; // User deleted after token was issued?
        }

        // Return the user object (without password hash!)
        return result.rows[0];

    } catch (error) {
        // Token verification failed (expired, invalid signature, etc.)
        // console.error('JWT verification error:', error.message);
        return null;
    }
};

module.exports = { getUserFromToken };