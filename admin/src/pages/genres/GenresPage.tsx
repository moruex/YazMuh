import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { debounce } from 'lodash';
import {
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
} from '@mui/material';
import { Add } from '@mui/icons-material';

import { GenreTable } from '@pages/genres/GenreTable';
import { AddEditGenreModal } from '@pages/genres/AddEditGenreModal';
import { GET_GENRES, CREATE_GENRE, UPDATE_GENRE, DELETE_GENRE } from '@graphql/index';
import { useAuth } from '@contexts/AuthContext';
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

  const { admin, isLoading: authLoading } = useAuth();

  const queryVariables = useMemo(() => {
    const trimmedSearch = debouncedSearchTerm.trim();
    return {
      limit: rowsPerPage,
      offset: page * rowsPerPage,
      search: trimmedSearch ? trimmedSearch : undefined,
      isCollection: filterType === 'collections' ? true : filterType === 'genres' ? false : null,
    };
  }, [rowsPerPage, page, debouncedSearchTerm, filterType]);

  const { data, loading: queryLoading, error: queryError } = useQuery<
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
    _event: React.MouseEvent<HTMLElement>,
    newFilter: FilterType | null,
  ) => {
    if (newFilter !== null) {
      setPage(0);
      setFilterType(newFilter);
    }
  };

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenAddModal = () => {
    setCurrentGenre(null);
    setOpenAddModal(true);
  };

  const handleOpenEditModal = (genre: ApiGenreCore) => {
    setCurrentGenre(genre);
    setOpenEditModal(true);
  };

  const handleCloseModals = () => {
    setOpenAddModal(false);
    setOpenEditModal(false);
  };

  const handleSubmit = async (formData: GenreInputData) => {
    setMutationLoading(true);
    const mode = openAddModal ? 'add' : openEditModal ? 'edit' : undefined;
    
    if (!admin?.id) {
      alert("You need to be logged in as an admin to perform this action");
      setMutationLoading(false);
      return;
    }

    try {
      if (mode === 'add') {
        await createGenre({
          variables: { performingAdminId: admin.id, input: formData },
          refetchQueries: [{ query: GET_GENRES, variables: queryVariables }],
        });
        console.log('Genre created successfully!');
      } else if (mode === 'edit' && currentGenre) {
        await updateGenre({
          variables: { performingAdminId: admin.id, id: currentGenre.id, input: formData },
          refetchQueries: [{ query: GET_GENRES, variables: queryVariables }],
        });
        console.log('Genre updated successfully!');
      }
      handleCloseModals();
    } catch (err) {
      console.error("Mutation error:", err);
      let errorMessage = 'An unknown error occurred during mutation.';
      if (err instanceof Error) {
        errorMessage = `Error: ${err.message}`;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      alert(errorMessage);
    } finally {
      setMutationLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(`Are you sure you want to delete this genre? This action cannot be undone.`)) {
      return;
    }
    
    if (!admin?.id) {
      alert("You need to be logged in as an admin to delete a genre");
      return;
    }

    setMutationLoading(true);
    try {
      const { data: deleteData, errors } = await deleteGenre({
        variables: { performingAdminId: admin.id, id },
        refetchQueries: [{ query: GET_GENRES, variables: queryVariables }],
      });

      if (errors) {
        console.error("Delete error response:", errors);
        throw new Error(errors.map(e => e.message).join(', '));
      }

      if (deleteData && deleteData.deleteGenre === true) {
        console.log('Genre deleted successfully!');
      } else {
        console.warn('Genre deletion may not have been successful or returned an unexpected value.', deleteData);
        alert('Genre deletion failed or returned an unexpected status.');
      }
    } catch (err) {
      console.error("Delete error:", err);
      let errorMessage = 'An unknown error occurred during deletion.';
      if (err instanceof Error) {
        errorMessage = `Error deleting genre: ${err.message}`;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      alert(errorMessage);
    } finally {
      setMutationLoading(false);
    }
  };

  const mode = openAddModal ? 'add' : openEditModal ? 'edit' : undefined;

  if (authLoading) {
    return <div>Loading authentication state...</div>;
  }

  return (
    <div className="genre-management-container">
      <div className="genre-toolbar">
        {/* Search Bar */}
        <div className="genre-search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search genres..."
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
          disabled={queryLoading || mutationLoading || !admin?.id}
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