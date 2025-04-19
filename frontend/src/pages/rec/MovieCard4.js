import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const MovieCard4 = ({ movie }) => {
    const handleImageError = (e) => {
        const target = e.target;
        target.style.display = 'none';
        console.error(`Failed to load image: ${movie.posterUrl}`);
    };
    return (_jsx("div", { className: "rec-movie-card", children: _jsxs("a", { href: `/movies/1`, className: "rec-movie-card-link", children: [_jsx("div", { className: "rec-movie-poster-container", children: _jsx("img", { src: movie.posterUrl, alt: `${movie.title} poster`, className: "rec-movie-poster", onError: handleImageError, loading: "lazy" }) }), _jsxs("div", { className: "rec-movie-info", children: [_jsx("h3", { className: "rec-movie-title", title: movie.title, children: movie.title }), _jsx("p", { className: "rec-movie-year", children: movie.year })] })] }) }));
};
