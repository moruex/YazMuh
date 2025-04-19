import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './MovieCard1.css';
const MovieCard1 = ({ title, year, posterUrl, rating, genres }) => {
    return (_jsx("div", { className: "hm-movie-card", children: _jsxs("a", { href: `/movies/1`, className: "hm-movie-card-link", children: [_jsxs("div", { className: "hm-movie-poster", children: [_jsx("img", { src: posterUrl, alt: `${title} poster` }), _jsx("div", { className: "hm-rating-badge", children: rating.toFixed(1) })] }), _jsxs("div", { className: "hm-movie-info", children: [_jsx("h3", { className: "hm-movie-title", children: title }), _jsx("div", { className: "hm-movie-year", children: year }), genres && genres.length > 0 && (_jsx("div", { className: "hm-movie-genres", children: genres.join(', ') }))] })] }) }));
};
export default MovieCard1;
