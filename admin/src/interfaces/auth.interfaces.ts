// src/interfaces/auth.interfaces.ts
import type { ApiAdmin } from './admin.interfaces';
import type { ApiUser } from './user.interfaces';

/** Represents the input for the standard user login mutation. */
export interface LoginInput {
    username: string; // Changed from email to username as requested
    password: string;
}

/** Represents the successful payload from the standard user login mutation. */
export interface LoginPayload {
    token: string; // This might be for a different user type, keeping for now unless specified otherwise
    user: ApiUser; // API returns user info on login
}

/** Input for the ADMIN login mutation. */
export interface AdminLoginInput {
    username: string; // Admin-specific username
    password: string;
}

/** Payload from the ADMIN login mutation. */
export interface AdminLoginPayload {
    // token: string; // REMOVED: No JWT for admin
    admin: ApiAdmin; // Details of the logged-in admin
    success: boolean;
    message?: string;
}

/** Input for the ADMIN registration mutation. */
export interface AdminRegisterInput {
    username: string;
    email: string; 
    password: string;
}

/** Payload from the ADMIN registration mutation. */
export interface AdminRegisterPayload {
    // token: string; // REMOVED: No JWT for admin
    admin: ApiAdmin;
    success: boolean;
    message?: string;
}

/** Input for the Forgot Password mutation (for admin) */
export interface ForgotPasswordInput {
    username: string;
}

/** Payload from the Forgot Password mutation (for admin) */
export interface ForgotPasswordPayload {
    success: boolean;
    message: string;
}