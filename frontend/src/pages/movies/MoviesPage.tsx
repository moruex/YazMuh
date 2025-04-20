import React, { useState, useEffect } from "react"; // Import React explicitly
import "./MoviesPage.css"; // Using existing CSS file
import MovieCard7 from "./MovieCard7";
import Footer from "@src/components/app/Footer"; // Assuming path is correct

// --- Define Interfaces (can be moved to a types file) ---
export interface Movie {
  id: number;
  title: string;
  year: number;
  posterUrl: string;
  rating: number; // Overall rating used initially for sorting default
  imdbRating?: number;
  rtRating?: number;
  mcRating?: number;
  genres: string[];
  director?: string;
  runtime?: number;
  language?: string;
}

// Define the possible sort keys explicitly for type safety
export type SortByType = "rating" | "title" | "year";

export interface FiltersState {
  sortBy: SortByType;
  year: string; // Keep as string from input, parse when filtering
  minRating: string; // Keep as string from input, parse when filtering
  category: string;
}

export interface FilterControlsProps {
  filters: FiltersState;
  onFilterChange: (name: keyof FiltersState, value: string) => void;
  onApplyFilters: () => void;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (pageNumber: number) => void;
}

export interface MovieCardProps {
  movie: Movie;
}
// --- Mock Data (Typed) ---
// Explicitly type mockMovies array
const mockMovies: Movie[] = [
  {
    id: 1,
    title: "The Shawshank Redemption",
    year: 1994,
    posterUrl:
      "https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzMtY2YzZC00NmNlLWJiNDMtZDViZWM2MzIxZDYwXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_FMjpg_UX1000_.jpg",
    rating: 9.3, // Assuming this is the primary rating for sorting/filtering initially
    imdbRating: 9.3,
    rtRating: 91,
    mcRating: 80,
    genres: ["Drama"],
    director: "Frank Darabont",
    runtime: 142,
    language: "English",
  },
  {
    id: 2,
    title: "The Godfather",
    year: 1972,
    posterUrl:
      "https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg",
    rating: 9.2,
    imdbRating: 9.2,
    rtRating: 97,
    mcRating: 100,
    genres: ["Crime", "Drama"],
    director: "Francis Ford Coppola",
    runtime: 175,
    language: "English",
  },
  {
    id: 3,
    title: "Pulp Fiction",
    year: 1994,
    posterUrl:
      "https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItYzViMjE3YzI5MjljXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg",
    rating: 8.9,
    imdbRating: 8.9,
    rtRating: 92,
    mcRating: 94,
    genres: ["Crime", "Drama"],
    director: "Quentin Tarantino",
    runtime: 154,
    language: "English",
  },
  {
    id: 6,
    title: "Inception",
    year: 2010,
    posterUrl:
      "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_FMjpg_UX1000_.jpg",
    rating: 8.8,
    imdbRating: 8.8,
    rtRating: 87,
    mcRating: 74,
    genres: ["Action", "Adventure", "Sci-Fi"],
    director: "Christopher Nolan",
    runtime: 148,
    language: "English",
  },
  {
    id: 7,
    title: "Interstellar",
    year: 2014,
    posterUrl:
      "https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_FMjpg_UX1000_.jpg",
    rating: 8.6,
    imdbRating: 8.6,
    rtRating: 73,
    mcRating: 74,
    genres: ["Adventure", "Drama", "Sci-Fi"],
    director: "Christopher Nolan",
    runtime: 169,
    language: "English",
  },
  {
    id: 9,
    title: "The Dark Knight",
    year: 2008,
    posterUrl:
      "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_FMjpg_UX1000_.jpg",
    rating: 9.0,
    imdbRating: 9.0,
    rtRating: 94,
    mcRating: 84,
    genres: ["Action", "Crime", "Drama"],
    director: "Christopher Nolan",
    runtime: 152,
    language: "English",
  },
  {
    id: 10,
    title: "Fight Club",
    year: 1999,
    posterUrl:
      "https://m.media-amazon.com/images/M/MV5BMmEzNTkxYjQtZTc0MC00YTVjLTg5ZTEtZWMwOWVlYzY0NWIwXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_FMjpg_UX1000_.jpg",
    rating: 8.8,
    imdbRating: 8.8,
    rtRating: 79,
    mcRating: 66,
    genres: ["Drama"],
    director: "David Fincher",
    runtime: 139,
    language: "English",
  },
  {
    id: 11,
    title: "Naruto: The Last",
    year: 2014,
    posterUrl:
      "https://static.hdrezka.ac/i/2022/9/28/d3abc7fdf9382ef67g21p.jpg",
    rating: 8.2,
    imdbRating: 8.2,
    rtRating: 80,
    mcRating: 62,
    genres: ["Animation", "Action", "Adventure"],
    director: "Tsuneo Kobayashi",
    runtime: 112,
    language: "Japanese",
  },
  {
    id: 17,
    title: "Spirited Away",
    year: 2001,
    posterUrl:
      "https://m.media-amazon.com/images/M/MV5BMjlmZmI5MDctNDE2YS00YWE0LWE5ZWItZDBhYWQ0NTcxNWRhXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_FMjpg_UX1000_.jpg",
    rating: 8.6,
    imdbRating: 8.6,
    rtRating: 97,
    mcRating: 96,
    genres: ["Animation", "Adventure", "Family"],
    director: "Hayao Miyazaki",
    runtime: 125,
    language: "Japanese",
  },
  {
    id: 15,
    title: "Parasite",
    year: 2019,
    posterUrl:
      "https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_FMjpg_UX1000_.jpg",
    rating: 8.6,
    imdbRating: 8.6,
    rtRating: 99,
    mcRating: 96,
    genres: ["Comedy", "Drama", "Thriller"],
    director: "Bong Joon-ho",
    runtime: 132,
    language: "Korean",
  },
  // ... rest of mock movies
];

