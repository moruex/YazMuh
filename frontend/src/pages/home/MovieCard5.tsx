import React from "react";
import './MovieCard5.css';

export const MovieCard5: React.FC<{ movie: any; index: any, renderStars: any }> = ({ movie, index, renderStars }) => {
  return (
    <div
      key={`${movie.id || index}-${movie.position}`}
      className={`movie-card5 ${movie.position}`}
    >
      <div className="movie-poster">
        <img src={movie.imageUrl || "/api/placeholder/300/320"} alt={movie.title || "Movie"} />
        <div className="movie-overlay">
          <button className="view-review-btn">Read Review</button>
        </div>
      </div>
      <div className="movie-info">
        <h3>{movie.title || "Untitled"}</h3>
        <p className="movie-year-genre">{movie.year || "N/A"} • {movie.genre || "Unknown"}</p>
        {renderStars(movie.rating || 0)}
      </div>
    </div>
  );
};
