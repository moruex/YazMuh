// src/schema/admin.js
// const { gql } = require('@apollo/server');
const gql = require('graphql-tag');
const { GraphQLError } = require('graphql');
const bcrypt = require('bcryptjs');
const config = require('../config'); // Use centralized config
// Import helpers from the new utility file
const { rolesHierarchy } = require('../utils/authHelpers');

// --- Helper Functions ---

// --- GraphQL Definitions ---
const typeDefs = gql`
  scalar DateTime
  scalar Date

  enum AdminRole { SUPER_ADMIN ADMIN CONTENT_MODERATOR }

  type Admin {
    id: ID!
    username: String!
    role: AdminRole!
    user: User # Assumes User type includes avatar_url
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # Input for self-updating admin profile
  input UpdateAdminSelfInput {
    username: String
    currentPassword: String # Required only if changing password
    newPassword: String
  }

  # Input for creating an admin by a SUPER_ADMIN
  input CreateAdminInput {
    userId: ID! # Assuming User MUST exist first
    username: String!
    password: String!
    role: AdminRole = ADMIN
  }

  # Input for updating an admin by a SUPER_ADMIN
  input UpdateAdminInput { username: String role: AdminRole }

  # --- Authentication & Registration Inputs and Payloads ---
  input AdminLoginInput {
    username: String!
    password: String!
  }

  type AdminLoginPayload {
    # token: String! // REMOVED: No JWT
    admin: Admin!
    success: Boolean!
    message: String
  }

  input AdminRegisterInput {
    username: String!
    email: String! # Used for User record association/creation
    password: String!
    # Optional: firstName: String, lastName: String
  }

  type AdminRegisterPayload {
    # token: String! // REMOVED: No JWT
    admin: Admin!
    success: Boolean!
    message: String
  }

  input ForgotPasswordInput {
    username: String! # Based on your frontend query example
  }

  type ForgotPasswordPayload {
    success: Boolean!
    message: String!
  }
  # --- End Authentication & Registration Inputs and Payloads ---

  extend type Query {
    # meAdmin uses context directly - REMOVED as context.admin is gone
    # meAdmin: Admin

    # These require specific roles, checked within resolvers
    admin(id: ID!): Admin
    admins(limit: Int = 10, offset: Int = 0, search: String): [Admin!]!
    adminCount: Int!
    # myAdminSessions: [AdminSession!]! - REMOVED
  }

  extend type Mutation {
    # Public Authentication Mutations
    adminLogin(input: AdminLoginInput!): AdminLoginPayload!
    adminRegister(input: AdminRegisterInput!): AdminRegisterPayload!
    forgotPassword(input: ForgotPasswordInput!): ForgotPasswordPayload!

    # Admin self-service (requires identifying the admin, e.g., via token in context later)
    # For now, keeping performingAdminId as per existing pattern, though this would typically use context
    updateAdminSelf(performingAdminId: ID!, input: UpdateAdminSelfInput!): Admin!

    # SUPER_ADMIN required operations
    createAdmin(performingAdminId: ID!, input: CreateAdminInput!): Admin!
    updateAdmin(performingAdminId: ID!, id: ID!, input: UpdateAdminInput!): Admin!
    deleteAdmin(performingAdminId: ID!, id: ID!): Boolean!
  }
`;

