// src/interfaces/admin.interfaces.ts
import { AdminRole } from './enums';
import type { ApiUser } from './user.interfaces';

/** Represents the Admin structure from the API (GraphQL Admin type). */
export interface ApiAdmin {
    id: string;
    username: string; // Admin-specific username
    role: AdminRole;
    user: ApiUser; // The nested regular user profile associated with the admin
}