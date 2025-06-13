import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { mdService } from '@src/services/mdService';
import { useTranslation } from 'react-i18next';
import './MovieListsTab.css';

interface MovieCardProps {
  id: string;
  title: string;
  posterUrl: string;
  year: string;
  onRemove: (movieId: string) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({ id, title, posterUrl, year, onRemove }) => {
  const navigate = useNavigate();
  const [isRemoving, setIsRemoving] = useState(false);
  const { t } = useTranslation();
  
  const handleClick = () => {
    navigate(`/movies/${id}`);
  };
  
  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isRemoving) return; // Prevent multiple clicks
    
    try {
      setIsRemoving(true);
      await onRemove(id);
    } finally {
      setIsRemoving(false);
    }
  };
  
  return (
    <div className="movie-grid-item">
      <div className="movie-poster" onClick={handleClick}>
        <img 
          src={posterUrl} 
          alt={title} 
          onError={(e) => e.currentTarget.src = 'https://via.placeholder.com/300x450?text=No+Image'} 
        />
        <div className="movie-hover-info">
          <h3>{title}</h3>
          <p>{year}</p>
          <button 
            className={`remove-button ${isRemoving ? 'removing' : ''}`} 
            onClick={handleRemove}
            disabled={isRemoving}
          >
            {isRemoving ? (
              t('removing')
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                {t('remove')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const MovieListsTab: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [activeCollection, setActiveCollection] = useState<'favorites'  | 'watchlist' | 'watched'>('favorites');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [movies, setMovies] = useState<{
    favorites: any[],
    watched: any[],
    watchlist: any[]
  }>({
    favorites: [],
    watched: [],
    watchlist: []
  });
  const [removingMovie, setRemovingMovie] = useState<string>('');
  
  // Fetch user movie lists
  useEffect(() => {
    if (!user) return;
    
    const fetchUserLists = async () => {
      setIsLoading(true);
      try {
        console.log(`🔍 Fetching movie lists for user ${user.id} (${user.username})...`);
        
        const favorites = await fetchListMovies('FAVORITES');
        console.log(`✅ Fetched ${favorites.length} favorites`);
        
        const watchlist = await fetchListMovies('WATCHLIST');
        console.log(`✅ Fetched ${watchlist.length} watchlist movies`);

        const watched = await fetchListMovies('WATCHED');
        console.log(`✅ Fetched ${watched.length} watched movies`);
        
        setMovies({
          favorites,
          watched,
          watchlist
        });
        
        console.log('Movie lists state updated successfully');
      } catch (error) {
        console.error('Error fetching movie lists:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserLists();
  }, [user]);
  
  // Fetch movies from a specific list type
  const fetchListMovies = async (listType: string) => {
    if (!user) return [];
    
    try {
      // Convert to uppercase for GraphQL enum
      const upperCaseListType = listType.toUpperCase();
      console.log(`Fetching movies from ${listType} (${upperCaseListType}) list for user ${user.id}`);
      
      const moviesList = await mdService.getUserMovies(user.id, upperCaseListType);
      
      console.log(`Fetched ${moviesList.length} movies from ${listType} list:`, moviesList);
      return moviesList;
    } catch (error) {
      console.error(`Error fetching ${listType} list:`, error);
      return [];
    }
  };
  
  // Remove movie from user list
  const handleRemoveMovie = async (movieId: string) => {
    if (!user) return;
    
    try {
      setRemovingMovie(movieId);
      console.log("Removing movie with id: ", removingMovie)
      // Always use UPPERCASE for GraphQL enums
      const listType = activeCollection.toUpperCase(); // 'FAVORITES' | 'WATCHED' | 'WATCHLIST'
      
      console.log(`Removing movie ${movieId} from ${activeCollection} (${listType}) list`);
      
      const result = await mdService.toggleUserListMovie(movieId, listType, false, user.id);
      
      if (result) {
        // Update local state to remove the movie from the displayed list
        setMovies(prev => ({
          ...prev,
          [activeCollection]: prev[activeCollection].filter(movie => movie.id !== movieId)
        }));
        console.log(`Movie removed from ${activeCollection} list`);
      } else {
        console.error(`Could not remove movie from ${activeCollection} list`);
      }
    } catch (error) {
      console.error(`Error removing movie from ${activeCollection} list:`, error);
    } finally {
      setRemovingMovie('');
    }
  };

  return (
    <div className="movie-lists">
      <div className="collection-tabs">
        <button 
          className={activeCollection === 'favorites' ? 'active' : ''} 
          onClick={() => setActiveCollection('favorites')}
        >
          <span className="tab-icon">
            <svg viewBox="0 0 24 24" fill={activeCollection === 'favorites' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </span>
          <span>{t('favorites')}</span>
        </button>
        <button 
          className={activeCollection === 'watchlist' ? 'active' : ''} 
          onClick={() => setActiveCollection('watchlist')}
        >
          <span className="tab-icon">
            <svg viewBox="0 0 24 24" fill={activeCollection === 'watchlist' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
            </svg>
          </span>
          <span>{t('watchlist')}</span>
        </button>
        <button 
          className={activeCollection === 'watched' ? 'active' : ''} 
          onClick={() => setActiveCollection('watched')}
        >
          <span className="tab-icon">
            <svg viewBox="0 0 24 24" fill={activeCollection === 'watched' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </span>
          <span>{t('watched')}</span>
        </button>
      </div>

      {isLoading ? (
        <div className="loading-indicator">{t('loadingYourMovies')}</div>
      ) : (
        <div className="p-movie-grid">
          {activeCollection === 'favorites' && (
            <>
              {movies.favorites.length > 0 ? (
                movies.favorites.map(movie => (
                  <MovieCard 
                    key={movie.id}
                    id={movie.id}
                    title={movie.title || 'Untitled Movie'}
                    posterUrl={movie.posterUrl || movie.poster_url || 'https://via.placeholder.com/300x450?text=No+Image'}
                    year={movie.year || (movie.release_date ? new Date(movie.release_date).getFullYear().toString() : 'N/A')}
                    onRemove={handleRemoveMovie}
                  />
                ))
              ) : (
                <div className="empty-collection">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  <p>{t('noFavoriteMoviesYet')}</p>
                </div>
              )}
            </>
          )}

          {activeCollection === 'watched' && (
            <>
              {movies.watched.length > 0 ? (
                movies.watched.map(movie => (
                  <MovieCard 
                    key={movie.id}
                    id={movie.id}
                    title={movie.title || 'Untitled Movie'}
                    posterUrl={movie.posterUrl || movie.poster_url || 'https://via.placeholder.com/300x450?text=No+Image'}
                    year={movie.year || (movie.release_date ? new Date(movie.release_date).getFullYear().toString() : 'N/A')}
                    onRemove={handleRemoveMovie}
                  />
                ))
              ) : (
                <div className="empty-collection">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                  <p>{t('noWatchedMoviesYet')}</p>
                </div>
              )}
            </>
          )}

          {activeCollection === 'watchlist' && (
            <>
              {movies.watchlist.length > 0 ? (
                movies.watchlist.map(movie => (
                  <MovieCard 
                    key={movie.id}
                    id={movie.id}
                    title={movie.title || 'Untitled Movie'}
                    posterUrl={movie.posterUrl || movie.poster_url || 'https://via.placeholder.com/300x450?text=No+Image'}
                    year={movie.year || (movie.release_date ? new Date(movie.release_date).getFullYear().toString() : 'N/A')}
                    onRemove={handleRemoveMovie}
                  />
                ))
              ) : (
                <div className="empty-collection">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <p>{t('yourWatchlistIsEmpty')}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MovieListsTab; 