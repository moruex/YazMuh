import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import './MovieSearchPage.css';
import Footer from '@components/app/Footer';
import { MovieCard2 } from './MovieCard2';
import {
    Movie as ApiMovie,
    Genre as ApiGenre,
    getAllGenres,
    getMoviesForPage,
    getMoviesPageCount,
    MoviesPageParams
} from '@src/services/movieNewsService';
import { Filter, Search, ListFilter } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import CircularLoader from '@components/app/CircularLoader';

export interface Movie {
    id: string;
    title: string;
    year?: number;
    posterUrl?: string | null;
    rating?: number | null;
    genres?: { id: string; name: string }[] | null;
    director?: string;
    runtime?: number;
    language?: string;
}

const sortMap: { [key: string]: string } = {
    title_asc: "TITLE_ASC",
    title_desc: "TITLE_DESC",
    year_desc: "RELEASE_DATE_DESC",
    year_asc: "RELEASE_DATE_ASC",
    rating_desc: "VOTE_AVERAGE_DESC",
    rating_asc: "VOTE_AVERAGE_ASC",
};
export type SortByType = keyof typeof sortMap;

interface FilterOptions {
    query: string;
    genreIds: string[];
    yearFrom: string;
    yearTo: string;
    minRating: string;
    sortBy: SortByType;
}

interface MultiSelectProps {
    options: ApiGenre[];
    selectedValues: string[];
    onChange: (selectedIds: string[]) => void;
    placeholder: string;
}

