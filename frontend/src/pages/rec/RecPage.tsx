import React, { useState } from "react";
import { movieService } from "./movieService";
import "./RecPage.css";
import Footer from "@components/app/Footer";
import { Movie } from "@src/types/Movie";
import { MovieCard4 } from "./MovieCard4";

const RecPage: React.FC = () => {
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);
  const [recommendationType, setRecommendationType] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchMovies = async (fetcher: (count: number) => any, type: string) => {
    setIsLoading(true);
    setRecommendationType(type);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      const movies = fetcher(18);
      setRecommendedMovies(movies);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRandomRecommendation = () => fetchMovies(movieService.getRandomMovies, "Random Gems");
  const handleNewRecommendation = () => fetchMovies(movieService.getNewMovies, "Latest Releases");
  const handlePopularRecommendation = () => fetchMovies(movieService.getPopularMovies, "Popular Picks");

  return (
    <>
      <div className="rec-page">
        <div className="rec-container">
          <h1 className="rec-heading">Discover Movies</h1>
          <p className="rec-subheading">
            Find your next favorite film with our curated recommendations.
          </p>

          <div className="rec-buttons">
            <button className="rec-button" onClick={handleRandomRecommendation}>
              Random
            </button>
            <button className="rec-button" onClick={handleNewRecommendation}>
              New Releases
            </button>
            <button className="rec-button" onClick={handlePopularRecommendation}>
              Popular
            </button>
          </div>

          {isLoading ? (
            <div className="rec-loading-indicator">
              <span className="rec-loader"></span>
              <p>Searching for movies...</p>
            </div>
          ) : recommendedMovies.length > 0 ? (
            <div className="rec-movie-grid-container">
              <h2 className="rec-movie-grid-title">{recommendationType}</h2>
              <div className="rec-movie-grid">
                {recommendedMovies.map((movie) => (
                  <MovieCard4 key={movie.id} movie={movie} />
                ))}
              </div>
            </div>
          ) : (
            <></>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default RecPage;