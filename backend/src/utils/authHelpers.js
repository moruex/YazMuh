const { GraphQLError } = require('graphql');

// Define role hierarchy (adjust if needed)
const rolesHierarchy = { CONTENT_MODERATOR: 1, ADMIN: 2, SUPER_ADMIN: 3 };

/**
 * Checks if a user is logged in via context.
 * Throws UNAUTHENTICATED error if not.
 */
const ensureLoggedIn = (userContext) => {
    if (!userContext || !userContext.id) {
        throw new GraphQLError('Authentication required. Please log in.', { extensions: { code: 'UNAUTHENTICATED' } });
    }
};

/**
 * Checks if an admin is logged in via context.
 * Throws UNAUTHENTICATED error if not.
 */
const ensureAdminLoggedIn = (adminContext) => {
    if (!adminContext || !adminContext.id) {
        throw new GraphQLError('Admin authentication required. Please log in.', { extensions: { code: 'UNAUTHENTICATED' } });
    }
};

/**
 * Checks if the logged-in admin has the required role or higher.
 * Throws UNAUTHENTICATED if not logged in, FORBIDDEN if insufficient role.
 */
const ensureAdminRole = (adminContext, requiredRole = 'ADMIN') => {
    ensureAdminLoggedIn(adminContext); // First check login

    const userLevel = rolesHierarchy[adminContext.role] || 0;
    const requiredLevel = rolesHierarchy[requiredRole] || 0;

    if (userLevel < requiredLevel) {
        console.warn(`Authorization failed: Admin ${adminContext.id} (Role: ${adminContext.role}) attempted action requiring ${requiredRole}.`);
        throw new GraphQLError(`Insufficient privileges. Requires ${requiredRole} role or higher.`, { extensions: { code: 'FORBIDDEN' } });
    }
};

/**
 * Simple check if an admin object exists in context (used where specific role isn't needed yet).
 * Throws UNAUTHENTICATED error if not.
 */
const ensureAdmin = (adminContext) => {
    ensureAdminLoggedIn(adminContext); // Essentially the same check for basic presence
};


module.exports = {
    ensureLoggedIn,
    ensureAdminLoggedIn,
    ensureAdminRole,
    ensureAdmin, // Export the basic admin check too
    rolesHierarchy // Export hierarchy if needed elsewhere
}; 