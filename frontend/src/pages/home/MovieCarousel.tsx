import React, { useState, useEffect, useRef, useCallback } from 'react';
import './MovieCarousel.css';
import { Movie } from '@src/types/Movie'; // Make sure this path is correct for your base Movie type
import { FaHeart } from 'react-icons/fa';

// --- Base Movie Type (Ensure this exists in @src/types/Movie) ---
// Example:
// export interface Movie {
//     id: string | number;
//     title: string;
//     year: number;
//     genres?: string[];
//     posterUrl?: string;
//     // other base properties...
// }

// --- Top Comment Structure ---
interface TopComment {
    avatarUrl: string;
    username: string;
    text: string;
    likes: number;
}

// --- Extend Movie type for carousel-specific data ---
interface CarouselMovie extends Movie {
    reviewQuote?: string;
    imdbRating?: number;
    movieQRating?: number;
    kinopoiskRating?: number;
    topComment?: TopComment; // This field MUST be present in your data for the comment to show
}

// --- Component Props ---
interface MovieCarouselProps {
    movies: CarouselMovie[];        // Pass the array of movies with potential topComment data here
    autoPlayInterval?: number;      // Milliseconds (0 or negative to disable)
    title?: string;
    maxSlides?: number;             // Max slides to actually use from the movies array
}

const MAX_DEFAULT_SLIDES = 5;
const DEFAULT_AUTOPLAY_INTERVAL = 5000;

