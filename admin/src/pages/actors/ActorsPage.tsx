// --- START OF FILE ActorsPage.tsx ---
import React, { useState, useMemo } from "react";
import { useQuery, useMutation, ApolloError } from "@apollo/client";
import {
  Button,
  TextField, // Use TextField for search input
  CircularProgress,
  Box, // For layout
  Typography, // For messages
  TablePagination, // Import pagination component
  Alert, // For displaying errors
  Paper, // For card background
  Avatar, // For person image
  Grid // For layout
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material"; // Use icons consistently
import { GET_PERSONS, GET_PERSON_COUNT } from "@src/graphql/queries/person.queries"; // Adjust import path
import { CREATE_PERSON, UPDATE_PERSON, DELETE_PERSON } from "@src/graphql/mutations/person.mutations"; // Adjust import path
import { AddEditActorsModal } from "./AddEditActorsModal";
import { ApiPersonCore } from "@interfaces/index";
import { PersonInput } from "@interfaces/person.interfaces";
import { Search } from "lucide-react";

// Helper to format date string for display
const formatDisplayDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString(undefined, { // Use user's locale
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    } catch {
        return 'Invalid Date';
    }
};

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50];

export const ActorsPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPerson, setCurrentPerson] = useState<ApiPersonCore | null>(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[1]); // Default to 10
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [mutationLoading, setMutationLoading] = useState(false);

  // Debounce search input
  const debouncedSetSearch = useMemo(
    () => debounce((value: string) => setDebouncedSearchTerm(value), 500),
    [] // Create the debounced function only once
  );

  // --- Data Fetching ---
  const { data: personsData, loading: loadingPersons, error: personsError, refetch: refetchPersons } = useQuery<{ persons: ApiPersonCore[] }>(
    GET_PERSONS,
    {
      variables: {
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        search: debouncedSearchTerm || null, // Send null if empty string
      },
      fetchPolicy: 'cache-and-network', // Good for lists that might change
      onError: (err) => console.error("Error fetching persons:", err),
    }
  );

  const { data: countData, loading: loadingCount, error: countError } = useQuery<{ personCount: number }>(
      GET_PERSON_COUNT,
      {
          variables: {
              search: debouncedSearchTerm || null,
          },
          fetchPolicy: 'cache-and-network',
          onError: (err) => console.error("Error fetching person count:", err),
      }
  );

  const totalPersonsCount = countData?.personCount ?? 0;

  // --- Mutations ---
  const handleMutationCompleted = () => {
    setMutationLoading(false);
    setModalOpen(false);
    setCurrentPerson(null);
    setMutationError(null);
    refetchPersons(); // Refetch the list after mutation
  };

  const handleMutationError = (error: ApolloError) => {
      console.error("Mutation failed:", error);
      setMutationLoading(false);
      setMutationError(`Operation failed: ${error.message}`);
      // Keep modal open on error so user can retry or cancel
  };

  const [createPerson] = useMutation(CREATE_PERSON, {
    onCompleted: handleMutationCompleted,
    onError: handleMutationError,
  });

  const [updatePerson] = useMutation(UPDATE_PERSON, {
    onCompleted: handleMutationCompleted,
    onError: handleMutationError,
     // Example of updating cache directly (more advanced, refetch is simpler)
    // update(cache, { data: { updatePerson: updatedPersonData } }) {
    //   cache.modify({
    //     fields: {
    //       persons(existingPersons = []) {
    //         // Find and update the person in the cache
    //       }
    //     }
    //   });
    // }
  });

  const [deletePerson] = useMutation(DELETE_PERSON, {
    onCompleted: (data) => {
        if (data.deletePerson) { // Check the boolean result
             // Optional: Add a success notification here
             console.log("Person deleted successfully");
             refetchPersons(); // Refetch list
         } else {
             console.error("Failed to delete person (not found or backend error).");
             setMutationError("Failed to delete the person. It might have been already removed.");
         }
         setMutationLoading(false);
    },
    onError: handleMutationError, // Handles network/GraphQL errors
     // Refetch relevant queries after deletion
    refetchQueries: [
        { query: GET_PERSONS, variables: { limit: rowsPerPage, offset: page * rowsPerPage, search: debouncedSearchTerm || null } },
        { query: GET_PERSON_COUNT, variables: { search: debouncedSearchTerm || null } }
    ],
    awaitRefetchQueries: true, // Wait for refetch before setting loading false
  });

  // --- Event Handlers ---
  const handleOpenAddModal = () => {
    setCurrentPerson(null);
    setMutationError(null); // Clear previous errors
    setModalOpen(true);
  };

  const handleOpenEditModal = (person: ApiPersonCore) => {
    setCurrentPerson(person);
    setMutationError(null); // Clear previous errors
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setCurrentPerson(null);
     // Don't clear mutation error on close, user might want to see it
  };

  // Modal Submit Handler (called by modal's onSubmit prop)
  const handleModalSubmit = (data: PersonInput, id?: string) => {
    setMutationLoading(true);
    setMutationError(null);
    if (id) {
      // Update existing person
      updatePerson({ variables: { id, input: data } });
    } else {
      // Create new person
      createPerson({ variables: { input: data } });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      setMutationLoading(true); // Indicate loading state for delete
      setMutationError(null);
      deletePerson({ variables: { id } });
      // Loading state will be reset in onCompleted/onError
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Go back to first page when changing rows per page
  };

  // --- Render Logic ---
  const isLoading = loadingPersons || loadingCount || mutationLoading; // Combined loading state

  return (
    <Box sx={{ padding: 3 }}> {/* Use Box for padding */}
       {/* Header: Search and Add Button */}
       <div className="main-toolbar">
        {/* Search Bar */}
        <div className="main-search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search movies..."
            onChange={debouncedSetSearch}
          />
        </div>
        <div style={{flex: 1}}></div>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={handleOpenAddModal}
          className="add-button"
        >
          Add Person
        </Button>
      </div>

       {/* Loading/Error States */}
      {isLoading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}
      {personsError && <Alert severity="error">Error loading people: {personsError.message}</Alert>}
      {countError && <Alert severity="error">Error loading count: {countError.message}</Alert>}
      {mutationError && <Alert severity="warning" onClose={() => setMutationError(null)} sx={{ mb: 2 }}>{mutationError}</Alert>}

      {/* People Grid/List */}
      {!isLoading && !personsError && (
        <>
          <Grid container spacing={3}>
            {personsData?.persons && personsData.persons.length > 0 ? (
              personsData.persons.map(person => (
                <Grid item key={person.id} xs={12} sm={6} md={4} lg={3}>
                  <Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                     <Avatar
                        src={person.profile_image_url ?? undefined} // Use Avatar for image
                        alt={person.name}
                        sx={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: '4px 4px 0 0' }} // Adjust styling
                        variant="square" // Use square variant for top card image
                      >
                        {/* Fallback if no image */}
                        {person.name.charAt(0)}
                      </Avatar>
                    <Box sx={{ padding: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}> {/* Content area */}
                        <Typography variant="h6" component="h3" gutterBottom noWrap>
                            {person.name}
                        </Typography>
                        {/* REMOVED Type Chip */}

                        <Box sx={{ mb: 1 }}> {/* Info section */}
                            <Typography variant="body2">
                                <strong>Born:</strong> {formatDisplayDate(person.birth_date)}
                            </Typography>
                            {/* REMOVED deathDate, nationality */}
                            {person.bio && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxHeight: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                   <strong>Bio:</strong> {person.bio}
                                </Typography>
                             )}
                        </Box>

                        {/* REMOVED Notable Works */}

                         {/* Actions */}
                        <Box sx={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end', gap: 1, pt: 1 }}>
                            <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                startIcon={<Edit />}
                                onClick={() => handleOpenEditModal(person)}
                                disabled={mutationLoading} // Disable while any mutation is running
                            >
                                Edit
                            </Button>
                            <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<Delete />}
                                onClick={() => handleDelete(person.id, person.name)}
                                disabled={mutationLoading} // Disable while any mutation is running
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
                 <Typography sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
                    No people found matching your criteria.
                 </Typography>
              </Grid>
            )}
          </Grid>

          {/* Pagination */}
          <TablePagination
            rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
            component="div"
            count={totalPersonsCount}
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
        isLoading={mutationLoading} // Pass only mutation loading state to modal
        person={currentPerson}
      />
    </Box>
  );
};
// --- END OF FILE ActorsPage.tsx ---