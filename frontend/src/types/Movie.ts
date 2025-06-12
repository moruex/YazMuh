// src/types/Movie.ts

// Define helper types if they aren't globally available or imported
interface Person {
  id: string;
  name: string;
  // Add other relevant fields if needed (e.g., profile_picture_url)
}

interface Genre {
  id: string;
  name: string;
}

export interface Movie {
  id: string; // GraphQL'de ID genellikle string olur
  title: string;
  // year?: number; // Removed as release_date is used
  release_date?: string | null; // GraphQL'den gelen tarih
  plot_summary?: string | null;
  poster_url?: string | null; // Changed from posterUrl, match GQL
  posterUrl?: string | null | undefined; // Added for compatibility with some components
  
  runtime?: number; // İlk sürümde runtime olarak geçiyor
  duration_minutes?: number | null; // GraphQL sürümü
  trailer_url?: string | null;
  rating?: number; // İlk sürümde rating olarak geçiyor
  avg_rating?: number | null; // GraphQL sürümü
  genres?: Genre[] | null;
  // Eğer GraphQL'den gelen detaylı genre nesneleri varsa:
  // genres?: { id: string; name: string }[];
  director?: string;
  language?: string;

  // --- Added Fields (matching MovieDetailData/GraphQL) ---
  site_rating?: number | null;
  imdb_rating?: number | null;
  your_rating_placeholder?: number | null;

  directors?: Person[] | null;
  actors?: Person[] | null;
  
  // --- Fields for the UI ---
  year?: number; // Extracted from release_date for display
  slug?: string; // For navigation purposes
  movieq_rating?: number | null; // For compatibility with API data
}
