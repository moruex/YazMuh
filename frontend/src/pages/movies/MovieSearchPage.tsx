import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import './MovieSearchPage.css';
import Footer from '@components/app/Footer';
import MovieCard2 from './MovieCard2';
import { Movie } from '@src/types/Movie';

interface FilterOptions {
    query: string;
    genres: string[];
    yearFrom: string;
    yearTo: string;
    rating: string;
    runtime: string;
    language: string;
    director: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}

// MultiSelect component for genres and other multi-select filters
interface MultiSelectProps {
    options: string[];
    selectedValues: string[];
    onChange: (selected: string[]) => void;
    placeholder: string;
}

const mockMovies: Movie[] = [
    {
        id: 1,
        title: "The Shawshank Redemption",
        year: 1994,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzMtY2YzZC00NmNlLWJiNDMtZDViZWM2MzIxZDYwXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_FMjpg_UX1000_.jpg",
        rating: 9.3,
        genres: ["Drama"],
        director: "Frank Darabont",
        runtime: 142,
        language: "English"
    },
    {
        id: 2,
        title: "The Godfather",
        year: 1972,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg",
        rating: 9.2,
        genres: ["Crime", "Drama"],
        director: "Francis Ford Coppola",
        runtime: 175,
        language: "English"
    },
    {
        id: 3,
        title: "Pulp Fiction",
        year: 1994,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItYzViMjE3YzI5MjljXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg",
        rating: 8.9,
        genres: ["Crime", "Drama"],
        director: "Quentin Tarantino",
        runtime: 154,
        language: "English"
    },
    {
        id: 6,
        title: "Inception",
        year: 2010,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_FMjpg_UX1000_.jpg",
        rating: 8.8,
        genres: ["Action", "Adventure", "Sci-Fi"],
        director: "Christopher Nolan",
        runtime: 148,
        language: "English"
    },
    {
        id: 7,
        title: "Interstellar",
        year: 2014,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_FMjpg_UX1000_.jpg",
        rating: 8.6,
        genres: ["Adventure", "Drama", "Sci-Fi"],
        director: "Christopher Nolan",
        runtime: 169,
        language: "English"
    },
    {
        id: 9,
        title: "The Dark Knight",
        year: 2008,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_FMjpg_UX1000_.jpg",
        rating: 9.0,
        genres: ["Action", "Crime", "Drama"],
        director: "Christopher Nolan",
        runtime: 152,
        language: "English"
    },
    {
        id: 10,
        title: "Fight Club",
        year: 1999,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BMmEzNTkxYjQtZTc0MC00YTVjLTg5ZTEtZWMwOWVlYzY0NWIwXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_FMjpg_UX1000_.jpg",
        rating: 8.8,
        genres: ["Drama"],
        director: "David Fincher",
        runtime: 139,
        language: "English"
    },
    {
        id: 11,
        title: "Naruto: The Last",
        year: 2014,
        posterUrl: "https://static.hdrezka.ac/i/2022/9/28/d3abc7fdf9382ef67g21p.jpg",
        rating: 8.2,
        genres: ["Animation", "Action", "Adventure"],
        director: "Tsuneo Kobayashi",
        runtime: 112,
        language: "Japanese"
    },
    {
        id: 12,
        title: "Attack on Titan: Chronicle",
        year: 2020,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BMTY5ODk1NzUyMl5BMl5BanBnXkFtZTgwMjUyNzEyMTE@._V1_FMjpg_UX1000_.jpg",
        rating: 8.5,
        genres: ["Animation", "Action", "Drama"],
        director: "Tetsurō Araki",
        runtime: 120,
        language: "Japanese"
    },
    {
        id: 13,
        title: "The Matrix",
        year: 1999,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4L2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_.jpg",
        rating: 8.7,
        genres: ["Action", "Sci-Fi"],
        director: "Lana & Lilly Wachowski",
        runtime: 136,
        language: "English"
    },
    {
        id: 15,
        title: "Parasite",
        year: 2019,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BYWZjMjk3ZTItODQ2ZC00NTY5LWE0ZDYtZTI3MjcwN2Q5NTVkXkEyXkFqcGdeQXVyODk4OTc3MTY@._V1_FMjpg_UX1000_.jpg",
        rating: 8.6,
        genres: ["Comedy", "Drama", "Thriller"],
        director: "Bong Joon-ho",
        runtime: 132,
        language: "Korean"
    },
    {
        id: 17,
        title: "Spirited Away",
        year: 2001,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BMjlmZmI5MDctNDE2YS00YWE0LWE5ZWItZDBhYWQ0NTcxNWRhXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_FMjpg_UX1000_.jpg",
        rating: 8.6,
        genres: ["Animation", "Adventure", "Family"],
        director: "Hayao Miyazaki",
        runtime: 125,
        language: "Japanese"
    },
    {
        id: 18,
        title: "The Avengers",
        year: 2012,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BNDYxNjQyMjAtNTdiOS00NGYwLWFmNTAtNThmYjU5ZGI2YTI1XkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_FMjpg_UX1000_.jpg",
        rating: 8.0,
        genres: ["Action", "Adventure", "Sci-Fi"],
        director: "Joss Whedon",
        runtime: 143,
        language: "English"
    },
    {
        id: 19,
        title: "Breaking Bad (TV Series)",
        year: 2008,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BYmQ4YWMxYjUtNjZmYi00MDQ1LWFjMjMtNjA5ZDdiYjdiODU5XkEyXkFqcGdeQXVyMTMzNDExODE5._V1_FMjpg_UX1000_.jpg",
        rating: 9.5,
        genres: ["Crime", "Drama", "Thriller"],
        runtime: 45, // per episode
        language: "English"
    },
    {
        id: 21,
        title: "Blade Runner 2049",
        year: 2017,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BNzA1Njg4NzYxOV5BMl5BanBnXkFtZTgwODk5NjU3MzI@._V1_FMjpg_UX1000_.jpg",
        rating: 8.0,
        genres: ["Sci-Fi", "Thriller"],
        director: "Denis Villeneuve",
        runtime: 164,
        language: "English"
    },
    {
        id: 23,
        title: "Demon Slayer: Mugen Train",
        year: 2020,
        posterUrl: "https://pics.blokino.org/anime/05/0530/prev.jpg",
        rating: 8.3,
        genres: ["Animation", "Action", "Adventure"],
        director: "Haruo Sotozaki",
        runtime: 117,
        language: "Japanese"
    },
    {
        id: 24,
        title: "Dune",
        year: 2021,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BN2FjNmEyNWMtYzM0ZS00NjIyLTg5YzYtYThlMGVjNzE1OGViXkEyXkFqcGdeQXVyMTkxNjUyNQ@@._V1_FMjpg_UX1000_.jpg",
        rating: 8.0,
        genres: ["Sci-Fi", "Adventure"],
        director: "Denis Villeneuve",
        runtime: 155,
        language: "English"
    },
    {
        id: 26,
        title: "The Witcher (TV Series)",
        year: 2019,
        posterUrl: "https://static.hdrezka.ac/i/2023/4/26/od101a5553311dy48a81e.jpg",
        rating: 8.2,
        genres: ["Action", "Adventure", "Fantasy"],
        runtime: 60,
        language: "English"
    },
    {
        id: 28,
        title: "Tenet",
        year: 2020,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BYzg0NGM2NjAtNmIxOC00MDJmLTg5ZmYtYzM0MTE4NWE2NzlhXkEyXkFqcGdeQXVyMTA4NjE0NjEy._V1_FMjpg_UX1000_.jpg",
        rating: 7.5,
        genres: ["Action", "Sci-Fi", "Thriller"],
        director: "Christopher Nolan",
        runtime: 150,
        language: "English"
    },
    {
        id: 29,
        title: "One Piece: Red",
        year: 2022,
        posterUrl: "https://static.hdrezka.ac/i/2023/5/5/oc9b75b78b731er75w38t.jpg",
        rating: 7.3,
        genres: ["Animation", "Action", "Adventure"],
        director: "Gorō Taniguchi",
        runtime: 115,
        language: "Japanese"
    },
];

