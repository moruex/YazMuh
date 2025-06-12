import { useState, useEffect } from "react";
import Footer from "@components/app/Footer";
import './HomePage.css'
import MovieCard1 from "./MovieCard1";
import MovieCardPlaceholder from "./MovieCardPlaceholder";
import MovieCarousel from "./MovieCarousel";
import { getNews, Movie, NewsItem, getRecommendationSections, PublicRecommendationSection } from "@src/services/movieNewsService";
import { useTranslation } from 'react-i18next';
// import CircularLoader from '@components/app/CircularLoader';

interface NewsCardProps {
  title: string;
  posterUrl: string;
  description: string;
  date: string;
}

const NewsCard = ({ title, posterUrl, description, date }: NewsCardProps) => (
  <div className="movie-news-card">
    <div className="movie-news-image">
      <img src={posterUrl} alt={title} />
    </div>
    <div className="movie-news-content">
      <h3>{title}</h3>
      <p>{description}</p>
      <span className="movie-news-date">{date}</span>
    </div>
  </div>
);

interface HomePageSection extends PublicRecommendationSection {
  movies: Movie[];
}

// Helper function to get number of cards per row based on screen width
const getCardsPerRow = () => {
  if (typeof window === 'undefined') return 5; // Default for SSR
  
  const width = window.innerWidth;
  if (width >= 1024) return 5; // Desktop
  if (width >= 768) return 4;  // Tablet
  if (width >= 640) return 3;  // Mobile Large
  if (width >= 480) return 2;  // Mobile
  return 1; // Mobile Small
};

// Helper function to fill row with placeholders
const fillRowWithPlaceholders = (movies: Movie[], cardsPerRow: number) => {
  const totalCards = movies.length;
  const remainder = totalCards % cardsPerRow;
  
  if (remainder === 0) return movies;
  
  const placeholdersNeeded = cardsPerRow - remainder;
  const placeholders = Array(placeholdersNeeded).fill(null);
  
  return [...movies, ...placeholders];
};

