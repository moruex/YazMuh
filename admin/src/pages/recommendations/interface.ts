import { Movie } from "@pages/movies/interface";

export interface Category {
    id: number;
    name: string;
    movies: Movie[];
}
