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
  ADD_GENRE_TO_MOVIE,
  ADD_CAST_MEMBER,
  ADD_CREW_MEMBER,
  REMOVE_GENRE_FROM_MOVIE,
  REMOVE_CAST_MEMBER,
  REMOVE_CREW_MEMBER,
} from "@graphql/index";
import { Movie, ApiMovieCore, ApiMovieDetail, CreateMovieInput, UpdateMovieInput } from "@interfaces/index";
import { ApolloError } from '@apollo/client';
import { useAuth } from '@contexts/AuthContext';

// --- Notification System ---
const useNotification = () => {
  return (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    console.log(`NOTIFICATION [${severity.toUpperCase()}]: ${message}`);
  };
};

// Transform API Core data to frontend Movie interface
const transformApiMovie = (apiMovie: ApiMovieCore): Movie => ({
  id: apiMovie.id,
  title: apiMovie.title,
  imageUrl: apiMovie.poster_url || '',
  description: apiMovie.plot_summary || '',
  genres: apiMovie.genres?.map(g => g.name) || [],
  rating: apiMovie.movieq_rating || 0,
  releaseDate: apiMovie.release_date || '',
  duration: apiMovie.duration_minutes || 0,
  movieqRating: apiMovie.movieq_rating || 0,
  imdbRating: apiMovie.imdb_rating || 0,
  letterboxdRating: apiMovie.letterboxd_rating || 0,
  trailerUrl: apiMovie.trailer_url || '',
  directors: [],
  actors: [],
  shortDescription: ''
});

// Transform API Detail data to frontend Movie interface
const transformDetailApiMovie = (apiMovie: ApiMovieDetail): Movie => {
  // Extract directors and actors from crew/cast
  let directors: string[] = [];
  let actors: string[] = [];
  let directorIds: string[] = [];
  let actorIds: string[] = [];
  
  // Handle new schema with nullable cast/crew
  if (apiMovie.crew && Array.isArray(apiMovie.crew)) {
    // Extract directors and their IDs
    const directorEntries = apiMovie.crew
      .filter(c => c?.job?.toLowerCase() === 'director' && c.person);
    
    directors = directorEntries
      .map(c => c.person?.name || 'Unknown Director');
    
    directorIds = directorEntries
      .map(c => c.person?.id || '');
  }
  
  if (apiMovie.cast && Array.isArray(apiMovie.cast)) {
    // Extract actors and their IDs
    actors = apiMovie.cast
      .filter(c => c?.person)
      .map(c => c.person?.name || 'Unknown Actor');
    
    actorIds = apiMovie.cast
      .filter(c => c?.person)
      .map(c => c.person?.id || '');
  }

  // Get all genres and genre IDs
  const genres = apiMovie.genres?.map(g => g.name) || [];
  const genreIds = apiMovie.genres?.map(g => g.id) || [];
  
  return {
    id: apiMovie.id,
    title: apiMovie.title,
    imageUrl: apiMovie.poster_url || '',
    description: apiMovie.plot_summary || '',
    directors,
    actors,
    genres,
    rating: apiMovie.movieq_rating || 0,
    releaseDate: apiMovie.release_date || '',
    duration: apiMovie.duration_minutes || 0,
    movieqRating: apiMovie.movieq_rating || 0,
    imdbRating: apiMovie.imdb_rating || 0,
    letterboxdRating: apiMovie.letterboxd_rating || 0,
    trailerUrl: apiMovie.trailer_url || '',
    shortDescription: apiMovie.plot_summary ? apiMovie.plot_summary.substring(0, 100) + '...' : '',
    selectedGenreIds: genreIds,
    selectedActorIds: actorIds,
    selectedDirectorIds: directorIds,
    status: 'RELEASED',
    originalTitle: ''
  };
};

// Transform frontend Movie data to API CreateMovieInput
const transformToCreateInput = (movieData: Omit<Movie, 'id'>): CreateMovieInput => ({
  title: movieData.title,
  overview: movieData.description,
  release_date: movieData.releaseDate,
  runtime: movieData.duration,
  poster_path: movieData.imageUrl,
  trailer_url: movieData.trailerUrl,
  movieq_rating: movieData.movieqRating,
  imdb_rating: movieData.imdbRating,
  letterboxd_rating: movieData.letterboxdRating
});

