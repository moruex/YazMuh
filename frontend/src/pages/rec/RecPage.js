var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { movieService } from "./movieService";
import "./RecPage.css";
import Footer from "@components/app/Footer";
import { MovieCard4 } from "./MovieCard4";
const RecPage = () => {
    const [recommendedMovies, setRecommendedMovies] = useState([]);
    const [recommendationType, setRecommendationType] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const fetchMovies = (fetcher, type) => __awaiter(void 0, void 0, void 0, function* () {
        setIsLoading(true);
        setRecommendationType(type);
        try {
            // Simulate network delay
            yield new Promise(resolve => setTimeout(resolve, 500));
            const movies = fetcher(18);
            setRecommendedMovies(movies);
        }
        finally {
            setIsLoading(false);
        }
    });
    const handleRandomRecommendation = () => fetchMovies(movieService.getRandomMovies, "Random Gems");
    const handleNewRecommendation = () => fetchMovies(movieService.getNewMovies, "Latest Releases");
    const handlePopularRecommendation = () => fetchMovies(movieService.getPopularMovies, "Popular Picks");
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "rec-page", children: _jsxs("div", { className: "rec-container", children: [_jsx("h1", { className: "rec-heading", children: "Discover Movies" }), _jsx("p", { className: "rec-subheading", children: "Find your next favorite film with our curated recommendations." }), _jsxs("div", { className: "rec-buttons", children: [_jsx("button", { className: "rec-button", onClick: handleRandomRecommendation, children: "Random" }), _jsx("button", { className: "rec-button", onClick: handleNewRecommendation, children: "New Releases" }), _jsx("button", { className: "rec-button", onClick: handlePopularRecommendation, children: "Popular" })] }), isLoading ? (_jsxs("div", { className: "rec-loading-indicator", children: [_jsx("span", { className: "rec-loader" }), _jsx("p", { children: "Searching for movies..." })] })) : recommendedMovies.length > 0 ? (_jsxs("div", { className: "rec-movie-grid-container", children: [_jsx("h2", { className: "rec-movie-grid-title", children: recommendationType }), _jsx("div", { className: "rec-movie-grid", children: recommendedMovies.map((movie) => (_jsx(MovieCard4, { movie: movie }, movie.id))) })] })) : (_jsx(_Fragment, {}))] }) }), _jsx(Footer, {})] }));
};
export default RecPage;
