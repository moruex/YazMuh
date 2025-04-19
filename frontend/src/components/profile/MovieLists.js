import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import MovieCard3 from './MovieCard3';
const MovieLists = ({ movies }) => {
    const [activeList, setActiveList] = useState('watched');
    return (_jsxs("div", { className: "movie-lists", children: [_jsx("h2", { children: "My Movie Lists" }), _jsxs("div", { className: "lists-tabs", children: [_jsxs("button", { className: activeList === 'watched' ? 'active' : '', onClick: () => setActiveList('watched'), children: ["Watched (", movies.length, ")"] }), _jsx("button", { className: activeList === 'favorites' ? 'active' : '', onClick: () => setActiveList('favorites'), children: "Favorites (0)" }), _jsx("button", { className: activeList === 'watchlist' ? 'active' : '', onClick: () => setActiveList('watchlist'), children: "Watchlist (0)" })] }), movies.length > 0 ? (_jsx("div", { className: "movies-grid", children: movies.map(movie => (_jsx(MovieCard3, { movie: movie }, movie.id))) })) : (_jsxs("div", { className: "empty-state", children: [_jsx("svg", { viewBox: "0 0 24 24", children: _jsx("path", { d: "M18 4V2H4v6h14V6h1v4H9.18l2.6-2.6-1.42-1.4-5 5 5 5 1.42-1.4-2.6-2.6H20v-6z" }) }), _jsx("h3", { children: "No movies yet" }), _jsx("p", { children: "Movies you watch will appear here" })] }))] }));
};
export default MovieLists;
