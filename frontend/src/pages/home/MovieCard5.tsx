import React from "react";

export const MovieCard5: React.FC<{ movie: any; index: any, renderStars: any }> = ({ movie, index, renderStars }) => {
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
    console.error(`Failed to load image: ${movie.posterUrl}`);
  };

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
