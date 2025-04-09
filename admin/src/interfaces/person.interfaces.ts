// src/interfaces/person.interfaces.ts
import type { RoleType } from './common.interfaces';

/** Core fields representing a Person from the API. */
export interface ApiPersonCore {
    __typename?: 'Person'; // Optional, Apollo Client often includes this
    id: string;
    name: string;
    bio?: string | null;
    birth_date?: string | null; // Keep as string from GQL, format for display
    profile_image_url?: string | null;
    created_at: string; // Keep as string from GQL
}

export interface PersonInput {
    name: string;
    bio?: string | null;
    birth_date?: string | null;
    profile_image_url?: string | null;
}