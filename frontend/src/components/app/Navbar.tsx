import { useState, useEffect, useRef, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconButton } from '@mui/material';
import { Menu as MenuIcon, Search as SearchIcon, ChevronDown } from 'lucide-react'; // Added LogOut
import './Navbar.css'; // Import the new CSS file
import { useAuth } from '@src/context/AuthContext'; // Import useAuth
import { useTranslation } from 'react-i18next';

// Define language type - flag is now a string (path or imported module)
interface Language {
  code: string;
  name: string;
  flag: string; // Path or imported SVG module
}

const Navbar = () => {
  const { isLoggedIn, user, isLoading: authIsLoading } = useAuth(); // Use auth state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // State for search input
  const navigate = useNavigate(); // Hook for navigation
  const { t, i18n } = useTranslation();

  // Language Dropdown State
  const [selectedLanguage, setSelectedLanguage] = useState<Language>({ code: 'en', name: 'English', flag: '/en.svg' });
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLLIElement>(null); // Ref for dropdown

  // Available languages - updated with imported flags
  const languages: Language[] = [
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
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
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
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Handle search form submission
  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
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
  const selectLanguage = (lang: Language) => {
    setSelectedLanguage(lang);
    setIsLangDropdownOpen(false);
    i18n.changeLanguage(lang.code);
    localStorage.setItem('i18nextLng', lang.code);
  };

  // Navigation links
  const navLinks = [
    { title: t('home'), path: '/' },
    { title: t('movies'), path: '/movies' },
    { title: t('recommended'), path: '/recs' },
    { title: t('news'), path: '/news' },
    { title: t('about'), path: '/about' },
    { title: t('contacts'), path: '/contacts' },
    // Language dropdown will be added dynamically after Contacts
  ];

  // Navigation links for logged-in users
  const authLinks = [
    { title: t('quiz'), path: '/quiz' },
  ];

  // Add handleLogout for sign out
  // const handleLogout = () => {
  //   logout();
  //   navigate('/login'); // Optionally redirect to login or home after logout
  // };

  // Display a simple loading or avoid rendering parts of navbar if auth is still loading
  // This is a basic check; you might want a more sophisticated loading state display.
  if (authIsLoading && !isLoggedIn) { 
    // Could return a minimal navbar or null if preferred during initial auth check
    // For now, let it render but buttons might be in a temp state
  }

  return (
    <header className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-brand" onClick={handleLinkClick}>
          Mov<span className="accent">i</span>e<span className="accent">Q</span>
        </Link>

        {/* Search Form */}
        <form className="search-form" onSubmit={handleSearchSubmit}>
          <div className="search-container">
            <SearchIcon className="search-icon" size={20} />
            <input
              type="text"
              placeholder={t("searchMovies")}
              className="search-input"
              aria-label="search movies"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {/* Hidden submit button for accessibility/enter key */}
             <button type="submit" style={{ display: 'none' }} aria-label="Submit search"></button>
          </div>
        </form>

        {/* Mobile Menu Toggle Button */}
        <IconButton onClick={toggleMenu} className="menu-toggle dhide" aria-label="Toggle menu">
          <MenuIcon />
        </IconButton>

        {/* Navigation and Auth Wrapper */}
        <div className={`nav-auth-wrapper ${isMenuOpen ? 'open' : ''}`}>
          {/* Navigation Links */}
          <ul className="nav-links">
            {navLinks.map((link) => (
              <li key={link.title}>
                <Link to={link.path} className="nav-link" onClick={handleLinkClick}>
                  {link.title}
                </Link>
              </li>
            ))}

            {/* Language Dropdown - Placed after Contacts */}
            <li ref={langDropdownRef} className="language-dropdown-container">
              <button className="language-dropdown-button" onClick={toggleLangDropdown} aria-haspopup="true" aria-expanded={isLangDropdownOpen}>
                {/* Use img tag for SVG flag */}
                <img src={selectedLanguage.flag} alt={`${selectedLanguage.name} flag`} className="flag-icon" />
                <span>{selectedLanguage.code.toUpperCase()}</span>
                <ChevronDown size={16} className={`dropdown-arrow ${isLangDropdownOpen ? 'open' : ''}`} />
              </button>
              {isLangDropdownOpen && (
                <ul className="language-dropdown-menu">
                  {languages.map((lang) => (
                    <li key={lang.code} onClick={() => selectLanguage(lang)} className="language-option">
                      {/* Use img tag for SVG flag */}
                      <img src={lang.flag} alt={`${lang.name} flag`} className="flag-icon" />
                      <span>{lang.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>

            {/* Auth Links (conditionally rendered) */}
            {isLoggedIn && authLinks.map((link) => (
              <li key={link.title}>
                <Link to={link.path} className="nav-link auth-link" onClick={handleLinkClick}>
                  {link.title}
                </Link>
              </li>
            ))}
          </ul>

          {/* Auth Actions */}
          <div className="auth-actions">
            {!isLoggedIn ? (
              <Link to="/login" className="sign-in-button" onClick={handleLinkClick}>
                {t('signIn')}
              </Link>
            ) : (
              <>
                <Link to="/profile" className="profile-link" title={user?.username || t('profile')} onClick={handleLinkClick}>
                  <div className="nav-profile-avatar">
                    {user?.avatar_url ? (
                        <img src={user.avatar_url} alt={user.username} className="avatar-image" />
                    ) : (
                        user?.username?.substring(0, 2).toUpperCase() || 'MQ'
                    )}
                    </div>
                </Link>
                {/* <IconButton onClick={handleLogout} className="sign-out-button" title="Sign Out" aria-label="Sign out">
                  <LogOut size={22} />
                </IconButton> */}
              </>
            )}
          </div>
        </div> {/* End nav-auth-wrapper */}

      </div> {/* End navbar-container */}
    </header>
  );
};

export default Navbar;