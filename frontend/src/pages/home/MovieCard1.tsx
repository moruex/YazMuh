import './MovieCard1.css';

interface MovieCard1Props {
  id: string; // Assuming ID is a string from the service
  title: string;
  posterUrl: string;
  rating: number;
  year: number;
  genres: { id: string; name: string }[] | null; // Expect array of genre objects or null
}

const MovieCard1 = ({ id, title, year, posterUrl, rating, genres }: MovieCard1Props) => {
  return (
    <div className="hm-movie-card">
      <a href={`/movies/${id}`} className="hm-movie-card-link">
        <div className="hm-movie-poster">
          <img src={posterUrl} alt={`${title} poster`} />
          <div className="hm-rating-badge">{rating.toFixed(1)}</div>
        </div>
        <div className="hm-movie-info">
          <h3 className="hm-movie-title">{title}</h3>
          <div className="hm-movie-year">{year}</div>
          {/* Display genres if available by mapping names */}
          {genres && genres.length > 0 && (
            <div className="hm-movie-genres">{genres.map(g => g.name).join(', ')}</div>
          )}
        </div>
      </a>
    </div>
  );
};

export default MovieCard1;