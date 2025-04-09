export interface Movie {
  id: number;
  title: string;
  year: number;
  posterUrl: string;
  rating: number;
  genres: string[];
  director?: string;
  runtime?: number;
  language?: string;
}