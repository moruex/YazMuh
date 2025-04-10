// src/pages/Admin/NewsPage.tsx

import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { useQuery, useMutation, ApolloError } from '@apollo/client';
import { debounce } from 'lodash';
import {
    Box, Button, Alert
} from '@mui/material';
import { Add } from '@mui/icons-material';

// Import updated components and GraphQL operations
import { GET_NEWS_LIST, CREATE_NEWS, UPDATE_NEWS, DELETE_NEWS } from '../../graphql'; // Adjust path
import type { ApiNews, NewsInputData } from '../../interfaces'; // Adjust path
import { NewsTable } from './NewsTable';
import { AddEditNewsModal } from './AddEditNewsModal';
import { ViewNewsModal } from './ViewNewsModal';
import { ApiAdmin } from '@interfaces/index';
import { AuthContext } from '@pages/app/App';
import { Search } from 'lucide-react';

// Define types for query data and variables
interface NewsQueryData {
    newsList: ApiNews[];
    newsCount: number;
}

interface NewsQueryVars {
    limit: number;
    offset: number;
    search?: string | null;
    movieId?: string | null; // Keep if filtering by movie is needed elsewhere
}

export const NewsPage = () => {
    // --- State ---
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

    const [openAddModal, setOpenAddModal] = useState(false);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [openViewModal, setOpenViewModal] = useState(false);
    const [currentNews, setCurrentNews] = useState<ApiNews | null>(null); // Use ApiNews type

    const [mutationLoading, setMutationLoading] = useState(false);
    const [mutationError, setMutationError] = useState<ApolloError | null>(null); // Specific state for mutation errors
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false, message: '', severity: 'success'
    });

    // --- Auth Context ---
    // Explicitly type the context value if possible, using ApiAdmin from interfaces
    // const auth = useContext<{ admin: ApiAdmin | null }>(AuthContext as any); // Unused variable

    // --- Apollo Query ---
    const queryVariables = useMemo(() => ({
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        search: debouncedSearchTerm.trim() || null,
        // movieId: null, // Set if needed
    }), [rowsPerPage, page, debouncedSearchTerm]);

    const { data, loading: queryLoading, error: queryError, refetch } = useQuery<
        NewsQueryData,
        NewsQueryVars
    >(GET_NEWS_LIST, {
        variables: queryVariables,
        fetchPolicy: 'cache-and-network',
        notifyOnNetworkStatusChange: true,
    });

    // --- Apollo Mutations ---
    const [createNews] = useMutation(CREATE_NEWS);
    const [updateNews] = useMutation(UPDATE_NEWS);
    // Ensure DELETE_NEWS hook is correct based on updated mutation definition
    const [deleteNews] = useMutation<{ deleteNews: boolean }, { id: string }>(DELETE_NEWS);


    // --- Debounce Search ---
    const debouncedSearch = useCallback(
        debounce((term: string) => {
            setPage(0); // Reset page on new search
            setDebouncedSearchTerm(term);
        }, 500),
        []
    );

    useEffect(() => {
        debouncedSearch(searchTerm);
        return () => { debouncedSearch.cancel(); };
    }, [searchTerm, debouncedSearch]);

    // --- Handlers ---
    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    const handlePageChange = (_event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleOpenAddModal = () => {
        setCurrentNews(null); // Clear current item
        setOpenAddModal(true);
        setMutationError(null); // Clear previous errors
    };

    const handleOpenEditModal = (newsItem: ApiNews) => {
        setCurrentNews(newsItem);
        setOpenEditModal(true);
        setMutationError(null);
    };

    const handleOpenViewModal = (newsItem: ApiNews) => {
        setCurrentNews(newsItem);
        setOpenViewModal(true);
    };

    const handleCloseModals = () => {
        setOpenAddModal(false);
        setOpenEditModal(false);
        setOpenViewModal(false);
        // Delay clearing currentNews slightly if needed for modal close animation
        // setTimeout(() => setCurrentNews(null), 150);
    };

    /* // Unused function
    const handleCloseSnackbar = (reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar({ ...snackbar, open: false });
    };
    */

    // Submit Handler for Add/Edit
    const handleSubmit = async (formData: NewsInputData) => {
        setMutationLoading(true);
        setMutationError(null);
        const mode = openAddModal ? 'add' : 'edit'; // Determine mode inside handler

        try {
            if (mode === 'add') {
                await createNews({
                    variables: { input: formData },
                    refetchQueries: [{ query: GET_NEWS_LIST, variables: queryVariables }],
                    // update(cache, { data }) { ... } // Optional cache update
                });
                setSnackbar({ open: true, message: 'News article created successfully!', severity: 'success' });
            } else if (mode === 'edit' && currentNews) {
                await updateNews({
                    variables: { id: currentNews.id, input: formData },
                    refetchQueries: [{ query: GET_NEWS_LIST, variables: queryVariables }],
                    // update(cache, { data }) { ... } // Optional cache update
                });
                setSnackbar({ open: true, message: 'News article updated successfully!', severity: 'success' });
            }
            handleCloseModals();
        } catch (err) {
            console.error("Mutation error:", err);
            const apolloError = err as ApolloError;
            setMutationError(apolloError); // Store error for potential display in modal
            setSnackbar({ open: true, message: `Error: ${apolloError.message}`, severity: 'error' });
        } finally {
            setMutationLoading(false);
        }
    };


    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this news article? This action cannot be undone.")) {
            return;
        }
        // Use a specific loading state or the general one
        setMutationLoading(true);
        setMutationError(null);
        try {
            const { data: deleteData } = await deleteNews({
                variables: { id },
                refetchQueries: [{ query: GET_NEWS_LIST, variables: queryVariables }],
                // Optimistic update or cache modification can be complex with pagination
            });
            // Check backend response if it indicates success/failure differently
            if (deleteData?.deleteNews) {
                setSnackbar({ open: true, message: 'News article deleted successfully!', severity: 'success' });
                // Optionally adjust page number if the last item on a page was deleted
                if (data?.newsList.length === 1 && page > 0) {
                    setPage(page - 1);
                } else {
                    refetch(); // Refetch might still be needed if pagination logic isn't handled perfectly
                }
            } else {
                // Handle case where mutation succeeded but returned false (e.g., not found)
                setSnackbar({ open: true, message: 'Failed to delete news article (maybe not found).', severity: 'error' });
            }
        } catch (err) {
            console.error("Delete error:", err);
            const apolloError = err as ApolloError;
            setMutationError(apolloError);
            setSnackbar({ open: true, message: `Error deleting news: ${apolloError.message}`, severity: 'error' });
        } finally {
            setMutationLoading(false);
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            {/* Toolbar */}
            <div className="main-toolbar">
                {/* Search Bar */}
                <div className="main-search-bar">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search movies..."
                        onChange={handleSearchChange}
                    />
                </div>
                <div style={{flex: 1}}></div>

                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Add />}
                    onClick={handleOpenAddModal}
                    disabled={queryLoading || mutationLoading}
                    className="add-button"
                >
                    Add Article
                </Button>
            </div>

            {queryError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    Failed to load news: {queryError.message}
                </Alert>
            )}
            {mutationError && !snackbar.open && ( // Show persistent mutation error if snackbar isn't shown
                <Alert severity="error" sx={{ mb: 2 }}>
                    Operation failed: {mutationError.message}
                </Alert>
            )}


            {/* Table */}
            <NewsTable
                news={data?.newsList ?? null}
                loading={queryLoading && !data?.newsList?.length} // Show skeleton only on initial/empty load
                error={queryError}
                onEdit={handleOpenEditModal}
                onView={handleOpenViewModal}
                onDelete={handleDelete}
                // Pagination Props
                count={data?.newsCount ?? 0}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            />

            {/* Modals */}
            {(openAddModal || openEditModal) && ( // Conditionally render AddEdit modal
                <AddEditNewsModal
                    mode={openAddModal ? 'add' : 'edit'}
                    open={openAddModal || openEditModal}
                    onClose={handleCloseModals}
                    onSubmit={handleSubmit}
                    isLoading={mutationLoading}
                    news={currentNews} // Pass only in edit mode
                />
            )}

            {openViewModal && currentNews && ( // Conditionally render View modal
                <ViewNewsModal
                    isOpen={openViewModal}
                    onClose={handleCloseModals}
                    news={currentNews}
                />
            )}
        </Box>
    );
};