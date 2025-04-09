import React from "react";

interface MovieCard1Props {
  id: number;
  title: string;
  posterUrl: string;
  rating: number;
  year: number;
}

const MovieCard1: React.FC<MovieCard1Props> = ({
  id,
  title,
  posterUrl,
  rating,
  year,
}) => {
  return (
    <div className="hm-movie-card">
      <a href={`/movies/1`} className="hm-movie-card-link">
        <div className="hm-movie-poster">
          <img src={posterUrl} alt={`${title} poster`} />
          <div className="hm-rating-badge">{rating.toFixed(1)}</div>
        </div>
        <div className="hm-movie-info">
          <h3 className="hm-movie-title">{title}</h3>
          <div className="hm-movie-year">{year}</div>
        </div>
      </a>
    </div>
  );
};

export default MovieCard1;