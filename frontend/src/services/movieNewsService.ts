import { gql } from '@apollo/client';
import client from '@src/config/apolloClient';

// GraphQL queries
const GET_MOVIES = gql`
  query GetMovies {
    movies {
      id
      title
      release_date
      plot_summary
      poster_url
      duration_minutes
      movieq_rating
      imdb_rating
      genres { id name }
    }
  }
`;

const GET_NEWS = gql`
  query GetNews($limit: Int) {
    newsArticles(limit: $limit, offset: 0, sortBy: "published_at", sortOrder: "DESC") {
      id
      title
      short_content
      image_url
      published_at
    }
  }
`;

// Query for MoviesPage (using existing backend 'movies' query)
const GET_MOVIES_PAGE_QUERY = gql`
  query GetMoviesPage(
    $filter: MovieFilterInput
    $sortBy: MovieSortBy
    $search: String
    $limit: Int
    $offset: Int
  ) {
    movies(
      filter: $filter
      sortBy: $sortBy
      search: $search
      limit: $limit
      offset: $offset
    ) {
      id
      title
      slug
      plot_summary
      release_date
      duration_minutes
      poster_url
      movieq_rating
      imdb_rating
      genres {
        id
        name
      }
      cast(limit: 3) { # Fetch a few actors
        person {
          id
          name
          slug
        }
        character_name
      }
      crew(limit: 3) { # Fetch a few crew members, filter for directors later
        person {
          id
          name
          slug
        }
        job
        department
      }
    }
  }
`;

const GET_MOVIES_PAGE_COUNT_QUERY = gql`
  query GetMoviesPageCount($filter: MovieFilterInput, $search: String) {
    movieCount(filter: $filter, search: $search) # Matches backend query
  }
`;

const GET_ALL_GENRES_QUERY = gql`
  query GetAllGenres {
    genres(limit: 100, isCollection: false) { # Fetching non-collection genres
      id
      name
      slug # slug is available on backend Genre type
    }
  }
`;

// --- Queries for RecPage ---
const GET_RANDOM_MOVIES = gql`
  query GetRandomMovies($limit: Int) {
    randomMovies(limit: $limit) {
      id
      title
      release_date
      plot_summary
      poster_url
      duration_minutes
      movieq_rating
      genres { # Assuming MovieCard4 needs genres
        id
        name
      }
      # Add any other fields from backend Movie type that MovieCard4 might need
    }
  }
`;

const GET_RECOMMENDATION_SECTIONS = gql`
  query GetPublicRecommendationSections($activeOnly: Boolean, $limitSections: Int, $offsetSections: Int, $limitMoviesPerSection: Int) {
    publicRecommendationSections(activeOnly: $activeOnly, limit: $limitSections, offset: $offsetSections) {
      id
      title
      section_type
      description
      movies(limit: $limitMoviesPerSection) { # Fetch a few movies per section for preview
        id
        title
        release_date
        poster_url
        movieq_rating
        genres { id name } 
        # Add other fields needed by MovieCard4
      }
    }
  }
`;

// Types
export interface Movie {
  id: string;
  title: string;
  release_date: string | null;
  plot_summary: string | null;
  poster_url: string | null;
  duration_minutes: number | null;
  movieq_rating: number | null;
  imdb_rating: number | null;
  genres: { id: string; name: string }[] | null;
  cast?: { person: { id: string; name: string; slug?: string | null; }; character_name: string | null; }[] | null;
  crew?: { person: { id: string; name: string; slug?: string | null; }; job: string | null; department: string | null; }[] | null;
  published_at: string | null;
}

export interface NewsItem {
  id: string;
  title: string;
  short_content: string | null;
  image_url: string | null;
  published_at: string | null;
}

// Interface for a single, detailed news article
export interface NewsArticleDetail extends NewsItem {
  content: string; // Full content of the news article
  author?: { // Optional author details
    id: string;
    username: string; // Or name, depending on what User type exposes
  } | null;
  movies?: Movie[]; // Optional related movies
  // Add any other fields from the backend NewsArticle type that are needed for the detail page
}

// Interface for Movie data returned by the 'movies' query
// This should be kept aligned with the fields requested in GET_MOVIES_PAGE_QUERY
// and what MovieCard7/MoviesPage expects.
// The existing Movie interface in this file is for movieNewsService.ts (HomePage), 
// we can reuse it if the structure is identical or create a new one if it differs significantly.
// For now, assuming the existing Movie interface is compatible or will be adapted in MoviesPage.tsx.

export interface Genre {
  id: string;
  name: string;
  slug: string;
}

// Interface for the parameters for fetching movies on MoviesPage
export interface MoviesPageParams {
  filter?: any; // Corresponds to MovieFilterInput. Using 'any' for now.
  sortBy?: string; // Corresponds to MovieSortBy enum values like "RELEASE_DATE_DESC"
  search?: string; // Corresponds to backend 'search' argument
  limit?: number;
  offset?: number;
}

