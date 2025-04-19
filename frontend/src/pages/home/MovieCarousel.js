import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from 'react';
import './MovieCarousel.css';
import { FaHeart } from 'react-icons/fa';
const MAX_DEFAULT_SLIDES = 5;
const DEFAULT_AUTOPLAY_INTERVAL = 5000;
const MovieCarousel = ({ movies, // Removed default sample data - MUST pass data via props
autoPlayInterval = DEFAULT_AUTOPLAY_INTERVAL, title, maxSlides = MAX_DEFAULT_SLIDES, }) => {
    // Ensure movies is an array, even if undefined/null is passed
    const validMovies = Array.isArray(movies) ? movies : [];
    // Limit the number of movies based on maxSlides prop
    const displayedMovies = validMovies.slice(0, Math.max(1, maxSlides));
    const totalMovies = displayedMovies.length;
    // --- State ---
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    // --- Refs ---
    const carouselInnerRef = useRef(null);
    const intervalIdRef = useRef(null);
    // Ref to track if component is mounted (for safe state updates in async operations)
    const isMountedRef = useRef(true);
    // Ref to track transition state to avoid race conditions in interval
    const isTransitioningRef = useRef(isTransitioning);
    // Update transition ref whenever state changes
    useEffect(() => {
        isTransitioningRef.current = isTransitioning;
    }, [isTransitioning]);
    // Set mounted ref to false on unmount
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);
    // --- Core Navigation Logic ---
    const goToSlide = useCallback((index) => {
        // Check against ref to prevent triggering during transition
        if (index === currentIndex || index < 0 || index >= totalMovies || isTransitioningRef.current) {
            return;
        }
        if (isMountedRef.current) {
            setIsTransitioning(true);
            setCurrentIndex(index);
        }
    }, [currentIndex, totalMovies]); // Don't depend on isTransitioning state directly here
    const nextSlide = useCallback(() => {
        if (isTransitioningRef.current)
            return;
        if (isMountedRef.current) {
            setIsTransitioning(true);
            setCurrentIndex(prev => (prev + 1) % totalMovies);
        }
    }, [totalMovies]); // Don't depend on isTransitioning state directly here
    const prevSlide = useCallback(() => {
        if (isTransitioningRef.current)
            return;
        if (isMountedRef.current) {
            setIsTransitioning(true);
            setCurrentIndex(prev => (prev - 1 + totalMovies) % totalMovies);
        }
    }, [totalMovies]); // Don't depend on isTransitioning state directly here
    // --- Event Handlers ---
    const handleTransitionEnd = useCallback(() => {
        // Check mounted state before setting state
        if (isMountedRef.current) {
            setIsTransitioning(false);
        }
    }, []); // No dependencies needed
    // Function to safely clear interval and reset timer if needed
    const resetAutoPlayTimer = useCallback(() => {
        if (intervalIdRef.current) {
            clearInterval(intervalIdRef.current);
            intervalIdRef.current = null;
        }
        // Restart interval logic is handled within the main useEffect
    }, []);
    const handleNextClick = useCallback(() => {
        resetAutoPlayTimer(); // Reset timer on manual interaction
        nextSlide();
    }, [nextSlide, resetAutoPlayTimer]);
    const handlePrevClick = useCallback(() => {
        resetAutoPlayTimer(); // Reset timer on manual interaction
        prevSlide();
    }, [prevSlide, resetAutoPlayTimer]);
    const handleIndicatorClick = useCallback((index) => {
        if (index === currentIndex || isTransitioningRef.current)
            return;
        resetAutoPlayTimer(); // Reset timer on manual interaction
        goToSlide(index);
    }, [currentIndex, goToSlide, resetAutoPlayTimer]); // Depend on currentIndex here for the check
    // --- Autoplay Effect ---
    useEffect(() => {
        // Clear previous interval if it exists
        if (intervalIdRef.current) {
            clearInterval(intervalIdRef.current);
        }
        intervalIdRef.current = null;
        // Setup new interval only if conditions are met
        if (autoPlayInterval > 0 && totalMovies > 1) {
            intervalIdRef.current = setInterval(() => {
                // Use the ref for the most up-to-date transition status check
                if (!isTransitioningRef.current && isMountedRef.current) {
                    // console.log("Autoplay triggering nextSlide");
                    // No need to set isTransitioning here, nextSlide does it
                    setCurrentIndex(prev => (prev + 1) % totalMovies);
                    // Important: Set isTransitioning *after* updating index in the interval
                    // to ensure the check works correctly next time if interval is short
                    setIsTransitioning(true);
                }
                else {
                    // console.log("Autoplay skipped - transition in progress or unmounted");
                }
            }, autoPlayInterval);
        }
        // Cleanup function: Clear interval on component unmount or when deps change
        return () => {
            if (intervalIdRef.current) {
                clearInterval(intervalIdRef.current);
                intervalIdRef.current = null;
            }
        };
        // Re-run effect if interval duration, number of movies changes, or crucially,
        // when a transition *finishes* (isTransitioning becomes false) to potentially restart a paused timer.
    }, [autoPlayInterval, totalMovies, isTransitioning]); // isTransitioning IS needed here to restart timer after manual nav
    // --- DEBUGGING ---
    // Uncomment this line temporarily to see exactly what data is being mapped
    // console.log('Displayed Movies Data:', displayedMovies);
    // --- Empty State ---
    if (totalMovies === 0) {
        return (_jsxs("div", { className: "mc-container", children: [title && _jsx("h2", { className: "mc-carousel-title", children: title }), _jsx("div", { className: "mc-empty", children: "No featured reviews available" })] }));
    }
    // --- Main Render ---
    return (_jsxs("div", { className: "mc-container", children: [title && _jsx("h2", { className: "mc-carousel-title", children: title }), _jsxs("div", { className: "mc-carousel", children: [_jsx("div", { className: "mc-carousel-inner", ref: carouselInnerRef, style: {
                            width: `${totalMovies * 100}%`,
                            transform: `translateX(-${(100 / totalMovies) * currentIndex}%)`,
                            // Apply transition only when isTransitioning is true
                            transition: isTransitioning ? 'transform 0.6s ease-in-out' : 'none',
                        }, onTransitionEnd: handleTransitionEnd, children: displayedMovies.map((movie, index) => {
                            var _a, _b, _c, _d, _e, _f;
                            return (_jsxs("div", { className: "mc-slide", style: { width: `${100 / totalMovies}%` }, role: "group" // Better semantics for carousel items
                                , "aria-roledescription": "slide", "aria-label": `${index + 1} of ${totalMovies}`, "aria-hidden": index !== currentIndex, children: [_jsxs("div", { className: "mc-slide-content", children: [_jsx("div", { className: "mc-poster-container", children: _jsx("img", { src: movie.posterUrl || '/placeholder-poster.jpg', alt: `Poster for ${movie.title}`, className: "mc-poster-img", 
                                                    // Load current/adjacent slides eagerly for perceived speed
                                                    loading: Math.abs(index - currentIndex) <= 1 ? "eager" : "lazy", fetchPriority: index === currentIndex ? "high" : "auto" }) }), _jsxs("div", { className: "mc-details-container", children: [_jsxs("div", { children: [_jsx("h3", { className: "mc-movie-title", children: movie.title }), _jsxs("p", { className: "mc-movie-year-genre", children: [movie.year, movie.genres && movie.genres.length > 0 && ` | ${movie.genres.join(', ')}`] })] }), movie.topComment && (_jsxs("div", { className: "mc-top-comment-section", children: [_jsx("h4", { className: "mc-comment-heading", children: "Top Comment" }), _jsxs("div", { className: "mc-comment-card", children: [_jsxs("div", { className: "mc-comment-header", children: [_jsx("img", { src: movie.topComment.avatarUrl || '/placeholder-avatar.png', alt: `${movie.topComment.username}'s avatar`, className: "mc-comment-avatar", loading: "lazy" // Lazy load avatars
                                                                                , width: "32" // Specify dimensions
                                                                                , height: "32" }), _jsx("span", { className: "mc-comment-username", children: movie.topComment.username })] }), _jsx("p", { className: "mc-comment-text", children: movie.topComment.text }), _jsxs("div", { className: "mc-comment-likes", children: [_jsx("span", { className: "mc-like-icon", "aria-hidden": "true", children: _jsx(FaHeart, { style: { color: "#d32f2f" } }) }), _jsx("span", { className: "mc-like-count", children: movie.topComment.likes })] })] })] })), _jsxs("div", { className: "mc-ratings-section", children: [_jsx("h4", { className: "mc-ratings-heading", children: "Ratings" }), _jsxs("div", { className: "mc-ratings-grid", children: [_jsxs("div", { className: "mc-rating-item", children: [_jsx("span", { className: "mc-rating-source", children: "IMDb" }), _jsx("span", { className: "mc-rating-value", children: (_b = (_a = movie.imdbRating) === null || _a === void 0 ? void 0 : _a.toFixed(1)) !== null && _b !== void 0 ? _b : _jsx("span", { className: "mc-rating-na", children: "N/A" }) })] }), _jsxs("div", { className: "mc-rating-item", children: [_jsx("span", { className: "mc-rating-source", children: "MovieQ" }), _jsx("span", { className: "mc-rating-value", children: (_d = (_c = movie.movieQRating) === null || _c === void 0 ? void 0 : _c.toFixed(1)) !== null && _d !== void 0 ? _d : _jsx("span", { className: "mc-rating-na", children: "N/A" }) })] }), _jsxs("div", { className: "mc-rating-item", children: [_jsx("span", { className: "mc-rating-source", children: "KinoPoisk" }), _jsx("span", { className: "mc-rating-value", children: (_f = (_e = movie.kinopoiskRating) === null || _e === void 0 ? void 0 : _e.toFixed(1)) !== null && _f !== void 0 ? _f : _jsx("span", { className: "mc-rating-na", children: "N/A" }) })] })] })] })] }), " "] }), " "] }, movie.id || index) // End mc-slide
                            );
                        }) }), " ", totalMovies > 1 && (_jsxs(_Fragment, { children: [_jsx("button", { className: "mc-control mc-prev", onClick: handlePrevClick, disabled: isTransitioning, "aria-label": "Previous review slide", "aria-controls": "mc-carousel-inner" // Link control to the container it controls
                                , children: "\u2039" }), _jsx("button", { className: "mc-control mc-next", onClick: handleNextClick, disabled: isTransitioning, "aria-label": "Next review slide", "aria-controls": "mc-carousel-inner" // Link control to the container it controls
                                , children: "\u203A" })] }))] }), " ", totalMovies > 1 && (_jsx("div", { className: "mc-indicators", role: "tablist", "aria-label": "Review slides", children: displayedMovies.map((_, index) => (_jsx("button", { id: `mc-indicator-${index}`, className: `mc-indicator ${index === currentIndex ? 'mc-active' : ''}`, onClick: () => handleIndicatorClick(index), disabled: isTransitioning || index === currentIndex, "aria-label": `Go to review slide ${index + 1}`, "aria-controls": "mc-carousel-inner" // Link indicator to the container it controls
                    , "aria-selected": index === currentIndex, role: "tab" }, index))) }))] }) // End mc-container
    );
};
export default MovieCarousel;
