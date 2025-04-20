import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
// import { Movie } from '@src/types/Movie'; // Remove unused import
import MovieSection from "./MovieSection";
import Footer from "@components/app/Footer";
import './HomePage.css';
import MovieCard1 from "./MovieCard1";
import MovieCarousel from "./MovieCarousel";
const mockMovies = [
    {
        id: 1,
        title: "The Shawshank Redemption",
        year: 1994,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzMtY2YzZC00NmNlLWJiNDMtZDViZWM2MzIxZDYwXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_FMjpg_UX1000_.jpg",
        rating: 9.3,
        genres: ["Drama"],
        director: "Frank Darabont",
        runtime: 142,
        language: "English"
    },
    {
        id: 2,
        title: "The Godfather",
        year: 1972,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg",
        rating: 9.2,
        genres: ["Crime", "Drama"],
        director: "Francis Ford Coppola",
        runtime: 175,
        language: "English"
    },
    {
        id: 3,
        title: "Pulp Fiction",
        year: 1994,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItYzViMjE3YzI5MjljXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg",
        rating: 8.9,
        genres: ["Crime", "Drama"],
        director: "Quentin Tarantino",
        runtime: 154,
        language: "English"
    },
    {
        id: 6,
        title: "Inception",
        year: 2010,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_FMjpg_UX1000_.jpg",
        rating: 8.8,
        genres: ["Action", "Adventure", "Sci-Fi"],
        director: "Christopher Nolan",
        runtime: 148,
        language: "English"
    },
    {
        id: 7,
        title: "Interstellar",
        year: 2014,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_FMjpg_UX1000_.jpg",
        rating: 8.6,
        genres: ["Adventure", "Drama", "Sci-Fi"],
        director: "Christopher Nolan",
        runtime: 169,
        language: "English"
    },
    {
        id: 9,
        title: "The Dark Knight",
        year: 2008,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_FMjpg_UX1000_.jpg",
        rating: 9.0,
        genres: ["Action", "Crime", "Drama"],
        director: "Christopher Nolan",
        runtime: 152,
        language: "English"
    },
    {
        id: 10,
        title: "Fight Club",
        year: 1999,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BMmEzNTkxYjQtZTc0MC00YTVjLTg5ZTEtZWMwOWVlYzY0NWIwXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_FMjpg_UX1000_.jpg",
        rating: 8.8,
        genres: ["Drama"],
        director: "David Fincher",
        runtime: 139,
        language: "English"
    },
    {
        id: 11,
        title: "Naruto: The Last",
        year: 2014,
        posterUrl: "https://static.hdrezka.ac/i/2022/9/28/d3abc7fdf9382ef67g21p.jpg",
        rating: 8.2,
        genres: ["Animation", "Action", "Adventure"],
        director: "Tsuneo Kobayashi",
        runtime: 112,
        language: "Japanese"
    },
    {
        id: 12,
        title: "Attack on Titan: Chronicle",
        year: 2020,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BMTY5ODk1NzUyMl5BMl5BanBnXkFtZTgwMjUyNzEyMTE@._V1_FMjpg_UX1000_.jpg",
        rating: 8.5,
        genres: ["Animation", "Action", "Drama"],
        director: "Tetsurō Araki",
        runtime: 120,
        language: "Japanese"
    },
    {
        id: 13,
        title: "The Matrix",
        year: 1999,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4L2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_.jpg",
        rating: 8.7,
        genres: ["Action", "Sci-Fi"],
        director: "Lana & Lilly Wachowski",
        runtime: 136,
        language: "English"
    },
    {
        id: 15,
        title: "Parasite",
        year: 2019,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_FMjpg_UX1000_.jpg",
        rating: 8.6,
        genres: ["Comedy", "Drama", "Thriller"],
        director: "Bong Joon-ho",
        runtime: 132,
        language: "Korean"
    },
    {
        id: 17,
        title: "Spirited Away",
        year: 2001,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BMjlmZmI5MDctNDE2YS00YWE0LWE5ZWItZDBhYWQ0NTcxNWRhXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_FMjpg_UX1000_.jpg",
        rating: 8.6,
        genres: ["Animation", "Adventure", "Family"],
        director: "Hayao Miyazaki",
        runtime: 125,
        language: "Japanese"
    },
    {
        id: 18,
        title: "The Avengers",
        year: 2012,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BNDYxNjQyMjAtNTdiOS00NGYwLWFmNTAtNThmYjU5ZGI2YTI1XkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_FMjpg_UX1000_.jpg",
        rating: 8.0,
        genres: ["Action", "Adventure", "Sci-Fi"],
        director: "Joss Whedon",
        runtime: 143,
        language: "English"
    },
    {
        id: 19,
        title: "Breaking Bad (TV Series)",
        year: 2008,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BYmQ4YWMxYjUtNjZmYi00MDQ1LWFjMjMtNjA5ZDdiYjdiODU5XkEyXkFqcGdeQXVyMTMzNDExODE5._V1_FMjpg_UX1000_.jpg",
        rating: 9.5,
        genres: ["Crime", "Drama", "Thriller"],
        runtime: 45,
        language: "English"
    },
    {
        id: 21,
        title: "Blade Runner 2049",
        year: 2017,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BNzA1Njg4NzYxOV5BMl5BanBnXkFtZTgwODk5NjU3MzI@._V1_FMjpg_UX1000_.jpg",
        rating: 8.0,
        genres: ["Sci-Fi", "Thriller"],
        director: "Denis Villeneuve",
        runtime: 164,
        language: "English"
    },
    {
        id: 23,
        title: "Demon Slayer: Mugen Train",
        year: 2020,
        posterUrl: "https://pics.blokino.org/anime/05/0530/prev.jpg",
        rating: 8.3,
        genres: ["Animation", "Action", "Adventure"],
        director: "Haruo Sotozaki",
        runtime: 117,
        language: "Japanese"
    },
    {
        id: 24,
        title: "Dune",
        year: 2021,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BN2FjNmEyNWMtYzM0ZS00NjIyLTg5YzYtYThlMGVjNzE1OGViXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_FMjpg_UX1000_.jpg",
        rating: 8.0,
        genres: ["Sci-Fi", "Adventure"],
        director: "Denis Villeneuve",
        runtime: 155,
        language: "English"
    },
    {
        id: 26,
        title: "The Witcher (TV Series)",
        year: 2019,
        posterUrl: "https://static.hdrezka.ac/i/2023/4/26/od101a5553311dy48a81e.jpg",
        rating: 8.2,
        genres: ["Action", "Adventure", "Fantasy"],
        runtime: 60,
        language: "English"
    },
    {
        id: 28,
        title: "Tenet",
        year: 2020,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BYzg0NGM2NjAtNmIxOC00MDJmLTg5ZmYtYzM0MTE4NWE2NzlhXkEyXkFqcGdeQXVyMTA4NjE0NjEy._V1_FMjpg_UX1000_.jpg",
        rating: 7.5,
        genres: ["Action", "Sci-Fi", "Thriller"],
        director: "Christopher Nolan",
        runtime: 150,
        language: "English"
    },
    {
        id: 29,
        title: "One Piece: Red",
        year: 2022,
        posterUrl: "https://static.hdrezka.ac/i/2023/5/5/oc9b75b78b731er75w38t.jpg",
        rating: 7.3,
        genres: ["Animation", "Action", "Adventure"],
        director: "Gorō Taniguchi",
        runtime: 115,
        language: "Japanese"
    },
];
const myMovieDataRaw = [
    {
        id: 'm1',
        title: "Interstellar",
        year: 2014,
        genres: ["Sci-Fi", "Drama", "Adventure"],
        posterUrl: "https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_FMjpg_UX1000_.jpg", // Use your actual paths
        reviewQuote: "Visually stunning and emotionally resonant.",
        imdbRating: 8.7,
        movieQRating: 9.5,
        kinopoiskRating: 8.6,
        topComment: {
            avatarUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Tom_Holland_by_Gage_Skidmore.jpg/330px-Tom_Holland_by_Gage_Skidmore.jpg", // Use your actual paths
            username: "SpaceFanatic",
            text: "Mind-blowing! The scale, the music, the feels... Cooper!",
            likes: 245
        }
    },
    {
        id: 'm2',
        title: "The Grand Budapest Hotel",
        year: 2014,
        genres: ["Comedy", "Drama", "Adventure"],
        posterUrl: "https://m.media-amazon.com/images/M/MV5BMzM5NjUxOTEyMl5BMl5BanBnXkFtZTgwNjEyMDM0MDE@._V1_.jpg",
        imdbRating: 8.1,
        movieQRating: 8.8,
        kinopoiskRating: 7.9,
        topComment: {
            avatarUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Tom_Holland_by_Gage_Skidmore.jpg/330px-Tom_Holland_by_Gage_Skidmore.jpg", // Use your actual paths
            username: "SpaceFanatic",
            text: "Mind-blowing! The scale, the music, the feels... Cooper!",
            likes: 245
        }
    },
    {
        id: 'm3',
        title: "Parasite",
        year: 2019,
        genres: ["Thriller", "Comedy", "Drama"],
        posterUrl: "https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_FMjpg_UX1000_.jpg",
        imdbRating: 8.5,
        movieQRating: 9.2,
        kinopoiskRating: 8.0,
        topComment: {
            avatarUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Tom_Holland_by_Gage_Skidmore.jpg/330px-Tom_Holland_by_Gage_Skidmore.jpg",
            username: "FilmBuff_Kim",
            text: "Absolutely brilliant script and direction. The tension builds perfectly. Deserved all the awards.",
            likes: 199
        }
    },
];
const myMovieData = myMovieDataRaw.map((movie, index) => {
    var _a, _b;
    return (Object.assign(Object.assign({}, movie), { id: parseInt(movie.id.replace('m', ''), 10) || index, rating: (_b = (_a = movie.movieQRating) !== null && _a !== void 0 ? _a : movie.imdbRating) !== null && _b !== void 0 ? _b : 0 }));
});
const mockMoviesSections = {
    popular: mockMovies,
    newReleases: mockMovies,
    recommended: mockMovies,
    recentlyAdded: mockMovies,
};
const NewsCard = ({ title, posterUrl, description, date }) => (_jsx("div", { className: "movie-news-card", children: _jsxs("a", { href: `/newsd`, className: "hm-movie-card-link", children: [_jsx("div", { className: "movie-news-image", children: _jsx("img", { src: posterUrl, alt: title }) }), _jsx("h3", { children: title }), _jsx("p", { children: description }), _jsx("span", { className: "movie-news-date", children: date })] }) }));
const HomePage = () => {
    const [popularMovies] = useState(mockMoviesSections.popular);
    const [newReleases] = useState(mockMoviesSections.newReleases);
    const [recommendedMovies] = useState(mockMoviesSections.recommended);
    const [recentlyAdded] = useState(mockMoviesSections.recentlyAdded);
    const newsItems = [
        {
            title: "New Spider-Man Film Announced",
            posterUrl: "https://resizing.flixster.com/iBPi8jYYfJgouPuxoKHMcg6vme4=/206x305/v2/https://resizing.flixster.com/-XZAfHZM39UwaGJIFWKAE8fS0ak=/v3/t/assets/p29821_p_v13_ai.jpg",
            description: "Marvel Studios reveals plans for the next Spider-Man trilogy.",
            date: "2 days ago"
        },
        {
            title: "Oscar Nominations 2023",
            posterUrl: "https://resizing.flixster.com/IYgCjgZpp_oGzLKpijsO1UHEgKg=/206x305/v2/https://resizing.flixster.com/-uSBmd4p_jdBa2PC4imW3wZdkkk=/ems.cHJkLWVtcy1hc3NldHMvbW92aWVzLzQzZDZlZWE1LTJkZjQtNDU1Yy1hNTFmLWMwMTQ0OTVhMDcxNi5qcGc=",
            description: "See the full list of nominees for this year's Academy Awards.",
            date: "1 week ago"
        },
        {
            title: "Director's Cut Coming Soon",
            posterUrl: "https://resizing.flixster.com/8iRXoIshaUVw7IAK7k4iCFTxECE=/206x305/v2/https://resizing.flixster.com/YM8JrZLwpJeRLWpZW9Onngrjahc=/ems.cHJkLWVtcy1hc3NldHMvbW92aWVzL2MzMGIyNzNmLTcxZjYtNDEwOC1iMGUyLWZhNTg5YWI2ZmRhNS5qcGc=",
            description: "Extended version of popular sci-fi film to be released next month.",
            date: "3 days ago"
        }
    ];
    return (_jsxs("div", { className: "movie-page", children: [_jsxs("div", { className: "movie-container", children: [_jsx(MovieCarousel, { movies: myMovieData, autoPlayInterval: 8000 }), _jsxs("section", { className: "movie-news-section", children: [_jsx("h2", { children: "Latest Movie News" }), _jsx("div", { className: "movie-news-grid", children: newsItems.map((news, index) => (_jsx(NewsCard, Object.assign({}, news), index))) })] }), _jsx(MovieSection, { title: "New Releases", link: "/films/new", children: newReleases.map((movie) => (_jsx(MovieCard1, Object.assign({}, movie), movie.id))) }), _jsx(MovieSection, { title: "Popular This Week", link: "/films/popular", children: popularMovies.map((movie) => (_jsx(MovieCard1, Object.assign({}, movie), movie.id))) }), _jsxs("div", { className: "movie-two-column", children: [_jsx(MovieSection, { title: "Recently Added", link: "/films/recent", children: recentlyAdded.map((movie) => (_jsx(MovieCard1, Object.assign({}, movie), movie.id))) }), _jsx(MovieSection, { title: "Recommended", link: "/films/recommended", children: recommendedMovies.map((movie) => (_jsx(MovieCard1, Object.assign({}, movie), movie.id))) })] })] }), _jsx(Footer, {})] }));
};
export default HomePage;
