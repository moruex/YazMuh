import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navbar from '@components/app/Navbar';
import HomePage from '@pages/home/HomePage';
import MovieSearch from '@pages/movies/MovieSearchPage';
import ErrorPage from '@pages/error/ErrorPage';
import LoginRegisterPage from '@pages/login_register/LoginRegisterPage';
import MovieDetailsPage from '@pages/movies/MovieDetailPage';
import NewsDetailsPage from '@pages/news/NewsDetailsPage';
import NewsPage from '@pages/news/NewsPage';
import ProfilePage from '@pages/profile/ProfilePage';
import QuizPage from '@pages/quiz/QuizPage';
import RecPage from '@pages/rec/RecPage';
import AboutPage from '@pages/about/AboutPage';
import ContactsPage from '@pages/contacts/ContactsPage';
import PersonDetailsPage from '@pages/person/PersonDetailPage';
const App = () => {
    // State to track if user is logged in
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    return (_jsx(Router, { children: _jsxs("div", { className: "app", children: [_jsx(Navbar, { isLoggedIn: isLoggedIn }), _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(HomePage, {}) }), _jsx(Route, { path: "/search", element: _jsx(MovieSearch, {}) }), _jsx(Route, { path: "/recs", element: _jsx(RecPage, {}) }), _jsx(Route, { path: "/movies/:movieId", element: _jsx(MovieDetailsPage, {}) }), _jsx(Route, { path: "/person/:personId", element: _jsx(PersonDetailsPage, {}) }), _jsx(Route, { path: "/news", element: _jsx(NewsPage, {}) }), _jsx(Route, { path: "/newsd", element: _jsx(NewsDetailsPage, {}) }), _jsx(Route, { path: "/about", element: _jsx(AboutPage, {}) }), _jsx(Route, { path: "/contacts", element: _jsx(ContactsPage, {}) }), _jsx(Route, { path: "/quiz", element: isLoggedIn ? _jsx(QuizPage, {}) : _jsx(LoginRegisterPage, {}) }), _jsx(Route, { path: "/profile", element: isLoggedIn ? _jsx(ProfilePage, {}) : _jsx(LoginRegisterPage, {}) }), _jsx(Route, { path: "/login", element: _jsx(LoginRegisterPage, {}) }), _jsx(Route, { path: "*", element: _jsx(ErrorPage, {}) })] }), _jsx("div", { className: "demo-controls", children: _jsx("button", { onClick: () => setIsLoggedIn(!isLoggedIn), children: isLoggedIn ? "Simulate Logout" : "Simulate Login" }) })] }) }));
};
export default App;