const HomePage = () => {
  const [carouselMovies, setCarouselMovies] = useState<Movie[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [sections, setSections] = useState<Record<string, HomePageSection>>({});
  const [loadingSections, setLoadingSections] = useState<Record<string, boolean>>({});
  const [errorSections, setErrorSections] = useState<Record<string, string | null>>({});
  const [loadingNews, setLoadingNews] = useState(true);
  const [errorNews, setErrorNews] = useState<string | null>(null);
  const [cardsPerRow, setCardsPerRow] = useState(5);

  // New state for all fetched recommendation sections
  const [allRecommendationSections, setAllRecommendationSections] = useState<PublicRecommendationSection[]>([]);
  const [loadingAllRecSections, setLoadingAllRecSections] = useState(true);
  const [errorAllRecSections, setErrorAllRecSections] = useState<string | null>(null);

  const { t } = useTranslation();

  const SECTION_CONFIGS = [
    { key: 'LATEST', title: t('latestMovies'), sectionType: 'LATEST' },
    { key: 'POPULAR', title: t('popularMovies'), sectionType: 'POPULAR' },
    { key: 'MOST_RATED', title: t('mostRated'), sectionType: 'MOST_RATED' },
  ];
  

  // Handle window resize for responsive grid
  useEffect(() => {
    const handleResize = () => {
      setCardsPerRow(getCardsPerRow());
    };

    // Set initial value
    setCardsPerRow(getCardsPerRow());

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Effect to fetch all recommendation sections once
  useEffect(() => {
    setLoadingAllRecSections(true);
    // Fetch up to 10 sections, each with up to 8 movies. Adjust as needed.
    getRecommendationSections(true, 10, 0, 8)
      .then(fetchedSections => {
        setAllRecommendationSections(fetchedSections || []);
        setLoadingAllRecSections(false);
      })
      .catch(err => {
        setErrorAllRecSections(err.message || 'Failed to fetch recommendation sections');
        setAllRecommendationSections([]);
        setLoadingAllRecSections(false);
      });
  }, []);

  // Effect to set carousel movies from allRecommendationSections
  useEffect(() => {
    if (!loadingAllRecSections && allRecommendationSections.length > 0) {
      const latestSection = allRecommendationSections.find(s => s.section_type === 'LATEST');
      if (latestSection && latestSection.movies) {
        setCarouselMovies(latestSection.movies.slice(0, 5));
      } else {
        setCarouselMovies([]);
        console.warn("Carousel: 'LATEST' section not found or has no movies.");
      }
    }
  }, [allRecommendationSections, loadingAllRecSections]);

  // Effect to populate individual page sections from allRecommendationSections
  useEffect(() => {
    if (loadingAllRecSections) {
      // Initialize loading state for all sections configured
      const initialLoading: Record<string, boolean> = {};
      SECTION_CONFIGS.forEach(config => {
        initialLoading[config.key] = true;
      });
      setLoadingSections(initialLoading);
      return;
    }

    if (errorAllRecSections) {
      const newErrorState: Record<string, string | null> = {};
       SECTION_CONFIGS.forEach(config => {
        newErrorState[config.key] = errorAllRecSections;
      });
      setErrorSections(newErrorState);
      setLoadingSections({}); // No longer loading if master fetch failed
      return;
    }
    
    const newSectionsState: Record<string, HomePageSection> = {};
    const newLoadingState: Record<string, boolean> = {};
    const newErrorState: Record<string, string | null> = {};

    SECTION_CONFIGS.forEach(config => {
      const foundSection = allRecommendationSections.find(s => s.section_type === config.sectionType);
      if (foundSection) {
        newSectionsState[config.key] = {
          ...foundSection,
          movies: foundSection.movies || [],
        };
        newErrorState[config.key] = null;
      } else {
        newSectionsState[config.key] = {
          id: config.key, title: config.title, section_type: config.sectionType, movies: [],
          description: null, display_order: 0, is_public: true, created_at: '', updated_at: ''
        };
        newErrorState[config.key] = `Section type "${config.sectionType}" not found.`;
      }
      newLoadingState[config.key] = false;
    });

    setSections(newSectionsState);
    setLoadingSections(newLoadingState);
    setErrorSections(newErrorState);

  }, [allRecommendationSections, loadingAllRecSections, errorAllRecSections]);

  // Effect for fetching news (remains unchanged)
  useEffect(() => {
    setLoadingNews(true);
    getNews(4)
      .then(newsData => {
        setNews(newsData || []);
        setLoadingNews(false);
      })
      .catch(err => {
        setErrorNews(err.message || 'Failed to fetch news');
        setLoadingNews(false);
      });
  }, []);

  const newsItemsForDisplay = news.map((item) => ({
    title: item.title,
    posterUrl: item.image_url || '',
    description: item.short_content || '',
    date: item.published_at ? new Date(item.published_at).toLocaleDateString() : '',
  }));

  return (
    <div className="movie-page">
      <div className="movie-container">
        {/* Carousel Loading/Error/Display Logic */} 
        {loadingAllRecSections && carouselMovies.length === 0 && <div className="loading-message">{t('loadingCarousel')}</div>}
        {!loadingAllRecSections && errorAllRecSections && carouselMovies.length === 0 && <div className="error-message">{t('errorLoadingCarousel')}: {errorAllRecSections}</div>}
        {carouselMovies.length > 0 && (
          <MovieCarousel 
            movies={carouselMovies.map(movie => ({
              ...movie,
              id: String(movie.id),
              posterUrl: movie.poster_url || '',
              rating: movie.movieq_rating ?? movie.imdb_rating ?? 0,
              year: movie.release_date ? new Date(movie.release_date).getFullYear() : 0,
              genres: movie.genres ? movie.genres.map(g => ({ id: String(g.id), name: g.name })) : [],
              reviewQuote: movie.plot_summary || '',
              imdbRating: typeof movie.imdb_rating === 'number' ? movie.imdb_rating : undefined,
              movieQRating: typeof movie.movieq_rating === 'number' ? movie.movieq_rating : undefined,
            }))} 
            autoPlayInterval={8000} 
          />
        )}

        <section className="movie-news-section">
          <h2>{t('latestNews')}</h2>
          {loadingNews && <div className="loading-message">{t('loadingNews')}</div>}
          {errorNews && <div className="error-message">{t('errorFetchingNews')}: {errorNews}</div>}
          {!loadingNews && !errorNews && news.length > 0 && (
            <div className="movie-news-grid">
              {newsItemsForDisplay.map((newsItem, index) => (
                <NewsCard key={index} {...newsItem} />
              ))}
            </div>
          )}
          {!loadingNews && !errorNews && news.length === 0 && <p className="empty-message">{t('noNewsToDisplay')}</p>}
        </section>

        {SECTION_CONFIGS.map(config => {
          const sectionMovies = sections[config.key]?.movies || [];
          const moviesWithPlaceholders = fillRowWithPlaceholders(sectionMovies, cardsPerRow);
          
          return (
            <section key={config.key} className="movie-section">
              <h2 className="movie-section-title">{config.title}</h2>
              {loadingAllRecSections && loadingSections[config.key] && <div className="loading-message">{t('loadingMovies')}</div>}
              {errorSections[config.key] && <div className="error-message">{t('error')}: {errorSections[config.key]}</div>}
              {/* Render movies with placeholders */}
              {!loadingSections[config.key] && !errorSections[config.key] && sectionMovies.length > 0 && (
                <div className="movie-grid">
                  {moviesWithPlaceholders.map((movie, index) => {
                    if (movie === null) {
                      return <MovieCardPlaceholder key={`placeholder-${config.key}-${index}`} />;
                    }
                    
                    const mappedMovie = {
                      id: String(movie.id),
                      title: movie.title,
                      posterUrl: movie.poster_url || '',
                      rating: movie.movieq_rating ?? movie.imdb_rating ?? 0,
                      year: movie.release_date ? new Date(movie.release_date).getFullYear() : 0,
                      genres: movie.genres ? movie.genres.map((g: { id: any; name: any; }) => ({ id: String(g.id), name: g.name })) : [],
                    };
                    return <MovieCard1 key={`${movie.id}-${config.key}`} {...mappedMovie} />;
                  })}
                </div>
              )}
              {/* Display message if no movies for the section */}
              {!loadingSections[config.key] && !errorSections[config.key] && sectionMovies.length === 0 && (
                <p className="empty-message">{t('noMoviesToDisplayInThisSection')}</p>
              )}
            </section>
          );
        })}
      </div>
      <Footer />
    </div>
  );
};

export default HomePage;