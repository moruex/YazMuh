import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const MovieSection = ({ title, children }) => {
    return (_jsxs("section", { children: [_jsx("div", { className: "movie-section-header", children: _jsx("h2", { children: title }) }), _jsx("div", { className: "movie-grid", children: children })] }));
};
export default MovieSection;
