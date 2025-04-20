import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from "react";
import "./MovieCarousel.css";
import { FaHeart } from "react-icons/fa";
const MAX_DEFAULT_SLIDES = 5;
const DEFAULT_AUTOPLAY_INTERVAL = 5000;
const MovieCarousel = ({ movies, autoPlayInterval = DEFAULT_AUTOPLAY_INTERVAL, title, maxSlides = MAX_DEFAULT_SLIDES, }) => {
    const validMovies = Array.isArray(movies) ? movies : [];
    const displayedMovies = validMovies.slice(0, Math.max(1, maxSlides));
    const totalMovies = displayedMovies.length;
    // --- State ---
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    // --- Refs ---
    const carouselInnerRef = useRef(null);
    const intervalIdRef = useRef(null);
    const isMountedRef = useRef(true);
    const isTransitioningRef = useRef(isTransitioning);
    useEffect(() => {
        isTransitioningRef.current = isTransitioning;
    }, [isTransitioning]);
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);
    // --- Core Navigation Logic ---
    const goToSlide = useCallback((index) => {
        if (index === currentIndex ||
            index < 0 ||
            index >= totalMovies ||
            isTransitioningRef.current) {
            return;
        }
        if (isMountedRef.current) {
            setIsTransitioning(true);
            setCurrentIndex(index);
        }
    }, [currentIndex, totalMovies]);
    const nextSlide = useCallback(() => {
        if (isTransitioningRef.current)
            return;
        if (isMountedRef.current) {
            setIsTransitioning(true);
            setCurrentIndex((prev) => (prev + 1) % totalMovies);
        }
    }, [totalMovies]);
    const prevSlide = useCallback(() => {
        if (isTransitioningRef.current)
            return;
        if (isMountedRef.current) {
            setIsTransitioning(true);
            setCurrentIndex((prev) => (prev - 1 + totalMovies) % totalMovies);
        }
    }, [totalMovies]); // Don't depend on isTransitioning state directly here
    // --- Event Handlers ---
    const handleTransitionEnd = useCallback(() => {
        if (isMountedRef.current) {
            setIsTransitioning(false);
        }
    }, []);
    const resetAutoPlayTimer = useCallback(() => {
        if (intervalIdRef.current) {
            clearInterval(intervalIdRef.current);
            intervalIdRef.current = null;
        }
    }, []);
    const handleNextClick = useCallback(() => {
        resetAutoPlayTimer();
        nextSlide();
    }, [nextSlide, resetAutoPlayTimer]);
    const handlePrevClick = useCallback(() => {
        resetAutoPlayTimer();
        prevSlide();
    }, [prevSlide, resetAutoPlayTimer]);
    const handleIndicatorClick = useCallback((index) => {
        if (index === currentIndex || isTransitioningRef.current)
            return;
        resetAutoPlayTimer();
        goToSlide(index);
    }, [currentIndex, goToSlide, resetAutoPlayTimer]);
    // --- Autoplay Effect ---
    useEffect(() => {
        if (intervalIdRef.current) {
            clearInterval(intervalIdRef.current);
        }
        intervalIdRef.current = null;
        if (autoPlayInterval > 0 && totalMovies > 1) {
            intervalIdRef.current = setInterval(() => {
                if (!isTransitioningRef.current && isMountedRef.current) {
                    // console.log("Autoplay triggering nextSlide");
                    setCurrentIndex((prev) => (prev + 1) % totalMovies);
                    setIsTransitioning(true);
                }
                else {
                    // console.log("Autoplay skipped - transition in progress or unmounted");
                }
            }, autoPlayInterval);
        }
        return () => {
            if (intervalIdRef.current) {
                clearInterval(intervalIdRef.current);
                intervalIdRef.current = null;
            }
        };
    }, [autoPlayInterval, totalMovies, isTransitioning]);
    // --- DEBUGGING ---
    // console.log('Displayed Movies Data:', displayedMovies);
    // --- Empty State ---
    if (totalMovies === 0) {
        return (_jsxs("div", { className: "mc-container", children: [title && _jsx("h2", { className: "mc-carousel-title", children: title }), _jsx("div", { className: "mc-empty", children: "No featured reviews available" })] }));
    }
    // --- Main Render ---
    return (_jsxs("div", { className: "mc-container", children: [title && _jsx("h2", { className: "mc-carousel-title", children: title }), _jsxs("div", { className: "mc-carousel", children: [_jsx("div", { className: "mc-carousel-inner", ref: carouselInnerRef, style: {
                            width: `${totalMovies * 100}%`,
                            transform: `translateX(-${(100 / totalMovies) * currentIndex}%)`,
                            transition: isTransitioning ? "transform 0.6s ease-in-out" : "none",
                        }, onTransitionEnd: handleTransitionEnd, children: displayedMovies.map((movie, index) => {
                            var _a, _b, _c, _d, _e, _f;
                            return (_jsx("div", { className: "mc-slide", style: { width: `${100 / totalMovies}%` }, role: "group", "aria-roledescription": "slide", "aria-label": `${index + 1} of ${totalMovies}`, "aria-hidden": index !== currentIndex, children: _jsxs("div", { className: "mc-slide-content", children: [_jsx("div", { className: "mc-poster-container", children: _jsx("img", { src: movie.posterUrl || "/placeholder-poster.jpg", alt: `Poster for ${movie.title}`, className: "mc-poster-img", loading: Math.abs(index - currentIndex) <= 1 ? "eager" : "lazy", fetchPriority: index === currentIndex ? "high" : "auto" }) }), _jsxs("div", { className: "mc-details-container", children: [_jsxs("div", { children: [_jsx("h3", { className: "mc-movie-title", children: movie.title }), _jsxs("p", { className: "mc-movie-year-genre", children: [movie.year, movie.genres &&
                                                                    movie.genres.length > 0 &&
                                                                    ` | ${movie.genres.join(", ")}`] })] }), movie.topComment && (_jsxs("div", { className: "mc-top-comment-section", children: [_jsx("h4", { className: "mc-comment-heading", children: "Top Comment" }), _jsxs("div", { className: "mc-comment-card", children: [_jsxs("div", { className: "mc-comment-header", children: [_jsx("img", { src: movie.topComment.avatarUrl ||
                                                                                "/placeholder-avatar.png", alt: `${movie.topComment.username}'s avatar`, className: "mc-comment-avatar", loading: "lazy", width: "32", height: "32" }), _jsx("span", { className: "mc-comment-username", children: movie.topComment.username })] }), _jsx("p", { className: "mc-comment-text", children: movie.topComment.text }), _jsxs("div", { className: "mc-comment-likes", children: [_jsx("span", { className: "mc-like-icon", "aria-hidden": "true", children: _jsx(FaHeart, { style: { color: "#d32f2f" } }) }), _jsx("span", { className: "mc-like-count", children: movie.topComment.likes })] })] })] })), _jsxs("div", { className: "mc-ratings-section", children: [_jsx("h4", { className: "mc-ratings-heading", children: "Ratings" }), _jsxs("div", { className: "mc-ratings-grid", children: [_jsxs("div", { className: "mc-rating-item", children: [_jsx("span", { className: "mc-rating-source", children: "IMDb" }), _jsx("span", { className: "mc-rating-value", children: (_b = (_a = movie.imdbRating) === null || _a === void 0 ? void 0 : _a.toFixed(1)) !== null && _b !== void 0 ? _b : (_jsx("span", { className: "mc-rating-na", children: "N/A" })) })] }), _jsxs("div", { className: "mc-rating-item", children: [_jsx("span", { className: "mc-rating-source", children: "MovieQ" }), _jsx("span", { className: "mc-rating-value", children: (_d = (_c = movie.movieQRating) === null || _c === void 0 ? void 0 : _c.toFixed(1)) !== null && _d !== void 0 ? _d : (_jsx("span", { className: "mc-rating-na", children: "N/A" })) })] }), _jsxs("div", { className: "mc-rating-item", children: [_jsx("span", { className: "mc-rating-source", children: "KinoPoisk" }), _jsx("span", { className: "mc-rating-value", children: (_f = (_e = movie.kinopoiskRating) === null || _e === void 0 ? void 0 : _e.toFixed(1)) !== null && _f !== void 0 ? _f : (_jsx("span", { className: "mc-rating-na", children: "N/A" })) })] })] })] })] })] }) }, movie.id || index));
                        }) }), totalMovies > 1 && (_jsxs(_Fragment, { children: [_jsx("button", { className: "mc-control mc-prev", onClick: handlePrevClick, disabled: isTransitioning, "aria-label": "Previous review slide", "aria-controls": "mc-carousel-inner", children: "\u2039" }), _jsx("button", { className: "mc-control mc-next", onClick: handleNextClick, disabled: isTransitioning, "aria-label": "Next review slide", "aria-controls": "mc-carousel-inner", children: "\u203A" })] }))] }), totalMovies > 1 && (_jsx("div", { className: "mc-indicators", role: "tablist", "aria-label": "Review slides", children: displayedMovies.map((_, index) => (_jsx("button", { id: `mc-indicator-${index}`, className: `mc-indicator ${index === currentIndex ? "mc-active" : ""}`, onClick: () => handleIndicatorClick(index), disabled: isTransitioning || index === currentIndex, "aria-label": `Go to review slide ${index + 1}`, "aria-controls": "mc-carousel-inner", "aria-selected": index === currentIndex, role: "tab" }, index))) }))] }));
};
export default MovieCarousel;
