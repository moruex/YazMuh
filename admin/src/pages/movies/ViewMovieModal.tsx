import { useState, useEffect } from "react";
import { Close } from "@mui/icons-material";
import { Box, Dialog, DialogTitle, IconButton, DialogContent, Typography, Rating, Chip, DialogActions, Button, Grid } from "@mui/material";
import { Movie } from "@interfaces/movie.interfaces"; // Corrected import path
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { RetryableImage } from "./RetryableImage";

interface ViewMovieModalProps {
  isOpen: boolean;
  onClose: () => void;
  movie: Movie; // Expects unified Movie interface
}

// Helper to extract YouTube Video ID
const getYouTubeId = (url: string | null | undefined): string | null => {
    if (!url) return null;
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'youtu.be') {
            return urlObj.pathname.slice(1);
        }
        if (urlObj.hostname.includes('youtube.com')) {
            return urlObj.searchParams.get('v');
        }
    } catch (e) {
        // Invalid URL format, try regex as fallback (less reliable)
        const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
        return (match && match[2].length === 11) ? match[2] : null;
    }
    return null;
};

export const ViewMovieModal = ({
  isOpen,
  onClose,
  movie
}: ViewMovieModalProps) => {
  const youtubeId = getYouTubeId(movie?.trailerUrl);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Reset trailer state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowTrailer(false);
    }
    setIsDialogOpen(isOpen);
  }, [isOpen]);

  // Create thumbnail URL for YouTube video
  const thumbnailUrl = youtubeId ? 
    `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : 
    null;

  return (
    <Dialog 
      open={isDialogOpen} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      TransitionProps={{
        onExited: () => setIsDialogOpen(false)
      }}
    >
      {movie ? (
        <>
          <DialogTitle className="dialog-title" sx={{ m: 0, p: 2 }}>
            {movie.title}
            <IconButton
              aria-label="close"
              onClick={onClose}
              sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
            >
              <Close />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers>
            <Grid container spacing={3}>

              {/* Left Column: Image */}
              <Grid className="view-poster-container" item xs={12} sm={4} md={3}>
                <RetryableImage
                  src={movie.imageUrl || '/placeholder.png'}
                  alt={`Poster for ${movie.title}`}
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '450px',
                    objectFit: 'contain',
                    borderRadius: '4px',
                    display: 'block',
                  }}
                />
              </Grid>

              {/* Right Column: Details */}
              <Grid item xs={12} sm={8} md={9}>
                <Typography variant="h5" gutterBottom>{movie.title}</Typography>
                {/* Rating */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Rating name="read-only-rating" value={movie.rating ?? 0} precision={0.1} readOnly size="small" />
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    {`${(movie.rating ?? 0).toFixed(1)}/5`}
                  </Typography>
                </Box>
                {/* Release Date & Duration */}
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {movie.releaseDate ? new Date(movie.releaseDate + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Release date N/A'}
                  {movie.duration > 0 && ` • ${Math.floor(movie.duration / 60)}h ${movie.duration % 60}m`}
                </Typography>

                {/* Genres - Memoizing this section would help with performance */}
                <Box sx={{ my: 2 }}>
                  <Typography variant="overline" component="div" color="text.secondary">Genres</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {movie.genres.length > 0 ? movie.genres.map((genre, idx) => (
                      <Chip key={`genre-${idx}-${genre}`} label={genre} size="small" variant="outlined" />
                    )) : <Typography variant="body2" color="text.secondary">N/A</Typography>}
                  </Box>
                </Box>

                {/* Description */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="overline" component="div" color="text.secondary">Description</Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{movie.description || 'No description available.'}</Typography>
                </Box>

                 {/* Directors */}
                 <Box sx={{ mb: 2 }}>
                   <Typography variant="overline" component="div" color="text.secondary">Directors</Typography>
                   <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                     {movie.directors.length > 0 ? movie.directors.map((director, idx) => (
                       <Chip key={`director-${idx}-${director}`} label={director} size="small" />
                     )) : <Typography variant="body2" color="text.secondary">N/A</Typography>}
                   </Box>
                 </Box>

                 {/* Actors */}
                 <Box sx={{ mb: 2 }}>
                   <Typography variant="overline" component="div" color="text.secondary">Cast</Typography>
                   <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                     {movie.actors.length > 0 ? movie.actors.map((actor, idx) => (
                       <Chip key={`actor-${idx}-${actor}`} label={actor} size="small" />
                     )) : <Typography variant="body2" color="text.secondary">N/A</Typography>}
                   </Box>
                 </Box>
              </Grid>

              {/* Trailer Section with Thumbnail/Click-to-Play */}
              {youtubeId && (
                <Grid item xs={12}>
                  <Box sx={{ mt: 2, borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
                    <Typography variant="h6" gutterBottom>Trailer</Typography>
                    <Box
                      sx={{
                        position: 'relative',
                        paddingBottom: '56.25%', /* 16:9 aspect ratio */
                        height: 0,
                        overflow: 'hidden',
                        maxWidth: '100%',
                        background: '#000',
                        borderRadius: 1
                      }}
                    >
                      {showTrailer ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
                          title={`${movie.title} Trailer`}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            border: 'none',
                          }}
                        />
                      ) : (
                        // Thumbnail with play button overlay
                        <Box 
                          onClick={() => setShowTrailer(true)}
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            cursor: 'pointer',
                            backgroundImage: 'none', // Remove direct background image
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            '&:hover': {
                              '& .play-icon': {
                                transform: 'scale(1.1)',
                                opacity: 1
                              },
                              '&::after': {
                                opacity: 0.7
                              }
                            },
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              backgroundColor: 'rgba(0,0,0,0.4)',
                              transition: 'opacity 0.3s'
                            }
                          }}
                        >
                          {/* Absolute positioned image with retry mechanism */}
                          {thumbnailUrl && (
                            <Box sx={{ position: 'absolute', width: '100%', height: '100%', zIndex: 0 }}>
                              <RetryableImage
                                src={thumbnailUrl}
                                alt={`${movie.title} trailer thumbnail`}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0
                                }}
                              />
                            </Box>
                          )}
                          <Box 
                            className="play-icon"
                            sx={{
                              width: 80,
                              height: 80,
                              borderRadius: '50%',
                              backgroundColor: 'rgba(255,255,255,0.9)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              zIndex: 1,
                              transition: 'all 0.3s',
                              '& svg': {
                                fontSize: 40,
                                color: '#FF0000'
                              }
                            }}
                          >
                            <PlayArrowIcon fontSize="large" />
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={onClose}>Close</Button>
          </DialogActions>
        </>
      ) : (
        <DialogContent>
          <Typography>Loading...</Typography>
        </DialogContent>
      )}
    </Dialog>
  );
};