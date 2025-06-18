import React, { useState, useEffect, useCallback } from "react";
import "./MoviesPage.css";
import MovieCard7 from "./MovieCard7";
import Footer from "@src/components/app/Footer";
import {
  getMoviesForPage,
  getMoviesPageCount,
  getAllGenres as getGenres,
  Movie as BackendMovie, // Fetched movie structure from API
  Genre as ApiGenre,
  MoviesPageParams,
} from "@src/services/movieNewsService";
import { useTranslation } from 'react-i18next';

// Local Movie type for what MovieCard7 and this page will use internally
export interface Movie {
  id: string;
  title: string;
  year?: number;
  posterUrl?: string | null;
  rating?: number | null; // Combined from movieq_rating / imdb_rating
  imdbRating?: number | null;
  genres: { id: string; name: string }[] | null;
  duration_minutes?: number | null;
  slug?: string;
  plot_summary?: string | null;
  language?: string; // Keep this if we plan to get it from backend Movie type directly (not crew)
  directors?: { id: string; name: string; slug?: string | null; }[];
  actors?: { id: string; name: string; slug?: string | null; character_name?: string | null; }[];
}

const sortMap: { [key: string]: string } = {
  rating_desc: "VOTE_AVERAGE_DESC",
  rating_asc: "VOTE_AVERAGE_ASC",
  title_asc: "TITLE_ASC",
  title_desc: "TITLE_DESC",
  year_desc: "RELEASE_DATE_DESC",
  year_asc: "RELEASE_DATE_ASC",
  popularity_desc: "POPULARITY_DESC",
  popularity_asc: "POPULARITY_ASC",
};
export type SortByType = keyof typeof sortMap;

export interface FiltersState {
  sortBy: SortByType;
  year: string;
  minRating: string;
  category: string; // Genre ID
  search: string;   // Search term for backend 'search' param
}

export interface FilterControlsProps {
  filters: FiltersState;
  availableGenres: ApiGenre[];
  onFilterChange: (name: keyof FiltersState, value: string) => void;
  onApplyFilters: () => void;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (pageNumber: number) => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  filters,
  availableGenres,
  onFilterChange,
  onApplyFilters,
}) => {
  const { t } = useTranslation();
  const sortOptions: { value: SortByType; label: string }[] = [
    { value: "rating_desc", label: t("ratingHighToLow") },
    { value: "rating_asc", label: t("ratingLowToHigh") },
    { value: "popularity_desc", label: t("popularityMost") },    
    { value: "title_asc", label: t("titleAZ") },
    { value: "title_desc", label: t("titleZA") },
    { value: "year_desc", label: t("yearNewest") },
    { value: "year_asc", label: t("yearOldest") },
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const name = e.target.name as keyof FiltersState;
    const value = e.target.value;
    onFilterChange(name, value);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onApplyFilters(); // Call the existing apply filters function
    }
  };
  
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange("sortBy", e.target.value);
    // Trigger apply on sort change to re-fetch immediately
    // This assumes onApplyFilters will use the latest state from the parent
    // We will call onApplyFilters directly in the parent for sort changes to ensure timing
  };

  return (
    <div className="filter-controls">
      <div className="filter-group search-group">
        <input
          type="text"
          name="search"
          id="search"
          value={filters.search}
          onChange={handleChange}
          onKeyDown={handleSearchKeyDown}
          placeholder={t("searchByTitle")}
          className="filter-input search"
        />
      </div>
      <div className="filter-group">
        <label htmlFor="sortBy">{t("sortBy")}:</label>
        <select
          name="sortBy"
          id="sortBy"
          value={filters.sortBy}
          onChange={handleSortChange} 
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
        <input
          type="number"
          name="year"
          id="year"
          value={filters.year}
          onChange={handleChange}
          placeholder={t("yearExample")}
          className="filter-input year"
          min="1900"
          max={new Date().getFullYear()}
        />
      </div>
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
          placeholder={t("minRatingRange")}
          className="filter-input rating"
        />
      </div>
      <div className="filter-group">
        <select
          name="category"
          id="category"
          value={filters.category}
          onChange={handleChange}
          className="filter-select category"
        >
          <option value="">{t("allGenres")}</option>
          {availableGenres.map((genre) => (
            <option key={genre.id} value={genre.id}>
              {genre.name}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={onApplyFilters}
        className="filter-apply-button"
      >
        {t("applyFilters")}
      </button>
    </div>
  );
};

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;
  const getPageNumbers = (): (number | string)[] => {
    const delta = 1;
    const pages: (number | string)[] = [1];
    if (currentPage > delta + 2) pages.push("...");
    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);
    for (let i = start; i <= end; i++) if (!pages.includes(i)) pages.push(i);
    if (currentPage < totalPages - delta - 1 && end < totalPages - 1) pages.push("...");
    if (totalPages > 1 && !pages.includes(totalPages)) pages.push(totalPages);
    return pages;
  };
  const pageNumbers = getPageNumbers();
  return (
    <div className="ms-pagination-container">
      <button className="ms-pagination-button" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>{t("previous")}</button>
      {pageNumbers.map((page, index) =>
        typeof page === "string" ? (
          <span key={`ellipsis-${index}`} className="ms-pagination-ellipsis">{page}</span>
        ) : (
          <button key={page} className={`ms-pagination-button ${currentPage === page ? "ms-pagination-active" : ""}`} onClick={() => onPageChange(page as number)}>{page}</button>
        )
      )}
      <button className="ms-pagination-button" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>{t("next")}</button>
    </div>
  );
};

