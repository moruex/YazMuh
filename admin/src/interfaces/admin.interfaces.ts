// src/interfaces/admin.interfaces.ts
import type { ApiUser } from './user.interfaces';

/** Role enum for Admins (must match backend schema exactly). */
export enum AdminRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    CONTENT_MODERATOR = 'CONTENT_MODERATOR',
}

/** Represents the Admin structure from the API (GraphQL Admin type). */
export interface ApiAdmin {
    id: string;
    username: string; // Admin-specific username
    role: AdminRole;
    createdAt: string; // Or DateTime scalar
    updatedAt: string; // Or DateTime scalar
    user: ApiUser; // The nested regular user profile associated with the admin
}