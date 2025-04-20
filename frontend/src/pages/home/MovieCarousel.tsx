import React, { useState, useEffect, useRef, useCallback } from "react";
import "./MovieCarousel.css";
import { Movie } from "@src/types/Movie";
import { FaHeart } from "react-icons/fa";

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
  topComment?: TopComment;
}

// --- Component Props ---
interface MovieCarouselProps {
  movies: CarouselMovie[];
  autoPlayInterval?: number;
  title?: string;
  maxSlides?: number;
}

const MAX_DEFAULT_SLIDES = 5;
const DEFAULT_AUTOPLAY_INTERVAL = 5000;

const MovieCarousel: React.FC<MovieCarouselProps> = ({
  movies,
  autoPlayInterval = DEFAULT_AUTOPLAY_INTERVAL,
  title,
  maxSlides = MAX_DEFAULT_SLIDES,
}) => {
  const validMovies = Array.isArray(movies) ? movies : [];

  const displayedMovies = validMovies.slice(0, Math.max(1, maxSlides));
  const totalMovies = displayedMovies.length;

  // --- State ---
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // --- Refs ---
  const carouselInnerRef = useRef<HTMLDivElement>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

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
  const goToSlide = useCallback(
    (index: number) => {
      if (
        index === currentIndex ||
        index < 0 ||
        index >= totalMovies ||
        isTransitioningRef.current
      ) {
        return;
      }
      if (isMountedRef.current) {
        setIsTransitioning(true);
        setCurrentIndex(index);
      }
    },
    [currentIndex, totalMovies]
  );
  const nextSlide = useCallback(() => {
    if (isTransitioningRef.current) return;
    if (isMountedRef.current) {
      setIsTransitioning(true);
      setCurrentIndex((prev) => (prev + 1) % totalMovies);
    }
  }, [totalMovies]);

  const prevSlide = useCallback(() => {
    if (isTransitioningRef.current) return;
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

  const handleIndicatorClick = useCallback(
    (index: number) => {
      if (index === currentIndex || isTransitioningRef.current) return;
      resetAutoPlayTimer();
      goToSlide(index);
    },
    [currentIndex, goToSlide, resetAutoPlayTimer]
  );
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
        } else {
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

      <div className="mc-carousel">
        <div
          className="mc-carousel-inner"
          ref={carouselInnerRef}
          style={{
            width: `${totalMovies * 100}%`,
            transform: `translateX(-${(100 / totalMovies) * currentIndex}%)`,

            transition: isTransitioning ? "transform 0.6s ease-in-out" : "none",
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {displayedMovies.map((movie, index) => (
            <div
              className="mc-slide"
              key={movie.id || index}
              style={{ width: `${100 / totalMovies}%` }}
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${totalMovies}`}
              aria-hidden={index !== currentIndex}
            >
              <div className="mc-slide-content">
                <div className="mc-poster-container">
                  <img
                    src={movie.posterUrl || "/placeholder-poster.jpg"}
                    alt={`Poster for ${movie.title}`}
                    className="mc-poster-img"
                    loading={
                      Math.abs(index - currentIndex) <= 1 ? "eager" : "lazy"
                    }
                    fetchPriority={index === currentIndex ? "high" : "auto"}
                  />
                </div>

                <div className="mc-details-container">
                  <div>
                    <h3 className="mc-movie-title">{movie.title}</h3>
                    <p className="mc-movie-year-genre">
                      {movie.year}
                      {movie.genres &&
                        movie.genres.length > 0 &&
                        ` | ${movie.genres.join(", ")}`}
                    </p>
                  </div>

                  {movie.topComment && (
                    <div className="mc-top-comment-section">
                      <h4 className="mc-comment-heading">Top Comment</h4>
                      <div className="mc-comment-card">
                        <div className="mc-comment-header">
                          <img
                            src={
                              movie.topComment.avatarUrl ||
                              "/placeholder-avatar.png"
                            }
                            alt={`${movie.topComment.username}'s avatar`}
                            className="mc-comment-avatar"
                            loading="lazy"
                            width="32"
                            height="32"
                          />
                          <span className="mc-comment-username">
                            {movie.topComment.username}
                          </span>
                        </div>
                        <p className="mc-comment-text">
                          {movie.topComment.text}
                        </p>
                        <div className="mc-comment-likes">
                          <span className="mc-like-icon" aria-hidden="true">
                            <FaHeart style={{ color: "#d32f2f" }} />
                          </span>
                          <span className="mc-like-count">
                            {movie.topComment.likes}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mc-ratings-section">
                    <h4 className="mc-ratings-heading">Ratings</h4>
                    <div className="mc-ratings-grid">
                      <div className="mc-rating-item">
                        <span className="mc-rating-source">IMDb</span>
                        <span className="mc-rating-value">
                          {movie.imdbRating?.toFixed(1) ?? (
                            <span className="mc-rating-na">N/A</span>
                          )}
                        </span>
                      </div>

                      <div className="mc-rating-item">
                        <span className="mc-rating-source">MovieQ</span>
                        <span className="mc-rating-value">
                          {movie.movieQRating?.toFixed(1) ?? (
                            <span className="mc-rating-na">N/A</span>
                          )}
                        </span>
                      </div>

                      <div className="mc-rating-item">
                        <span className="mc-rating-source">KinoPoisk</span>
                        <span className="mc-rating-value">
                          {movie.kinopoiskRating?.toFixed(1) ?? (
                            <span className="mc-rating-na">N/A</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalMovies > 1 && (
          <>
            <button
              className="mc-control mc-prev"
              onClick={handlePrevClick}
              disabled={isTransitioning}
              aria-label="Previous review slide"
              aria-controls="mc-carousel-inner"
            >
              ‹
            </button>
            <button
              className="mc-control mc-next"
              onClick={handleNextClick}
              disabled={isTransitioning}
              aria-label="Next review slide"
              aria-controls="mc-carousel-inner"
            >
              ›
            </button>
          </>
        )}
      </div>

      {totalMovies > 1 && (
        <div
          className="mc-indicators"
          role="tablist"
          aria-label="Review slides"
        >
          {displayedMovies.map((_, index) => (
            <button
              key={index}
              id={`mc-indicator-${index}`}
              className={`mc-indicator ${
                index === currentIndex ? "mc-active" : ""
              }`}
              onClick={() => handleIndicatorClick(index)}
              disabled={isTransitioning || index === currentIndex}
              aria-label={`Go to review slide ${index + 1}`}
              aria-controls="mc-carousel-inner"
              aria-selected={index === currentIndex}
              role="tab"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MovieCarousel;