const MovieCarousel: React.FC<MovieCarouselProps> = ({
    movies, // Removed default sample data - MUST pass data via props
    autoPlayInterval = DEFAULT_AUTOPLAY_INTERVAL,
    title,
    maxSlides = MAX_DEFAULT_SLIDES,
}) => {
    // Ensure movies is an array, even if undefined/null is passed
    const validMovies = Array.isArray(movies) ? movies : [];
    // Limit the number of movies based on maxSlides prop
    const displayedMovies = validMovies.slice(0, Math.max(1, maxSlides));
    const totalMovies = displayedMovies.length;

    // --- State ---
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // --- Refs ---
    const carouselInnerRef = useRef<HTMLDivElement>(null);
    const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
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
    const goToSlide = useCallback((index: number) => {
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
        if (isTransitioningRef.current) return;
        if (isMountedRef.current) {
            setIsTransitioning(true);
            setCurrentIndex(prev => (prev + 1) % totalMovies);
        }
    }, [totalMovies]); // Don't depend on isTransitioning state directly here

    const prevSlide = useCallback(() => {
        if (isTransitioningRef.current) return;
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

    const handleIndicatorClick = useCallback((index: number) => {
        if (index === currentIndex || isTransitioningRef.current) return;
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
                 } else {
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


    // --- Star Rendering Utility ---
    const renderStars = (ratingOutOf10: number | null | undefined) => {
        if (ratingOutOf10 === null || ratingOutOf10 === undefined || isNaN(ratingOutOf10)) {
            return <span className="mc-rating-value mc-rating-na">N/A</span>;
        }
        const ratingOutOf5 = Math.max(0, Math.min(10, ratingOutOf10)) / 2;
        const stars = [];
        const fullStars = Math.floor(ratingOutOf5);
        const hasHalfStar = ratingOutOf5 % 1 >= 0.5;
        const maxStars = 5;

        for (let i = 0; i < maxStars; i++) {
            if (i < fullStars) {
                stars.push(<span key={i} className="mc-star mc-full" aria-hidden="true">★</span>);
            } else if (i === fullStars && hasHalfStar) {
                stars.push(<span key={i} className="mc-star mc-half" aria-hidden="true">★</span>);
            } else {
                stars.push(<span key={i} className="mc-star mc-empty" aria-hidden="true">☆</span>);
            }
        }
        const accessibleText = `${ratingOutOf5.toFixed(1)} out of 5 stars`;
        return (
             <div className="mc-rating-stars" role="img" aria-label={accessibleText}>
                {stars}
            </div>
        );
    };

    // --- DEBUGGING ---
    // Uncomment this line temporarily to see exactly what data is being mapped
    // console.log('Displayed Movies Data:', displayedMovies);


    // --- Empty State ---
    if (totalMovies === 0) {
        return (
            <div className="mc-container">
                {title && <h2 className="mc-carousel-title">{title}</h2>}
                <div className="mc-empty">No featured reviews available</div>
            </div>
        );
    }

    // --- Main Render ---
    return (
        <div className="mc-container">
            {title && <h2 className="mc-carousel-title">{title}</h2>}

            {/* Viewport */}
            <div className="mc-carousel">
                {/* Inner track holding all slides */}
                <div
                    className="mc-carousel-inner"
                    ref={carouselInnerRef}
                    style={{
                        width: `${totalMovies * 100}%`,
                        transform: `translateX(-${(100 / totalMovies) * currentIndex}%)`,
                        // Apply transition only when isTransitioning is true
                        transition: isTransitioning ? 'transform 0.6s ease-in-out' : 'none',
                    }}
                    onTransitionEnd={handleTransitionEnd} // Use the memoized handler
                >
                    {/* Map over the movies to create slides */}
                    {displayedMovies.map((movie, index) => (
                        <div
                            className="mc-slide"
                            key={movie.id || index} // Use movie ID if available, otherwise index
                            style={{ width: `${100 / totalMovies}%` }} // Each slide takes fractional width
                            role="group" // Better semantics for carousel items
                            aria-roledescription="slide"
                            aria-label={`${index + 1} of ${totalMovies}`}
                            aria-hidden={index !== currentIndex} // Hide non-visible slides from accessibility tree
                        >
                            <div className="mc-slide-content">
                                {/* Left Side: Poster */}
                                <div className="mc-poster-container">
                                    <img
                                        src={movie.posterUrl || '/placeholder-poster.jpg'} // Provide a default fallback poster
                                        alt={`Poster for ${movie.title}`}
                                        className="mc-poster-img"
                                        // Load current/adjacent slides eagerly for perceived speed
                                        loading={Math.abs(index - currentIndex) <= 1 ? "eager" : "lazy"}
                                        fetchPriority={index === currentIndex ? "high" : "auto"}
                                    />
                                </div>

                                {/* Right Side: Details */}
                                <div className="mc-details-container">
                                    {/* Top Section: Title, Year, Genre */}
                                    <div>
                                        <h3 className="mc-movie-title">{movie.title}</h3>
                                        <p className="mc-movie-year-genre">
                                            {movie.year}
                                            {movie.genres && movie.genres.length > 0 && ` | ${movie.genres.join(', ')}`}
                                        </p>
                                    </div>

                                    {/* --- Top Comment Section (Conditionally Rendered) --- */}
                                    {/* This section ONLY appears if movie.topComment has data */}
                                    {movie.topComment && (
                                        <div className="mc-top-comment-section">
                                            <h4 className="mc-comment-heading">Top Comment</h4>
                                            <div className="mc-comment-card">
                                                <div className="mc-comment-header">
                                                    <img
                                                        src={movie.topComment.avatarUrl || '/placeholder-avatar.png'} // Provide a fallback avatar
                                                        alt={`${movie.topComment.username}'s avatar`}
                                                        className="mc-comment-avatar"
                                                        loading="lazy" // Lazy load avatars
                                                        width="32" // Specify dimensions
                                                        height="32"
                                                    />
                                                    <span className="mc-comment-username">{movie.topComment.username}</span>
                                                </div>
                                                <p className="mc-comment-text">{movie.topComment.text}</p>
                                                <div className="mc-comment-likes">
                                                    {/* Consider using an SVG icon for better styling */}
                                                    <span className="mc-like-icon" aria-hidden="true"><FaHeart style={{ color: "#d32f2f" }}  /></span>
                                                    <span className="mc-like-count">{movie.topComment.likes}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    {/* --- End Top Comment Section --- */}

                                    {/* Bottom Section: Ratings */}
                                    <div className="mc-ratings-section">
                                        <h4 className="mc-ratings-heading">Ratings</h4>
                                        <div className="mc-ratings-grid">
                                            {/* IMDb */}
                                            <div className="mc-rating-item">
                                                <span className="mc-rating-source">IMDb</span>
                                                <span className="mc-rating-value">
                                                    {/* Use nullish coalescing for cleaner N/A */}
                                                    {movie.imdbRating?.toFixed(1) ?? <span className="mc-rating-na">N/A</span>}
                                                </span>
                                            </div>
                                            {/* MovieQ */}
                                            <div className="mc-rating-item">
                                                <span className="mc-rating-source">MovieQ</span>
                                                <span className="mc-rating-value">
                                                    {/* Use nullish coalescing for cleaner N/A */}
                                                    {movie.imdbRating?.toFixed(1) ?? <span className="mc-rating-na">N/A</span>}
                                                </span>
                                            </div>
                                            {/* KinoPoisk */}
                                            <div className="mc-rating-item">
                                                <span className="mc-rating-source">KinoPoisk</span>
                                                <span className="mc-rating-value">
                                                    {movie.kinopoiskRating?.toFixed(1) ?? <span className="mc-rating-na">N/A</span>}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div> {/* End mc-details-container */}
                            </div> {/* End mc-slide-content */}
                        </div> // End mc-slide
                    ))}
                </div> {/* End mc-carousel-inner */}

                {/* Navigation Controls (Show only if more than 1 slide) */}
                {totalMovies > 1 && (
                    <>
                        <button
                            className="mc-control mc-prev"
                            onClick={handlePrevClick}
                            disabled={isTransitioning} // Disable during transition
                            aria-label="Previous review slide"
                            aria-controls="mc-carousel-inner" // Link control to the container it controls
                        >
                            ‹
                        </button>
                        <button
                            className="mc-control mc-next"
                            onClick={handleNextClick}
                            disabled={isTransitioning} // Disable during transition
                            aria-label="Next review slide"
                            aria-controls="mc-carousel-inner" // Link control to the container it controls
                        >
                            ›
                        </button>
                    </>
                )}
            </div> {/* End mc-carousel */}

            {/* Navigation Indicators (Show only if more than 1 slide) */}
            {totalMovies > 1 && (
                <div className="mc-indicators" role="tablist" aria-label="Review slides">
                    {displayedMovies.map((_, index) => (
                        <button
                            key={index}
                            id={`mc-indicator-${index}`}
                            className={`mc-indicator ${index === currentIndex ? 'mc-active' : ''}`}
                            onClick={() => handleIndicatorClick(index)} // Use memoized handler
                            disabled={isTransitioning || index === currentIndex}
                            aria-label={`Go to review slide ${index + 1}`}
                            aria-controls="mc-carousel-inner" // Link indicator to the container it controls
                            aria-selected={index === currentIndex} // Use aria-selected for tablist role
                            role="tab"
                        />
                    ))}
                </div>
            )}
        </div> // End mc-container
    );
};

export default MovieCarousel;