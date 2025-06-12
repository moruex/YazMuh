// src/components/News/NewsTable.tsx

import React from 'react';
import { Edit, Trash2, Eye, Calendar } from "lucide-react";
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Tooltip,
    TablePagination,
    Box,
    Typography,
    Skeleton,
} from '@mui/material';
import { Image as ImageIcon } from '@mui/icons-material';
import type { ApiNewsArticle } from '../../interfaces';

interface NewsTableProps {
    news: ApiNewsArticle[] | null;
    loading: boolean;
    error?: Error;
    onEdit: (newsItem: ApiNewsArticle) => void;
    onView: (newsItem: ApiNewsArticle) => void;
    onDelete: (id: string) => void;
    onPublish?: (id: string) => void;
    // Pagination Props
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

// Helper to determine if an article is effectively a draft
const isDraft = (published_at: string | null | undefined): boolean => {
    if (!published_at) return true; // No publish date means it's a draft
    // Optionally, consider future dates as drafts/scheduled if needed
    // const পাবলিশDate = new Date(published_at);
    // if (publishDate.getTime() > Date.now()) return true; // Future date
    return false;
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
    onPublish,
    count,
    page,
    rowsPerPage,
    onPageChange,
    onRowsPerPageChange,
}: NewsTableProps) => {

    const columns = 5; // Image, Title, Author, Date, Actions (Status column removed)

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
                        {/* <TableCell sx={{ width: '10%' }}>Status</TableCell> Removed Status Column */}
                        <TableCell sx={{ width: '20%' }}>Author</TableCell>
                        <TableCell sx={{ width: '20%' }}>Published</TableCell>
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
                                        {item.featured_image_url ? (
                                            <img
                                                src={item.featured_image_url} alt={item.title}
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
                                    <Tooltip title={item.excerpt ?? ''} placement="top-start">
                                        <Typography variant="body2" fontWeight="medium" noWrap>
                                            {item.title}
                                        </Typography>
                                    </Tooltip>
                                </TableCell>
                                {/* Status Cell Removed
                                <TableCell>
                                    <Chip
                                        label={item.status}
                                        color={
                                            item.status === 'PUBLISHED' ? 'success' :
                                            item.status === 'DRAFT' ? 'default' :
                                            'error'
                                        }
                                        size="small"
                                    />
                                </TableCell>
                                */}
                                <TableCell>
                                    <Typography variant="body2" color="text.secondary">
                                        {item.author?.username ?? 'System'}
                                    </Typography>
                                </TableCell>
                                <TableCell>{formatTableDate(item.published_at)}</TableCell>
                                <TableCell align="center" sx={{ padding: '0' }}>
                                    <div className="main-action-buttons">
                                        <button
                                            onClick={() => { onView(item); }}
                                            className="main-btn main-btn-icon info"
                                            title="View Article"
                                        >
                                            <Eye size={16} />
                                        </button>
                                        {isDraft(item.published_at) && onPublish && (
                                            <button
                                                onClick={() => { onPublish(item.id); }}
                                                className="main-btn main-btn-icon success"
                                                title="Publish Article"
                                            >
                                                <Calendar size={16} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => { onEdit(item); }}
                                            className="main-btn main-btn-icon rename"
                                            title="Edit Article"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => { onDelete(item.id); }}
                                            className="main-btn main-btn-icon delete"
                                            title="Delete Article"
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