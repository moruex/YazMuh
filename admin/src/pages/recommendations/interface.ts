import { Movie } from "@interfaces/movie.interfaces";

export interface Category {
    id: number;
    name: string;
    movies: Movie[];
}
