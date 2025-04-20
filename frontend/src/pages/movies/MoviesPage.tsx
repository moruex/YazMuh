import { useState, useEffect } from "react";
import "./MoviesPage.css"; // Using existing CSS file
import MovieCard7 from "./MovieCard7";
import Footer from "@src/components/app/Footer";
("./MovieCard7");

// --- Mock Data ---
const mockMovies = [
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
];

// Improved FilterControls with better responsiveness
const FilterControls = ({ filters, onFilterChange, onApplyFilters }) => {
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

  const sortOptions = [
    { value: "rating", label: "By IMDb Rating" }, // Assuming 'rating' in mock data is IMDb
    { value: "title", label: "By Title" },
    { value: "year", label: "By Year" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange(name, value);
  };

  // Trigger filter application automatically on sort change or category change
  // Keep the button for year and rating filters for explicit control
  const handleSelectChange = (e) => {
    handleChange(e);
    // Optionally, trigger applyFilters immediately for selects
    // onApplyFilters(); // Uncomment if you want instant filtering on select change
  };

  return (
    <div className="filter-controls">
      {/* Sort By Dropdown */}
      <div className="filter-group">
        <label htmlFor="sortBy">Sort by:</label>
        <select
          name="sortBy"
          id="sortBy"
          value={filters.sortBy}
          onChange={handleSelectChange} // Use specific handler or combine if desired
          className="filter-select"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Year Input */}
      <div className="filter-group">
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

      {/* Min Rating Input */}
      <div className="filter-group">
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

      {/* Category Select */}
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

      {/* Filter Button */}
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
          <path d="M6 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zm-2-3a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11a.5.5 0 0 1-.5-.5z" />
        </svg>
        Apply
      </button>
    </div>
  );
};

// --- Pagination Component ---
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null; // Don't render pagination if there's only one page or less
  }

  // --- Simple Pagination Logic ---
  // Show first, last, current, current +/- 1, and ellipsis
  const getPageNumbers = () => {
    const delta = 1; // How many pages to show around the current page
    const pages = [];

    // Always show the first page
    pages.push(1);

    // Ellipsis before current page block?
    if (currentPage > delta + 2) {
      pages.push("...");
    }

    // Pages around the current page
    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);
    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) {
        // Avoid duplicates if near start/end
        pages.push(i);
      }
    }

    // Ellipsis after current page block?
    if (currentPage < totalPages - delta - 1) {
      // Ensure ellipsis isn't redundant if end was already totalPages - 1
      if (end < totalPages - 1) {
        pages.push("...");
      }
    }

    // Always show the last page (if different from the first)
    if (totalPages > 1 && !pages.includes(totalPages)) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="ms-pagination-container">
      {/* Previous Button */}
      <button
        className="ms-pagination-button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Go to previous page"
      >
        Previous
      </button>

      {/* Page Number Buttons */}
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
            onClick={() => onPageChange(page)}
            aria-label={`Go to page ${page}`}
            aria-current={currentPage === page ? "page" : undefined}
          >
            {page}
          </button>
        )
      )}

      {/* Next Button */}
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

const MoviesPage = () => {
  const [filters, setFilters] = useState({
    sortBy: "rating", // Default sort
    year: "",
    minRating: "",
    category: "",
  });

  // Holds the full list of movies *after* filtering and sorting
  const [filteredMovies, setFilteredMovies] = useState([]);
  // Holds the current page number
  const [currentPage, setCurrentPage] = useState(1);
  // Define how many movies per page
  const itemsPerPage = 6; // Adjust as needed

  // Apply filters and sorting
  const applyFiltersAndSort = () => {
    let results = [...mockMovies]; // Start with a fresh copy

    // --- Filtering ---
    results = results.filter((movie) => {
      // Year filter
      if (filters.year && movie.year !== parseInt(filters.year, 10)) {
        return false;
      }
      // Rating filter (using imdbRating for clarity)
      const minRatingValue = parseFloat(filters.minRating);
      if (!isNaN(minRatingValue) && movie.imdbRating < minRatingValue) {
        return false;
      }
      // Category/Genre filter
      if (filters.category && !movie.genres.includes(filters.category)) {
        return false;
      }
      return true;
    });

    // --- Sorting ---
    results.sort((a, b) => {
      const aValue = a[filters.sortBy];
      const bValue = b[filters.sortBy];

      // Handle sorting based on type
      if (filters.sortBy === "title") {
        // Case-insensitive string comparison for title
        return aValue.toLowerCase().localeCompare(bValue.toLowerCase());
      } else if (filters.sortBy === "rating") {
        // Numeric comparison (descending for rating)
        return (bValue || 0) - (aValue || 0); // Use imdbRating or default rating
      } else if (filters.sortBy === "year") {
        // Numeric comparison (ascending for year)
        return (aValue || 0) - (bValue || 0);
      }
      return 0; // Default no sort change
    });

    setFilteredMovies(results);
    setCurrentPage(1); // Reset to page 1 whenever filters change
  };

  // Update filters state
  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Optional: Apply filters immediately on any change
    // applyFiltersAndSort(); // Uncomment for instant filtering/sorting on change
  };

  // Function explicitly called by the "Apply Filters" button
  const handleApplyFiltersClick = () => {
    applyFiltersAndSort();
  };

  // Apply default sort/filter on initial load
  useEffect(() => {
    applyFiltersAndSort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount

  // Apply sorting immediately when sortBy changes via dropdown
  useEffect(() => {
    applyFiltersAndSort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.sortBy]);

  // --- Pagination Calculations ---
  const totalFilteredMovies = filteredMovies.length;
  const totalPages = Math.ceil(totalFilteredMovies / itemsPerPage);

  // Calculate the movies to display on the current page
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMoviesOnPage = filteredMovies.slice(startIndex, endIndex);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      // Scroll to top when page changes (optional but good UX)
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      <div className="movie-archive-container">
        <div className="archive-header">
          <h1 className="archive-title">
            {/* Optional: Add an icon span here if needed by CSS */}
            All Movies
          </h1>
          {/* Display count of filtered movies */}
          {totalFilteredMovies > 0 && (
            <p className="archive-count">
              Showing {totalFilteredMovies} movies
            </p>
          )}
        </div>

        <FilterControls
          filters={filters}
          onFilterChange={handleFilterChange}
          onApplyFilters={handleApplyFiltersClick} // Pass the explicit apply function
        />

        {/* Top Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />

        <div className="results-area">
          {currentMoviesOnPage.length > 0 ? (
            currentMoviesOnPage.map((movie) => (
              <MovieCard7 key={movie.id} movie={movie} />
            ))
          ) : (
            <div className="no-results">
              <p>No movies found matching your criteria.</p>
              {/* Optionally add a button to clear filters */}
              {(filters.year || filters.minRating || filters.category) && (
                <button
                  onClick={() => {
                    setFilters({
                      sortBy: filters.sortBy,
                      year: "",
                      minRating: "",
                      category: "",
                    });
                    applyFiltersAndSort(); // Re-apply after clearing
                  }}
                  className="clear-filters-button"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
      <Footer />
    </>
  );
};

export default MoviesPage;
