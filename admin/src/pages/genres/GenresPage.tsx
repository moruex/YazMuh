import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, ApolloError } from '@apollo/client';
import { debounce } from 'lodash';
import {
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  Typography,
  Alert,
  Box,
  Snackbar,
} from '@mui/material';
import { Add } from '@mui/icons-material';

import { GenreTable } from '@pages/genres/GenreTable';
import { AddEditGenreModal } from '@pages/genres/AddEditGenreModal';
import { GET_GENRES, CREATE_GENRE, UPDATE_GENRE, DELETE_GENRE } from '@graphql/index';
import type { ApiGenreCore, GenreInputData } from '@interfaces/index';
import { Search } from 'lucide-react';

type FilterType = 'all' | 'genres' | 'collections';

// Typings for GraphQL results (replace with generated types if possible)
interface GenresQueryData {
  genres: ApiGenreCore[];
  genreCount: number;
}
interface GenresQueryVars {
  limit: number;
  offset: number;
  search?: string;
}

export const GenresPage = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterType>('all');

  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [currentGenre, setCurrentGenre] = useState<ApiGenreCore | null>(null);

  const [mutationLoading, setMutationLoading] = useState(false);
  const [mutationError, setMutationError] = useState<ApolloError | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success'
  });

  const queryVariables = useMemo(() => ({
    limit: rowsPerPage,
    offset: page * rowsPerPage,
    search: debouncedSearchTerm.trim() || null,
    isCollection: filterType === 'collections' ? true : filterType === 'genres' ? false : null,
  }), [rowsPerPage, page, debouncedSearchTerm, filterType]);

  const { data, loading: queryLoading, error: queryError, refetch } = useQuery<
    GenresQueryData,
    GenresQueryVars
  >(GET_GENRES, {
    variables: queryVariables,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const [createGenre] = useMutation(CREATE_GENRE);
  const [updateGenre] = useMutation(UPDATE_GENRE);
  const [deleteGenre] = useMutation(DELETE_GENRE);

  const debouncedSearch = useCallback(
    debounce((term: string) => {
      setPage(0);
      setDebouncedSearchTerm(term);
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, debouncedSearch]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleFilterChange = (
    event: React.MouseEvent<HTMLElement>,
    newFilter: FilterType | null,
  ) => {
    if (newFilter !== null) {
      setPage(0);
      setFilterType(newFilter);
    }
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenAddModal = () => {
    setCurrentGenre(null);
    setOpenAddModal(true);
    setMutationError(null);
  };

  const handleOpenEditModal = (genre: ApiGenreCore) => {
    setCurrentGenre(genre);
    setOpenEditModal(true);
    setMutationError(null);
  };

  const handleCloseModals = () => {
    setOpenAddModal(false);
    setOpenEditModal(false);
  };

  const handleSubmit = async (formData: GenreInputData) => {
    setMutationLoading(true);
    setMutationError(null);
    try {
      if (mode === 'add') {
        await createGenre({
          variables: { input: formData },
          refetchQueries: [{ query: GET_GENRES, variables: queryVariables }],
        });
        setSnackbar({ open: true, message: 'Genre created successfully!', severity: 'success' });
      } else if (mode === 'edit' && currentGenre) {
        await updateGenre({
          variables: { id: currentGenre.id, input: formData },
          refetchQueries: [{ query: GET_GENRES, variables: queryVariables }],
        });
        setSnackbar({ open: true, message: 'Genre updated successfully!', severity: 'success' });
      }
      handleCloseModals();
    } catch (err) {
      console.error("Mutation error:", err);
      setMutationError(err as ApolloError);
      setSnackbar({ open: true, message: `Error: ${err.message}`, severity: 'error' });
    } finally {
      setMutationLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete this genre? This action cannot be undone.`)) {
      return;
    }

    setMutationLoading(true);
    setMutationError(null);
    try {
      await deleteGenre({
        variables: { id },
        refetchQueries: [{ query: GET_GENRES, variables: queryVariables }],
      });
      setSnackbar({ open: true, message: 'Genre deleted successfully!', severity: 'success' });
    } catch (err) {
      console.error("Delete error:", err);
      setMutationError(err as ApolloError);
      setSnackbar({ open: true, message: `Error deleting genre: ${err.message}`, severity: 'error' });
    } finally {
      setMutationLoading(false);
    }
  };

  const mode = openAddModal ? 'add' : openEditModal ? 'edit' : undefined;

  return (
    <div className="genre-management-container">
      <div className="genre-toolbar">
        {/* Search Bar */}
        <div className="genre-search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search movies..."
            onChange={handleSearchChange}
          />
        </div>

        <ToggleButtonGroup
          color="primary"
          value={filterType}
          exclusive
          onChange={handleFilterChange}
          aria-label="Filter genres or collections"
          size="small"
          className="filter-buttons"
        >
          <ToggleButton className='genre-toggle-button' value="all">All</ToggleButton>
          <ToggleButton className='genre-toggle-button' value="genres">Genres</ToggleButton>
          <ToggleButton className='genre-toggle-button' value="collections">Collections</ToggleButton>
        </ToggleButtonGroup>

        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={handleOpenAddModal}
          disabled={queryLoading || mutationLoading}
          className="add-button"
        >
          Add Genre
        </Button>
      </div>

      {queryError && (
        <Alert severity="error" className="error-alert">
          Failed to load genres: {queryError.message}
        </Alert>
      )}

      <GenreTable
        genres={data?.genres ?? null}
        loading={queryLoading && !data?.genres?.length}
        error={queryError}
        onEdit={handleOpenEditModal}
        onDelete={handleDelete}
        count={data?.genreCount ?? 0}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />

      {(openAddModal || openEditModal) && mode && (
        <AddEditGenreModal
          mode={mode}
          open={openAddModal || openEditModal}
          onClose={handleCloseModals}
          onSubmit={handleSubmit}
          isLoading={mutationLoading}
          genre={currentGenre}
        />
      )}
    </div>
  );
};