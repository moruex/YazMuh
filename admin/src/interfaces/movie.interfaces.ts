// src/interfaces/movie.interfaces.ts
import type { ApiGenreCore } from './genre.interfaces';
import type { ApiMoviePerson } from './person.interfaces';

/** Represents the Movie structure used primarily in frontend components. */
export interface Movie {
    id: string;
    title: string;
    imageUrl: string;
    trailerUrl?: string | null;
    description: string;
    shortDescription?: string; // Optional summary field for frontend use
    genres: string[]; // Names of genres
    directors: string[]; // Names of directors
    actors: string[]; // Names of actors
    rating: number; // Typically avg_rating from API
    releaseDate: string; // Formatted date string (e.g., YYYY-MM-DD)
    duration: number; // Duration in minutes
}

/**
 * Represents the data structure sent to API mutations (Create/Update Movie).
 * Maps frontend fields to the API's expected field names and structure.
 * IMPORTANT: Relationship updates (genres, persons) might need separate mutations
 * or a different backend input structure depending on your schema.
 */
export interface MovieInputData {
    title: string;              // Maps to API title
    release_date: string;       // Maps from frontend releaseDate (ensure YYYY-MM-DD format)
    plot_summary: string;       // Maps from frontend description
    poster_url: string;         // Maps from frontend imageUrl
    duration_minutes: number;   // Maps from frontend duration
    trailer_url?: string | null; // Maps from frontend trailerUrl (send null if empty)

    // --- Example Relationship Handling (IF SUPPORTED BY BACKEND INPUT) ---
    // genreIds?: string[]; // If backend accepts genre IDs directly on update/create
    // personLinks?: { personId: string; roleType: RoleType; characterName?: string | null }[]; // If backend accepts structured person links
    //
    // NOTE: The original comment indicated these were NOT accepted by MovieUpdateInput.
    // Verify your backend schema for MovieInput and MovieUpdateInput.
}

/** Core fields representing a Movie from the API, often used in lists. */
export interface ApiMovieCore {
    id: string;
    title: string;
    poster_url?: string | null;
    release_date?: string | null; // API format (e.g., ISO string or YYYY-MM-DD)
    avg_rating?: number | null;
    duration_minutes?: number | null;
    genres?: Pick<ApiGenreCore, 'id' | 'name'>[]; // Include basic genre info
}

/** Detailed fields representing a Movie from the API, used for detail views. */
export interface ApiMovieDetail {
    id: string;
    title: string;
    release_date?: string | null; // API format
    plot_summary?: string | null;
    poster_url?: string | null;
    duration_minutes?: number | null;
    trailer_url?: string | null;
    avg_rating?: number | null;
    created_at: string; // Or DateTime scalar
    updated_at: string; // Or DateTime scalar
    genres?: ApiGenreCore[];
    persons?: ApiMoviePerson[];
}