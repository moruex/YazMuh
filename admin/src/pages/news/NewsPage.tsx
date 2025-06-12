// src/pages/Admin/NewsPage.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, ApolloError } from '@apollo/client';
import { debounce } from 'lodash';
import {
    Box, Button, Alert
} from '@mui/material';
import { Add } from '@mui/icons-material';

// Import updated components and GraphQL operations
import { 
    GET_NEWS_ARTICLES, 
    CREATE_NEWS_ARTICLE, 
    UPDATE_NEWS_ARTICLE, 
    DELETE_NEWS_ARTICLE,
    PUBLISH_NEWS_ARTICLE 
} from '../../graphql';
import type { ApiNewsArticle, CreateNewsArticleInput, UpdateNewsArticleInput } from '../../interfaces';
import { NewsTable } from './NewsTable';
import { AddEditNewsModal } from './AddEditNewsModal';
import { ViewNewsModal } from './ViewNewsModal';
import { Search } from 'lucide-react';
import { useAuth } from '@contexts/AuthContext';

// Define types for query data and variables
interface NewsQueryData {
    newsArticles: ApiNewsArticle[];
    newsArticleCount: number;
}

interface NewsQueryVars {
    limit: number;
    offset: number;
    search?: string;
    status?: string;
    categoryId?: string;
    authorId?: string;
    tag?: string;
    sortBy?: string;
    sortOrder?: string;
}

