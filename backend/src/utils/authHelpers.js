const { GraphQLError } = require('graphql');

// Define role hierarchy (adjust if needed)
const rolesHierarchy = { CONTENT_MODERATOR: 1, ADMIN: 2, SUPER_ADMIN: 3 };

module.exports = {
    rolesHierarchy
}; 
