import React from "react";

export const MovieCard4: React.FC<{ movie: any; }> = ({ movie }) => {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
    console.error(`Failed to load image: ${movie.posterUrl}`);
  };

  return (
    <div className="rec-movie-card">
      <a href={`/movies/1`} className="rec-movie-card-link">
        <div className="rec-movie-poster-container">
          <img
            src={movie.posterUrl}
            alt={`${movie.title} poster`}
            className="rec-movie-poster"
            onError={handleImageError}
            loading="lazy" />
        </div>
        <div className="rec-movie-info">
          <h3 className="rec-movie-title" title={movie.title}>{movie.title}</h3>
          <p className="rec-movie-year">{movie.year}</p>
        </div>
      </a>
    </div>
  );
};