const MultiSelect = ({ options, selectedValues, onChange, placeholder }: MultiSelectProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();

    const toggleOption = (optionId: string) => {
        const newSelected = selectedValues.includes(optionId)
            ? selectedValues.filter(id => id !== optionId)
            : [...selectedValues, optionId];
        onChange(newSelected);
    };

    const removeSelected = (optionId: string) => {
        onChange(selectedValues.filter(id => id !== optionId));
    };

    const filteredOptions = options.filter(option =>
        option.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    return (
        <div className="ms-multi-select-container" ref={dropdownRef}>
            <div
                className={`ms-multi-select-input ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)} >
                <span>{selectedValues.length > 0 ? `${selectedValues.length} selected` : placeholder}</span>
                <ListFilter size={16} />
            </div>
            {selectedValues.length > 0 && (
                <div className="ms-selected-items">
                    {selectedValues.map(id => {
                        const genre = options.find(opt => opt.id === id);
                        return genre ? (
                            <div key={id} className="ms-selected-item">
                                {genre.name}
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    removeSelected(id);
                                }}>×</button>
                            </div>
                        ) : null;
                    })}
                </div>
            )}
            {isOpen && (
                <div className="ms-multi-select-dropdown">
                    <div className="ms-multi-select-search" onClick={e => e.stopPropagation()}>
                        <input
                            type="text"
                            placeholder={t('search')}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className='ms-search-input1' />
                    </div>
                    {filteredOptions.map(option => (
                        <div
                            key={option.id}
                            className="ms-multi-select-option"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleOption(option.id);
                            }} >
                            <input
                                className='ms-multi-select-checkbox'
                                type="checkbox"
                                checked={selectedValues.includes(option.id)}
                                readOnly
                            />
                            {option.name}
                        </div>
                    ))}
                    {filteredOptions.length === 0 && <div className="ms-no-options">No genres found</div>}
                </div>
            )}
        </div>
    );
};

const MovieSearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryInputRef = useRef<HTMLInputElement>(null);
    const { t } = useTranslation();

    const initializeFilters = useCallback((): FilterOptions => {
        const query = searchParams.get('query') || '';
        const genreIds = searchParams.getAll('genreId') || [];
        const yearFrom = searchParams.get('yearFrom') || '';
        const yearTo = searchParams.get('yearTo') || '';
        const minRating = searchParams.get('minRating') || 'Any';
        const sortByParam = searchParams.get('sortBy') || 'title_asc';
        const sortBy = Object.keys(sortMap).includes(sortByParam) ? sortByParam as SortByType : 'title_asc';
        return { query, genreIds, yearFrom, yearTo, minRating, sortBy };
    }, [searchParams]);

    const [filters, setFilters] = useState<FilterOptions>(initializeFilters);
    const [tempFilters, setTempFilters] = useState<FilterOptions>(initializeFilters); // Temporary state for filters before applying
    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [advancedSearchOpen, setAdvancedSearchOpen] = useState<boolean>(false);
    const [availableGenres, setAvailableGenres] = useState<ApiGenre[]>([]);
    const [totalMovies, setTotalMovies] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const moviesPerPage = 15;

    const ratingOptions = [t('any'), '9+', '8+', '7+', '6+', '5+'];
    const sortOptionsDisplay: { value: SortByType; labelKey: string }[] = [
        { value: 'title_asc', labelKey: 'titleAZ' },
        { value: 'title_desc', labelKey: 'titleZA' },
        { value: 'year_desc', labelKey: 'yearNewest' },
        { value: 'year_asc', labelKey: 'yearOldest' },
        { value: 'rating_desc', labelKey: 'ratingHighToLow' },
        { value: 'rating_asc', labelKey: 'ratingLowToHigh' },
    ];

    // Update URL with current filters
    const updateURL = useCallback((newFilters: FilterOptions, resetPage = false) => {
        const newSearchParams = new URLSearchParams();
        
        if (newFilters.query.trim()) {
            newSearchParams.set('query', newFilters.query.trim());
        }
        
        newFilters.genreIds.forEach(id => {
            if (id.trim()) {
                newSearchParams.append('genreId', id);
            }
        });
        
        if (newFilters.yearFrom.trim()) {
            newSearchParams.set('yearFrom', newFilters.yearFrom);
        }
        
        if (newFilters.yearTo.trim()) {
            newSearchParams.set('yearTo', newFilters.yearTo);
        }
        
        if (newFilters.minRating && newFilters.minRating !== 'Any') {
            newSearchParams.set('minRating', newFilters.minRating);
        }
        
        if (newFilters.sortBy && newFilters.sortBy !== 'title_asc') {
            newSearchParams.set('sortBy', String(newFilters.sortBy));
        }

        if (!resetPage && currentPage > 1) {
            newSearchParams.set('page', currentPage.toString());
        }
        
        setSearchParams(newSearchParams, { replace: true });
    }, [setSearchParams, currentPage]);

    useEffect(() => {
        getAllGenres()
            .then(data => setAvailableGenres(data || []))
            .catch(err => {
                console.error("Failed to fetch genres:", err);
                setError(t('failedToFetchMovies'));
            });
    }, [t]);

    const fetchAndFilterMovies = useCallback(async () => {
        setLoading(true);
        setError(null);

        const apiParams: MoviesPageParams = {
            limit: moviesPerPage,
            offset: (currentPage - 1) * moviesPerPage,
            sortBy: sortMap[filters.sortBy],
            search: filters.query.trim() || undefined,
            filter: {},
        };

        if (filters.genreIds.length > 0) {
            apiParams.filter.genreIds = filters.genreIds.filter(id => id.trim());
        }
        
        if (filters.yearFrom.trim()) {
            const yearNum = parseInt(filters.yearFrom, 10);
            if (!isNaN(yearNum)) apiParams.filter.minReleaseYear = yearNum;
        }
        
        if (filters.yearTo.trim()) {
            const yearNum = parseInt(filters.yearTo, 10);
            if (!isNaN(yearNum)) apiParams.filter.maxReleaseYear = yearNum;
        }
        
        if (filters.minRating && filters.minRating !== 'Any') {
            const ratingNum = parseFloat(filters.minRating.replace('+', ''));
            if (!isNaN(ratingNum)) apiParams.filter.minMovieqRating = ratingNum;
        }
        
        if (Object.keys(apiParams.filter).length === 0) {
            delete apiParams.filter;
        }

        try {
            const count = await getMoviesPageCount({ filter: apiParams.filter, search: apiParams.search });
            setTotalMovies(count);
            
            if (count === 0) {
                setMovies([]);
            } else {
                const moviesData = await getMoviesForPage(apiParams);
                const transformedMovies: Movie[] = moviesData.map((apiMovie: ApiMovie) => ({
                    id: String(apiMovie.id),
                    title: apiMovie.title,
                    posterUrl: apiMovie.poster_url,
                    year: apiMovie.release_date ? new Date(apiMovie.release_date).getFullYear() : undefined,
                    rating: apiMovie.movieq_rating ?? apiMovie.imdb_rating,
                    genres: apiMovie.genres,
                }));
                setMovies(transformedMovies);
            }
        } catch (err: any) {
            console.error("Error fetching movies:", err);
            setError(t('failedToFetchMovies'));
            setMovies([]);
            setTotalMovies(0);
        }
        
        setLoading(false);
    }, [filters, currentPage, t]);

    // Initialize from URL params on component mount and URL changes
    useEffect(() => {
        const urlFilters = initializeFilters();
        const urlPage = parseInt(searchParams.get('page') || '1', 10);
        
        setFilters(urlFilters);
        setTempFilters(urlFilters);
        setCurrentPage(isNaN(urlPage) ? 1 : urlPage);
    }, [searchParams, initializeFilters]);

    // Fetch movies when filters or page changes
    useEffect(() => {
        fetchAndFilterMovies();
    }, [fetchAndFilterMovies]);

    // Handle search input change (only updates temp state)
    const handleQueryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        setTempFilters(prev => ({ ...prev, query: newQuery }));
    };

    // Handle filter changes (only updates temp state)
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setTempFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSortBy = e.target.value as SortByType;
        setTempFilters(prev => ({ ...prev, sortBy: newSortBy }));
    };

    const handleGenresChange = (selectedIds: string[]) => {
        setTempFilters(prev => ({ ...prev, genreIds: selectedIds }));
    };

    // Apply filters - this updates the actual filters and URL
    const applyFilters = useCallback(() => {
        setFilters(tempFilters);
        setCurrentPage(1);
        updateURL(tempFilters, true);
        queryInputRef.current?.blur();
    }, [tempFilters, updateURL]);

    // Handle search form submission
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters();
    };

    const toggleAdvancedSearch = () => {
        setAdvancedSearchOpen(prev => !prev);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        
        // Update URL with new page
        const newSearchParams = new URLSearchParams();
        
        if (filters.query.trim()) {
            newSearchParams.set('query', filters.query.trim());
        }
        
        filters.genreIds.forEach(id => {
            if (id.trim()) {
                newSearchParams.append('genreId', id);
            }
        });
        
        if (filters.yearFrom.trim()) {
            newSearchParams.set('yearFrom', filters.yearFrom);
        }
        
        if (filters.yearTo.trim()) {
            newSearchParams.set('yearTo', filters.yearTo);
        }
        
        if (filters.minRating && filters.minRating !== 'Any') {
            newSearchParams.set('minRating', filters.minRating);
        }
        
        if (filters.sortBy && filters.sortBy !== 'title_asc') {
            newSearchParams.set('sortBy', String(filters.sortBy));
        }

        if (page > 1) {
            newSearchParams.set('page', page.toString());
        }
        
        setSearchParams(newSearchParams, { replace: true });

        // Scroll to results
        const resultsContainer = document.querySelector('.ms-results-container') as HTMLElement | null;
        if (resultsContainer) {
            window.scrollTo({ top: resultsContainer.offsetTop, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const resetFiltersAndSearch = () => {
        const resetFilters = {
            query: '',
            genreIds: [],
            yearFrom: '',
            yearTo: '',
            minRating: 'Any',
            sortBy: 'title_asc' as SortByType,
        };
        
        setFilters(resetFilters);
        setTempFilters(resetFilters);
        setCurrentPage(1);
        setSearchParams({}, { replace: true });
    };

    const Pagination = () => {
        const totalPages = Math.ceil(totalMovies / moviesPerPage);
        if (totalPages <= 1) return null;

        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 ||
                i === totalPages ||
                i === currentPage ||
                i === currentPage - 1 ||
                i === currentPage + 1
            ) {
                pages.push(i);
            } else if (
                (i === currentPage - 2 && currentPage > 3) ||
                (i === currentPage + 2 && currentPage < totalPages - 2)
            ) {
                pages.push(-1);
            }
        }

        const uniquePages = [...new Set(pages)].sort((a, b) => a - b);

        return (
            <div className="ms-pagination-container">
                <button
                    className="ms-pagination-button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    {t('previous')}
                </button>

                {uniquePages.map((page, index) =>
                    page === -1 ? (
                        <span key={`ellipsis-${index}`}>...</span>
                    ) : (
                        <button
                            key={page}
                            className={`ms-pagination-button ${currentPage === page ? 'ms-pagination-active' : ''}`}
                            onClick={() => handlePageChange(page)}
                        >
                            {page}
                        </button>
                    )
                )}

                <button
                    className="ms-pagination-button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    {t('next')}
                </button>
            </div>
        );
    };

    return (
        <div className='ms-container'>
            <div className='ms-page'>
                <div className="ms-movie-search-page">
                    <div className="ms-page-title">
                        {t('searchResultsFor', { query: filters.query || t('allMovies') })}
                    </div>

                    <div className="ms-search-container1">
                        <form onSubmit={handleSearchSubmit}>
                            <div className="ms-main-search1">
                                <input
                                    ref={queryInputRef}
                                    type="text"
                                    value={tempFilters.query}
                                    onChange={handleQueryInputChange}
                                    placeholder={t('searchMovies')}
                                    className="ms-search-input1" />
                                    
                                <button type="submit" className="ms-search-button">
                                    <Search size={18} />
                                    <span className="mvhide-text">{t('search')}</span>
                                </button>

                                <button
                                    type="button"
                                    className="ms-advanced-toggle"
                                    onClick={toggleAdvancedSearch}>
                                    <Filter size={18} />
                                    <span className="mvhide-text">
                                        {advancedSearchOpen ? t('hide') : t('filters')}
                                    </span>
                                </button>
                            </div>
                            
                            {advancedSearchOpen && (
                                <div className="ms-advanced-search">
                                    <div className="ms-filter-row">
                                        <div className="ms-filter-group genres">
                                            <label htmlFor="genres">{t('genres')}</label>
                                            <MultiSelect
                                                options={availableGenres}
                                                selectedValues={tempFilters.genreIds}
                                                onChange={handleGenresChange}
                                                placeholder={t('anyGenre')} />
                                        </div>
                                        
                                        <div className="ms-filter-group">
                                            <label htmlFor="yearRange">{t('yearRange')}</label>
                                            <div className="ms-year-range-container">
                                                <input
                                                    type="number"
                                                    name="yearFrom"
                                                    value={tempFilters.yearFrom}
                                                    onChange={handleFilterChange}
                                                    placeholder={t('from')}
                                                    className='ms-search-input1'
                                                    min="1900"
                                                    max="2025" />
                                                <span>{t('to')}</span>
                                                <input
                                                    type="number"
                                                    name="yearTo"
                                                    value={tempFilters.yearTo}
                                                    onChange={handleFilterChange}
                                                    placeholder={t('to')}
                                                    className='ms-search-input1'
                                                    min="1900"
                                                    max="2025" />
                                            </div>
                                        </div>
                                        
                                        <div className="ms-filter-group">
                                            <label htmlFor="minRating">{t('minRating')}</label>
                                            <div className='ms-filter-rating-container'>
                                                <select
                                                    name="minRating"
                                                    id="minRating"
                                                    value={tempFilters.minRating}
                                                    onChange={handleFilterChange}
                                                    className="ms-filter-select rating" >
                                                    {ratingOptions.map(rating => (
                                                        <option className='option' key={rating} value={rating}>
                                                            {rating === 'Any' ? t('any') : rating}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="ms-filter-row">
                                        <div className="ms-filter-group">
                                            <label htmlFor="sortBy">{t('sortBy')}</label>
                                            <div className="ms-sort-container">
                                                <select
                                                    name="sortBy"
                                                    id="sortBy"
                                                    value={tempFilters.sortBy}
                                                    onChange={handleSortByChange}
                                                    className="ms-filter-select" >
                                                    {sortOptionsDisplay.map(option => (
                                                        <option key={option.value} value={option.value}>
                                                            {t(option.labelKey)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="ms-filter-group ms-filter-actions">
                                            <button
                                                type="button"
                                                onClick={applyFilters}
                                                className="ms-apply-filters-button"
                                            >
                                                {t('apply')}
                                            </button>
                                            <button
                                                type="button"
                                                className="ms-reset-filters-button"
                                                onClick={resetFiltersAndSearch}
                                            >
                                                {t('reset')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                    
                    <div className="ms-results-container">
                        {!loading && movies.length > 0 && <Pagination />}
                        
                        {loading ? (
                            <div className="ms-loading-indicator">
                                <CircularLoader />
                                <p>{t('searchingForMovies')}</p>
                            </div>
                        ) : movies.length > 0 ? (
                            <div className="ms-movie-grid">
                                {movies.map((movie) => (
                                    <MovieCard2 key={movie.id} movie={movie} />
                                ))}
                            </div>
                        ) : (
                            <div className="ms-no-results">
                                <p>{error || t('noMoviesFoundMatchingCriteria')}</p>
                                {!error && (
                                    <button
                                        onClick={resetFiltersAndSearch}
                                        className="ms-reset-search-button"
                                    >
                                        {t('resetSearch')}
                                    </button>
                                )}
                            </div>
                        )}
                        
                        {!loading && movies.length > 0 && <Pagination />}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default MovieSearchPage;