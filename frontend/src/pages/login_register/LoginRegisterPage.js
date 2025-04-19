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
import { Button, IconButton, InputAdornment, TextField } from "@mui/material";
import { Eye, EyeClosed } from "lucide-react";
import "./LoginRegisterPage.css";
const LoginRegisterPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [page, setPage] = useState("login");
    const handleSubmit = (e) => __awaiter(void 0, void 0, void 0, function* () {
        e.preventDefault();
        if (!email || !password) {
            setError("Please enter both email and password");
            return;
        }
        setError("");
        setIsLoading(true);
        try {
            yield new Promise((resolve) => setTimeout(resolve, 1000));
            window.location.href = "/";
        }
        catch (err) {
            setError("Invalid email or password");
        }
        finally {
            setIsLoading(false);
        }
    });
    return (_jsxs("div", { className: "lr-container", children: [_jsx("div", { className: "animated-background", children: _jsx("div", { className: 'bg-body', children: _jsxs("div", { className: "tunnel", children: [_jsxs("div", { className: "a-structure", children: [_jsx("div", { className: "line-left" }), _jsx("div", { className: "line-right" })] }), _jsxs("div", { className: "a-structure", children: [_jsx("div", { className: "line-left" }), _jsx("div", { className: "line-right" })] }), _jsxs("div", { className: "a-structure", children: [_jsx("div", { className: "line-left" }), _jsx("div", { className: "line-right" })] }), _jsx("div", { className: "reflection" })] }) }) }), _jsx("div", { className: "form-container", children: _jsxs("div", { className: "form-content", children: [page === "login" && (_jsxs(_Fragment, { children: [_jsx("h1", { className: "title", children: "Sign In" }), _jsx("p", { className: "subtitle", children: "Welcome back to MovieQ!" }), _jsxs("form", { className: "form", onSubmit: handleSubmit, children: [error && _jsx("div", { className: "error-message", children: error }), _jsx(TextField, { type: "email", placeholder: "Email", value: email, onChange: (e) => setEmail(e.target.value), required: true }), _jsx(TextField, { type: showPassword ? "text" : "password", placeholder: "Password", value: password, onChange: (e) => setPassword(e.target.value), required: true, InputProps: {
                                                endAdornment: (_jsx(InputAdornment, { position: "end", children: _jsx(IconButton, { onClick: () => setShowPassword(!showPassword), edge: "end", className: "uv-button", children: showPassword ? _jsx(Eye, {}) : _jsx(EyeClosed, {}) }) }))
                                            } }), _jsxs("div", { className: "form-options", children: [_jsxs("label", { className: "remember-me", children: [_jsx("input", { type: "checkbox", checked: rememberMe, onChange: () => setRememberMe(!rememberMe) }), "Remember me"] }), _jsx("a", { href: "#", onClick: () => setPage("forgot"), children: "Forgot password?" })] }), _jsx(Button, { type: "submit", fullWidth: true, disabled: isLoading, children: "Sign In" })] }), _jsxs("p", { className: "prompt", children: ["Don't have an account? ", _jsx("a", { href: "#", onClick: () => setPage("register"), children: "Create one" })] })] })), page === "register" && (_jsxs(_Fragment, { children: [_jsx("h1", { className: "title", children: "Create Account" }), _jsx("p", { className: "subtitle", children: "Join MovieQ today." }), _jsxs("form", { className: "form", onSubmit: handleSubmit, children: [_jsx(TextField, { type: "email", placeholder: "Email", value: email, onChange: (e) => setEmail(e.target.value), required: true }), _jsx(TextField, { type: showPassword ? "text" : "password", placeholder: "Password", value: password, onChange: (e) => setPassword(e.target.value), required: true, InputProps: {
                                                endAdornment: (_jsx(InputAdornment, { position: "end", children: _jsx(IconButton, { onClick: () => setShowPassword(!showPassword), edge: "end", className: "uv-button", children: showPassword ? _jsx(Eye, {}) : _jsx(EyeClosed, {}) }) }))
                                            } }), _jsx(Button, { type: "submit", fullWidth: true, disabled: isLoading, children: "Register" })] }), _jsxs("p", { className: "prompt", children: ["Already have an account? ", _jsx("a", { href: "#", onClick: () => setPage("login"), children: "Sign in" })] })] })), page === "forgot" && (_jsxs(_Fragment, { children: [_jsx("h1", { className: "title", children: "Forgot Password" }), _jsx("p", { className: "subtitle", children: "Enter your email to reset password." }), _jsxs("form", { className: "form", onSubmit: handleSubmit, children: [_jsx(TextField, { type: "email", placeholder: "Email", value: email, onChange: (e) => setEmail(e.target.value), required: true }), _jsx(Button, { type: "submit", fullWidth: true, disabled: isLoading, children: "Reset Password" })] }), _jsx("p", { className: "prompt", children: _jsx("a", { href: "#", onClick: () => setPage("login"), children: "Back to login" }) })] }))] }) })] }));
};
export default LoginRegisterPage;
