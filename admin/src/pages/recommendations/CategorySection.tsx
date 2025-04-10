// src/pages/recommendations/CategorySection.tsx (Example Structure)
import React from 'react';
// Import necessary MUI components (Box, Typography, Button, Checkbox, Grid, Card, etc.)
import { Box, Typography, Button, Checkbox, Grid, Card, CardMedia, CardContent, IconButton } from '@mui/material';
import { Delete, PlaylistAddCheck, PlaylistRemove, Visibility } from '@mui/icons-material'; // Example icons
// Use API types
import type { ApiRecommendationSection } from '@interfaces/recommendation.interfaces';
import type { ApiMovieCore } from '@interfaces/movie.interfaces';

interface CategorySectionProps {
    // Expect ApiRecommendationSection
    category: ApiRecommendationSection;
    // Keep other props as they are, ensure types match if needed
    loadedMovies: { [key: string]: number }; // Use section ID as key
    selectedMovies: { [key: string]: ApiMovieCore[] }; // Use section ID as key, hold ApiMovieCore
    areAllSelected: (categoryId: string) => boolean; // Use section ID
    handleAddMovies: (category: ApiRecommendationSection) => void; // Pass full section
    handleToggleSelectAll: (categoryId: string, isSelected: boolean) => void; // Use section ID
    handleViewDetails: (categoryId: string) => void; // Use section ID
    handleOpenDeleteConfirmationBulk: (category: ApiRecommendationSection) => void; // Pass full section
    toggleMovieSelection: (category: ApiRecommendationSection, movie: ApiMovieCore) => void; // Pass section and movie
    handleShowLess: (category: ApiRecommendationSection) => void; // Pass full section
    handleLoadMore: (category: ApiRecommendationSection) => void; // Pass full section
    handleLoadAll: (category: ApiRecommendationSection) => void; // Pass full section
    handleOpenDeleteConfirmationSingle: (category: ApiRecommendationSection, movie: ApiMovieCore) => void; // Pass section and movie
}

const CategorySection: React.FC<CategorySectionProps> = ({
    category,
    loadedMovies,
    selectedMovies,
    areAllSelected,
    handleAddMovies,
    handleToggleSelectAll,
    handleViewDetails,
    handleOpenDeleteConfirmationBulk,
    toggleMovieSelection,
    handleShowLess,
    handleLoadMore,
    handleLoadAll,
    handleOpenDeleteConfirmationSingle,
}) => {
    const displayLimit = loadedMovies[category.id] || 10;
    const moviesToShow = category.movies.slice(0, displayLimit);
    const currentSelected = selectedMovies[category.id] || [];

    return (
        // Keep existing outer container structure and class names
        <Box className="category-section" sx={{ mb: 4, p: 2, border: '1px solid var(--border)', borderRadius: 2 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">{category.title} ({category.movieCount})</Typography>
                <Button variant="contained" onClick={() => handleAddMovies(category)}>
                    Add Movies
                </Button>
            </Box>

            {/* Bulk Actions */}
            <div className="category-actions">
                <Button
                    className='select-button-rec'
                    variant="contained"
                    color={areAllSelected(category.id) ? "secondary" : "primary"}
                    startIcon={areAllSelected(category.id) ? <PlaylistRemove /> : <PlaylistAddCheck />}
                    onClick={() => handleToggleSelectAll(category.id, areAllSelected(category.id))}
                    sx={{ mr: 1 }}
                >
                    {areAllSelected(category.id) ? "Deselect All" : "Select All"}
                </Button>
                <Button
                    className='view-button-rec'
                    variant="contained"
                    color='info'
                    onClick={() => handleViewDetails(category.id)}
                    disabled={currentSelected.length === 0}
                    startIcon={<Visibility />}
                >
                    View Details
                </Button>
                <Button
                    className='delete-button-rec'
                    variant="contained"
                    color="error"
                    onClick={() => handleOpenDeleteConfirmationBulk(category)}
                    disabled={currentSelected.length === 0}
                    startIcon={<Delete />}
                >
                    Delete Selected
                </Button>
            </div>

            {/* Movie Grid - Keep existing structure */}
            <Grid container spacing={2} mt={1}>
                {moviesToShow.map(movie => (
                    <Grid className='movie-grid' item key={movie.id} xs={6} sm={4} md={3} lg={2}> {/* Adjust grid sizing as needed */}
                        <Card
                            className="movie-card"
                            onClick={() => toggleMovieSelection(category, movie)}
                        >
                            <Checkbox
                                className='rec-checkbox'
                                checked={currentSelected.some(m => m.id === movie.id)}
                                onChange={() => toggleMovieSelection(category, movie)}
                            />
                            {/* Use poster_url */}
                            <CardMedia
                                component="img"
                                height="140"
                                image={movie.poster_url ?? 'https://via.placeholder.com/150x225?text=No+Image'}
                                alt={movie.title}
                                sx={{ objectFit: 'cover' }}
                            />
                            <CardContent className='movie-card-content'>
                                <Typography className='title-rec selectable' variant="body1">{movie.title}</Typography>

                                {/* Single Delete Button */}
                                <IconButton
                                    className='delete-button-rec'
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenDeleteConfirmationSingle(category, movie);
                                    }}
                                >
                                    <Delete color="error" />
                                </IconButton>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
                {category.movies.length === 0 && (
                    <Grid item xs={12}><Typography sx={{ textAlign: 'center', p: 3 }}>No movies in this section yet.</Typography></Grid>
                )}
            </Grid>
            <div className="category-footer">
                <Button onClick={() => handleShowLess(category)} variant="contained">Show Less</Button>
                <Button onClick={() => handleLoadMore(category)} variant="contained">Load More</Button>
                <Button onClick={() => handleLoadAll(category)} variant="contained">Load All</Button>
            </div>
        </Box>
    );
};

export default CategorySection;