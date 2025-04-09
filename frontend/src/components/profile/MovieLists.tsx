import React, { useState } from 'react';
import MovieCard3 from './MovieCard3';
import { Movie } from '@src/types/Movie';

interface MovieListsProps {
  movies: Movie[],
}

const MovieLists: React.FC<MovieListsProps> = ({ movies }) => {
  const [activeList, setActiveList] = useState<'watched' | 'favorites' | 'watchlist'>('watched');

  return (
    <div className="movie-lists">
      <h2>My Movie Lists</h2>
      
      <div className="lists-tabs">
        <button 
          className={activeList === 'watched' ? 'active' : ''}
          onClick={() => setActiveList('watched')}
        >
          Watched ({movies.length})
        </button>
        <button 
          className={activeList === 'favorites' ? 'active' : ''}
          onClick={() => setActiveList('favorites')}
        >
          Favorites (0)
        </button>
        <button 
          className={activeList === 'watchlist' ? 'active' : ''}
          onClick={() => setActiveList('watchlist')}
        >
          Watchlist (0)
        </button>
      </div>
      
      {movies.length > 0 ? (
        <div className="movies-grid">
          {movies.map(movie => (
            <MovieCard3 key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <svg viewBox="0 0 24 24">
            <path d="M18 4V2H4v6h14V6h1v4H9.18l2.6-2.6-1.42-1.4-5 5 5 5 1.42-1.4-2.6-2.6H20v-6z" />
          </svg>
          <h3>No movies yet</h3>
          <p>Movies you watch will appear here</p>
        </div>
      )}
    </div>
  );
};

export default MovieLists;