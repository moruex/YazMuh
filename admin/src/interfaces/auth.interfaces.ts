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
    token: string;
    user: ApiUser; // API returns user info on login
}

/** Input for the ADMIN login mutation. */
export interface AdminLoginInput {
    username: string; // Admin-specific username
    password: string;
}

/** Payload from the ADMIN login mutation. */
export interface AdminLoginPayload {
    token: string; // This will be the admin JWT
    admin: ApiAdmin; // Details of the logged-in admin
}