// --- FilterControls Component (Typed) ---
const FilterControls: React.FC<FilterControlsProps> = ({
  filters,
  onFilterChange,
  onApplyFilters,
}) => {
  const genres = [
    "Action",
    "Adventure",
    "Animation",
    "Comedy",
    "Crime",
    "Drama",
    "Family",
    "Fantasy",
    "Horror",
    "Mystery",
    "Romance",
    "Sci-Fi",
    "Thriller",
    "Documentary",
  ];

  // Type the sort options array
  const sortOptions: { value: SortByType; label: string }[] = [
    { value: "rating", label: "By IMDb Rating" },
    { value: "title", label: "By Title" },
    { value: "year", label: "By Year" },
  ];

  // Type the event parameter
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    // Assert the name is a key of FiltersState for type safety with onFilterChange
    const name = e.target.name as keyof FiltersState;
    const value = e.target.value;
    onFilterChange(name, value);
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleChange(e);
    // onApplyFilters(); // Optional: Trigger apply on select change
  };

  return (
    <div className="filter-controls">
      <div className="filter-group">
        <label htmlFor="sortBy">Sort by:</label>
        <select
          name="sortBy"
          id="sortBy"
          value={filters.sortBy}
          onChange={handleSelectChange}
          className="filter-select"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        {/* Year Input - Input type is number but value is managed as string in state */}
        <input
          type="number"
          name="year"
          id="year"
          value={filters.year}
          onChange={handleChange}
          placeholder="Year"
          className="filter-input year"
          min="1900"
          max={new Date().getFullYear()}
        />
      </div>

      <div className="filter-group">
        {/* Min Rating Input */}
        <input
          type="number"
          step="0.1"
          min="1"
          max="10"
          name="minRating"
          id="minRating"
          value={filters.minRating}
          onChange={handleChange}
          placeholder="Min IMDb Rating"
          className="filter-input rating"
        />
      </div>

      <div className="filter-group">
        <select
          name="category"
          id="category"
          value={filters.category}
          onChange={handleSelectChange} // Use specific handler or combine if desired
          className="filter-select category"
        >
          <option value="">Select Category</option>
          {genres.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        onClick={onApplyFilters}
        className="filter-apply-button"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 16 16"
          className="filter-icon"
        >
          {/* SVG Path */}
          <path d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z" />
        </svg>
        Apply Filters
      </button>
    </div>
  );
};

// --- Pagination Component (Typed) ---
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) {
    return null;
  }

  const getPageNumbers = (): (number | string)[] => {
    // Return type includes string for "..."
    const delta = 1;
    const pages: (number | string)[] = []; // Allow numbers or "..." string

    pages.push(1);

    if (currentPage > delta + 2) {
      pages.push("...");
    }

    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);
    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    if (currentPage < totalPages - delta - 1) {
      if (end < totalPages - 1) {
        pages.push("...");
      }
    }

    if (totalPages > 1 && !pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="ms-pagination-container">
      <button
        className="ms-pagination-button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Go to previous page"
      >
        Previous
      </button>

      {pageNumbers.map((page, index) =>
        typeof page === "string" ? (
          <span key={`ellipsis-${index}`} className="ms-pagination-ellipsis">
            {page}
          </span>
        ) : (
          <button
            key={page}
            className={`ms-pagination-button ${
              currentPage === page ? "ms-pagination-active" : ""
            }`}
            // Type assertion needed here if TS can't infer page is number
            onClick={() => onPageChange(page as number)}
            aria-label={`Go to page ${page}`}
            aria-current={currentPage === page ? "page" : undefined}
          >
            {page}
          </button>
        )
      )}

      <button
        className="ms-pagination-button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Go to next page"
      >
        Next
      </button>
    </div>
  );
};

