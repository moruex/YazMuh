import { Movie } from "@src/types/Movie";

export interface MovieCardProps {
  movie: Movie;
}

const MovieCard7: React.FC<MovieCardProps> = ({ movie }) => {
  return (
    <div className="mp-movie-card">
      <div className="mp-movie-card-poster-container">
        <img
          src={movie.posterUrl}
          alt={`${movie.title} Poster`}
          className="mp-movie-card-poster"
        />
      </div>
      <div className="mp-movie-card-info">
        <div className="mp-movie-card-header">
          <h3 className="mp-movie-card-title">{movie.title}</h3>
          <div className="mp-movie-card-ratings">
            {/* Use optional chaining or checks if these could be truly missing */}
            {movie.rating && (
              <span className="rating-item imdb-rating">
                IMDb: {movie.rating.toFixed(1)}
              </span>
            )}
            {movie.rating && (
              <span className="rating-item rt-rating">
                {/* Label was MiQ, assuming it should be RT */}
                RT: {movie.rating}%
              </span>
            )}
            {movie.rating && (
              <span className="rating-item mc-rating">
                {/* Label was KP, assuming it should be MC */}
                MC: {movie.rating}
              </span>
            )}
          </div>
        </div>
        <div className="mp-movie-card-meta">
          {movie.director && (
            <p>
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  fill="currentColor"
                  className="bi bi-person-video3"
                  viewBox="0 0 16 16"
                >
                  {/* SVG paths */}
                  <path d="M14 9.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm-6 5.7c-1.78.04-3.534-.67-4.94-1.97a8.01 8.01 0 0 1-2.06-3.01.188.188 0 0 1 .29-.207c1.486 1.03 3.545 1.68 5.71 1.68.91 0 1.8-.13 2.64-.395a.178.178 0 0 1 .23.14l.44 1.86a.178.178 0 0 1-.09.19c-1.19.7-2.51.98-3.94.98Zm-.02-4.91c-1.19-.24-2.33-.68-3.39-1.29a.178.178 0 0 1-.1-.29l1.03-1.42a.178.178 0 0 1 .26-.06c.97.66 2.07 1.14 3.2 1.39a.178.178 0 0 1 .19.19l-.02.84a.178.178 0 0 1-.18.17Z" />
                  <path d="M0 1a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V1Zm1.5 0a.5.5 0 0 0-.5.5v13a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-13a.5.5 0 0 0-.5-.5h-13Z" />
                </svg>{" "}
                Director:
              </span>{" "}
              {movie.director}
            </p>
          )}
          {movie.year && (
            <p>
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  {/* SVG paths */}
                  <path d="M4 .5a.5.5 0 0 0-1 0V1H2a2 2 0 0 0-2 2v1h16V3a2 2 0 0 0-2-2h-1V.5a.5.5 0 0 0-1 0V1H4V.5zM16 14V5H0v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2zM8.5 7.5h-1v1h1v-1zm3 0h-1v1h1v-1zm3 0h-1v1h1v-1zm-9 2.5h1v1h-1v-1zm3 0h1v1h-1v-1zm3 0h1v1h-1v-1zm3 0h1v1h-1v-1zm-9 2.5h1v1h-1v-1zm3 0h1v1h-1v-1zm3 0h1v1h-1v-1z" />
                </svg>{" "}
                Year:
              </span>{" "}
              {movie.year}
            </p>
          )}
          {movie.runtime && (
            <p>
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  fill="currentColor"
                  className="bi bi-clock"
                  viewBox="0 0 16 16"
                >
                  {/* SVG paths */}
                  <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z" />
                  <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z" />
                </svg>{" "}
                Runtime:
              </span>{" "}
              {movie.runtime} min
            </p>
          )}
          {movie.language && (
            <p>
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  fill="currentColor"
                  className="bi bi-translate"
                  viewBox="0 0 16 16"
                >
                  {/* SVG paths */}
                  <path d="M4.545 6.714 4.11 8H3l1.862-5h1.284L8 8H6.833l-.435-1.286H4.545zm1.634-.736L5.5 3.956h-.049l-.679 2.022H6.18z" />
                  <path d="M0 2a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v3h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3H2a2 2 0 0 1-2-2V2zm2-1a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H2zm7.138 9.995c.193.166.454.295.71.402 1.024.36 1.831-.217 1.831-1.343 0-.762-.373-1.356-.91-1.756-.424-.315-.846-.547-1.278-.71A6.516 6.516 0 0 0 9 8V7h1.047l.596-.596L8.88 3.707 8 4.414V7H5c-.552 0-.998.445-1 .998V12c0 .55.445.995.99.995H7v.347c0 .276.11.535.3.734l.547.546L9.44 14l.395-.395-.55-.55zm-3.63-1.418L7.07 10H5V8h1.697l.468-.468.604.603-.635.635-.868.867L5.5 11zm1.734 2.476-.672-.671L6.5 11.5l.671.672-.67.67z" />
                </svg>{" "}
                Language:
              </span>{" "}
              {movie.language}
            </p>
          )}
          {movie.genres && movie.genres.length > 0 && (
            <p>
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  {/* SVG paths */}
                  <path d="M6 1v3H1V1h5zM1 0a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1H1zm14 12v3h-5v-3h5zm-5-1a1 1 0 0 0-1 1v3a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-5zM6 8v7H1V8h5zM1 7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H1zm14-6v7h-5V1h5zm-5-1a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1h-5z" />
                </svg>{" "}
                Genres:
              </span>{" "}
              {movie.genres.join(", ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieCard7;
