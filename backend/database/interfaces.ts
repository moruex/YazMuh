// Enum Definitions (from your schema)
export enum AdminRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    CONTENT_MODERATOR = 'CONTENT_MODERATOR',
}

export enum RoleType {
    ACTOR = 'actor',
    DIRECTOR = 'director',
    WRITER = 'writer',
    PRODUCER = 'producer',
    CINEMATOGRAPHER = 'cinematographer',
    COMPOSER = 'composer',
}

// Table Interfaces

export interface Admin {
    id: number;
    user_id: number;
    username: string; // character varying(50)
    password_hash: string; // character varying(255)
    role: AdminRole; // default 'ADMIN'
}

export interface CensorshipReason {
    reason_code: string; // character varying(50), PRIMARY KEY
    description: string; // text
    is_active: boolean; // default true
}

export interface CommentCensorshipLog {
    id: number;
    comment_id: number;
    admin_id: number;
    reason_code: string; // character varying(50)
    admin_notes?: string; // text
    action_taken_at: Date; // timestamp with time zone, default CURRENT_TIMESTAMP
    original_content_snapshot?: string; // text
}

export interface CommentLike {
    id: number;
    user_id: number;
    comment_id: number;
    created_at: Date; // timestamp with time zone, default CURRENT_TIMESTAMP
}

export interface Comment {
    id: number;
    user_id: number;
    movie_id: number;
    content: string; // text
    parent_comment_id?: number;
    likes_count: number; // default 0
    is_currently_censored: boolean; // default false
    created_at: Date; // timestamp with time zone, default CURRENT_TIMESTAMP
    updated_at: Date; // timestamp with time zone, default CURRENT_TIMESTAMP
}

export interface Genre {
    id: number;
    name: string; // character varying(50)
    description?: string; // text
    image_url?: string; // character varying(255)
    is_collection?: boolean; // default false
}

export interface MovieGenre {
    movie_id: number;
    genre_id: number;
}

// New Interface for MovieCrew
export interface MovieCrew {
    movie_id: number;
    person_id: number;
    role: RoleType; // references the RoleType enum
}

export interface Movie {
    id: number;
    title: string; // character varying(255)
    release_date?: Date; // date
    plot_summary?: string; // text
    poster_url?: string; // character varying(255)
    duration_minutes?: number;
    trailer_url?: string; // character varying(255)
    movieq_rating?: number; // numeric(3,2), default 0.00
    imdb_rating?: number; // numeric(3,1), default 0.0
    letterboxd_rating?: number; // numeric(3,1), default 0.0
}

export interface News {
    id: number;
    title: string; // character varying(255)
    short_content?: string; // text
    content: string; // text
    author_id?: number;
    image_url?: string; // character varying(255)
    published_at: Date; // timestamp with time zone, default CURRENT_TIMESTAMP
}

export interface NewsMovie {
    news_id: number;
    movie_id: number;
}

export interface Person {
    id: number;
    name: string; // character varying(100)
    bio?: string; // text
    birth_date?: Date; // date
    profile_image_url?: string; // character varying(255)
}

export interface QuizChoice {
    id: number;
    question_id: number;
    choice_text: string; // character varying(255)
    image_url?: string; // character varying(255)
}

export interface QuizQuestion {
    id: number;
    question_text: string; // text
    allowed_choices_count: number; // default 1
}

export interface RecommendationSectionMovie {
    id: number;
    section_id: number;
    movie_id: number;
    display_order: number; // default 0
    added_at: Date; // timestamp with time zone, default CURRENT_TIMESTAMP
}

export interface RecommendationSection {
    id: number;
    title: string; // character varying(100)
    section_type: string; // character varying(50) - Consider an ENUM here (see below)
    description?: string; // text
    display_order: number; // default 0
    is_active: boolean; // default true
}

export interface UserListItem {
    id: number;
    list_id: number;
    movie_id: number;
    added_at: Date; // timestamp with time zone, default CURRENT_TIMESTAMP
    updated_at: Date; // timestamp with time zone, default CURRENT_TIMESTAMP
}

export interface UserList {
    id: number;
    user_id: number;
    list_type: string; // character varying(20) - Consider an ENUM here (see below)
    created_at: Date; // timestamp with time zone, default CURRENT_TIMESTAMP
}

export interface UserQuizAnswer {
    id: number;
    user_id: number;
    question_id: number;
    choice_id: number;
    answered_at: Date; // timestamp with time zone, default CURRENT_TIMESTAMP
}

export interface UserRating {
    id: number;
    user_id: number;
    movie_id: number;
    rating: number; // CHECK rating >= 1 AND rating <= 10
    created_at: Date; // timestamp with time zone, default CURRENT_TIMESTAMP
    updated_at: Date; // timestamp with time zone, default CURRENT_TIMESTAMP
}

export interface User {
    id: number;
    first_name?: string; // character varying(100)
    last_name?: string; // character varying(100)
    username: string; // character varying(50)
    email: string; // character varying(100)
    password_hash: string; // character varying(255)
    avatar_url?: string; // character varying(255)
    bio?: string; // text
    created_at: Date; // timestamp with time zone, default CURRENT_TIMESTAMP
    updated_at: Date; // timestamp with time zone, default CURRENT_TIMESTAMP
}

// Potential ENUMs based on CHECK constraints or common string types in your schema:
export enum UserListType {
    FAVORITES = 'favorites',
    WATCHED = 'watched',
    WATCHLIST = 'watchlist',
    MOST_RATED = 'MOST_RATED',
    MOST_COMMENTED = 'MOST_COMMENTED',
}

export enum RecommendationSectionType {
    ADMIN_DEFINED = 'ADMIN_DEFINED',
    LATEST = 'LATEST',
    POPULAR = 'POPULAR',
    MOST_RATED = 'MOST_RATED',
    MOST_COMMENTED = 'MOST_COMMENTED',
}
