// --- START OF FILE MovieDetailsModal.tsx ---
import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, CardMedia, Box, MobileStepper, Chip, Divider, CircularProgress, useTheme } from '@mui/material';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
// Use API types
import type { ApiMovieCore } from '@interfaces/movie.interfaces';
import { useQuery } from '@apollo/client';
import { GET_MOVIE } from '@graphql/queries/movie.queries';
// Optional: Query for full details if needed
// import { useQuery } from '@apollo/client';
// import { GET_MOVIE } from '@graphql/queries/movie.queries';
// import type { ApiMovieDetail } from '@interfaces/movie.interfaces';

interface MovieDetailsModalProps {
    open: boolean;
    onClose: () => void;
    movies: ApiMovieCore[];
    activeStep: number;
    onNext: () => void;
    onBack: () => void;
}

const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
    open,
    onClose,
    movies,
    activeStep,
    onNext,
    onBack,
}) => {
    const theme = useTheme();
    const currentMovie = movies.length > activeStep ? movies[activeStep] : null;

    // Fetch detailed movie information if we have a movie selected
    const { data: movieDetailData, loading: loadingDetails } = useQuery(
        GET_MOVIE,
        {
            variables: { id: currentMovie?.id },
            skip: !currentMovie || !open, // Skip if no movie or modal is closed
            fetchPolicy: 'cache-first', // Use cache if available
        }
    );

    const movieDetail = movieDetailData?.movie;

    // Helper function to format release date
    const formatReleaseDate = (dateString?: string | null) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="md"
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    overflow: 'hidden'
                }
            }}
        >
            {currentMovie ? (
                <>
                    <DialogTitle sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: `1px solid ${theme.palette.divider}`
                    }}>
                        <Typography variant="h5" component="div">
                            {currentMovie.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {activeStep + 1} of {movies.length}
                        </Typography>
                    </DialogTitle>

                    <DialogContent sx={{ p: 0 }}>
                        {loadingDetails ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <Box>
                                <Box sx={{ 
                                    display: 'flex', 
                                    flexDirection: { xs: 'column', md: 'row' }
                                }}>
                                    {/* Movie Poster */}
                                    <Box sx={{ 
                                        width: { xs: '100%', md: '35%' },
                                        minHeight: { xs: 200, md: 'auto' }
                                    }}>
                                        <CardMedia
                                            component="img"
                                            image={currentMovie.poster_url || '/placeholder-poster.jpg'}
                                            alt={currentMovie.title}
                                            sx={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                objectPosition: 'center top'
                                            }}
                                        />
                                    </Box>

                                    {/* Movie Details */}
                                    <Box sx={{ 
                                        flex: 1, 
                                        p: 3,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 2
                                    }}>
                                        <Typography variant="h4" component="h1" gutterBottom>
                                            {currentMovie.title}
                                            {currentMovie.release_date && (
                                                <Typography 
                                                    component="span" 
                                                    color="text.secondary" 
                                                    sx={{ ml: 1, fontSize: '0.6em' }}
                                                >
                                                    ({new Date(currentMovie.release_date).getFullYear()})
                                                </Typography>
                                            )}
                                        </Typography>

                                        {/* Movie Metadata */}
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {movieDetail?.duration_minutes && (
                                                <Chip 
                                                    label={`${movieDetail.duration_minutes} min`} 
                                                    size="small" 
                                                    variant="outlined" 
                                                />
                                            )}
                                            {currentMovie.genres?.map(genre => (
                                                <Chip 
                                                    key={genre.id} 
                                                    label={genre.name} 
                                                    size="small" 
                                                    color={genre.is_collection ? "secondary" : "primary"}
                                                    variant="outlined"
                                                />
                                            ))}
                                        </Box>

                                        <Divider />

                                        {/* Movie Summary */}
                                        <Box>
                                            <Typography variant="h6" gutterBottom>
                                                Overview
                                            </Typography>
                                            <Typography variant="body1">
                                                {movieDetail?.plot_summary || currentMovie.plot_summary || 'No overview available.'}
                                            </Typography>
                                        </Box>

                                        {/* Additional Details */}
                                        <Box sx={{ mt: 'auto' }}>
                                            <Typography variant="h6" gutterBottom>
                                                Details
                                            </Typography>
                                            <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', rowGap: 1, columnGap: 2 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Release Date:
                                                </Typography>
                                                <Typography variant="body2">
                                                    {formatReleaseDate(currentMovie.release_date)}
                                                </Typography>

                                                {(movieDetail?.movieq_rating || movieDetail?.imdb_rating || movieDetail?.letterboxd_rating) && (
                                                    <>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Ratings:
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 2 }}>
                                                            {movieDetail?.movieq_rating && (
                                                                <Chip 
                                                                    label={`MovieQ: ${movieDetail.movieq_rating.toFixed(1)}`}
                                                                    size="small"
                                                                    variant="filled"
                                                                />
                                                            )}
                                                            {movieDetail?.imdb_rating && (
                                                                <Chip 
                                                                    label={`IMDB: ${movieDetail.imdb_rating.toFixed(1)}`}
                                                                    size="small"
                                                                    variant="filled"
                                                                />
                                                            )}
                                                            {movieDetail?.letterboxd_rating && (
                                                                <Chip 
                                                                    label={`Letterboxd: ${movieDetail.letterboxd_rating.toFixed(1)}`}
                                                                    size="small"
                                                                    variant="filled"
                                                                />
                                                            )}
                                                        </Box>
                                                    </>
                                                )}

                                                {movieDetail?.trailer_url && (
                                                    <>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Trailer:
                                                        </Typography>
                                                        <Button 
                                                            variant="outlined" 
                                                            size="small" 
                                                            href={movieDetail.trailer_url} 
                                                            target="_blank"
                                                            sx={{ justifyContent: 'flex-start', width: 'fit-content' }}
                                                        >
                                                            Watch Trailer
                                                        </Button>
                                                    </>
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        )}
                    </DialogContent>

                    <DialogActions>
                        <MobileStepper
                            variant="dots"
                            steps={movies.length}
                            position="static"
                            activeStep={activeStep}
                            sx={{
                                flexGrow: 1,
                                backgroundColor: 'transparent',
                                '& .MuiMobileStepper-dot': { mx: 0.5 }
                            }}
                            nextButton={
                                <Button
                                    size="small"
                                    onClick={onNext}
                                    disabled={activeStep === movies.length - 1}
                                >
                                    Next <KeyboardArrowRight />
                                </Button>
                            }
                            backButton={
                                <Button
                                    size="small"
                                    onClick={onBack}
                                    disabled={activeStep === 0}
                                >
                                    <KeyboardArrowLeft /> Previous
                                </Button>
                            }
                        />
                        <Button 
                            onClick={onClose} 
                            variant="contained"
                            sx={{ ml: 2 }}
                        >
                            Close
                        </Button>
                    </DialogActions>
                </>
            ) : (
                <>
                    <DialogTitle>Movie Details</DialogTitle>
                    <DialogContent>
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography>No movie selected or data unavailable.</Typography>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={onClose} variant="contained">Close</Button>
                    </DialogActions>
                </>
            )}
        </Dialog>
    );
};

// Use default export if that's your convention
export default MovieDetailsModal;
// --- END OF FILE MovieDetailsModal.tsx ---