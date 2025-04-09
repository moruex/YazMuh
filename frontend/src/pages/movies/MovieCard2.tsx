import React from 'react';

const MovieCard2: React.FC<{ movie: any, index: any }> = ({ movie, index }) => {
    return (
        <div className="ms-movie-card">
            <a href={`/movies/${movie.id}`} className="ms-movie-card-link">
                <div className="ms-movie-poster">
                    <img src={movie.posterUrl} alt={`${movie.title} poster`} />
                    <div className="ms-rating-badge">{movie.rating.toFixed(1)}</div>
                </div>
                <div className="ms-movie-info">
                    <h3 className="ms-movie-title">{movie.title}</h3>
                    <div className="ms-movie-year">{movie.year}</div>
                    <div className="ms-movie-details">
                        {movie.runtime && <span>{movie.runtime} min</span>}
                        {movie.director && <span> • {movie.director}</span>}
                    </div>
                    <div className="ms-movie-genres">
                        {movie.genres.join(', ')}
                    </div>
                </div>
            </a>
        </div>
    );
};

export default MovieCard2;

