// src/components/News/NewsTable.tsx

import React from 'react';
import { Edit, Trash2, Image as ImageIcon, Eye } from "lucide-react"; // Use Eye for View
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    IconButton, Box, Typography, TablePagination, Skeleton, Tooltip, Chip
} from '@mui/material';
// Use interface matching GraphQL schema
import type { ApiNews } from '../../interfaces';

interface NewsTableProps {
    news: ApiNews[] | null; // Can be null initially
    loading: boolean;
    error?: Error; // Optional error display
    onEdit: (newsItem: ApiNews) => void;
    onView: (newsItem: ApiNews) => void;
    onDelete: (id: string) => void; // ID is string
    // --- MUI Pagination Props ---
    count: number;
    page: number;
    rowsPerPage: number;
    onPageChange: (event: unknown, newPage: number) => void;
    onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

// Helper to format date for table display (shorter format)
const formatTableDate = (isoString: string | null | undefined): string => {
    if (!isoString) return '-';
    try {
        return new Date(isoString).toLocaleDateString(); // Just the date part
    } catch (e) {
        return 'Invalid Date';
    }
};

// Skeleton Row Helper
const SkeletonRow = ({ columns }: { columns: number }) => (
    <TableRow>
        <TableCell colSpan={columns}>
            <Skeleton animation="wave" height={60} />
        </TableCell>
    </TableRow>
);

export const NewsTable = ({
    news,
    loading,
    error,
    onEdit,
    onView,
    onDelete,
    count,
    page,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
}: NewsTableProps) => {

    const columns = 5; // Image, Title, Author, Date, Actions

    if (error) {
        return <Typography color="error">Error loading news: {error.message}</Typography>;
    }

    return (
        <TableContainer className='main-table1-container'>
            <Table className='main-table1' stickyHeader aria-label="news table" size="small">
                <TableHead>
                    <TableRow>
                        <TableCell sx={{ width: '80px' }}></TableCell> {/* Image */}
                        <TableCell>Title</TableCell>
                        <TableCell sx={{ width: '15%' }}>Author</TableCell>
                        <TableCell sx={{ width: '15%' }}>Published</TableCell>
                        {/* Removed Source column */}
                        <TableCell align="center" sx={{ width: '120px' }}>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {loading && !news?.length ? (
                        Array.from(new Array(rowsPerPage)).map((_, index) => (
                            <SkeletonRow key={`skel-${index}`} columns={columns} />
                        ))
                    ) : !loading && !news?.length ? (
                        <TableRow>
                            <TableCell colSpan={columns} align="center">
                                No news articles found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        news?.map((item) => (
                            <TableRow hover key={item.id}>
                                <TableCell sx={{ padding: '4px' }}>
                                    <Box
                                        width={80}
                                        height={120}
                                    >
                                        {item.image_url ? (
                                            <img
                                                src={item.image_url} alt={item.title}
                                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                                loading="lazy"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                        ) : (
                                            <ImageIcon fontSize="small" color="disabled" />
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell component="th" scope="row">
                                    <Tooltip title={item.short_content ?? ''} placement="top-start">
                                        <Typography variant="body2" fontWeight="medium" noWrap>
                                            {item.title}
                                        </Typography>
                                    </Tooltip>
                                    {/* Optional: Show linked movies as chips */}
                                    {/* <Box sx={{mt: 0.5}}>
                                              {item.movies?.slice(0, 2).map(m => <Chip key={m.id} label={m.title} size="small" sx={{mr:0.5}}/>)}
                                              {item.movies && item.movies.length > 2 && <Chip label="..." size="small"/>}
                                          </Box> */}
                                </TableCell>
                                <TableCell>
                                    {/* Display author username or 'System' */}
                                    <Typography variant="body2" color="text.secondary">
                                        {item.author?.username ?? 'System'}
                                    </Typography>
                                </TableCell>
                                <TableCell>{formatTableDate(item.published_at)}</TableCell>
                                {/* Removed Source Cell */}
                                <TableCell align="center" sx={{ padding: '0' }}>
                                    <div className="main-action-buttons">
                                        <button
                                            onClick={() => { onView(item); }}
                                            className="main-btn main-btn-icon info"
                                            title="View Article"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        <button
                                            onClick={() => { onEdit(item); }}
                                            className="main-btn main-btn-icon rename"
                                            title="Edit Movie"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => { onDelete(item.id); }}
                                            className="main-btn main-btn-icon delete"
                                            title="Delete Movie"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
            {/* --- MUI Pagination --- */}
            <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={count}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={onPageChange}
                    onRowsPerPageChange={onRowsPerPageChange}
                    className="main-pagination"
                />
        </TableContainer>
    );
};