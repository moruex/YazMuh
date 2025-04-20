import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { Button } from "@mui/material";
import "./ErrorPage.css";
const ErrorPage = () => {
    return (_jsx("div", { className: "error-container", children: _jsx("div", { className: "error-page", children: _jsxs("div", { className: "error-content", children: [_jsx("div", { className: "error-image-container", children: _jsx("img", { src: "/error.png", alt: "Error", className: "error-image" }) }), _jsxs("div", { className: "error-text-container", children: [_jsx("h1", { className: "error-code glitch", children: "404" }), _jsx("h2", { className: "error-title1 glitch", children: "Page Not Found" }), _jsx("p", { className: "error-message1", children: "The page you're looking for doesn't exist or has been moved." }), _jsx(Link, { to: "/", className: "error-link", children: _jsx(Button, { className: "error-button neon-glow", variant: "contained", children: "Go Home" }) })] })] }) }) }));
};
export default ErrorPage;
