import React from "react";
import { Movie } from "@src/services/movieNewsService";

export const MovieCard4: React.FC<{ movie: Movie; }> = ({ movie }) => {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
    console.error(`Failed to load image: ${movie.poster_url}`);
  };

  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';

  return (
    <div className="rec-movie-card">
      <a href={`/movies/${movie.id}`} className="rec-movie-card-link">
        <div className="rec-movie-poster-container">
          <img
            src={movie.poster_url || ""}
            alt={`${movie.title} poster`}
            className="rec-movie-poster"
            onError={handleImageError}
            loading="lazy" />
        </div>
        <div className="rec-movie-info">
          <h3 className="rec-movie-title" title={movie.title}>{movie.title}</h3>
          <p className="rec-movie-year">{year}</p>
        </div>
      </a>
    </div>
  );
};
