// src/interfaces/enums.ts

// Person-related enums
export enum Gender {
    NOT_SPECIFIED = 'NOT_SPECIFIED',
    FEMALE = 'FEMALE',
    MALE = 'MALE',
}

// Movie-related enums
export enum UserListType {
    favorites = 'favorites',
    watched = 'watched',
    watchlist = 'watchlist',
}

export enum RecommendationSectionType {
    ADMIN_DEFINED = 'ADMIN_DEFINED',
    LATEST = 'LATEST',
    POPULAR = 'POPULAR',
    MOST_RATED = 'MOST_RATED',
    MOST_COMMENTED = 'MOST_COMMENTED',
}

// Admin-related enums
export enum AdminRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    ADMIN = 'ADMIN',
    CONTENT_MODERATOR = 'CONTENT_MODERATOR',
} 