import { Movie } from './Movie';

export interface User {
  id: string;
  username: string;
  nickname: string;
  avatar: string;
  gender: 'male' | 'female' | 'other' | 'not-specified';
  age: number;
  watchedMovies: Movie[];
  favoriteMovies: Movie[];
  watchlist: Movie[];
}