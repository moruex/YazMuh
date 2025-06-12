import { Movie } from '@src/types/Movie';
import React from 'react';

const MovieCard3: React.FC<{ movie: Movie }> = ({ movie }) => {
  return (
    <div key={movie.id} className="pro-movie-card3">
      <div className="pro-movie-poster">
        <img src={movie.posterUrl!} alt={movie.title} />
        {movie.rating && (
          <div className="pro-movie-rating">
            <span>{movie.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      <div className="pro-movie-info">
        <h3>{movie.title}</h3>
        <p>{movie.year}</p>
        {movie.genres && (
          <div className="pro-movie-genres">
            {movie.genres.slice(0, 2).map(genre => (
              <span key={genre.id} className="pro-genre-tag">{genre.name}</span>
            ))}
          </div>
        )}
      </div>
      <div className="pro-movie-actions">
        <button className="pro-remove-button">
          × Remove
        </button>
      </div>
    </div>
  );
};

export default MovieCard3;