const MoviesPage: React.FC = () => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<FiltersState>({
    sortBy: "rating_desc",
    year: "",
    minRating: "",
    category: "",
    search: "",
  });

  const [movies, setMovies] = useState<Movie[]>([]);
  const [totalMovies, setTotalMovies] = useState(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableGenres, setAvailableGenres] = useState<ApiGenre[]>([]);

  const itemsPerPage = 12; // Adjusted items per page

  const fetchMoviesData = useCallback(async (pageToFetch: number, currentFilters: FiltersState) => {
    setLoading(true);
    setError(null);
    const offset = (pageToFetch - 1) * itemsPerPage;

    const apiParams: MoviesPageParams = {
      limit: itemsPerPage,
      offset,
      sortBy: sortMap[currentFilters.sortBy],
      search: currentFilters.search && currentFilters.search.trim() !== "" ? currentFilters.search.trim() : undefined,
      filter: {},
    };

    if (currentFilters.category) {
      apiParams.filter.genreIds = [currentFilters.category];
    }
    if (currentFilters.year) {
      const yearNum = parseInt(currentFilters.year, 10);
      if (!isNaN(yearNum)) {
        apiParams.filter.minReleaseYear = yearNum;
        apiParams.filter.maxReleaseYear = yearNum;
      }
    }
    if (currentFilters.minRating) {
      const ratingNum = parseFloat(currentFilters.minRating);
      if(!isNaN(ratingNum)) {
        apiParams.filter.minMovieqRating = ratingNum;
      }
    }
    if (Object.keys(apiParams.filter).length === 0) {
      delete apiParams.filter;
    }

    try {
      // Fetch count first or in parallel
      const countData = await getMoviesPageCount({ filter: apiParams.filter, search: apiParams.search });
      setTotalMovies(countData);
      
      if (countData === 0) {
        setMovies([]);
      } else {
        const moviesData = await getMoviesForPage(apiParams);
        const transformedMovies: Movie[] = moviesData.map((apiMovie: BackendMovie) => ({
          id: String(apiMovie.id),
          title: apiMovie.title,
          posterUrl: apiMovie.poster_url,
          year: apiMovie.release_date ? new Date(apiMovie.release_date).getFullYear() : undefined,
          rating: apiMovie.movieq_rating ?? apiMovie.imdb_rating,
          imdbRating: apiMovie.imdb_rating,
          genres: apiMovie.genres,
          duration_minutes: apiMovie.duration_minutes,
          // slug: apiMovie.slug,
          plot_summary: apiMovie.plot_summary,
          // language: apiMovie.original_language,
          directors: apiMovie.crew?.filter(member => member.department === 'Directing' && member.job === 'Director').map(d => d.person) || [],
          actors: apiMovie.cast?.map(c => ({ ...c.person, character_name: c.character_name })) || [],
        }));
        setMovies(transformedMovies);
      }
      setCurrentPage(pageToFetch);
    } catch (err: any) {
      setError(err.message || t("failedToFetchMovies"));
      setMovies([]);
      setTotalMovies(0);
    }
    setLoading(false);
  }, [itemsPerPage, t]); // Added t to dependencies

  useEffect(() => {
    getGenres()
      .then(setAvailableGenres)
      .catch(err => {
        console.error("Failed to fetch genres:", err);
      });
  }, []);

  useEffect(() => {
    fetchMoviesData(currentPage, filters); 
  }, [fetchMoviesData, currentPage, filters]);

  const handleFilterChange = (name: keyof FiltersState, value: string) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    if (name === 'sortBy' || name === 'category') { // Apply immediately for sort and category changes
      setCurrentPage(1); // Reset to page 1
      // fetchMoviesData will be called by useEffect due to filters change
    }
    // For other filters like year, minRating, search, fetching is deferred to Apply button or Enter key
  };

  const handleApplyFiltersClick = () => {
    setCurrentPage(1); // Reset to first page when applying any new filter combination
    // The useEffect watching `filters` and `currentPage` will trigger the fetch.
    // If filters didn't change but currentPage was already 1, we might need to force it, but useEffect should handle it.
    // To be safe, or if direct fetch is preferred over relying on useEffect for this specific action:
    fetchMoviesData(1, filters); // Explicitly call to ensure fetch if filters object reference didn't change
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalPages = Math.ceil(totalMovies / itemsPerPage);

  return (
    <>
      <div className="movie-archive-container">
        <div className="archive-header">
          <h1 className="archive-title">{t("allMovies")}</h1>
        </div>
        <FilterControls
          filters={filters}
          availableGenres={availableGenres}
          onFilterChange={handleFilterChange}
          onApplyFilters={handleApplyFiltersClick}
        />
        {loading && <div className="loading-indicator">{t("loadingMovies")}</div>}
        {error && <div className="error-message">{t("error")}: {error}</div>}
        {!loading && !error && movies.length === 0 && (
          <div className="no-results">
            <p>{t("noMoviesFoundMatchingCriteria")}</p>
          </div>
        )}
        {!loading && !error && movies.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
        <div className="results-area">
          {!loading && !error && movies.map(movie => (
            <MovieCard7 key={movie.id} movie={movie} />
          ))}
        </div>
        {!loading && !error && movies.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>
      <Footer />
    </>
  );
};

export default MoviesPage;