export const NewsPage = () => {
    // --- State ---
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [status, setStatus] = useState<string | undefined>(undefined);

    const [openAddModal, setOpenAddModal] = useState(false);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [openViewModal, setOpenViewModal] = useState(false);
    const [currentNews, setCurrentNews] = useState<ApiNewsArticle | null>(null);

    const [mutationLoading, setMutationLoading] = useState(false);
    const [mutationError, setMutationError] = useState<ApolloError | null>(null);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false, message: '', severity: 'success'
    });

    const { admin } = useAuth();

    // --- Apollo Query ---
    const queryVariables = useMemo(() => ({
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        search: debouncedSearchTerm.trim() || undefined,
        status: status,
        sortBy: "published_at",
        sortOrder: "DESC"
    }), [rowsPerPage, page, debouncedSearchTerm, status]);

    const { data, loading: queryLoading, error: queryError, refetch } = useQuery<
        NewsQueryData,
        NewsQueryVars
    >(GET_NEWS_ARTICLES, {
        variables: queryVariables,
        fetchPolicy: 'cache-and-network',
        notifyOnNetworkStatusChange: true,
    });

    // --- Apollo Mutations ---
    const [createNewsArticle] = useMutation(CREATE_NEWS_ARTICLE);
    const [updateNewsArticle] = useMutation(UPDATE_NEWS_ARTICLE);
    const [deleteNewsArticle] = useMutation(DELETE_NEWS_ARTICLE);
    const [publishNewsArticle] = useMutation(PUBLISH_NEWS_ARTICLE);

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
        setStatus("");
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

    const handleOpenEditModal = (newsItem: ApiNewsArticle) => {
        setCurrentNews(newsItem);
        setOpenEditModal(true);
        setMutationError(null);
    };

    const handleOpenViewModal = (newsItem: ApiNewsArticle) => {
        setCurrentNews(newsItem);
        setOpenViewModal(true);
    };

    const handleCloseModals = () => {
        setOpenAddModal(false);
        setOpenEditModal(false);
        setOpenViewModal(false);
    };

    // const handleCloseSnackbar = () => {
    //     setSnackbar({ ...snackbar, open: false });
    // };

    // Submit Handler for Add/Edit
    const handleSubmit = async (formData: CreateNewsArticleInput | UpdateNewsArticleInput) => {
        if (!admin?.id) {
            setSnackbar({ 
                open: true, 
                message: 'You must be logged in as an admin to perform this action', 
                severity: 'error' 
            });
            return;
        }

        setMutationLoading(true);
        setMutationError(null);
        const mode = openAddModal ? 'add' : 'edit';

        try {
            if (mode === 'add') {
                const createInput = formData as CreateNewsArticleInput;
                await createNewsArticle({
                    variables: { 
                        performingAdminId: admin.id,
                        input: createInput
                    },
                    refetchQueries: [{ query: GET_NEWS_ARTICLES, variables: queryVariables }],
                });
                setSnackbar({ open: true, message: 'News article created successfully!', severity: 'success' });
            } else if (mode === 'edit' && currentNews) {
                const updateInput = formData as UpdateNewsArticleInput;
                await updateNewsArticle({
                    variables: { 
                        performingAdminId: admin.id,
                        id: currentNews.id, 
                        input: updateInput 
                    },
                    refetchQueries: [{ query: GET_NEWS_ARTICLES, variables: queryVariables }],
                });
                setSnackbar({ open: true, message: 'News article updated successfully!', severity: 'success' });
            }
            handleCloseModals();
        } catch (err) {
            console.error("Mutation error:", err);
            const apolloError = err as ApolloError;
            setMutationError(apolloError);
            setSnackbar({ open: true, message: `Error: ${apolloError.message}`, severity: 'error' });
        } finally {
            setMutationLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!admin?.id) {
            setSnackbar({ 
                open: true, 
                message: 'You must be logged in as an admin to delete articles', 
                severity: 'error' 
            });
            return;
        }

        if (!window.confirm("Are you sure you want to delete this news article? This action cannot be undone.")) {
            return;
        }
        
        setMutationLoading(true);
        setMutationError(null);
        try {
            const { data: deleteData } = await deleteNewsArticle({
                variables: { 
                    performingAdminId: admin.id,
                    id 
                },
                refetchQueries: [{ query: GET_NEWS_ARTICLES, variables: queryVariables }],
            });
            
            if (deleteData?.deleteNewsArticle) {
                setSnackbar({ open: true, message: 'News article deleted successfully!', severity: 'success' });
                // Optionally adjust page number if the last item on a page was deleted
                if (data?.newsArticles.length === 1 && page > 0) {
                    setPage(page - 1);
                } else {
                    refetch();
                }
            } else {
                setSnackbar({ open: true, message: 'Failed to delete news article.', severity: 'error' });
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

    const handlePublish = async (id: string) => {
        if (!admin?.id) {
            setSnackbar({ 
                open: true, 
                message: 'You must be logged in as an admin to publish articles', 
                severity: 'error' 
            });
            return;
        }

        setMutationLoading(true);
        try {
            await publishNewsArticle({
                variables: { 
                    performingAdminId: admin.id,
                    id
                },
                refetchQueries: [{ query: GET_NEWS_ARTICLES, variables: queryVariables }],
            });
            setSnackbar({ open: true, message: 'News article published successfully!', severity: 'success' });
        } catch (err) {
            console.error("Publish error:", err);
            const apolloError = err as ApolloError;
            setSnackbar({ open: true, message: `Error publishing: ${apolloError.message}`, severity: 'error' });
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
                        placeholder="Search news articles..."
                        onChange={handleSearchChange}
                    />
                </div>
                <div style={{flex: 1}}></div>

                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Add />}
                    onClick={handleOpenAddModal}
                    disabled={queryLoading || mutationLoading || !admin?.id}
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
            {mutationError && !snackbar.open && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    Operation failed: {mutationError.message}
                </Alert>
            )}

            {/* Table */}
            <NewsTable
                news={data?.newsArticles ?? null}
                loading={queryLoading && !data?.newsArticles?.length}
                error={queryError}
                onEdit={handleOpenEditModal}
                onView={handleOpenViewModal}
                onDelete={handleDelete}
                onPublish={handlePublish}
                // Pagination Props
                count={data?.newsArticleCount ?? 0}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            />

            {/* Modals */}
            {(openAddModal || openEditModal) && (
                <AddEditNewsModal
                    mode={openAddModal ? 'add' : 'edit'}
                    open={openAddModal || openEditModal}
                    onClose={handleCloseModals}
                    onSubmit={handleSubmit}
                    isLoading={mutationLoading}
                    news={currentNews}
                />
            )}

            {openViewModal && currentNews && (
                <ViewNewsModal
                    isOpen={openViewModal}
                    onClose={handleCloseModals}
                    news={currentNews}
                />
            )}
        </Box>
    );
};