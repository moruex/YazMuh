// src/schema/admin.js
// const { gql } = require('@apollo/server');
const gql = require('graphql-tag');
const { GraphQLError } = require('graphql');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const ms = require('ms');
const config = require('../config'); // Use centralized config

// --- Helper Functions ---

// Checks if context.admin (populated by middleware) exists.
// Throws error if not logged in as an admin.
const _ensureAdminLoggedIn = (context) => {
  // context.admin might just contain { id, role } from the minimal middleware
  if (!context.admin || !context.admin.id) {
    throw new GraphQLError('Admin authentication required. Please log in.', { extensions: { code: 'UNAUTHENTICATED' } });
  }
};

// Checks role AFTER ensuring logged in
const _ensureAdminRole = (context, requiredRole = 'ADMIN') => {
  _ensureAdminLoggedIn(context); // First, ensure logged in

  const adminUser = context.admin; // Contains { id, role }
  const rolesHierarchy = { CONTENT_MODERATOR: 1, ADMIN: 2, SUPER_ADMIN: 3 };
  const userLevel = rolesHierarchy[adminUser.role] || 0;
  const requiredLevel = rolesHierarchy[requiredRole] || 0;

  if (userLevel < requiredLevel) {
    console.warn(`Authorization failed: Admin ${adminUser.id} (Role: ${adminUser.role}) attempted action requiring ${requiredRole}.`);
    throw new GraphQLError(`Insufficient privileges. Requires ${requiredRole} role or higher.`, { extensions: { code: 'FORBIDDEN' } });
  }
};

// --- Fetch Full Admin Object (Helper for Resolvers) ---
// Use this when a resolver needs more than just id/role from context.admin
async function getFullAdminFromContext(context) {
  _ensureAdminLoggedIn(context);
  const adminId = context.admin.id;
  // Use DataLoader if available and appropriate
  if (context.loaders?.adminLoader) {
    // Ensure DataLoader also fetches user details including avatar_url
    // (Implementation of DataLoader not shown, assume it's configured correctly)
    return await context.loaders.adminLoader.load(adminId);
  }
  // Fallback to direct query (select needed fields, excluding password)
  const { rows } = await context.db.query(
    `SELECT a.id, a.username, a.role, a.created_at, a.updated_at, a.user_id,
                u.id as user_id_alias, u.username as user_username, u.email as user_email, u.avatar_url as user_avatar_url -- Added avatar_url
         FROM admins a
         LEFT JOIN users u ON a.user_id = u.id
         WHERE a.id = $1`, [adminId]
  );
  if (!rows[0]) {
    throw new GraphQLError('Admin account not found for authenticated session.', { extensions: { code: 'NOT_FOUND' } }); // Should not happen if token is valid
  }
  // Destructure the new field
  const { user_id_alias, user_username, user_email, user_avatar_url, ...adminData } = rows[0];
  // Include avatar_url in the nested user object
  adminData.user = user_id_alias
    ? { id: user_id_alias, username: user_username, email: user_email, avatar_url: user_avatar_url }
    : null;
  return adminData;
}


// --- GraphQL Definitions ---
const typeDefs = gql`
  scalar DateTime
  scalar Date
  scalar Inet

  enum AdminRole { SUPER_ADMIN ADMIN CONTENT_MODERATOR }

  type Admin {
    id: ID!
    username: String!
    role: AdminRole!
    user: User # Assumes User type includes avatar_url
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AdminSession {
      id: ID!
      token_jti: String! # Show JTI for reference
      user_agent: String
      ip_address: String # Use String or Inet scalar
      created_at: DateTime!
      expires_at: DateTime!
      last_used_at: DateTime
      is_current: Boolean # Flag indicates if this matches the token used for the current request
  }

  type AdminLoginPayload { token: String! admin: Admin! }
  type ForgotPasswordPayload { success: Boolean! message: String! } # Keep insecure version for now

  input AdminLoginInput { username: String! password: String! }
  input ForgotPasswordInput { username: String! }

  input UpdateAdminSelfInput {
    username: String
    currentPassword: String # Required only if changing password
    newPassword: String
  }

  input CreateAdminInput {
    userId: ID! # Assuming User MUST exist first
    username: String!
    password: String!
    role: AdminRole = ADMIN
  }

  input UpdateAdminInput { username: String role: AdminRole }

  extend type Query {
    # meAdmin uses context directly
    meAdmin: Admin

    # These require specific roles, checked within resolvers
    admin(id: ID!): Admin
    admins(limit: Int = 10, offset: Int = 0, search: String): [Admin!]!
    # users(limit: Int = 20, offset: Int = 0, search: String): [User!]! # Keep existing
    adminCount: Int!
    myAdminSessions: [AdminSession!]!
  }

  extend type Mutation {
    # Public
    adminLogin(input: AdminLoginInput!): AdminLoginPayload!
    forgotPassword(input: ForgotPasswordInput!): ForgotPasswordPayload! # Still insecure

    # Require Admin Login
    adminLogout: Boolean!
    adminLogoutSession(jti: String!): Boolean!
    updateAdminSelf(input: UpdateAdminSelfInput!): Admin!

    # Require SUPER_ADMIN
    createAdmin(input: CreateAdminInput!): Admin!
    updateAdmin(id: ID!, input: UpdateAdminInput!): Admin!
    deleteAdmin(id: ID!): Boolean!
  }
`;

