// src/components/MoviesPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Search } from "lucide-react";
import { Add } from "@mui/icons-material";
import { MovieTable } from "./MovieTable";
import { ViewMovieModal } from "./ViewMovieModal";
import { AddEditMovieModal } from "./AddEditMovieModal";
import { Button, CircularProgress, Box } from "@mui/material";
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';
import {
  CREATE_MOVIE,
  DELETE_MOVIE,
  GET_MOVIES,
  GET_MOVIE,
  UPDATE_MOVIE,
} from "@graphql/index";
import { Movie, MovieInputData, ApiMovieCore, ApiMovieDetail, RoleType, ApiPersonCore } from "@interfaces/index";

// --- Notification System ---
const useNotification = () => {
  return (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    console.log(`NOTIFICATION [${severity.toUpperCase()}]: ${message}`);
  };
};

// Transform API Core data to frontend Movie interface
const transformApiMovie = (apiMovie: ApiMovieCore): Movie => ({
  id: apiMovie.id,
  title: apiMovie.title || 'Untitled',
  imageUrl: apiMovie.poster_url || '/placeholder.png',
  trailerUrl: undefined,
  description: '',
  shortDescription: '',
  genres: apiMovie.genres?.map(g => g.name) || [],
  directors: [],
  actors: [],
  rating: apiMovie.avg_rating ?? 0,
  releaseDate: apiMovie.release_date || '',
  duration: apiMovie.duration_minutes ?? 0,
});

// Transform API Detail data to frontend Movie interface
const transformDetailApiMovie = (apiMovie: ApiMovieDetail): Movie => {
  const getPersonNamesByRole = (persons: ApiPersonCore[] | undefined | null, role: RoleType): string[] => {
    if (!Array.isArray(persons)) return [];
    return persons
      .map(p => p.name);
  };
  
  const base = transformApiMovie(apiMovie as ApiMovieCore);
  return {
    ...base,
    trailerUrl: apiMovie.trailer_url,
    description: apiMovie.plot_summary || 'No description available.',
    shortDescription: apiMovie.plot_summary ? `${apiMovie.plot_summary.substring(0, 120)}...` : '',
    directors: getPersonNamesByRole(apiMovie.persons, RoleType.DIRECTOR),
    actors: getPersonNamesByRole(apiMovie.persons, RoleType.ACTOR),
  };
};

// Transform frontend Movie data to API Mutation Input
const transformToInputData = (movieData: Omit<Movie, 'id' | 'shortDescription' | 'rating' | 'genres' | 'directors' | 'actors'>): MovieInputData => ({
  title: movieData.title,
  release_date: movieData.releaseDate,
  plot_summary: movieData.description,
  poster_url: movieData.imageUrl,
  duration_minutes: movieData.duration,
  trailer_url: movieData.trailerUrl || null,
});

