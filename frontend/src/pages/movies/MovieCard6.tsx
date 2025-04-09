import './MovieCard6.css'

import React from 'react';

const MovieCard6: React.FC<{ movie: any; }> = ({ movie }) => {
    return (
        <div key={movie.id} className="md-similar-movie-card">
            <div className='md-similar-poster-container'>
                <img src={movie.posterUrl} alt={movie.title} />
                <div className="md-similar-rating-badge">
                    {movie.rating.toFixed(1)}
                </div>
            </div>
            <div className="md-similar-movie-info">
                <h3>{movie.title}</h3>
                <p>{movie.year}</p>
            </div>
        </div>
    );
};

export default MovieCard6;

