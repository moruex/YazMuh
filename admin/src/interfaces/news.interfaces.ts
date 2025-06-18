// src/interfaces/news.interfaces.ts
// import type { ApiUser } from './user.interfaces';

/** Represents a NewsCategory structure from the API - REMOVED */
// export interface ApiNewsCategory {
//   id: string;
//   name: string;
//   // slug: string;
//   description?: string | null;
// }

/** Represents a News article structure from the API. */
export interface ApiNewsArticle {
  id: string;
  title: string;
  // slug: string; // Removed slug
  content: string;
  excerpt?: string | null; // Maps from short_content
  featured_image_url?: string | null; // Maps from image_url
  // status: string; // Removed status
  published_at?: string | null; // This will now be key for determining published state
  // view_count: number; // Removed view_count
  // tags?: string[] | null; // Removed tags
  // created_at: string; // Removed created_at
  updated_at: string;
  author_id?: string | null;
  // category_id?: string | null; // Removed category_id
  author?: { id: string; username: string } | null;
  // category?: ApiNewsCategory | null; // Removed category
}

/** Data structure for the Add/Edit News form, matching backend inputs. */
export interface CreateNewsArticleInput {
  title: string;
  content: string;
  excerpt?: string | null;
  featured_image_url?: string | null;
  // status?: string; // Removed status
  published_at?: string | null; // Can be null (draft) or a date string
  // category_id?: string | null; // Removed category_id
  // tags?: string[] | null; // Removed tags
  author_id?: string | null;
}

export interface UpdateNewsArticleInput {
  title?: string;
  content?: string;
  excerpt?: string | null;
  featured_image_url?: string | null;
  // status?: string; // Removed status
  published_at?: string | null; // Can be null (draft) or a date string
  // category_id?: string | null; // Removed category_id
  // tags?: string[] | null; // Removed tags
  author_id?: string | null;
}