const MultiSelect: React.FC<MultiSelectProps> = ({ options, selectedValues, onChange, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const toggleOption = (option: string) => {
        const newSelected = selectedValues.includes(option)
            ? selectedValues.filter(item => item !== option)
            : [...selectedValues, option];
        onChange(newSelected);
    };

    const removeSelected = (option: string) => {
        onChange(selectedValues.filter(item => item !== option));
    };

    const filteredOptions = options.filter(option =>
        option.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="ms-multi-select-container">
            <div
                className={`ms-multi-select-input ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)} >
                <span>{selectedValues.length > 0 ? `${selectedValues.length} selected` : placeholder}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00e054" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                </svg>

            </div>
            {selectedValues.length > 0 && (
                <div className="ms-selected-items">
                    {selectedValues.map(item => (
                        <div key={item} className="ms-selected-item">
                            {item}
                            <button onClick={(e) => {
                                e.stopPropagation();
                                removeSelected(item);
                            }}>×</button>
                        </div>
                    ))}
                </div>
            )}
            {isOpen && (
                <div className="ms-multi-select-dropdown">
                    <div className="ms-multi-select-search" onClick={e => e.stopPropagation()}>
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className='ms-search-input1' />
                    </div>
                    {filteredOptions.map(option => (
                        <div
                            key={option}
                            className="ms-multi-select-option"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleOption(option);
                            }} >
                            <input
                                className='ms-multi-select-checkbox'
                                type="checkbox"
                                checked={selectedValues.includes(option)}
                                onChange={() => { }} />
                            {option}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const MovieSearchPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryInputRef = useRef<HTMLInputElement>(null);

    // Initialize filters based on initial URL search parameters
    const initializeFilters = (): FilterOptions => {
        const query = searchParams.get('query') || '';
        const genres = searchParams.getAll('genre') || []; // Use getAll for potential multiple values
        const yearFrom = searchParams.get('yearFrom') || '';
        const yearTo = searchParams.get('yearTo') || '';
        const rating = searchParams.get('rating') || '';
        // runtime, language, director are not currently used in the UI filters, so skip for now
        const sortBy = searchParams.get('sortBy') || 'title';
        const sortOrderParam = searchParams.get('sortOrder');
        const sortOrder = (sortOrderParam === 'asc' || sortOrderParam === 'desc') ? sortOrderParam : 'asc';

        return {
            query: query,
            genres: genres,
            yearFrom: yearFrom,
            yearTo: yearTo,
            rating: rating,
            runtime: '', // Not in URL yet
            language: '', // Not in URL yet
            director: '', // Not in URL yet
            sortBy: sortBy,
            sortOrder: sortOrder
        };
    };

    const [filters, setFilters] = useState<FilterOptions>(initializeFilters);
    const [inputValue, setInputValue] = useState<string>(filters.query); // Initialize input with URL/filter query

    const [movies, setMovies] = useState<Movie[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [advancedSearchOpen, setAdvancedSearchOpen] = useState<boolean>(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const moviesPerPage = 15;

    const genres = ['Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
        'Drama', 'Family', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 'Thriller'];

    const years = Array.from({ length: 2025 - 1930 + 1 }, (_, i) => (2025 - i).toString());

    const ratings = ['9+', '8+', '7+', '6+', '5+', 'Any'];

    const runtimes = ['< 90 min', '90-120 min', '> 120 min', 'Any'];

    const languages = ['English', 'Spanish', 'French', 'German', 'Japanese', 'Korean', 'Chinese', 'Russian', 'Other'];

    const directors = ['Christopher Nolan', 'Steven Spielberg', 'Martin Scorsese', 'Quentin Tarantino', 'Denis Villeneuve', 'Other'];

    const sortOptions = [
        { value: 'title', label: 'Title' },
        { value: 'year', label: 'Release Year' },
        { value: 'rating', label: 'Rating' },
        { value: 'runtime', label: 'Runtime' }
    ];

    const fetchAndFilterMovies = useCallback(() => {
        setLoading(true);
        console.log("Fetching/Filtering based on:", filters, "Page:", currentPage);

        const timer = setTimeout(() => {
            let filteredMovies = mockMovies.filter(movie => {
                if (filters.query && !movie.title.toLowerCase().includes(filters.query.toLowerCase())) {
                    return false;
                }
                if (filters.genres.length > 0 && !movie.genres.some(genre => filters.genres.includes(genre))) {
                    return false;
                }
                if (filters.yearFrom && movie.year < parseInt(filters.yearFrom)) {
                    return false;
                }
                if (filters.yearTo && movie.year > parseInt(filters.yearTo)) {
                    return false;
                }
                if (filters.rating && filters.rating !== 'Any') {
                    const minRating = parseInt(filters.rating.replace('+', ''));
                    if (movie.rating < minRating) {
                        return false;
                    }
                }
                return true;
            });

            const sortedMovies = [...filteredMovies].sort((a, b) => {
                const aValue = a[filters.sortBy as keyof Movie];
                const bValue = b[filters.sortBy as keyof Movie];

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return filters.sortOrder === 'asc'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                } else if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return filters.sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
                }
                return 0;
            });

            setTotalPages(Math.ceil(sortedMovies.length / moviesPerPage));

            const indexOfLastMovie = currentPage * moviesPerPage;
            const indexOfFirstMovie = indexOfLastMovie - moviesPerPage;
            const currentMovies = sortedMovies.slice(indexOfFirstMovie, indexOfLastMovie);

            setMovies(currentMovies);
            setLoading(false);
        }, 300);

        return () => clearTimeout(timer);
    }, [filters, currentPage, moviesPerPage]);

    useEffect(() => {
        fetchAndFilterMovies();
    }, [fetchAndFilterMovies]);

    // Update URL search parameters whenever filters change
    useEffect(() => {
        const newSearchParams = new URLSearchParams();

        if (filters.query) {
            newSearchParams.set('query', filters.query);
        }
        filters.genres.forEach(genre => newSearchParams.append('genre', genre)); // Use append for multiple genres
        if (filters.yearFrom) {
            newSearchParams.set('yearFrom', filters.yearFrom);
        }
        if (filters.yearTo) {
            newSearchParams.set('yearTo', filters.yearTo);
        }
        if (filters.rating) {
            newSearchParams.set('rating', filters.rating);
        }
        // Add other filters like runtime, language, director if/when they are implemented
        if (filters.sortBy && filters.sortBy !== 'title') { // Don't add default sort
             newSearchParams.set('sortBy', filters.sortBy);
        }
        if (filters.sortOrder && filters.sortOrder !== 'asc') { // Don't add default order
            newSearchParams.set('sortOrder', filters.sortOrder);
        }

        // Use replace: true to avoid adding multiple history entries for filter changes
        setSearchParams(newSearchParams, { replace: true });

    // Only run when filters change. Avoid dependency on setSearchParams.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters]);

    // React to external URL changes (e.g., from Navbar or back/forward)
    // This effect now PRIMARILY focuses on syncing the *input field* and *resetting filters*
    // if the URL is changed externally in a significant way (e.g., query changes).
    useEffect(() => {
        // Read filters directly from the *current* URL state
        const currentUrlFilters = initializeFilters();

        // Update the main filters state if the URL reflects different filter values
        // This handles back/forward navigation restoring previous filter states.
        // Use JSON.stringify for simple comparison; for complex objects, a deep comparison might be needed.
        if (JSON.stringify(currentUrlFilters) !== JSON.stringify(filters)) {
            console.log("URL changed externally, updating filters state:", currentUrlFilters);
            setFilters(currentUrlFilters);
            setCurrentPage(1); // Reset page if filters changed externally
        }

        // Always ensure the input value reflects the URL query, especially if the input
        // doesn't have focus.
        const queryFromUrl = searchParams.get('query') || '';
        if (queryFromUrl !== inputValue && document.activeElement !== queryInputRef.current) {
             console.log("Syncing input value from URL:", queryFromUrl);
             setInputValue(queryFromUrl);
        }

    // Trigger this effect when the searchParams object itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]); // Removed filters dependency here to prevent loops

    const handleQueryInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
        setCurrentPage(1);
    };

    const handleGenresChange = (selected: string[]) => {
        setFilters(prev => ({
            ...prev,
            genres: selected
        }));
        setCurrentPage(1);
    };

    const triggerSearch = () => {
        console.log("Triggering search with input value:", inputValue);
        // Update the active query filter. This will trigger the useEffect to update the URL.
        setFilters(prev => ({ ...prev, query: inputValue }));
        // Reset to page 1 if the query or other filters initiated the search
        // Note: Filter changes already reset the page. This ensures query changes also reset it.
        if (currentPage !== 1) {
             setCurrentPage(1);
        }
        queryInputRef.current?.blur();
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        triggerSearch(); // This now updates filters, which triggers URL update
    };

    const toggleSortOrder = () => {
        setFilters(prev => ({
            ...prev,
            sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
        }));
        setCurrentPage(1);
    };

    const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFilters(prev => ({
            ...prev,
            sortBy: e.target.value
        }));
        setCurrentPage(1);
    };

    const toggleAdvancedSearch = () => {
        setAdvancedSearchOpen(prev => !prev);
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        const resultsContainer = document.querySelector('.ms-results-container') as HTMLElement | null;
        if (resultsContainer) {
            window.scrollTo({ top: resultsContainer.offsetTop, behavior: 'smooth' });
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const resetFiltersAndSearch = () => {
        const initialFilters: FilterOptions = {
            query: '',
            genres: [],
            yearFrom: '',
            yearTo: '',
            rating: '',
            runtime: '',
            language: '',
            director: '',
            sortBy: 'title',
            sortOrder: 'asc'
        };
        setInputValue('');
        setFilters(initialFilters); // This will trigger the useEffect to clear URL parameters
        setCurrentPage(1);
        queryInputRef.current?.focus(); // Optional: focus query input after reset
    };

    const Pagination = () => {
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
                    Previous
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
                    Next
                </button>
            </div>
        );
    };

    return (
        <div className='ms-container'>
            <div className='ms-page'>
                <div className="ms-movie-search-page">
                    <div className="ms-page-title">Search results for «{filters.query || "All Movies"}»</div>
                    <div className="ms-search-container1">
                        <form onSubmit={handleSearchSubmit}>
                            <div className="ms-main-search1">
                                <input
                                    ref={queryInputRef}
                                    type="text"
                                    name="queryInput"
                                    value={inputValue}
                                    onChange={handleQueryInputChange}
                                    placeholder="Search movies..."
                                    className="ms-search-input1" />
                                <button type="submit" className="ms-search-button">
                                    Search
                                </button>
                                <button
                                    type="button"
                                    className="ms-advanced-toggle"
                                    onClick={toggleAdvancedSearch} >
                                    {advancedSearchOpen ? 'Hide' : 'Show'}
                                </button>
                            </div>
                            {advancedSearchOpen && (
                                <div className="ms-advanced-search">
                                    <div className="ms-filter-row">
                                        <div className="ms-filter-group genres">
                                            <label htmlFor="genres">Genres</label>
                                            <MultiSelect
                                                options={genres}
                                                selectedValues={filters.genres}
                                                onChange={handleGenresChange}
                                                placeholder="Any" />
                                        </div>
                                        <div className="ms-filter-group">
                                            <label htmlFor="yearRange">Year Range</label>
                                            <div className="ms-year-range-container">
                                                <input
                                                    type="number"
                                                    name="yearFrom"
                                                    value={filters.yearFrom}
                                                    onChange={handleFilterChange}
                                                    placeholder="From"
                                                    className='ms-search-input1'
                                                    min="1900"
                                                    max="2025" />
                                                <span>to</span>
                                                <input
                                                    type="number"
                                                    name="yearTo"
                                                    value={filters.yearTo}
                                                    onChange={handleFilterChange}
                                                    placeholder="To"
                                                    className='ms-search-input1'
                                                    min="1900"
                                                    max="2025" />
                                            </div>
                                        </div>
                                        <div className="ms-filter-group">
                                            <label htmlFor="rating">Rating</label>
                                            <div className='ms-filter-rating-container'>
                                                <select
                                                    name="rating"
                                                    id="rating"
                                                    value={filters.rating}
                                                    onChange={handleFilterChange}
                                                    className="ms-filter-select rating" >
                                                    <option value="">Any</option>
                                                    {ratings.filter(r => r !== 'Any').map(rating => (
                                                        <option className='option' key={rating} value={rating}>{rating}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ms-filter-row">
                                        <div className="ms-filter-group">
                                            <label htmlFor="sortBy">Sort By</label>
                                            <div className="ms-sort-container">
                                                <select
                                                    name="sortBy"
                                                    id="sortBy"
                                                    value={filters.sortBy}
                                                    onChange={handleSortByChange}
                                                    className="ms-filter-select" >
                                                    {sortOptions.map(option => (
                                                        <option key={option.value} value={option.value}>{option.label}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    onClick={toggleSortOrder}
                                                    className="ms-sort-order-toggle" >
                                                    {filters.sortOrder === 'asc' ? '↑' : '↓'}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="ms-filter-group ms-filter-actions">
                                            <button type="button" onClick={triggerSearch} className="ms-apply-filters-button">
                                                Apply
                                            </button>
                                            <button
                                                type="button"
                                                className="ms-reset-filters-button"
                                                onClick={resetFiltersAndSearch}
                                                >
                                                Reset
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
                                <span className="ms-loader"></span>
                                <p>Searching for movies...</p>
                            </div>
                        ) : movies.length > 0 ? (
                            <div className="ms-movie-grid">
                                {movies.map((movie, index) => (
                                    <MovieCard2 movie={movie} index={index} />
                                ))}
                            </div>
                        ) : (
                            <div className="ms-no-results">
                                <p>No movies found matching your search criteria.</p>
                                <button
                                    onClick={resetFiltersAndSearch}
                                    className="ms-reset-search-button"  >
                                    Reset Search
                                </button>
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