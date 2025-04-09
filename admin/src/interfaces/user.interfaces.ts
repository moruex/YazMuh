// src/interfaces/user.interfaces.ts

/** Represents the User structure from the API (GraphQL User type). */
export interface ApiUser {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    username: string;
    email: string;
    avatar_url?: string | null;
    bio?: string | null;
    created_at: string; // Or DateTime scalar
    updated_at: string; // Or DateTime scalar
}