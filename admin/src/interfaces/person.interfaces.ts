// src/interfaces/person.interfaces.ts
// import { Gender } from './enums';

/** Core fields representing a Person from the API. */
export interface ApiPersonCore {
    __typename?: 'Person'; // Optional, Apollo Client often includes this
    id: string;
    name: string;
    biography?: string | null; // Biographical information
    birthday?: string | null;  // Date of birth 
    profile_image_url?: string | null; // URL to profile image
    slug?: string | null; // URL-friendly version of name
}

// Input for creating a new person
export interface CreatePersonInput {
    name: string;
    biography?: string | null; // Biographical information
    birthday?: string | null;  // Date of birth in YYYY-MM-DD format
    profile_image_url?: string | null; // URL to profile image
}

// Input for updating an existing person
export interface UpdatePersonInput {
    name?: string;
    biography?: string | null; // Biographical information
    birthday?: string | null;  // Date of birth in YYYY-MM-DD format
    profile_image_url?: string | null; // URL to profile image
}

// For backward compatibility with existing components
export interface PersonInput extends CreatePersonInput {}

// Types needed to handle person's credits
export interface MovieCastMember {
    id: string;
    character_name: string;
    cast_order?: number;
    _movieId: string; // Used to resolve the movie
}

export interface MovieCrewMember {
    id: string;
    job: string;
    department: string;
    _movieId: string; // Used to resolve the movie
}
