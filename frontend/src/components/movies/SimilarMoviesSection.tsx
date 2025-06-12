import React from 'react';
import { MovieTeaserData } from '@src/services/mdService';
import MovieCard6 from '@src/pages/movies/MovieCard6'; // Assuming this is the correct path
import { Movie } from '@src/types/Movie'; // For adapting MovieTeaserData
import './SimilarMoviesSection.css';

interface SimilarMoviesSectionProps {
  similarMovies: MovieTeaserData[] | null;
}

const SimilarMoviesSection: React.FC<SimilarMoviesSectionProps> = ({ similarMovies }) => {
  if (!similarMovies || similarMovies.length === 0) {
    return <p className="md-no-similar-movies">No similar movies found.</p>;
  }

  // Adapt MovieTeaserData to Movie type expected by MovieCard6
  const adaptedMovies: Movie[] = similarMovies.map(teaser => ({
    id: teaser.id,
    title: teaser.title,
    slug: teaser.slug,
    posterUrl: teaser.poster_url || undefined,
    rating: teaser.movieq_rating !== null ? teaser.movieq_rating : undefined,
    release_date: teaser.release_date || undefined,
    year: teaser.release_date ? new Date(teaser.release_date).getFullYear() : undefined,
    // genres: teaser.genres, // Include if fetched and MovieCard6 uses it
  }));

  return (
    <div className="md-similar-movies-container">
      {adaptedMovies.map(movie => (
        <MovieCard6 key={movie.id} movie={movie} />
      ))}
    </div>
  );
};

export default SimilarMoviesSection; 