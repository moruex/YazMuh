// src/interfaces/recommendation.interfaces.ts
import type { ApiMovieCore } from './movie.interfaces';

// Matches the RECOMMENDATION_SECTION_FIELDS fragment
export interface ApiRecommendationSection {
    __typename?: 'RecommendationSection';
    id: string;
    title: string;
    section_type: string; // Or map to a specific enum type if needed
    description?: string | null;
    display_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    movies: ApiMovieCore[]; // Use the core movie type fetched
    movieCount: number;
}

// Keep your existing Movie interface for potential frontend-specific needs,
// but primarily work with ApiMovieCore/ApiMovieDetail from the API.
export interface Movie {
    id: string;
    title: string;
    imageUrl: string; // Maps from poster_url
    trailerUrl?: string | null;
    description: string; // Maps from plot_summary
    // Add other fields if needed for display that aren't directly on ApiMovieCore
}