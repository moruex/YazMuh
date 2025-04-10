// --- START OF FILE MovieDetailsModal.tsx ---
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, CardMedia, Box, MobileStepper, Chip, Rating, IconButton } from '@mui/material';
import { KeyboardArrowLeft, KeyboardArrowRight, Close } from '@mui/icons-material';
// Use API types
import type { ApiMovieCore } from '@interfaces/movie.interfaces';
import type { ApiRecommendationSection } from '@interfaces/recommendation.interfaces';
// Optional: Query for full details if needed
// import { useQuery } from '@apollo/client';
// import { GET_MOVIE } from '@graphql/queries/movie.queries';
// import type { ApiMovieDetail } from '@interfaces/movie.interfaces';

interface MovieDetailsModalProps { // Renamed interface
    open: boolean;
    onClose: () => void;
    currentSectionId: string | null; // Use ID
    // Pass the map of selected movies using section ID as key
    selectedMoviesMap: { [key: string]: ApiMovieCore[] };
    detailsActiveStep: number;
    handleNext: () => void;
    handleBack: () => void;
    // Pass all sections to find the title
    sections: ApiRecommendationSection[];
}

const MovieDetailsModalComponent: React.FC<MovieDetailsModalProps> = ({ // Renamed component
    open,
    onClose,
    currentSectionId,
    selectedMoviesMap,
    detailsActiveStep,
    handleNext,
    handleBack,
    sections,
}) => {
    const selectedMovies = currentSectionId ? selectedMoviesMap[currentSectionId] ?? [] : [];
    const currentMovie = selectedMovies.length > detailsActiveStep ? selectedMovies[detailsActiveStep] : null;
    const section = sections.find(s => s.id === currentSectionId);

    // --- Optional: Fetch full details if ApiMovieCore is not enough ---
    /*
    const { data: detailData, loading: loadingDetails, error: detailError } = useQuery<{ movie: ApiMovieDetail }>(
        GET_MOVIE,
        {
            variables: { id: currentMovie?.id },
            skip: !currentMovie, // Only run query if there's a movie ID
        }
    );
    const movieDetails = detailData?.movie;
    */
    // If using the above, replace 'currentMovie?.fieldName' below with 'movieDetails?.fieldName'
    // and handle loading/error states for the detail query.
    // For this example, we assume ApiMovieCore is sufficient.

    return (
        // Keep existing class name
        <Dialog
            className='movie-detail-dialog'
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="md"
        >
            {/* Check if there's a movie */}
            {currentMovie && section ? (
                <>
                    <DialogTitle>
                        {currentMovie.title} ({detailsActiveStep + 1} of {selectedMovies.length})
                    </DialogTitle>
                    <DialogContent dividers>
                         {/* Optional: Loading/Error for detail fetch */}
                         {/* {loadingDetails && <CircularProgress />} */}
                         {/* {detailError && <Alert severity="error">Error loading details: {detailError.message}</Alert>} */}
                         {/* {!loadingDetails && !detailError && movieDetails && ( */}

                        {/* Keep existing layout */}
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                            <Box sx={{ flexShrink: 0, width: { xs: '100%', md: 300 } }}>
                                <CardMedia
                                    component="img"
                                    // Use poster_url
                                    image={currentMovie.poster_url ?? 'https://via.placeholder.com/300x450?text=No+Image'}
                                    alt={currentMovie.title}
                                    // Keep existing sx
                                    sx={{
                                        borderRadius: 1,
                                        height: { xs: 200, md: 400 },
                                        objectFit: 'cover'
                                    }}
                                />
                            </Box>

                            <Box sx={{ flex: 1 }}>
                                {/* Keep existing class name */}
                                <Typography className='selectable' variant="h4" gutterBottom>{currentMovie.title}</Typography>
                                <Typography className='selectable' variant="body1" paragraph>
                                     {/* Use plot_summary (if available on ApiMovieCore, else fetch details) */}
                                     {/* {movieDetails?.plot_summary || 'No description available.'} */}
                                     {'Description would be here if fetched.'}
                                </Typography>
                                <Box sx={{ mt: 3 }}>
                                    <Typography variant="subtitle1" fontWeight="bold">Details:</Typography>
                                    {/* Keep existing class names */}
                                    <Typography className='selectable' variant="body2">
                                        • ID: {currentMovie.id}
                                    </Typography>
                                    <Typography className='selectable' variant="body2">
                                        • Section: {section.title}
                                    </Typography>
                                     {/* Display more fields from ApiMovieCore/ApiMovieDetail */}
                                     <Typography className='selectable' variant="body2">
                                        • Release: {currentMovie.release_date ? new Date(currentMovie.release_date).toLocaleDateString() : 'N/A'}
                                     </Typography>
                                     <Typography className='selectable' variant="body2">
                                        • Rating: {currentMovie.avg_rating?.toFixed(1) ?? 'N/A'}
                                     </Typography>
                                     <Typography className='selectable' variant="body2">
                                        • Duration: {currentMovie.duration_minutes ? `${currentMovie.duration_minutes} min` : 'N/A'}
                                     </Typography>
                                </Box>
                            </Box>
                        </Box>
                        {/* )} End optional detail fetch block */}
                    </DialogContent>
                    {/* Keep existing DialogActions structure */}
                    <DialogActions>
                        <MobileStepper
                            variant="text"
                            steps={selectedMovies.length}
                            position="static"
                            activeStep={detailsActiveStep}
                            sx={{
                                flexGrow: 1,
                                backgroundColor: 'transparent',
                                '& .MuiMobileStepper-dot': { mx: 0.5 }
                            }}
                            nextButton={
                                <Button
                                    size="small"
                                    onClick={handleNext}
                                    disabled={detailsActiveStep === selectedMovies.length - 1}
                                >
                                    Next <KeyboardArrowRight />
                                </Button>
                            }
                            backButton={
                                <Button
                                    size="small"
                                    onClick={handleBack}
                                    disabled={detailsActiveStep === 0}
                                >
                                    <KeyboardArrowLeft /> Previous
                                </Button>
                            }
                        />
                        <Button onClick={onClose} variant="contained"> Close </Button>
                    </DialogActions>
                </>
            ) : (
                 // Handle case where no movie/section is found (shouldn't usually happen if opened correctly)
                 <DialogContent><Typography>No movie details available.</Typography></DialogContent>
            )}
        </Dialog>
    );
};

// Use default export if that's your convention
export default MovieDetailsModalComponent;
// --- END OF FILE MovieDetailsModal.tsx ---