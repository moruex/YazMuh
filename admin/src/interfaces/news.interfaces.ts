// src/interfaces/news.interfaces.ts
import type { ApiUser } from './user.interfaces';
import type { ApiMovieCore } from './movie.interfaces';

/** Represents a News article structure from the API. */
export interface ApiNews {
     id: string; // GraphQL ID is usually string
    title: string;
    short_content?: string | null;
    content: string;
    image_url?: string | null;
    published_at: string; // DateTime scalar often represented as ISO string
    created_at: string;
    updated_at: string;
    author?: Pick<ApiUser, 'id' | 'username'> | null; // Basic author info
    movies?: Pick<ApiMovieCore, 'id' | 'title'>[]; // Basic linked movie info
}

/** Data structure for the Add/Edit News form, matching backend inputs. */
export interface NewsInputData {
    title: string;
    short_content?: string | null;
    content: string;
    image_url?: string | null;
    published_at?: string | null; // Use string for ISO date/time input or from date picker
    movie_ids?: string[]; // Array of movie IDs
}