// Transform frontend Movie data to API UpdateMovieInput
const transformToUpdateInput = (movieData: Partial<Movie>): UpdateMovieInput => ({
  title: movieData.title,
  overview: movieData.description,
  release_date: movieData.releaseDate,
  runtime: movieData.duration,
  poster_path: movieData.imageUrl,
  trailer_url: movieData.trailerUrl,
  movieq_rating: movieData.movieqRating,
  imdb_rating: movieData.imdbRating,
  letterboxd_rating: movieData.letterboxdRating
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
  
  // Refs to store IDs for after movie creation/update
  const addedMovieGenreIds = React.useRef<string[]>([]);
  const updatedMovieGenreIds = React.useRef<string[]>([]);
  const addedMovieActorIds = React.useRef<string[]>([]);
  const updatedMovieActorIds = React.useRef<string[]>([]);
  const addedMovieDirectorIds = React.useRef<string[]>([]);
  const updatedMovieDirectorIds = React.useRef<string[]>([]);

  const addNotification = useNotification();
  const { admin } = useAuth();

  // Memoized query variables
  const queryVariables = useMemo(() => ({
    limit: pagination.rowsPerPage,
    offset: pagination.page * pagination.rowsPerPage,
    search: searchTerm || undefined,
    sortBy: "RELEASE_DATE_DESC" // Using schema enum value
  }), [pagination.rowsPerPage, pagination.page, searchTerm]);

  // --- GraphQL Queries ---
  const { loading: listLoading, data: listData, refetch } = useQuery(GET_MOVIES, {
    variables: queryVariables,
    notifyOnNetworkStatusChange: true,
    fetchPolicy: "cache-and-network",
    onError: (err) => {
      addNotification(`Error fetching movies: ${err.message}`, 'error');
      console.error("List Error:", err);
    }
  });

  const [getMovieDetail, { loading: detailLoading }] = useLazyQuery(GET_MOVIE, {
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
    onError: (err: ApolloError) => {
      addNotification(`Operation failed: ${err.message}`, 'error');
    }
  };

  const [createMovieMutation, { loading: createLoading }] = useMutation(CREATE_MOVIE, {
    ...commonMutationOptions,
    onCompleted: (data) => {
      addNotification(`Movie "${data.createMovie?.title}" created successfully!`, 'success');
      
      // After creating a movie, add associations if any were selected
      if (data.createMovie?.id) {
        // Add genres
        if (addedMovieGenreIds.current?.length > 0) {
          addGenresToMovie(data.createMovie.id, addedMovieGenreIds.current);
        }
        
        // Add actors
        if (addedMovieActorIds.current?.length > 0) {
          addActorsToMovie(data.createMovie.id, addedMovieActorIds.current);
        }
        
        // Add directors
        if (addedMovieDirectorIds.current?.length > 0) {
          addDirectorsToMovie(data.createMovie.id, addedMovieDirectorIds.current);
        }
      }
      
      refetch();
      closeModal('add');
    }
  });

  const [updateMovieMutation, { loading: updateLoading }] = useMutation(UPDATE_MOVIE, {
    ...commonMutationOptions,
    onCompleted: (data) => {
      addNotification(`Movie "${data.updateMovie?.title}" updated successfully!`, 'success');
      
      // After updating a movie, add/update associations if any were selected
      if (data.updateMovie?.id) {
        // Add/update genres
        if (updatedMovieGenreIds.current?.length > 0) {
          addGenresToMovie(data.updateMovie.id, updatedMovieGenreIds.current);
        }
        
        // Add/update actors
        if (updatedMovieActorIds.current?.length > 0) {
          addActorsToMovie(data.updateMovie.id, updatedMovieActorIds.current);
        }
        
        // Add/update directors
        if (updatedMovieDirectorIds.current?.length > 0) {
          addDirectorsToMovie(data.updateMovie.id, updatedMovieDirectorIds.current);
        }
      }
      
      refetch();
      closeModal('edit');
    }
  });
  
  const [addGenreToMovieMutation, { loading: addGenreLoading }] = useMutation(ADD_GENRE_TO_MOVIE, {
    ...commonMutationOptions,
    onCompleted: (data) => {
      console.log('Genre added successfully to movie:', data);
    }
  });
  
  const [addCastMemberMutation, { loading: addCastLoading }] = useMutation(ADD_CAST_MEMBER, {
    ...commonMutationOptions,
    onCompleted: (data) => {
      console.log('Actor added successfully to movie:', data);
    }
  });
  
  const [addCrewMemberMutation, { loading: addCrewLoading }] = useMutation(ADD_CREW_MEMBER, {
    ...commonMutationOptions,
    onCompleted: (data) => {
      console.log('Director added successfully to movie:', data);
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

  // Create mutations for removing relationships
  const [removeGenreFromMovieMutation] = useMutation(REMOVE_GENRE_FROM_MOVIE, {
    ...commonMutationOptions,
    onCompleted: (data) => {
      console.log('Genre removed successfully from movie', data);
    }
  });
  
  const [removeCastMemberMutation] = useMutation(REMOVE_CAST_MEMBER, {
    ...commonMutationOptions,
    onCompleted: (data) => {
      console.log('Actor removed successfully from movie', data);
    }
  });
  
  const [removeCrewMemberMutation] = useMutation(REMOVE_CREW_MEMBER, {
    ...commonMutationOptions,
    onCompleted: (data) => {
      console.log('Director removed successfully from movie', data);
    }
  });

  // --- Loading States ---
  const isMutationLoading = createLoading || updateLoading || deleteLoading || addGenreLoading || addCastLoading || addCrewLoading;
  const showLoadingIndicator = listLoading && !listData;
  
  // Helper function to add genres to a movie
  const addGenresToMovie = async (movieId: string, genreIds: string[]) => {
    if (!admin?.id) {
      addNotification("You must be logged in as an admin to perform this action.", "error");
      return;
    }
    
    if (!genreIds || genreIds.length === 0) {
      return;
    }
    
    try {
      // Add genres sequentially to avoid race conditions
      for (const genreId of genreIds) {
        await addGenreToMovieMutation({
          variables: {
            performingAdminId: admin.id,
            movieId,
            genreId
          }
        });
      }
      addNotification("Genres added to movie successfully.", "success");
    } catch (error) {
      console.error("Error adding genres to movie:", error);
      addNotification("Failed to add some genres to the movie.", "error");
    }
  };
  
  // Helper function to update genres for a movie (add new ones, remove deselected ones)
  const updateGenresForMovie = async (movieId: string, newGenreIds: string[]) => {
    if (!admin?.id || !currentMovie?.selectedGenreIds) {
      addNotification("Missing admin ID or current movie data.", "error");
      return;
    }
    
    try {
      // Find genres to remove (in current but not in new selection)
      const genresToRemove = currentMovie.selectedGenreIds.filter(
        id => !newGenreIds.includes(id)
      );
      
      // Find genres to add (in new but not in current selection)
      const genresToAdd = newGenreIds.filter(
        id => !currentMovie.selectedGenreIds?.includes(id)
      );
      
      // Remove genres that were deselected
      for (const genreId of genresToRemove) {
        await removeGenreFromMovieMutation({
          variables: {
            performingAdminId: admin.id,
            movieId,
            genreId
          }
        });
      }
      
      // Add new genres that were selected
      for (const genreId of genresToAdd) {
        await addGenreToMovieMutation({
          variables: {
            performingAdminId: admin.id,
            movieId,
            genreId
          }
        });
      }
      
      if (genresToRemove.length > 0 || genresToAdd.length > 0) {
        addNotification("Movie genres updated successfully.", "success");
      }
    } catch (error) {
      console.error("Error updating genres for movie:", error);
      addNotification("Failed to update some genres for the movie.", "error");
    }
  };
  
  // Helper function to add actors to a movie
  const addActorsToMovie = async (movieId: string, actorIds: string[]) => {
    if (!admin?.id) {
      addNotification("You must be logged in as an admin to perform this action.", "error");
      return;
    }
    
    if (!actorIds || actorIds.length === 0) {
      return;
    }
    
    try {
      // Add actors sequentially to avoid race conditions
      for (let i = 0; i < actorIds.length; i++) {
        await addCastMemberMutation({
          variables: {
            performingAdminId: admin.id,
            movieId,
            personId: actorIds[i],
            castOrder: i + 1 // Order based on array position
          }
        });
      }
      addNotification("Actors added to movie successfully.", "success");
    } catch (error) {
      console.error("Error adding actors to movie:", error);
      addNotification("Failed to add some actors to the movie.", "error");
    }
  };
  
  // Helper function to update actors for a movie (add new ones, remove deselected ones)
  const updateActorsForMovie = async (movieId: string, newActorIds: string[]) => {
    if (!admin?.id || !currentMovie?.selectedActorIds) {
      addNotification("Missing admin ID or current movie data.", "error");
      return;
    }
    
    try {
      // Find actors to remove (in current but not in new selection)
      const actorsToRemove = currentMovie.selectedActorIds.filter(
        id => !newActorIds.includes(id)
      );
      
      // Find actors to add (in new but not in current selection)
      const actorsToAdd = newActorIds.filter(
        id => !currentMovie.selectedActorIds?.includes(id)
      );
      
      // Remove actors that were deselected
      for (const personId of actorsToRemove) {
        await removeCastMemberMutation({
          variables: {
            performingAdminId: admin.id,
            movieId,
            personId
          }
        });
      }
      
      // Add new actors with ordering based on their position
      let castOrder = 1;
      for (const personId of newActorIds) {
        // Only add actors that weren't already there
        if (actorsToAdd.includes(personId)) {
          await addCastMemberMutation({
            variables: {
              performingAdminId: admin.id,
              movieId,
              personId,
              castOrder: castOrder
            }
          });
        }
        castOrder++;
      }
      
      if (actorsToRemove.length > 0 || actorsToAdd.length > 0) {
        addNotification("Movie actors updated successfully.", "success");
      }
    } catch (error) {
      console.error("Error updating actors for movie:", error);
      addNotification("Failed to update some actors for the movie.", "error");
    }
  };
  
  // Helper function to add directors to a movie
  const addDirectorsToMovie = async (movieId: string, directorIds: string[]) => {
    if (!admin?.id) {
      addNotification("You must be logged in as an admin to perform this action.", "error");
      return;
    }
    
    if (!directorIds || directorIds.length === 0) {
      return;
    }
    
    try {
      // Add directors sequentially to avoid race conditions
      for (const directorId of directorIds) {
        await addCrewMemberMutation({
          variables: {
            performingAdminId: admin.id,
            movieId,
            personId: directorId,
            job: "Director",
            department: "Directing"
          }
        });
      }
      addNotification("Directors added to movie successfully.", "success");
    } catch (error) {
      console.error("Error adding directors to movie:", error);
      addNotification("Failed to add some directors to the movie.", "error");
    }
  };
  
  // Helper function to update directors for a movie (add new ones, remove deselected ones)
  const updateDirectorsForMovie = async (movieId: string, newDirectorIds: string[]) => {
    if (!admin?.id || !currentMovie?.selectedDirectorIds) {
      addNotification("Missing admin ID or current movie data.", "error");
      return;
    }
    
    try {
      // Find directors to remove (in current but not in new selection)
      const directorsToRemove = currentMovie.selectedDirectorIds.filter(
        id => !newDirectorIds.includes(id)
      );
      
      // Find directors to add (in new but not in current selection)
      const directorsToAdd = newDirectorIds.filter(
        id => !currentMovie.selectedDirectorIds?.includes(id)
      );
      
      // Remove directors that were deselected
      for (const personId of directorsToRemove) {
        await removeCrewMemberMutation({
          variables: {
            performingAdminId: admin.id,
            movieId,
            personId
          }
        });
      }
      
      // Add new directors
      for (const personId of directorsToAdd) {
        await addCrewMemberMutation({
          variables: {
            performingAdminId: admin.id,
            movieId,
            personId,
            job: "Director",
            department: "Directing"
          }
        });
      }
      
      if (directorsToRemove.length > 0 || directorsToAdd.length > 0) {
        addNotification("Movie directors updated successfully.", "success");
      }
    } catch (error) {
      console.error("Error updating directors for movie:", error);
      addNotification("Failed to update some directors for the movie.", "error");
    }
  };

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
    if (!admin?.id) {
      addNotification("You must be logged in as an admin to perform this action.", "error");
      return;
    }

    if (modals.add) {
      // Save genre IDs for creation
      addedMovieGenreIds.current = movieData.selectedGenreIds || [];
      addedMovieActorIds.current = movieData.selectedActorIds || [];
      addedMovieDirectorIds.current = movieData.selectedDirectorIds || [];
      
      const createInput = transformToCreateInput(movieData);
      await createMovieMutation({ 
        variables: { 
          performingAdminId: admin.id,
          input: createInput 
        } 
      });
    } else if (modals.edit && currentMovie) {
      // Store the new relationship IDs
      updatedMovieGenreIds.current = movieData.selectedGenreIds || [];
      updatedMovieActorIds.current = movieData.selectedActorIds || [];
      updatedMovieDirectorIds.current = movieData.selectedDirectorIds || [];
      
      // Update movie basic information first
      const updateInput = transformToUpdateInput({
        ...currentMovie,
        ...movieData
      });
      
      const result = await updateMovieMutation({ 
        variables: { 
          performingAdminId: admin.id,
          id: currentMovie.id, 
          input: updateInput 
        } 
      });
      
      if (result.data?.updateMovie?.id) {
        const movieId = result.data.updateMovie.id;
        
        // Update relationships (add new ones and remove deselected ones)
        await updateGenresForMovie(movieId, movieData.selectedGenreIds || []);
        await updateActorsForMovie(movieId, movieData.selectedActorIds || []);
        await updateDirectorsForMovie(movieId, movieData.selectedDirectorIds || []);
        
        // Refetch movie list after all updates
        refetch();
        closeModal('edit');
      }
    }
  }, [modals.add, modals.edit, currentMovie, createMovieMutation, updateMovieMutation, admin, addNotification]);

  const handleDelete = useCallback(async (id: string) => {
    if (!admin?.id) {
      addNotification("You must be logged in as an admin to perform this action.", "error");
      return;
    }

    if (window.confirm("Are you sure you want to delete this movie? This action cannot be undone.")) {
      await deleteMovieMutation({ 
        variables: { 
          performingAdminId: admin.id,
          id 
        } 
      });
    }
  }, [deleteMovieMutation, admin]);

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
          disabled={listLoading || isMutationLoading || detailLoading || !admin?.id}
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