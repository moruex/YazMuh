import React from 'react';
import { Movie } from './MovieSearchPage';

export const MovieCard2: React.FC<{ movie: Movie; }> = ({ movie }) => {
    return (
        <div className="ms-movie-card">
            <a href={`/movies/${movie.id}`} className="ms-movie-card-link">
                <div className="ms-movie-poster">
                    <img src={movie.posterUrl || undefined} alt={`${movie.title} poster`} />
                    {movie.rating && <div className="ms-rating-badge">{movie.rating.toFixed(1)}</div>}
                </div>
                <div className="ms-movie-info">
                    <h3 className="ms-movie-title">{movie.title}</h3>
                    {movie.year && <div className="ms-movie-year">{movie.year}</div>}
                    <div className="ms-movie-details">
                        {movie.runtime && <span>{movie.runtime} min</span>}
                        {/* movie.director is not reliably fetched for list view, consider removing or making it more robust if data is available */}
                        {/* movie.director && <span> • {movie.director}</span> */}
                    </div>
                    {movie.genres && movie.genres.length > 0 && (
                        <div className="ms-movie-genres">
                            {movie.genres.map(genre => genre.name).join(', ')}
                        </div>
                    )}
                </div>
            </a>
        </div>
    );
};

