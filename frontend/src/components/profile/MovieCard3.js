import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const MovieCard3 = ({ movie }) => {
    return (_jsxs("div", { className: "pro-movie-card3", children: [_jsxs("div", { className: "pro-movie-poster", children: [_jsx("img", { src: movie.posterUrl, alt: movie.title }), movie.rating && (_jsx("div", { className: "pro-movie-rating", children: _jsx("span", { children: movie.rating.toFixed(1) }) }))] }), _jsxs("div", { className: "pro-movie-info", children: [_jsx("h3", { children: movie.title }), _jsx("p", { children: movie.year }), movie.genres && (_jsx("div", { className: "pro-movie-genres", children: movie.genres.slice(0, 2).map(genre => (_jsx("span", { className: "pro-genre-tag", children: genre }, genre))) }))] }), _jsx("div", { className: "pro-movie-actions", children: _jsx("button", { className: "pro-remove-button", children: "\u00D7 Remove" }) })] }, movie.id));
};
export default MovieCard3;
