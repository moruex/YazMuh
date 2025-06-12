// src/pages/recommendations/CategorySection.tsx
import React from 'react';
import { Box, Typography, Button, Checkbox, Grid, Card, CardMedia, CardContent, IconButton, Tooltip } from '@mui/material';
import { Delete, PlaylistAddCheck, PlaylistRemove, Visibility, Add, ExpandMore, ExpandLess, PlaylistAdd } from '@mui/icons-material';
// Use API types
import type { ApiRecommendationSection } from '@interfaces/recommendation.interfaces';
import type { ApiMovieCore } from '@interfaces/movie.interfaces';

interface CategorySectionProps {
    // Updated props matching RecommendationsPage
    section: ApiRecommendationSection;
    selectedMovies: ApiMovieCore[];
    loadedMoviesCount: number;
    areAllSelected: boolean;
    disabled?: boolean;
    onAddMovie: () => void;
    onDeleteMovie: (movie: ApiMovieCore) => void;
    onDeleteSelected: () => void;
    onViewDetails: () => void;
    onToggleSelect: (movie: ApiMovieCore) => void;
    onToggleSelectAll: () => void;
    onShowLess: () => void;
    onLoadMore: () => void;
    onLoadAll: () => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({
    section,
    selectedMovies,
    loadedMoviesCount,
    areAllSelected,
    disabled = false,
    onAddMovie,
    onDeleteMovie,
    onDeleteSelected,
    onViewDetails,
    onToggleSelect,
    onToggleSelectAll,
    onShowLess,
    onLoadMore,
    onLoadAll,
}) => {
    const moviesToShow = section.movies.slice(0, loadedMoviesCount);
    const hasMoreMovies = loadedMoviesCount < section.movieCount;
    const hasLessMovies = loadedMoviesCount > 5;
    const hasMovies = section.movies.length > 0;

    return (
        <Box className="category-section" sx={{ mb: 4, p: 3, border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: 2, boxShadow: 1 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 'medium' }}>
                        {section.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {section.section_type} • {section.movieCount} movies
                    </Typography>
                </Box>
                <Button 
                    variant="contained" 
                    color="primary"
                    onClick={onAddMovie}
                    startIcon={<Add />}
                    disabled={disabled}
                >
                    Add Movies
                </Button>
            </Box>

            {section.description && (
                <Typography variant="body1" sx={{ mb: 2 }}>
                    {section.description}
                </Typography>
            )}

            {/* Bulk Actions */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Button
                    variant="outlined"
                    color={areAllSelected ? "secondary" : "primary"}
                    startIcon={areAllSelected ? <PlaylistRemove /> : <PlaylistAddCheck />}
                    onClick={onToggleSelectAll}
                    disabled={!hasMovies || disabled}
                    size="small"
                >
                    {areAllSelected ? "Deselect All" : "Select All"}
                </Button>
                <Button
                    variant="outlined"
                    color="primary"
                    onClick={onViewDetails}
                    disabled={selectedMovies.length === 0 || disabled}
                    startIcon={<Visibility />}
                    size="small"
                >
                    View Selected ({selectedMovies.length})
                </Button>
                <Button
                    variant="outlined"
                    color="error"
                    onClick={onDeleteSelected}
                    disabled={selectedMovies.length === 0 || disabled}
                    startIcon={<Delete />}
                    size="small"
                >
                    Remove Selected
                </Button>
            </Box>

            {/* Movie Grid */}
            {hasMovies ? (
                <Grid container spacing={2}>
                    {moviesToShow.map(movie => (
                        <Grid item key={movie.id} xs={6} sm={4} md={3} lg={2}>
                            <Card 
                                sx={{ 
                                    position: 'relative',
                                    transition: 'all 0.2s',
                                    border: selectedMovies.some(m => m.id === movie.id) 
                                        ? '2px solid #3f51b5' 
                                        : '2px solid transparent',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 3
                                    }
                                }}
                            >
                                <Checkbox
                                    checked={selectedMovies.some(m => m.id === movie.id)}
                                    onChange={() => onToggleSelect(movie)}
                                    sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        zIndex: 1,
                                        m: 0.5,
                                        bgcolor: 'rgba(255,255,255,0.7)',
                                        borderRadius: '50%',
                                        '&:hover': {
                                            bgcolor: 'rgba(255,255,255,0.9)',
                                        }
                                    }}
                                    disabled={disabled}
                                />
                                <Box sx={{ position: 'relative' }} onClick={() => onToggleSelect(movie)}>
                                    <CardMedia
                                        component="img"
                                        height="160"
                                        image={movie.poster_url || '/placeholder-poster.jpg'}
                                        alt={movie.title}
                                        sx={{ cursor: 'pointer' }}
                                    />
                                    <IconButton
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDeleteMovie(movie);
                                        }}
                                        disabled={disabled}
                                        sx={{
                                            position: 'absolute',
                                            top: 0,
                                            right: 0,
                                            m: 0.5,
                                            bgcolor: 'rgba(255,255,255,0.7)',
                                            '&:hover': {
                                                bgcolor: 'rgba(255,255,255,0.9)',
                                                color: 'error.main'
                                            }
                                        }}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </Box>
                                <CardContent sx={{ p: 1.5, pb: '8px !important' }}>
                                    <Tooltip title={movie.title}>
                                        <Typography 
                                            variant="body2" 
                                            component="div" 
                                            sx={{ 
                                                fontWeight: 'medium',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                lineHeight: 1.2,
                                                height: '2.4em'
                                            }}
                                        >
                                            {movie.title}
                                        </Typography>
                                    </Tooltip>
                                    {movie.release_date && (
                                        <Typography variant="caption" color="text.secondary">
                                            {new Date(movie.release_date).getFullYear()}
                                        </Typography>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            ) : (
                <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                        No movies in this section yet
                    </Typography>
                    <Button 
                        variant="outlined" 
                        startIcon={<PlaylistAdd />} 
                        onClick={onAddMovie}
                        sx={{ mt: 1 }}
                        disabled={disabled}
                    >
                        Add your first movie
                    </Button>
                </Box>
            )}

            {/* Footer Pagination Controls */}
            {hasMovies && (
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                    {hasLessMovies && (
                        <Button 
                            onClick={onShowLess} 
                            variant="outlined" 
                            size="small"
                            startIcon={<ExpandLess />}
                            disabled={disabled}
                        >
                            Show Less
                        </Button>
                    )}
                    {hasMoreMovies && (
                        <Button 
                            onClick={onLoadMore} 
                            variant="outlined" 
                            size="small"
                            startIcon={<ExpandMore />}
                            disabled={disabled}
                        >
                            Load More
                        </Button>
                    )}
                    {hasMoreMovies && (
                        <Button 
                            onClick={onLoadAll} 
                            variant="outlined" 
                            size="small"
                            disabled={disabled}
                        >
                            Load All ({section.movieCount})
                        </Button>
                    )}
                </Box>
            )}
        </Box>
    );
};

export default CategorySection;