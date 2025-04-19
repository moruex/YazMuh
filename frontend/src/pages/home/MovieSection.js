import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const MovieSection = ({ title, link, children }) => {
    return (_jsxs("section", { children: [_jsxs("div", { className: "movie-section-header", children: [_jsx("h2", { children: title }), link && (_jsxs("a", { href: link, className: "movie-see-all", children: ["See All", _jsx("svg", { width: "20", height: "20", viewBox: "0 0 20 20", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M7.5 15L12.5 10L7.5 5", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }) })] }))] }), _jsx("div", { className: "movie-grid", children: children })] }));
};
export default MovieSection;
