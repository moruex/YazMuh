// --- START OF FILE ActorsPage.tsx ---
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client";
import {
  Button,
  CircularProgress,
  Box,
  Typography,
  TablePagination,
  Alert,
  Paper,
  Avatar,
  Grid,
  Divider
} from "@mui/material";
import { Add, Edit, Delete, Cake, PersonOutline } from "@mui/icons-material";
import { GET_PERSONS } from "@src/graphql/queries/person.queries";
import { CREATE_PERSON, UPDATE_PERSON, DELETE_PERSON } from "@src/graphql/mutations/person.mutations";
import { AddEditActorsModal } from "./AddEditActorsModal";
import { ApiPersonCore, CreatePersonInput, UpdatePersonInput } from "@interfaces/person.interfaces";
import { useAuth } from "@contexts/AuthContext";
import { Search } from "lucide-react";
import { debounce } from 'lodash';
import "./Actors.css";

// Helper to format date string for display
const formatDisplayDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    } catch {
        return 'Invalid Date';
    }
};

const ROWS_PER_PAGE_OPTIONS = [8, 16, 24, 32]; // Better grid-friendly numbers

// Types for GraphQL results
interface PeopleQueryData {
  people: ApiPersonCore[];
  peopleCount: number;
}

interface PeopleQueryVars {
  limit: number;
  offset: number;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}

export const ActorsPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPerson, setCurrentPerson] = useState<ApiPersonCore | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[1]); // Default to 16
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationLoading, setMutationLoading] = useState(false);

  const { admin } = useAuth();

  // Debounce search input
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

  // Query variables
  const queryVariables = useMemo<PeopleQueryVars>(() => ({
    limit: rowsPerPage,
    offset: page * rowsPerPage,
    search: debouncedSearchTerm || undefined,
  }), [rowsPerPage, page, debouncedSearchTerm]);

  // --- Data Fetching ---
  const { data, loading: queryLoading, error: queryError, refetch } = useQuery<PeopleQueryData, PeopleQueryVars>(
    GET_PERSONS,
    {
      variables: queryVariables,
      fetchPolicy: 'cache-and-network',
      notifyOnNetworkStatusChange: true,
    }
  );

  // --- Mutations ---
  const [createPerson] = useMutation(CREATE_PERSON, {
    onCompleted: () => {
      setMutationLoading(false);
      setModalOpen(false);
      setCurrentPerson(null);
      refetch();
    },
    onError: (error) => {
      console.error("Create mutation failed:", error);
      setMutationLoading(false);
      setMutationError(`Failed to create person: ${error.message}`);
    },
  });

  const [updatePerson] = useMutation(UPDATE_PERSON, {
    onCompleted: () => {
      setMutationLoading(false);
      setModalOpen(false);
      setCurrentPerson(null);
      refetch();
    },
    onError: (error) => {
      console.error("Update mutation failed:", error);
      setMutationLoading(false);
      setMutationError(`Failed to update person: ${error.message}`);
    },
  });

  const [deletePerson] = useMutation(DELETE_PERSON, {
    onCompleted: (data) => {
      if (data.deletePerson) {
        console.log("Person deleted successfully");
        refetch();
      } else {
        setMutationError("Failed to delete person. It might have been already removed.");
      }
      setMutationLoading(false);
    },
    onError: (error) => {
      console.error("Delete mutation failed:", error);
      setMutationLoading(false);
      setMutationError(`Failed to delete person: ${error.message}`);
    },
  });

  // --- Event Handlers ---
  const handleOpenAddModal = () => {
    setCurrentPerson(null);
    setMutationError(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (person: ApiPersonCore) => {
    setCurrentPerson(person);
    setMutationError(null);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setCurrentPerson(null);
  };

  const handleModalSubmit = (formData: CreatePersonInput | UpdatePersonInput) => {
    if (!admin?.id) {
      setMutationError("You need to be logged in as an admin to perform this action");
      return;
    }

    setMutationLoading(true);
    setMutationError(null);

    if (currentPerson) {
      // Update existing person
      updatePerson({ 
        variables: { 
          performingAdminId: admin.id,
          id: currentPerson.id, 
          input: formData 
        } 
      });
    } else {
      // Create new person
      createPerson({ 
        variables: { 
          performingAdminId: admin.id,
          input: formData 
        } 
      });
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (!admin?.id) {
      setMutationError("You need to be logged in as an admin to delete a person");
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      setMutationLoading(true);
      setMutationError(null);
      deletePerson({ 
        variables: { 
          performingAdminId: admin.id,
          id 
        } 
      });
    }
  };

  const handlePageChange = (_event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // --- Render Logic ---
  const isLoading = queryLoading || mutationLoading;
  const people = data?.people || [];
  const totalCount = data?.peopleCount || 0;

  return (
    <Box className="actors-container">
       {/* Header: Search and Add Button */}
       <div className="main-toolbar">
        {/* Search Bar */}
        <div className="main-search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search actors..."
            onChange={handleSearchChange}
            value={searchTerm}
          />
        </div>
        <div style={{flex: 1}}></div>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={handleOpenAddModal}
          disabled={isLoading || !admin?.id}
          className="add-button"
        >
          Add Actor
        </Button>
      </div>

       {/* Loading/Error States */}
      {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}
      {queryError && <Alert severity="error">Error loading people: {queryError.message}</Alert>}
      {mutationError && <Alert severity="warning" onClose={() => setMutationError(null)} sx={{ mb: 2 }}>{mutationError}</Alert>}

      {/* People Grid/List */}
      {!isLoading && !queryError && (
        <>
          <Grid container spacing={2}>
            {people.length > 0 ? (
              people.map(person => (
                <Grid item key={person.id} xs={12} sm={6} md={4} lg={3} xl={2.4}>
                  <Paper elevation={1} className="actor-card">
                     <Box className="actor-avatar">
                        <Avatar
                          src={person.profile_image_url ?? undefined}
                          alt={person.name}
                          sx={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 0 }}
                          variant="square"
                        >
                          {person.name.charAt(0)}
                        </Avatar>
                     </Box>
                    <Box className="actor-content">
                        <Typography variant="h6" component="h3" className="actor-name">
                            {person.name}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                          <Cake fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
                          <Typography variant="body2" color="text.secondary">
                              {formatDisplayDate(person.birthday)}
                          </Typography>
                        </Box>
                        
                        {person.biography && (
                            <Typography variant="body2" color="text.secondary" className="actor-bio">
                               {person.biography}
                            </Typography>
                         )}

                         <Divider sx={{ my: 1.5 }} />

                         {/* Actions */}
                        <Box className="actor-actions">
                            <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                startIcon={<Edit />}
                                onClick={() => handleOpenEditModal(person)}
                                disabled={isLoading}
                            >
                                Edit
                            </Button>
                            <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<Delete />}
                                onClick={() => handleDelete(person.id, person.name)}
                                disabled={isLoading}
                            >
                                Delete
                            </Button>
                        </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                 <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: 4 
                 }}>
                    <PersonOutline sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                    <Typography sx={{ textAlign: 'center', color: 'text.secondary' }}>
                       No actors found matching your criteria.
                    </Typography>
                 </Box>
              </Grid>
            )}
          </Grid>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            className="main-pagination"
          />
        </>
      )}

      {/* Modal */}
      <AddEditActorsModal
        open={modalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        isLoading={mutationLoading}
        person={currentPerson}
      />
    </Box>
  );
};
// --- END OF FILE ActorsPage.tsx ---