// --- Types for RecPage ---
export interface PublicRecommendationSection {
  id: string;
  title: string;
  section_type: string;
  description: string | null;
  movies: Movie[]; // Reusing the existing Movie type
  display_order: number | null;
  is_public: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

// Service functions
export const getMovies = async (): Promise<Movie[]> => {
  const { data, errors } = await client.query<{ movies: Movie[] }>({
    query: GET_MOVIES,
    fetchPolicy: 'network-only',
  });
  if (errors) throw new Error(errors.map(e => e.message).join('\n'));
  return data.movies;
};

export const getNews = async (limit?: number): Promise<NewsItem[]> => {
  const { data, errors } = await client.query<{ newsArticles: NewsItem[] }>({
    query: GET_NEWS,
    variables: { limit },
    fetchPolicy: 'network-only',
  });
  if (errors) {
    console.error('GraphQL Errors fetching news:', errors);
    throw new Error(errors.map(e => e.message).join('\n'));
  }
  return data.newsArticles;
};

// Function to fetch movies for MoviesPage
export const getMoviesForPage = async (params: MoviesPageParams): Promise<Movie[]> => {
  const { data, errors } = await client.query<{ movies: Movie[] }>({
    query: GET_MOVIES_PAGE_QUERY,
    variables: params,
    fetchPolicy: 'network-only',
  });
  if (errors) {
    console.error('GraphQL Errors fetching movies for page:', errors);
    throw new Error(errors.map(e => e.message).join('\n'));
  }
  return data.movies || [];
};

// Function to fetch total count of movies for MoviesPage pagination
export const getMoviesPageCount = async (params: { filter?: any; search?: string }): Promise<number> => {
  const { data, errors } = await client.query<{ movieCount: number }>({
    query: GET_MOVIES_PAGE_COUNT_QUERY,
    variables: params,
    fetchPolicy: 'network-only',
  });
  if (errors) {
    console.error('GraphQL Errors fetching movies page count:', errors);
    throw new Error(errors.map(e => e.message).join('\n'));
  }
  return data.movieCount || 0;
};

// Function to fetch all genres for filter dropdown
export const getAllGenres = async (): Promise<Genre[]> => {
  const { data, errors } = await client.query<{ genres: Genre[] }>({
    query: GET_ALL_GENRES_QUERY,
    fetchPolicy: 'cache-first',
  });
  if (errors) {
    console.error('GraphQL Errors fetching all genres:', errors);
    throw new Error(errors.map(e => e.message).join('\n'));
  }
  return data.genres || [];
};

// --- Service functions for RecPage ---
export const getRandomMoviesForRecPage = async (limit: number = 18): Promise<Movie[]> => {
  try {
    const { data, errors } = await client.query<{ randomMovies: Movie[] }>({
      query: GET_RANDOM_MOVIES,
      variables: { limit },
      fetchPolicy: 'network-only',
    });
    if (errors) {
      console.error('GraphQL Errors fetching random movies:', errors);
      throw new Error(errors.map(e => e.message).join('\n'));
    }
    return data.randomMovies || [];
  } catch (error) {
    console.error('Error in getRandomMoviesForRecPage service:', error);
    throw error;
  }
};

export const getRecommendationSections = async (
  activeOnly: boolean = true,
  limitSections: number = 10,
  offsetSections: number = 0,
  limitMoviesPerSection: number = 6 // Number of movies to fetch per section for display
): Promise<PublicRecommendationSection[]> => {
  try {
    const { data, errors } = await client.query<{ publicRecommendationSections: PublicRecommendationSection[] }>({
      query: GET_RECOMMENDATION_SECTIONS,
      variables: { activeOnly, limitSections, offsetSections, limitMoviesPerSection },
      fetchPolicy: 'network-only',
    });
    if (errors) {
      console.error('GraphQL Errors fetching recommendation sections:', errors);
      throw new Error(errors.map(e => e.message).join('\n'));
    }
    return data.publicRecommendationSections || [];
  } catch (error) {
    console.error('Error in getRecommendationSections service:', error);
    throw error;
  }
};

// GraphQL query for a single news article by ID
const GET_NEWS_ARTICLE_BY_ID = gql`
  query GetNewsArticleById($id: ID!) {
    newsArticle(id: $id) {
      id
      title
      short_content # Or excerpt, depending on backend resolver
      content # Full content
      image_url # Or featured_image_url
      published_at
      updated_at
      author {
        id
        username # Assuming User type has username, adjust if it's 'name' or similar
      }
      movies { # Assuming movies connection returns basic movie info
        id
        title
        poster_url
        # Add other movie fields if needed for display on news article page
      }
      # Add any other fields from NewsArticle type as needed
    }
  }
`;

// Function to fetch a single news article by its ID
export const getNewsArticleById = async (id: string): Promise<NewsArticleDetail | null> => {
  const { data, errors } = await client.query<{ newsArticle: NewsArticleDetail | null }>({
    query: GET_NEWS_ARTICLE_BY_ID,
    variables: { id },
    fetchPolicy: 'network-only',
  });

  if (errors) {
    console.error(`GraphQL Errors fetching news article with ID ${id}:`, errors);
    throw new Error(errors.map(e => e.message).join('\n'));
  }
  
  if (!data || !data.newsArticle) {
    // It might be a 404 if newsArticle is null, or an error if data itself is null
    // Depending on GraphQL server setup, a non-existent ID might return null for newsArticle or an error.
    // Handling the null case gracefully.
    return null; 
  }

  return data.newsArticle;
}; 