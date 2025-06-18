// src/interfaces/genre.interfaces.ts

/** Core fields representing a Genre from the API. */
export interface ApiGenreCore {
    id: string; // Assuming GraphQL uses String IDs
    name: string;
    description?: string | null;
    image_url?: string | null;
    slug?: string | null; // Added slug field
    is_collection?: boolean | null; // Added
    movieCount?: number | null; // Optional: Depends on if your API provides this efficiently
}

// Input type for mutations might differ slightly (e.g., ID not needed for create)
// Ensure these match your actual GraphQL Input types
export interface GenreInputData {
    name: string;
    description?: string | null;
    image_url?: string | null;
    slug?: string | null; // Added slug field
    is_collection: boolean; // Required for create/update
}