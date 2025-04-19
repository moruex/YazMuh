import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const MovieCard6 = ({ movie }) => {
    return (_jsxs("div", { className: "md-similar-movie-card", children: [_jsxs("div", { className: 'md-similar-poster-container', children: [_jsx("img", { src: movie.posterUrl, alt: movie.title }), _jsx("div", { className: "md-similar-rating-badge", children: movie.rating.toFixed(1) })] }), _jsxs("div", { className: "md-similar-movie-info", children: [_jsx("h3", { children: movie.title }), _jsx("p", { children: movie.year })] })] }, movie.id));
};
export default MovieCard6;
