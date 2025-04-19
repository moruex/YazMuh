import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconButton } from '@mui/material';
import { Menu as MenuIcon, Search as SearchIcon, ChevronDown } from 'lucide-react'; // Use Lucide Search, Added ChevronDown
import './Navbar.css'; // Import the new CSS file
const Navbar = ({ isLoggedIn = false }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [searchQuery, setSearchQuery] = useState(''); // State for search input
    const navigate = useNavigate(); // Hook for navigation
    // Language Dropdown State
    const [selectedLanguage, setSelectedLanguage] = useState({ code: 'en', name: 'English', flag: '/en.svg' });
    const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
    const langDropdownRef = useRef(null); // Ref for dropdown
    // Available languages - updated with imported flags
    const languages = [
        { code: 'en', name: 'English', flag: '/en.svg' },
        { code: 'tr', name: 'Türkçe', flag: '/tr.svg' },
        { code: 'tk', name: 'Türkmençe', flag: '/tk.svg' },
        { code: 'ru', name: 'Русский', flag: '/ru.svg' },
    ];
    // Track scroll for navbar appearance
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    // Close language dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
                setIsLangDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [langDropdownRef]);
    // Close menu on link click (optional but good UX)
    const handleLinkClick = () => {
        setIsMenuOpen(false);
        setIsLangDropdownOpen(false); // Close lang dropdown too
    };
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
        setIsLangDropdownOpen(false); // Close lang dropdown when opening/closing main menu
    };
    // Handle search input change
    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };
    // Handle search form submission
    const handleSearchSubmit = (event) => {
        event.preventDefault();
        const query = searchQuery.trim();
        if (query) {
            const targetUrl = `/search?query=${encodeURIComponent(query)}`;
            console.log("Navbar navigating to:", targetUrl); // Debug log
            navigate(targetUrl);
            // Clear the query *after* navigation might have started
            setTimeout(() => setSearchQuery(''), 0);
            setIsMenuOpen(false); // Close menu if open on mobile
        }
    };
    // Toggle language dropdown
    const toggleLangDropdown = () => {
        setIsLangDropdownOpen(!isLangDropdownOpen);
    };
    // Select language
    const selectLanguage = (lang) => {
        setSelectedLanguage(lang);
        setIsLangDropdownOpen(false);
        // TODO: Implement actual translation logic here
        // This usually involves setting the language in a context or using an i18n library instance
        console.log(`Language selected: ${lang.name} (${lang.code})`);
        // For demo, maybe reload or update a global state
    };
    // Navigation links
    const navLinks = [
        { title: 'Home', path: '/' },
        { title: 'Movies', path: '/recs' },
        { title: 'News', path: '/news' },
        { title: 'About', path: '/about' },
        { title: 'Contacts', path: '/contacts' },
        // Language dropdown will be added dynamically after Contacts
    ];
    // Navigation links for logged-in users
    const authLinks = [
        { title: 'Quiz', path: '/quiz' },
    ];
    return (_jsxs("header", { className: `navbar ${isScrolled ? 'scrolled' : ''}`, children: [_jsxs("div", { className: "navbar-container", children: [_jsxs(Link, { to: "/", className: "navbar-brand", onClick: handleLinkClick, children: ["Mov", _jsx("span", { className: "accent", children: "i" }), "e", _jsx("span", { className: "accent", children: "Q" })] }), _jsx("form", { className: "search-form", onSubmit: handleSearchSubmit, children: _jsxs("div", { className: "search-container", children: [_jsx(SearchIcon, { className: "search-icon", size: 20 }), _jsx("input", { type: "text", placeholder: "Search movies...", className: "search-input", "aria-label": "search movies", value: searchQuery, onChange: handleSearchChange }), _jsx("button", { type: "submit", style: { display: 'none' }, "aria-label": "Submit search" })] }) }), _jsx(IconButton, { onClick: toggleMenu, className: "menu-toggle dhide", "aria-label": "Toggle menu", children: _jsx(MenuIcon, {}) }), _jsxs("div", { className: `nav-auth-wrapper ${isMenuOpen ? 'open' : ''}`, children: [_jsxs("ul", { className: "nav-links", children: [navLinks.map((link) => (_jsx("li", { children: _jsx(Link, { to: link.path, className: "nav-link", onClick: handleLinkClick, children: link.title }) }, link.title))), _jsxs("li", { ref: langDropdownRef, className: "language-dropdown-container", children: [_jsxs("button", { className: "language-dropdown-button", onClick: toggleLangDropdown, "aria-haspopup": "true", "aria-expanded": isLangDropdownOpen, children: [_jsx("img", { src: selectedLanguage.flag, alt: `${selectedLanguage.name} flag`, className: "flag-icon" }), _jsx("span", { children: selectedLanguage.code.toUpperCase() }), _jsx(ChevronDown, { size: 16, className: `dropdown-arrow ${isLangDropdownOpen ? 'open' : ''}` })] }), isLangDropdownOpen && (_jsx("ul", { className: "language-dropdown-menu", children: languages.map((lang) => (_jsxs("li", { onClick: () => selectLanguage(lang), className: "language-option", children: [_jsx("img", { src: lang.flag, alt: `${lang.name} flag`, className: "flag-icon" }), _jsx("span", { children: lang.name })] }, lang.code))) }))] }), isLoggedIn && authLinks.map((link) => (_jsx("li", { children: _jsx(Link, { to: link.path, className: "nav-link auth-link", onClick: handleLinkClick, children: link.title }) }, link.title)))] }), _jsx("div", { className: "auth-actions", children: !isLoggedIn ? (_jsx(Link, { to: "/login", className: "sign-in-button", onClick: handleLinkClick, children: "Sign In" })) : (_jsx(Link, { to: "/profile", className: "profile-link", title: "Your Profile", onClick: handleLinkClick, children: _jsx("div", { className: "nav-profile-avatar", children: "MQ" }) })) })] }), " "] }), " "] }));
};
export default Navbar;