// --- MoviesPage Component (Typed) ---
const MoviesPage: React.FC = () => {
  // Use React.FC for functional components
  // Type the state for filters
  const [filters, setFilters] = useState<FiltersState>({
    sortBy: "rating", // Default sort matches SortByType
    year: "",
    minRating: "",
    category: "",
  });

  // Explicitly type the state for filteredMovies
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;

  const applyFiltersAndSort = () => {
    let results = [...mockMovies];

    results = results.filter((movie) => {
      const filterYear = parseInt(filters.year, 10);
      if (!isNaN(filterYear) && movie.year !== filterYear) {
        return false;
      }

      const minRatingValue = parseFloat(filters.minRating);
      if (!isNaN(minRatingValue) && (movie.imdbRating === undefined || movie.imdbRating < minRatingValue)) {
        return false;
      }

      if (filters.category && !movie.genres.includes(filters.category)) {
        return false;
      }
      return true;
    });

    // --- Sorting (Type Safe - Revised) ---
    results.sort((a, b) => {
      // Access properties directly based on the specific sort key
      if (filters.sortBy === 'title') {
        // Here, we know we are dealing with strings
        return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
      } else if (filters.sortBy === 'rating') {
        // Here, we know we are dealing with numbers (or undefined)
        const ratingA = a.imdbRating ?? a.rating ?? 0; // Prefer imdbRating, fallback to rating
        const ratingB = b.imdbRating ?? b.rating ?? 0;
        return ratingB - ratingA; // Descending order for rating
      } else if (filters.sortBy === 'year') {
        // Here, we know we are dealing with numbers
        // Assuming 'year' is always present based on Movie interface, but nullish coalescing is safe
        return (a.year ?? 0) - (b.year ?? 0); // Ascending order for year
      }

      // Default case (shouldn't be reached with typed sortBy, but good practice)
      return 0;
    });

    setFilteredMovies(results);
    setCurrentPage(1);
  };

  // Type parameters for handleFilterChange
  const handleFilterChange = (name: keyof FiltersState, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    // applyFiltersAndSort(); // Optional instant apply
  };

  const handleApplyFiltersClick = () => {
    applyFiltersAndSort();
  };

  useEffect(() => {
    applyFiltersAndSort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initial load

  useEffect(() => {
    // This effect specifically handles re-sorting when sortBy changes
    applyFiltersAndSort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.sortBy]); // Re-run only when sortBy changes

  const totalFilteredMovies = filteredMovies.length;
  const totalPages = Math.ceil(totalFilteredMovies / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  // currentMoviesOnPage is correctly inferred as Movie[]
  const currentMoviesOnPage = filteredMovies.slice(startIndex, endIndex);

  // Type the parameter for handlePageChange
  const handlePageChange = (pageNumber: number) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      <div className="movie-archive-container">
        <div className="archive-header">
          <h1 className="archive-title">All Movies</h1>
          {totalFilteredMovies > 0 && (
            <p className="archive-count">
              Showing {totalFilteredMovies} movies
            </p>
          )}
        </div>

        <FilterControls
          filters={filters}
          onFilterChange={handleFilterChange}
          onApplyFilters={handleApplyFiltersClick}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />

        <div className="results-area">
          {currentMoviesOnPage.length > 0 ? (
            // movie is correctly inferred as Movie here
            currentMoviesOnPage.map((movie) => (
              <MovieCard7 key={movie.id} movie={movie} />
            ))
          ) : (
            <div className="no-results">
              <p>No movies found matching your criteria.</p>
              {(filters.year || filters.minRating || filters.category) && (
                <button
                  onClick={() => {
                    setFilters({
                      // Reset filters, keeping sortBy
                      sortBy: filters.sortBy,
                      year: "",
                      minRating: "",
                      category: "",
                    });
                    // applyFiltersAndSort(); // No need to call explicitly if state change triggers useEffect
                  }}
                  className="clear-filters-button"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
      <Footer /> {/* Assuming Footer component exists and works */}
    </>
  );
};

export default MoviesPage;
