import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './MovieCard5.css';
export const MovieCard5 = ({ movie, index, renderStars }) => {
    return (_jsxs("div", { className: `movie-card5 ${movie.position}`, children: [_jsxs("div", { className: "movie-poster", children: [_jsx("img", { src: movie.imageUrl || "/api/placeholder/300/320", alt: movie.title || "Movie" }), _jsx("div", { className: "movie-overlay", children: _jsx("button", { className: "view-review-btn", children: "Read Review" }) })] }), _jsxs("div", { className: "movie-info", children: [_jsx("h3", { children: movie.title || "Untitled" }), _jsxs("p", { className: "movie-year-genre", children: [movie.year || "N/A", " \u2022 ", movie.genre || "Unknown"] }), renderStars(movie.rating || 0)] })] }, `${movie.id || index}-${movie.position}`));
};