export const MoviesPage = () => {
  // State hooks - using reducer pattern for related state
  const [movies, setMovies] = useState<Movie[]>([]);
  const [totalMovieCount, setTotalMovieCount] = useState(0);
  const [modals, setModals] = useState({
    add: false,
    edit: false,
    view: false
  });
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: 10
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [detailFetch, setDetailFetch] = useState<{
    id: string | null, 
    mode: 'view' | 'edit' | null
  }>({ id: null, mode: null });

  const addNotification = useNotification();

  // Memoized query variables
  const queryVariables = useMemo(() => ({
    limit: pagination.rowsPerPage,
    offset: pagination.page * pagination.rowsPerPage,
    search: searchTerm || null,
  }), [pagination.rowsPerPage, pagination.page, searchTerm]);

  // --- GraphQL Queries ---
  const { loading: listLoading, error: listError, data: listData, refetch } = useQuery(GET_MOVIES, {
    variables: queryVariables,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network",
    onError: (err) => {
      addNotification(`Error fetching movies: ${err.message}`, 'error');
      console.error("List Error:", err);
    }
  });

  const [getMovieDetail, { loading: detailLoading, error: detailError }] = useLazyQuery(GET_MOVIE, {
    fetchPolicy: "network-only",
    onCompleted: (data) => {
      if (data?.movie) {
        const detailedMovie = transformDetailApiMovie(data.movie);
        setCurrentMovie(detailedMovie);
        
        if (detailFetch.id === data.movie.id) {
          setModals(prev => ({
            ...prev,
            edit: detailFetch.mode === 'edit',
            view: detailFetch.mode === 'view'
          }));
        }
      } else {
        addNotification("Movie details could not be loaded.", 'warning');
      }
      setDetailFetch({ id: null, mode: null });
    },
    onError: (err) => {
      addNotification(`Error fetching movie details: ${err.message}`, 'error');
      setCurrentMovie(null);
      setDetailFetch({ id: null, mode: null });
    }
  });

  // Process movie list data
  useEffect(() => {
    if (listData?.movies) {
      setMovies(listData.movies.map(transformApiMovie));
      setTotalMovieCount(listData.movieCount || 0);
    }
  }, [listData]);

  // --- Mutations ---
  const commonMutationOptions = {
    onError: (err) => {
      addNotification(`Operation failed: ${err.message}`, 'error');
    }
  };

  const [createMovieMutation, { loading: createLoading }] = useMutation(CREATE_MOVIE, {
    ...commonMutationOptions,
    onCompleted: (data) => {
      addNotification(`Movie "${data.createMovie?.title}" created successfully!`, 'success');
      refetch();
      closeModal('add');
    }
  });

  const [updateMovieMutation, { loading: updateLoading }] = useMutation(UPDATE_MOVIE, {
    ...commonMutationOptions,
    onCompleted: (data) => {
      addNotification(`Movie "${data.updateMovie?.title}" core details updated successfully!`, 'success');
      refetch();
      closeModal('edit');
    }
  });

  const [deleteMovieMutation, { loading: deleteLoading }] = useMutation(DELETE_MOVIE, {
    refetchQueries: [{
      query: GET_MOVIES,
      variables: queryVariables
    }],
    onError: commonMutationOptions.onError,
    onCompleted: (data) => {
      if (data?.deleteMovie === true) {
        addNotification('Movie deleted successfully!', 'success');
        
        // Adjust pagination if the last item on a page was deleted
        if (movies.length === 1 && pagination.page > 0) {
          setPagination(prev => ({...prev, page: prev.page - 1}));
        }
      } else {
        addNotification('Failed to delete movie.', 'warning');
      }
    }
  });

  // --- Loading States ---
  const isMutationLoading = createLoading || updateLoading || deleteLoading;
  const showLoadingIndicator = listLoading && !listData;

  // --- Handlers ---
  // Debounced search with cleanup
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value;
    const timeoutId = setTimeout(() => {
      setSearchTerm(term);
      setPagination(prev => ({...prev, page: 0}));
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, []);

  const handleSubmit = useCallback(async (movieData: Omit<Movie, 'id'>) => {
    const inputData = transformToInputData(movieData as Movie);

    if (modals.add) {
      const fullInputForCreate = {
        ...inputData,
        genreNames: movieData.genres,
        directorNames: movieData.directors,
        actorNames: movieData.actors,
      };
      await createMovieMutation({ variables: { input: fullInputForCreate } });
    } else if (modals.edit && currentMovie) {
      addNotification("Saving core movie details. Genre/person changes require separate handling.", "info");
      await updateMovieMutation({ variables: { id: currentMovie.id, input: inputData } });
    }
  }, [modals.add, modals.edit, currentMovie, createMovieMutation, updateMovieMutation, addNotification]);

  const handleDelete = useCallback(async (id: string) => {
    if (window.confirm("Are you sure you want to delete this movie? This action cannot be undone.")) {
      await deleteMovieMutation({ variables: { id } });
    }
  }, [deleteMovieMutation]);

  const fetchMovieDetails = useCallback((id: string, mode: 'view' | 'edit') => {
    setDetailFetch({ id, mode });
    setCurrentMovie(null);
    setModals({ add: false, edit: false, view: false });
    getMovieDetail({ variables: { id } });
  }, [getMovieDetail]);

  const handleView = useCallback((movie: Movie) => {
    fetchMovieDetails(movie.id, 'view');
  }, [fetchMovieDetails]);

  const handleEdit = useCallback((movie: Movie) => {
    fetchMovieDetails(movie.id, 'edit');
  }, [fetchMovieDetails]);

  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({...prev, page: newPage}));
  }, []);

  const handleRowsPerPageChange = useCallback((rows: number) => {
    setPagination({page: 0, rowsPerPage: rows});
  }, []);

  const openModal = useCallback((type: 'add' | 'edit' | 'view') => {
    setModals(prev => ({...prev, [type]: true}));
  }, []);

  const closeModal = useCallback((type: 'add' | 'edit' | 'view') => {
    setModals(prev => ({...prev, [type]: false}));
    if (type !== 'add') {
      setCurrentMovie(null);
      setDetailFetch({ id: null, mode: null });
    }
  }, []);

  return (
    <div className="movies-container">
      {/* Header */}
      <Box className="page-header" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        {/* Search Bar */}
        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search movies..."
            onChange={handleSearchChange}
            disabled={listLoading || isMutationLoading}
          />
        </div>
        {/* Add Button */}
        <Button
          className="btn"
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => openModal('add')}
          disabled={listLoading || isMutationLoading || detailLoading}
        >
          Add Movie
        </Button>
      </Box>

      {/* Loading Indicator */}
      {showLoadingIndicator && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
          <CircularProgress />
        </Box>
      )}

      {/* Table */}
      {!showLoadingIndicator && (
        <MovieTable
          movies={movies}
          onEdit={handleEdit}
          onView={handleView}
          onDelete={handleDelete}
          page={pagination.page}
          rowsPerPage={pagination.rowsPerPage}
          totalCount={totalMovieCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          isLoading={listLoading}
          isDetailLoading={detailLoading}
        />
      )}

      {/* Modals */}
      {modals.add && (
        <AddEditMovieModal
          mode="add"
          open={modals.add}
          onClose={() => closeModal('add')}
          onSubmit={handleSubmit}
          isLoading={createLoading}
        />
      )}
      
      {modals.edit && currentMovie && (
        <AddEditMovieModal
          mode="edit"
          open={modals.edit}
          onClose={() => closeModal('edit')}
          onSubmit={handleSubmit}
          isLoading={updateLoading}
          movie={currentMovie}
        />
      )}
      
      {modals.view && currentMovie && (
        <ViewMovieModal
          isOpen={modals.view}
          onClose={() => closeModal('view')}
          movie={currentMovie}
        />
      )}
    </div>
  );
};