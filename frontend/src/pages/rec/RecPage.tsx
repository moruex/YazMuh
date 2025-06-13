import React, { useState, useEffect, useCallback } from "react";
import { 
  getRandomMoviesForRecPage,
  getRecommendationSections,
  Movie, 
  PublicRecommendationSection 
} from "@src/services/movieNewsService"; 
import "./RecPage.css";
import Footer from "@components/app/Footer";
import { MovieCard4 } from "./MovieCard4";
// import CircularLoader from '@components/app/CircularLoader';
import { useTranslation } from 'react-i18next';

const RecPage: React.FC = () => {
  const [recommendationSections, setRecommendationSections] = useState<PublicRecommendationSection[]>([]);
  const [displayedMovies, setDisplayedMovies] = useState<Movie[]>([]);
  const [displayedTitle, setDisplayedTitle] = useState<string>("");
  
  const [isLoadingRandom, setIsLoadingRandom] = useState<boolean>(false);
  const [isLoadingSections, setIsLoadingSections] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { t } = useTranslation();

  const fetchFreshRandomMovies = useCallback(async (setActive: boolean = true) => {
    setIsLoadingRandom(true);
    if(setActive) setError(null);
    try {
      const movies = await getRandomMoviesForRecPage(12);
      if (setActive) {
        setDisplayedMovies(movies);
        setDisplayedTitle("Random Gems");
      }
    } catch (err) {
      console.error("Failed to fetch random movies:", err);
      if (setActive) setError(err instanceof Error ? err.message : "Failed to load random movies.");
    } finally {
      setIsLoadingRandom(false);
    }
  }, []);

  const fetchDbSections = useCallback(async () => {
    setIsLoadingSections(true);
    try {
      const sections = await getRecommendationSections(true, 10, 0, 18);
      setRecommendationSections(sections);
    } catch (err) {
      console.error("Failed to fetch DB recommendation sections:", err);
      setError(err instanceof Error ? err.message : "Failed to load sections.");
      setRecommendationSections([]);
    } finally {
      setIsLoadingSections(false);
    }
  }, []);

  useEffect(() => {
    fetchFreshRandomMovies(true);
    fetchDbSections();
  }, [fetchFreshRandomMovies, fetchDbSections]);

  const handleRandomGemsClick = () => {
    fetchFreshRandomMovies(true);
  };

  const handleDbSectionButtonClick = (section: PublicRecommendationSection) => {
    setError(null); 
    if (section.movies && section.movies.length > 0) {
      setDisplayedMovies(section.movies);
      setDisplayedTitle(section.title);
    } else {
      setDisplayedMovies([]);
      setDisplayedTitle(`${section.title} (No movies available)`);
    }
  };
  
  const isLoadingGridContent = isLoadingRandom && displayedTitle === "Random Gems";

  return (
    <>
      <div className="rec-page">
        <div className="rec-container">
          <h1 className="rec-heading">{t('discoverMovies')}</h1>
          <p className="rec-subheading">{t('findNextFavorite')}</p>

          <div className="rec-buttons">
            <button
              className={`rec-button ${displayedTitle === "Random Gems" ? 'active' : ''}`}
              onClick={handleRandomGemsClick}
              disabled={isLoadingRandom}
            >
              {t('randomGems')}
            </button>

            {isLoadingSections && recommendationSections.length === 0 && <p>{t('loadingOtherSections')}</p>}
            {recommendationSections.map((section) => (
              <button
                key={section.id}
                className={`rec-button ${displayedTitle === section.title ? 'active' : ''}`}
                onClick={() => handleDbSectionButtonClick(section)}
                disabled={isLoadingRandom && displayedTitle === "Random Gems"}
              >
                {section.title}
              </button>
            ))}
          </div>
          
          {error && <div className="rec-error-message">{t('error')}: {error}</div>}

          {isLoadingGridContent ? (
            <div className="rec-loading-indicator">
              <span className="rec-loader"></span>
              <p>{t('loadingMovies')}</p>
            </div>
          ) : displayedMovies.length > 0 ? (
            <div className="rec-movie-grid-container">
              <h2 className="rec-movie-grid-title">{displayedTitle}</h2>
              <div className="rec-movie-grid">
                {displayedMovies.map((movie) => (
                  <MovieCard4 key={movie.id} movie={movie} />
                ))}
              </div>
            </div>
          ) : !error ? (
            <div className="rec-no-movies">
                <p>{t('noMoviesToDisplayFor')} {displayedTitle}</p>
            </div>
          ) : null}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default RecPage;