// --- Resolvers ---
const resolvers = {
  Query: {
    // # meAdmin removed

    admin: async (_, { id }, { db }) => {
      // Authorization: Implement how you verify the caller has permission for this query
      const { rows } = await db.query(
        `SELECT a.*, u.id as uid, u.username as uname, u.avatar_url as uavatar_url, u.email as uemail
           FROM admins a LEFT JOIN users u ON a.user_id = u.id WHERE a.id = $1`, [id]);
      if (rows.length === 0) {
        throw new GraphQLError(`Admin account with ID ${id} not found.`, { extensions: { code: 'NOT_FOUND' } });
      }
      const { uid, uname, uemail, uavatar_url, ...adminData } = rows[0];
      adminData.user = uid ? { id: uid, username: uname, email: uemail, avatar_url: uavatar_url } : null;
      return adminData;
    },

    admins: async (_, { limit = 10, offset = 0, search }, { db }) => {
      // Authorization: Implement how you verify the caller has permission for this query (e.g. check role of performingAdminId if passed)
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
          LIMIT $1 OFFSET $2`;
        queryParams = [limit, offset];
      }
      const { rows } = await db.query(query, queryParams);
      return rows.map(row => {
        const { uid, uname, uemail, uavatar_url, ...adminData } = row;
        adminData.user = uid ? { id: uid, username: uname, email: uemail, avatar_url: uavatar_url } : null;
        return adminData;
      });
    },

    adminCount: async (_, __, { db }) => {
      // Authorization: Implement how you verify the caller has permission for this query
      const { rows } = await db.query('SELECT COUNT(*) FROM admins');
      return parseInt(rows[0].count, 10);
    },
    // # myAdminSessions removed
  },

  Mutation: {
    // # adminLogin, forgotPassword, adminLogout, adminLogoutSession removed
    // VVVVVV NEW RESOLVERS VVVVVV
    adminLogin: async (_, { input }, { db }) => {
      const { username, password } = input;

      if (!username || !password) {
        throw new GraphQLError('Username and password are required.', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      const { rows: adminRows } = await db.query('SELECT * FROM admins WHERE lower(username) = lower($1)', [username]);
      if (adminRows.length === 0) {
        throw new GraphQLError('Invalid username or password.', { extensions: { code: 'UNAUTHENTICATED' } });
      }
      const adminAccount = adminRows[0];

      const validPassword = await bcrypt.compare(password, adminAccount.password_hash);
      if (!validPassword) {
        throw new GraphQLError('Invalid username or password.', { extensions: { code: 'UNAUTHENTICATED' } });
      }

      // Fetch associated user details for the Admin object
      let user = null;
      if (adminAccount.user_id) {
        const { rows: userRows } = await db.query('SELECT id, username, email, avatar_url FROM users WHERE id = $1', [adminAccount.user_id]);
        if (userRows.length > 0) {
          user = userRows[0];
        }
      }
      
      // Ensure the returned admin object matches the Admin type structure, including the user field
      const adminToReturn = {
        ...adminAccount,
        user: user, // This could be null if no user_id or user not found
        createdAt: adminAccount.created_at,
        updatedAt: adminAccount.updated_at
      };

      return {
        admin: adminToReturn,
        success: true,
        message: 'Login successful.',
      };
    },

    adminRegister: async (_, { input }, { db }) => {
      const { username, email, password } = input;

      if (!username || !email || !password) {
        throw new GraphQLError('Username, email, and password are required for registration.', { extensions: { code: 'BAD_USER_INPUT' } });
      }
      if (password.length < 8) {
        throw new GraphQLError('Password must be at least 8 characters long.', { extensions: { code: 'BAD_USER_INPUT' } });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new GraphQLError('Invalid email format.', { extensions: { code: 'BAD_USER_INPUT' }});
      }

      // Check if username is already taken in admins table
      const { rows: existingAdminUser } = await db.query('SELECT id FROM admins WHERE lower(username) = lower($1)', [username]);
      if (existingAdminUser.length > 0) {
        throw new GraphQLError(`Admin username "${username}" is already taken.`, { extensions: { code: 'BAD_USER_INPUT' } });
      }

      // Check if email is already taken in users table (for a different admin potentially)
      // Or decide if an existing user can become an admin. For simplicity, we'll ensure the email isn't tied to another *admin* yet.
      // A more robust check might see if the email exists and if that user can be "promoted" or linked.
      // For now, we'll create a new user record or use an existing one if the email matches.

      let userId;
      let userForAdmin;
      const { rows: existingUserRows } = await db.query('SELECT * FROM users WHERE lower(email) = lower($1)', [email]);

      if (existingUserRows.length > 0) {
        // User with this email already exists.
        // Check if this user is already linked to an admin account.
        const existingUser = existingUserRows[0];
        userId = existingUser.id;
        userForAdmin = existingUser;
        const { rows: adminLinkCheck } = await db.query('SELECT id FROM admins WHERE user_id = $1', [userId]);
        if (adminLinkCheck.length > 0) {
          throw new GraphQLError('This email is already associated with an existing admin account.', { extensions: { code: 'BAD_USER_INPUT' } });
        }
        // If not linked to another admin, we can proceed to create an admin profile for this existing user.
      } else {
        // User with this email does not exist, create a new user.
        // The new user's username will be the admin username by default, can be updated later.
        const { rows: newUserRows } = await db.query(
          'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
          [username, email, await bcrypt.hash(password, config.bcryptSaltRounds)] // Hash a placeholder password for the user record
        );
        userId = newUserRows[0].id;
        userForAdmin = newUserRows[0];
      }

      const saltRounds = config.bcryptSaltRounds;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      const defaultRole = AdminRole.CONTENT_MODERATOR; // Or AdminRole.ADMIN if preferred

      const { rows: newAdminRows } = await db.query(
        'INSERT INTO admins (user_id, username, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *',
        [userId, username, passwordHash, defaultRole]
      );
      const newAdmin = newAdminRows[0];

      // Ensure the returned admin object matches the Admin type structure
      const adminToReturn = {
        ...newAdmin,
        user: { // Populate user field based on userForAdmin
            id: userForAdmin.id,
            username: userForAdmin.username, // This would be the user's own username
            email: userForAdmin.email,
            avatar_url: userForAdmin.avatar_url
        },
        createdAt: newAdmin.created_at,
        updatedAt: newAdmin.updated_at
      };
      
      return {
        admin: adminToReturn,
        success: true,
        message: 'Admin registration successful.',
      };
    },

    forgotPassword: async (_, { input }, { db }) => {
      const { username } = input;

      if (!username) {
        throw new GraphQLError('Username is required for password reset.', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      const { rows: adminRows } = await db.query(
        'SELECT a.id, a.user_id, u.email FROM admins a LEFT JOIN users u ON a.user_id = u.id WHERE lower(a.username) = lower($1)',
         [username]
      );

      if (adminRows.length === 0) {
        return {
          success: true, 
          message: 'If an account with that username exists, password reset instructions have been processed.',
        };
      }

      const adminToReset = adminRows[0];
      const defaultPassword = "admin";

      try {
        const saltRounds = config.bcryptSaltRounds || 10; // Use from config or default to 10
        if (typeof saltRounds !== 'number' || saltRounds <= 0) {
            console.error('Invalid bcryptSaltRounds configured. Using default 10.', config.bcryptSaltRounds);
            // saltRounds = 10; // Already set by || 10 above
        }

        const newPasswordHash = await bcrypt.hash(defaultPassword, saltRounds);

        await db.query(
          'UPDATE admins SET password_hash = $1 WHERE id = $2',
          [newPasswordHash, adminToReset.id]
        );

        console.log(`Admin password for ${username} (ID: ${adminToReset.id}) reset to default.`);

        return {
          success: true,
          message: 'Password has been reset to the default: "admin". Please log in and change it immediately.',
        };
      } catch (error) {
        // Log the actual error to the server console for detailed debugging
        console.error(`[CRITICAL] Error during password reset for admin '${username}' (ID: ${adminToReset.id || 'N/A'}):`, error);
        throw new GraphQLError('Failed to reset password due to a server error. Check server logs for details.', { 
            extensions: { 
                code: 'INTERNAL_SERVER_ERROR',
                originalError: error.message // Optionally include original error message if safe
            }
        });
      }
    },
    // ^^^^^^ NEW RESOLVERS ^^^^^^

    updateAdminSelf: async (_, { performingAdminId, input }, { db }) => {
      // Authorization: Verify performingAdminId and their permissions
      // For self-update, performingAdminId is the ID of the admin being updated.
      const adminId = performingAdminId; 
      const { username, currentPassword, newPassword } = input;

      if (!username && !newPassword) {
        throw new GraphQLError('No updates provided. Please specify a new username or password.', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      const updates = [];
      const values = [];
      let valueCounter = 1;

      const { rows: currentAdminRows } = await db.query('SELECT username, password_hash, role FROM admins WHERE id = $1', [adminId]);
      if (currentAdminRows.length === 0) {
          throw new GraphQLError('Admin account not found.', { extensions: { code: 'NOT_FOUND' } });
      }
      const currentAdmin = currentAdminRows[0];

      if (username && username !== currentAdmin.username) {
        const { rows: existingUser } = await db.query('SELECT id FROM admins WHERE lower(username) = lower($1) AND id != $2', [username, adminId]);
        if (existingUser.length > 0) {
          throw new GraphQLError(`Username "${username}" is already taken.`, { extensions: { code: 'BAD_USER_INPUT' } });
        }
        updates.push(`username = $${valueCounter++}`);
        values.push(username);
      }

      if (newPassword) {
        if (!currentPassword) {
          throw new GraphQLError('Current password is required to set a new password.', { extensions: { code: 'BAD_USER_INPUT' } });
        }
        const validPassword = await bcrypt.compare(currentPassword, currentAdmin.password_hash);
        if (!validPassword) {
          throw new GraphQLError('Incorrect current password.', { extensions: { code: 'UNAUTHENTICATED' } });
        }
        if (newPassword.length < 8) { 
            throw new GraphQLError('New password must be at least 8 characters long.', { extensions: { code: 'BAD_USER_INPUT' } });
        }
        const saltRounds = config.bcryptSaltRounds; // Use from config
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
        updates.push(`password_hash = $${valueCounter++}`);
        values.push(newPasswordHash);
      }

      if (updates.length === 0) {
         const { rows: adminForReturn } = await db.query(
            `SELECT a.*, u.id as uid, u.username as uname, u.avatar_url as uavatar_url, u.email as uemail 
            FROM admins a LEFT JOIN users u ON a.user_id = u.id WHERE a.id = $1`, 
            [adminId]
         );
         const { uid, uname, uemail, uavatar_url, ...adminData } = adminForReturn[0];
         adminData.user = uid ? { id: uid, username: uname, email: uemail, avatar_url: uavatar_url } : null;
         return adminData; 
      }

      updates.push(`updated_at = NOW()`);
      values.push(adminId);
      const updateQuery = `UPDATE admins SET ${updates.join(', ')} WHERE id = $${valueCounter} RETURNING *`;

      try {
        const { rows: updatedAdminRows } = await db.query(updateQuery, values);
        const { uid, uname, uemail, uavatar_url, ...adminData } = updatedAdminRows[0];
        adminData.user = uid ? { id: uid, username: uname, email: uemail, avatar_url: uavatar_url } : null;
        return adminData;
      } catch (err) {
        console.error(`Error updating admin profile for ID ${adminId}:`, err);
        if (err instanceof GraphQLError) throw err;
        throw new GraphQLError('Failed to update admin profile due to a server error.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
    },

    createAdmin: async (_, { performingAdminId, input }, { db }) => {
      // Authorization: Verify performingAdminId has SUPER_ADMIN role
      const { rows: performingAdminRows } = await db.query('SELECT role FROM admins WHERE id = $1', [performingAdminId]);
      if (performingAdminRows.length === 0 || performingAdminRows[0].role !== 'SUPER_ADMIN') {
        throw new GraphQLError('Operation requires SUPER_ADMIN privileges.', { extensions: { code: 'FORBIDDEN' } });
      }

      const { userId, username, password, role } = input;
      if (password.length < 8) {
            throw new GraphQLError('Password must be at least 8 characters long.', { extensions: { code: 'BAD_USER_INPUT' } });
      }
      const { rows: userRows } = await db.query('SELECT id FROM users WHERE id = $1', [userId]);
      if (userRows.length === 0) {
        throw new GraphQLError(`User with ID ${userId} not found.`, { extensions: { code: 'NOT_FOUND' } });
      }
      const { rows: existingAdminRows } = await db.query('SELECT id FROM admins WHERE user_id = $1 OR lower(username) = lower($2)', [userId, username]);
      if (existingAdminRows.length > 0) {
        throw new GraphQLError('An admin account already exists for this user or username.', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      const saltRounds = config.bcryptSaltRounds;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // PostgreSQL does not have uuid_generate_v4() by default unless pgcrypto extension is enabled.
      // Assuming 'id' is a regular integer sequence or you'll handle UUID generation in JS/client if it's a UUID type.
      // For now, assuming integer ID from sequence.
      const insertQuery = `
        INSERT INTO admins (user_id, username, password_hash, role)
        VALUES ($1, $2, $3, $4)
        RETURNING *`; 
      try {
        const { rows: newAdminRows } = await db.query(insertQuery, [userId, username, passwordHash, role]);
        const newAdminData = newAdminRows[0];
        
        const { rows: userDetails } = await db.query('SELECT id as uid, username as uname, email as uemail, avatar_url as uavatar_url FROM users WHERE id = $1', [newAdminData.user_id]);
        const { uid, uname, uemail, uavatar_url } = userDetails[0] || {};
        newAdminData.user = uid ? { id: uid, username: uname, email: uemail, avatar_url: uavatar_url } : null;
        return newAdminData;

      } catch (err) {
        console.error(`Error creating admin ${username}:`, err);
        if (err.code === '23505') {
            throw new GraphQLError('Username or associated user conflict.', { extensions: { code: 'BAD_USER_INPUT' } });
        }
        throw new GraphQLError('Failed to create admin due to a server error.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
    },

    updateAdmin: async (_, { performingAdminId, id, input }, { db }) => {
      // Authorization: Verify performingAdminId has SUPER_ADMIN role
      const { rows: performingAdminRows } = await db.query('SELECT role FROM admins WHERE id = $1', [performingAdminId]);
      if (performingAdminRows.length === 0 || performingAdminRows[0].role !== 'SUPER_ADMIN') {
        throw new GraphQLError('Operation requires SUPER_ADMIN privileges.', { extensions: { code: 'FORBIDDEN' } });
      }

      const { username, role } = input;
      if (!username && !role) {
        throw new GraphQLError('No update data provided. Specify username or role.', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      const { rows: existingAdminRows } = await db.query('SELECT id, role FROM admins WHERE id = $1', [id]);
      if (existingAdminRows.length === 0) {
        throw new GraphQLError(`Admin with ID ${id} not found.`, { extensions: { code: 'NOT_FOUND' } });
      }
      const currentRole = existingAdminRows[0].role;

      if (role && role !== 'SUPER_ADMIN' && currentRole === 'SUPER_ADMIN') {
        const { rows: superAdminCountRows } = await db.query('SELECT COUNT(*) FROM admins WHERE role = $1', ['SUPER_ADMIN']);
        const superAdminCount = parseInt(superAdminCountRows[0].count, 10);
        if (superAdminCount <= 1) {
          throw new GraphQLError('Cannot remove the last SUPER_ADMIN.', { extensions: { code: 'FORBIDDEN' } });
        }
      }

      const updates = [];
      const values = [];
      let valueCounter = 1;

      if (username) {
        const { rows: existingUser } = await db.query('SELECT id FROM admins WHERE lower(username) = lower($1) AND id != $2', [username, id]);
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
        throw new GraphQLError('No valid update fields provided.', { extensions: { code: 'BAD_USER_INPUT' } });
      }

      updates.push(`updated_at = NOW()`);
      values.push(id);
      const updateQuery = `UPDATE admins SET ${updates.join(', ')} WHERE id = $${valueCounter} RETURNING *`;

      try {
        const { rows: updatedAdminRows } = await db.query(updateQuery, values);
        const updatedAdminData = updatedAdminRows[0];
        const { rows: userDetails } = await db.query('SELECT id as uid, username as uname, email as uemail, avatar_url as uavatar_url FROM users WHERE id = $1', [updatedAdminData.user_id]);
        const { uid, uname, uemail, uavatar_url } = userDetails[0] || {};
        updatedAdminData.user = uid ? { id: uid, username: uname, email: uemail, avatar_url: uavatar_url } : null;
        return updatedAdminData;

      } catch (err) {
        console.error(`Error updating admin ID ${id}:`, err);
        if (err instanceof GraphQLError) throw err;
        if (err.code === '23505') {
            throw new GraphQLError('Username conflict during update.', { extensions: { code: 'BAD_USER_INPUT' } });
        }
        throw new GraphQLError('Failed to update admin due to a server error.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
    },

    deleteAdmin: async (_, { performingAdminId, id }, { db }) => {
      // Authorization: Verify performingAdminId has SUPER_ADMIN role
      const { rows: performingAdminRows } = await db.query('SELECT role FROM admins WHERE id = $1', [performingAdminId]);
      if (performingAdminRows.length === 0 || performingAdminRows[0].role !== 'SUPER_ADMIN') {
        throw new GraphQLError('Operation requires SUPER_ADMIN privileges.', { extensions: { code: 'FORBIDDEN' } });
      }
      
      // Prevent self-deletion by performingAdminId
      if (performingAdminId.toString() === id.toString()) {
        throw new GraphQLError('You cannot delete your own admin account using this operation.', { extensions: { code: 'FORBIDDEN' } });
      }

      const { rows: adminToDeleteRows } = await db.query('SELECT role FROM admins WHERE id = $1', [id]);
      if (adminToDeleteRows.length === 0) {
        return false; 
      }
      const adminToDeleteRole = adminToDeleteRows[0].role;

      if (adminToDeleteRole === 'SUPER_ADMIN') {
        const { rows: superAdminCountRows } = await db.query('SELECT COUNT(*) FROM admins WHERE role = $1', ['SUPER_ADMIN']);
        const superAdminCount = parseInt(superAdminCountRows[0].count, 10);
        if (superAdminCount <= 1) {
          throw new GraphQLError('Cannot delete the last SUPER_ADMIN.', { extensions: { code: 'FORBIDDEN' } });
        }
      }

      // Sessions are already removed from DB schema, so no need to delete admin_sessions here.
      try {
        const adminDeleteRes = await db.query('DELETE FROM admins WHERE id = $1', [id]);
        if (adminDeleteRes.rowCount > 0) {
          console.log(`Admin account deleted successfully: ID ${id}`);
          return true;
        }
        return false;
      } catch (err) {
        console.error(`Error during admin deletion process for ID ${id}:`, err);
        if (err instanceof GraphQLError) throw err;
        throw new GraphQLError('Failed to delete admin due to a server error.', { extensions: { code: 'INTERNAL_SERVER_ERROR' } });
      }
    },
  },

  Admin: {
    user: async (admin, _, { db }) => {
      if (!admin.user_id) return null;
      // If admin.user is already populated (e.g. by parent resolver), return it.
      if (admin.user && admin.user.id) return admin.user;
      
      const { rows } = await db.query(
          'SELECT id, username, email, first_name, last_name, avatar_url, bio FROM users WHERE id = $1',
          [admin.user_id]
      );
      return rows[0] || null;
    },
  },
};

module.exports = { typeDefs, resolvers };