// --- Resolvers ---
const resolvers = {
  Query: {
    meAdmin: async (_, __, context) => {
      // This resolver uses getFullAdminFromContext which now includes avatar_url
      if (!context.admin || !context.admin.id) {
        return null; // Not logged in as admin
      }
      try {
        // Fetch full data including nested user with avatar_url
        return await getFullAdminFromContext(context);
      } catch (err) {
        console.error("Error fetching full admin in meAdmin:", err);
        // If getFullAdminFromContext fails (e.g., user deleted after token issued but before query)
        // return null to signify the admin data isn't available.
        return null;
      }
    },

    admin: async (_, { id }, context) => {
      _ensureAdminRole(context, 'SUPER_ADMIN'); // Check role
      // This query already selected avatar_url, just ensure aliases match logic
      const { rows } = await context.db.query(
        `SELECT a.*, u.id as uid, u.username as uname, u.avatar_url as uavatar_url, u.email as uemail -- etc
           FROM admins a LEFT JOIN users u ON a.user_id = u.id WHERE a.id = $1`, [id]);
      if (rows.length === 0) {
        throw new GraphQLError(`Admin account with ID ${id} not found.`, { extensions: { code: 'NOT_FOUND' } });
      }
      const { uid, uname, uemail, uavatar_url, ...adminData } = rows[0]; // Ensure uavatar_url is destructured
      adminData.user = uid ? { id: uid, username: uname, email: uemail, avatar_url: uavatar_url } : null; // Add avatar_url here
      return adminData;
    },

    admins: async (_, { limit = 10, offset = 0, search }, context) => {
      _ensureAdminRole(context, 'SUPER_ADMIN');
      
      let query, queryParams;
      
      if (search) {
        query = `
          SELECT a.*, u.id as uid, u.username as uname, u.email as uemail, u.avatar_url as uavatar_url
          FROM admins a
          LEFT JOIN users u ON a.user_id = u.id
          WHERE u.username ILIKE $3 OR u.email ILIKE $3
          ORDER BY a.created_at DESC 
          LIMIT $1 OFFSET $2`;
        queryParams = [limit, offset, `%${search}%`];
      } else {
        query = `
          SELECT a.*, u.id as uid, u.username as uname, u.email as uemail, u.avatar_url as uavatar_url
          FROM admins a
          LEFT JOIN users u ON a.user_id = u.id
          ORDER BY a.created_at DESC 
          LIMIT $1 OFFSET $2`;
        queryParams = [limit, offset];
      }
      
      const { rows } = await context.db.query(query, queryParams);
      return rows.map(row => {
        const { uid, uname, uemail, uavatar_url, ...adminData } = row;
        adminData.user = uid ? { id: uid, username: uname, email: uemail, avatar_url: uavatar_url } : null;
        return adminData;
      });
    },

    adminCount: async (_, __, context) => {
      _ensureAdminRole(context, 'SUPER_ADMIN');
      const { rows } = await context.db.query('SELECT COUNT(*) FROM admins');
      return parseInt(rows[0].count, 10);
    },

    myAdminSessions: async (_, __, context) => {
      _ensureAdminLoggedIn(context); // Ensure admin is logged in
      const currentJti = context.tokenPayload?.jti; // JTI from the token used for *this* request
      const adminId = context.admin.id;

      const { rows } = await context.db.query(
        `SELECT id, token_jti, user_agent, ip_address::text, created_at, expires_at, last_used_at
           FROM admin_sessions
           WHERE admin_id = $1 AND revoked_at IS NULL -- Show only active sessions
           ORDER BY last_used_at DESC NULLS LAST, created_at DESC`,
        [adminId]
      );

      return rows.map(session => ({
        ...session,
        is_current: currentJti === session.token_jti // Check if session JTI matches current token JTI
      }));
    }
  },

  Mutation: {
    adminLogin: async (_, { input }, { db, req }) => {
      const { username, password } = input;
      // Find admin user by username
      const query = 'SELECT id, username, role, password_hash, user_id FROM admins WHERE lower(username) = lower($1)';
      const { rows } = await db.query(query, [username]);
      const admin = rows[0];

      // Verify password
      if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
        console.warn(`Admin login failed for username: ${username}`);
        throw new GraphQLError('Invalid admin username or password.', { extensions: { code: 'UNAUTHENTICATED' } });
      }

      // --- Session Creation ---
      const jti = uuidv4(); // Unique ID for this token/session
      const expiresInMs = ms(config.adminJwtExpiresIn);
      const expiresAt = new Date(Date.now() + expiresInMs);
      const userAgent = req?.headers['user-agent'] ?? null;
      const ipAddress = req?.headers['x-forwarded-for']?.split(',')[0].trim() || req?.socket?.remoteAddress || null;

      try {
        // Store session record (using JTI)
        await db.query(
          `INSERT INTO admin_sessions (admin_id, token_jti, expires_at, user_agent, ip_address, last_used_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           ON CONFLICT (token_jti) DO NOTHING`, // Handle rare JTI collision if needed
          [admin.id, jti, expiresAt, userAgent, ipAddress]
        );
      } catch (dbError) {
        console.error(`Failed to create admin session record for ${username}:`, dbError);
        throw new GraphQLError('Login failed: Could not record session.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }

      // --- JWT Generation ---
      const tokenPayload = {
        adminId: admin.id,
        role: admin.role,
        jti: jti // Embed the JTI in the token
      };
      const token = jwt.sign(tokenPayload, config.adminJwtSecret, {
        expiresIn: config.adminJwtExpiresIn,
      });

      console.log(`Admin login successful: ${admin.username} (ID: ${admin.id}), Session JTI: ${jti}`);

      // Fetch full admin data for payload using the helper function
      // This now includes the nested user with avatar_url thanks to the update in getFullAdminFromContext
      const fullAdmin = await getFullAdminFromContext({ admin: { id: admin.id, role: admin.role }, db});
      return { token, admin: fullAdmin };
    },

    // Logout the *current* session identified by the token used for this request
    adminLogout: async (_, __, context) => {
      _ensureAdminLoggedIn(context); // Ensure logged in
      const jti = context.tokenPayload?.jti; // JTI from the current token
      const adminId = context.admin.id;

      if (!jti) {
        console.error(`Admin logout attempt for ${adminId} without a JTI in context payload.`);
        throw new GraphQLError("Cannot logout: Session identifier missing.", { extensions: { code: 'UNAUTHENTICATED' } });
      }

      try {
        // Mark the specific session as revoked
        const result = await context.db.query(
          `UPDATE admin_sessions
                 SET revoked_at = NOW()
                 WHERE admin_id = $1 AND token_jti = $2 AND revoked_at IS NULL`,
          [adminId, jti]
        );
        if (result.rowCount > 0) {
          console.log(`Admin session revoked via logout: User ${adminId}, JTI ${jti}`);
          return true;
        }
        console.warn(`Admin logout: No active session found to revoke for User ${adminId}, JTI ${jti}`);
        return false;
      } catch (err) {
        console.error(`Error revoking admin session (logout) for User ${adminId}, JTI ${jti}:`, err);
        throw new GraphQLError("Logout failed due to a server error.", { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
    },

    // Logout a *specific* session by its JTI (e.g., from the session list)
    adminLogoutSession: async (_, { jti }, context) => {
      _ensureAdminLoggedIn(context); // Ensure current user is an admin
      const adminId = context.admin.id; // ID of the admin *requesting* the logout

      if (!jti) {
        throw new GraphQLError("Session identifier (JTI) is required.", { extensions: { code: 'BAD_USER_INPUT' } });
      }

      try {
        // Only allow admin to revoke their *own* sessions
        const result = await context.db.query(
          `UPDATE admin_sessions
                 SET revoked_at = NOW()
                 WHERE admin_id = $1 AND token_jti = $2 AND revoked_at IS NULL`,
          [adminId, jti] // Use adminId from context
        );
        if (result.rowCount > 0) {
          console.log(`Admin session revoked by JTI: Requesting User ${adminId}, Target JTI ${jti}`);
          return true;
        }
        console.warn(`Admin specific logout: No active session found for User ${adminId} with JTI ${jti}`);
        return false;
      } catch (err) {
        console.error(`Error during specific admin session revocation for User ${adminId}, JTI ${jti}:`, err);
        throw new GraphQLError("Session revocation failed due to a server error.", { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
    },

    forgotPassword: async (_, { input }, { db }) => {
      // ... (Keep existing insecure logic for now) ...
      console.warn(`SECURITY RISK: Insecure password reset attempt for admin: ${input.username}`);
      const { username } = input;
      const defaultPassword = 'newDefaultPassword123!'; // NEVER use a hardcoded default in production
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

      try {
        const { rowCount } = await db.query(
          'UPDATE admins SET password_hash = $1, updated_at = NOW() WHERE lower(username) = lower($2)',
          [passwordHash, username]
        );

        if (rowCount === 0) {
           console.warn(`Insecure forgot password: Admin user not found: ${username}`);
           // Still return success-like message to avoid user enumeration
           return { success: true, message: "If your admin account exists, a reset has been processed (INSECURE - DEV ONLY)." };
        }

        console.log(`INSECURE: Password for admin ${username} reset to default.`);
        // In a real scenario, you would email a reset link, not change the password directly.
        // Also, revoke all existing sessions for this admin.
         const { rows: adminRows } = await db.query('SELECT id FROM admins WHERE lower(username) = lower($1)', [username]);
         if(adminRows.length > 0) {
            const adminId = adminRows[0].id;
            await db.query('UPDATE admin_sessions SET revoked_at = NOW() WHERE admin_id = $1 AND revoked_at IS NULL', [adminId]);
            console.log(`INSECURE: Revoked active sessions for admin ${username} after insecure password reset.`);
         }


        return { success: true, message: "Password reset processed (INSECURE - DEV ONLY)." };
      } catch (err) {
        console.error(`Error during insecure password reset for admin ${username}:`, err);
        throw new GraphQLError("Password reset failed due to a server error.", { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
    },

    updateAdminSelf: async (_, { input }, context) => {
      _ensureAdminLoggedIn(context); // Check login
      const adminId = context.admin.id;
      const { username, currentPassword, newPassword } = input;

      if (!username && !newPassword) {
        throw new GraphQLError('No updates provided. Please specify a new username or password.', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      const updates = [];
      const values = [];
      let valueCounter = 1;

      // Fetch current admin data for password check if needed
      const { rows: currentAdminRows } = await context.db.query('SELECT username, password_hash FROM admins WHERE id = $1', [adminId]);
      if (currentAdminRows.length === 0) {
          throw new GraphQLError('Admin account not found.', { extensions: { code: 'NOT_FOUND' } }); // Should not happen if logged in
      }
      const currentAdmin = currentAdminRows[0];

      // Handle username update
      if (username && username !== currentAdmin.username) {
        // Optional: Check if username already exists
        const { rows: existingUser } = await context.db.query('SELECT id FROM admins WHERE lower(username) = lower($1) AND id != $2', [username, adminId]);
        if (existingUser.length > 0) {
          throw new GraphQLError(`Username "${username}" is already taken.`, { extensions: { code: 'BAD_USER_INPUT' } });
        }
        updates.push(`username = $${valueCounter++}`);
        values.push(username);
      }

      // Handle password update
      if (newPassword) {
        if (!currentPassword) {
          throw new GraphQLError('Current password is required to set a new password.', { extensions: { code: 'BAD_USER_INPUT' } });
        }
        const validPassword = await bcrypt.compare(currentPassword, currentAdmin.password_hash);
        if (!validPassword) {
          throw new GraphQLError('Incorrect current password.', { extensions: { code: 'UNAUTHENTICATED' } });
        }
        // Optional: Add password complexity rules here
        if (newPassword.length < 8) { // Example minimum length
            throw new GraphQLError('New password must be at least 8 characters long.', { extensions: { code: 'BAD_USER_INPUT' } });
        }
        const saltRounds = 12;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
        updates.push(`password_hash = $${valueCounter++}`);
        values.push(newPasswordHash);
      }

      if (updates.length === 0) {
         // This case might happen if the provided username is the same as the current one and no password was provided
         console.log(`UpdateAdminSelf: No actual changes detected for admin ${adminId}`);
          // Return current data as no update query is needed
         return await getFullAdminFromContext(context);
      }

      updates.push(`updated_at = NOW()`); // Always update timestamp

      values.push(adminId); // Add adminId for the WHERE clause

      const updateQuery = `UPDATE admins SET ${updates.join(', ')} WHERE id = $${valueCounter} RETURNING *`; // Return updated row

      try {
        const { rows: updatedAdminRows } = await context.db.query(updateQuery, values);
         if (updatedAdminRows.length === 0) {
             throw new GraphQLError('Failed to update admin profile.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } }); // Should not happen if WHERE clause is correct
         }
        console.log(`Admin profile updated successfully for ID: ${adminId}`);
        // Use getFullAdminFromContext to return the correctly structured object with nested user
        // Pass the minimal updated admin context to ensure fresh data fetch
        const minimalContext = { admin: { id: updatedAdminRows[0].id, role: updatedAdminRows[0].role }, db: context.db, loaders: context.loaders };
        return await getFullAdminFromContext(minimalContext);
      } catch (err) {
        console.error(`Error updating admin profile for ID ${adminId}:`, err);
         if (err instanceof GraphQLError) {
           throw err; // Re-throw specific Apollo errors
         }
        throw new GraphQLError('Failed to update admin profile due to a server error.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
    },

    createAdmin: async (_, { input }, context) => {
      _ensureAdminRole(context, 'SUPER_ADMIN'); // Check role
      const { userId, username, password, role } = input;

      // 1. Validate Input (e.g., password complexity)
       if (password.length < 8) { // Example minimum length
            throw new GraphQLError('Password must be at least 8 characters long.', { extensions: { code: 'BAD_USER_INPUT' } });
        }

      // 2. Check if User exists and is not already an admin
      const { rows: userRows } = await context.db.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (userRows.length === 0) {
        throw new GraphQLError(`User with ID ${userId} not found.`, { extensions: { code: 'NOT_FOUND' } });
      }
      const { rows: existingAdminRows } = await context.db.query('SELECT id FROM admins WHERE user_id = $1 OR lower(username) = lower($2)', [userId, username]);
      if (existingAdminRows.length > 0) {
        throw new GraphQLError('An admin account already exists for this user or username.', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      // 3. Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // 4. Insert into admins table
      const insertQuery = `
        INSERT INTO admins (id, user_id, username, password_hash, role)
        VALUES (uuid_generate_v4(), $1, $2, $3, $4)
        RETURNING id, role`; // Return needed info for getFullAdminFromContext
      try {
        const { rows: newAdminRows } = await context.db.query(insertQuery, [userId, username, passwordHash, role]);
        if (newAdminRows.length === 0) {
            throw new GraphQLError("Failed to create admin record.", { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
        }
        const newAdminId = newAdminRows[0].id;
        const newAdminRole = newAdminRows[0].role;
        console.log(`Admin created: ${username} (ID: ${newAdminId}) linked to User ID: ${userId}`);

        // 5. Fetch and return the full new admin object
        // Pass minimal context needed by the helper
        return await getFullAdminFromContext({ admin: { id: newAdminId, role: newAdminRole }, db: context.db, loaders: context.loaders });
      } catch (err) {
        console.error(`Error creating admin ${username}:`, err);
         if (err.code === '23505') { // Handle potential unique constraint violation (e.g., race condition on username)
            throw new GraphQLError('Username or associated user conflict.', { extensions: { code: 'BAD_USER_INPUT' } });
        }
        throw new GraphQLError('Failed to create admin due to a server error.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
    },

    updateAdmin: async (_, { id, input }, context) => {
      _ensureAdminRole(context, 'SUPER_ADMIN');
      const { username, role } = input;

      if (!username && !role) {
        throw new GraphQLError('No update data provided. Specify username or role.', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      // Prevent updating the current super admin's own role if needed? (Optional)
      // if (context.admin.id.toString() === id.toString() && role && role !== context.admin.role) {
      //   // Maybe require another super admin? Or just allow it.
      // }

      // Check if admin exists
       const { rows: existingAdminRows } = await context.db.query('SELECT id, role FROM admins WHERE id = $1', [id]);
        if (existingAdminRows.length === 0) {
            throw new GraphQLError(`Admin with ID ${id} not found.`, { extensions: { code: 'NOT_FOUND' } });
        }
        const currentRole = existingAdminRows[0].role;


      // Check for last super admin if demoting
       if (role && role !== 'SUPER_ADMIN' && currentRole === 'SUPER_ADMIN') {
           const { rows: superAdminCountRows } = await context.db.query('SELECT COUNT(*) FROM admins WHERE role = $1', ['SUPER_ADMIN']);
           const superAdminCount = parseInt(superAdminCountRows[0].count, 10);
           if (superAdminCount <= 1) {
               throw new GraphQLError('Cannot remove the last SUPER_ADMIN.', { extensions: { code: 'FORBIDDEN' } });
           }
       }


      const updates = [];
      const values = [];
      let valueCounter = 1;

      if (username) {
         // Check if new username is already taken by another admin
        const { rows: existingUser } = await context.db.query('SELECT id FROM admins WHERE lower(username) = lower($1) AND id != $2', [username, id]);
        if (existingUser.length > 0) {
          throw new GraphQLError(`Username "${username}" is already taken by another admin.`, { extensions: { code: 'BAD_USER_INPUT' } });
        }
        updates.push(`username = $${valueCounter++}`);
        values.push(username);
      }
      if (role) {
        updates.push(`role = $${valueCounter++}`);
        values.push(role);
      }

      if (updates.length === 0) {
           // Should not happen due to initial check, but good practice
           throw new GraphQLError('No valid update fields provided.', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      updates.push(`updated_at = NOW()`);
      values.push(id); // For WHERE clause

      const updateQuery = `UPDATE admins SET ${updates.join(', ')} WHERE id = $${valueCounter} RETURNING id, role`; // Return needed info

      try {
        const { rows: updatedAdminRows } = await context.db.query(updateQuery, values);
         if (updatedAdminRows.length === 0) {
             // Should not happen if admin was found initially
             throw new GraphQLError('Admin update failed unexpectedly.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
         }
        const updatedAdminRole = updatedAdminRows[0].role; // Get potentially updated role
        console.log(`Admin updated successfully for ID: ${id}`);

        // Fetch and return full updated admin object
        return await getFullAdminFromContext({ admin: { id: id, role: updatedAdminRole }, db: context.db, loaders: context.loaders });
      } catch (err) {
        console.error(`Error updating admin ID ${id}:`, err);
         if (err instanceof GraphQLError) {
           throw err; // Re-throw specific Apollo errors
         }
         if (err.code === '23505') { // Handle potential unique constraint violation on username
            throw new GraphQLError('Username conflict during update.', { extensions: { code: 'BAD_USER_INPUT' } });
        }
        throw new GraphQLError('Failed to update admin due to a server error.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
    },

    deleteAdmin: async (_, { id }, context) => {
      _ensureAdminRole(context, 'SUPER_ADMIN');
      const currentAdminId = context.admin.id;

      if (currentAdminId.toString() === id.toString()) {
        throw new GraphQLError('You cannot delete your own admin account.', { extensions: { code: 'FORBIDDEN' } });
      }

      // Check if admin exists before attempting delete
       const { rows: adminToDeleteRows } = await context.db.query('SELECT role FROM admins WHERE id = $1', [id]);
        if (adminToDeleteRows.length === 0) {
            // Optionally return true if the goal is idempotency (already deleted is success)
            // Or throw UserInputError if it must exist to be deleted.
             console.log(`DeleteAdmin: Admin with ID ${id} not found.`);
            return false; // Or throw new UserInputError(`Admin with ID ${id} not found.`);
        }
       const adminToDeleteRole = adminToDeleteRows[0].role;


      // Prevent deleting the last SUPER_ADMIN
      if (adminToDeleteRole === 'SUPER_ADMIN') {
        const { rows: superAdminCountRows } = await context.db.query('SELECT COUNT(*) FROM admins WHERE role = $1', ['SUPER_ADMIN']);
        const superAdminCount = parseInt(superAdminCountRows[0].count, 10);
        if (superAdminCount <= 1) {
          throw new GraphQLError('Cannot delete the last SUPER_ADMIN.', { extensions: { code: 'FORBIDDEN' } });
        }
      }

      try {
          const client = await context.db.getClient(); // Use transaction
          try {
            await client.query('BEGIN');

            // 1. Revoke/Delete associated sessions (important!)
            //    If ON DELETE CASCADE is set for admin_sessions.admin_id, this is optional.
            //    Explicitly doing it is safer if unsure about cascade settings.
             const sessionDeleteRes = await client.query('DELETE FROM admin_sessions WHERE admin_id = $1', [id]);
             console.log(`Deleted ${sessionDeleteRes.rowCount} sessions for admin ID ${id}`);


            // 2. Delete the admin record
            const adminDeleteRes = await client.query('DELETE FROM admins WHERE id = $1', [id]);

            await client.query('COMMIT');

            if (adminDeleteRes.rowCount > 0) {
              console.log(`Admin account deleted successfully: ID ${id}`);
              return true;
            } else {
               // Should not happen if initial check passed and no race condition
              console.warn(`Admin deletion attempt failed for ID ${id}, record might have been deleted concurrently.`);
              return false;
            }
          } catch(txError) {
              await client.query('ROLLBACK');
              console.error(`Transaction error deleting admin ID ${id}:`, txError);
              throw new GraphQLError("Failed to delete admin due to a server error (transaction failed).", { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
          } finally {
              client.release();
          }
      } catch (err) {
          // Catch errors from getting client or re-throw from transaction block
           console.error(`Error during admin deletion process for ID ${id}:`, err);
           if (err instanceof GraphQLError) {
             throw err; // Re-throw specific Apollo errors
           }
          throw new GraphQLError('Failed to delete admin due to a server error.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
    },

  },

  // --- Field Resolvers ---
  Admin: {
    // Field resolver for the 'user' field within the Admin type
    user: async (admin, _, { db, loaders }) => {
      // This resolver is used when the 'user' field is specifically requested
      // and wasn't already populated by the parent resolver (like in adminLogin or meAdmin).
      if (!admin.user_id) {
        return null; // Admin might not be linked to a user
      }
      // If parent resolver (like getFullAdminFromContext) already populated user, return it.
      // This check ensures we don't query again if data is already present.
      if (admin.user && admin.user.id) {
         // Ensure avatar_url is present if expected (it should be if populated by getFullAdminFromContext)
        return admin.user;
      }

      // Use DataLoader if available (preferred)
       if (loaders?.userLoader) {
           try {
               return await loaders.userLoader.load(admin.user_id);
           } catch(loaderError) {
                console.error(`Error loading user ${admin.user_id} via DataLoader in Admin.user resolver:`, loaderError);
               // Decide how to handle loader errors, maybe return null or throw
               return null;
           }
       }


      // Fallback direct query if DataLoader isn't used or if parent didn't populate
      console.warn(`Admin.user resolver performing fallback query for user ID: ${admin.user_id}`);
      const { rows } = await db.query(
          'SELECT id, username, email, first_name, last_name, avatar_url, bio FROM users WHERE id = $1',
          [admin.user_id]
      );
      return rows[0] || null; // Return null if user not found (data inconsistency)
    },
    // Map DB columns to GraphQL fields if names differ or formatting is needed
    createdAt: (admin) => admin.created_at, // Direct mapping usually works
    updatedAt: (admin) => admin.updated_at, // Direct mapping usually works
  },
};

module.exports = { typeDefs, resolvers };
