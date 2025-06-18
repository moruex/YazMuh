// src/interfaces/movie.interfaces.ts
import type { ApiGenreCore } from './genre.interfaces';

/** Represents a person for use in dropdowns */
export interface PersonOption {
    id: string;
    name: string;
    profile_image_url?: string;
    slug?: string;
}

/** Represents a genre for use in dropdowns */
export interface GenreOption {
    id: string;
    name: string;
    is_collection?: boolean;
}

/** Represents the Movie structure used primarily in frontend components. */
export interface Movie {
    id: string;
    title: string;
    imageUrl: string;
    trailerUrl?: string;
    description: string;
    shortDescription?: string; // Optional summary field for frontend use
    genres: string[]; // Names of genres
    directors: string[]; // Names of directors
    actors: string[]; // Names of actors
    rating: number; // Typically vote_average from API
    releaseDate: string; // Formatted date string (e.g., YYYY-MM-DD)
    duration: number; // Runtime in minutes
    movieqRating?: number; // From database movieq_rating
    imdbRating?: number; // From database imdb_rating
    letterboxdRating?: number; // From database letterboxd_rating
    selectedGenreIds?: string[]; // For form handling with dropdown selectors
    selectedActorIds?: string[]; // For form handling with dropdown selectors
    selectedDirectorIds?: string[]; // For form handling with dropdown selectors
    originalTitle?: string; // Original language title
    imdbId?: string; // IMDB ID (e.g., tt1234567)
    tmdbId?: number; // TMDB ID
    status?: string; // Movie status
}

/**
 * Input for creating a movie
 */
export interface CreateMovieInput {
    title: string;
    overview?: string;
    release_date?: string;
    runtime?: number;
    poster_path?: string;
    backdrop_path?: string;
    budget?: number;
    revenue?: number;
    status?: string; // MovieStatus enum value
    tagline?: string;
    tmdb_id?: number;
    imdb_id?: string;
    popularity?: number;
    vote_average?: number;
    vote_count?: number;
    trailer_url?: string;
    movieq_rating?: number; // DB field
    imdb_rating?: number; // DB field
    letterboxd_rating?: number; // DB field
}

/**
 * Input for updating a movie
 */
export interface UpdateMovieInput {
    title?: string;
    overview?: string;
    release_date?: string;
    runtime?: number;
    poster_path?: string;
    backdrop_path?: string;
    budget?: number;
    revenue?: number;
    status?: string; // MovieStatus enum value
    tagline?: string;
    tmdb_id?: number;
    imdb_id?: string;
    popularity?: number;
    vote_average?: number;
    vote_count?: number;
    trailer_url?: string;
    movieq_rating?: number; // DB field
    imdb_rating?: number; // DB field
    letterboxd_rating?: number; // DB field
}

/** Core fields representing a Movie from the API, used in lists. */
export interface ApiMovieCore {
    id: string;
    title: string;
    slug: string;
    poster_url?: string | null;
    release_date?: string | null; 
    duration_minutes?: number | null;
    plot_summary?: string | null;
    trailer_url?: string | null;
    movieq_rating?: number | null;
    imdb_rating?: number | null;
    letterboxd_rating?: number | null;
    genres?: Pick<ApiGenreCore, 'id' | 'name' | 'is_collection'>[]; 
}

/** Role type for a person in a movie */
export enum MovieRoleType {
    DIRECTOR = 'director',
    ACTOR = 'actor',
    WRITER = 'writer',
    PRODUCER = 'producer',
    CINEMATOGRAPHER = 'cinematographer',
    COMPOSER = 'composer'
}

/** Person in a cast role */
export interface ApiMovieCastMember {
    id: string;
    character_name?: string;
    cast_order?: number;
    person: {
        id: string;
        name: string;
    };
}

/** Person in a crew role */
export interface ApiMovieCrewMember {
    id: string;
    job?: string;
    department?: string;
    person: {
        id: string;
        name: string;
    };
}

/** Detailed fields representing a Movie from the API. */
export interface ApiMovieDetail extends ApiMovieCore {
    created_at: string;
    updated_at: string;
    cast?: ApiMovieCastMember[];
    crew?: ApiMovieCrewMember[];
}