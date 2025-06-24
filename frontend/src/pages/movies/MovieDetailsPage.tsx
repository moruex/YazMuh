import React, { useEffect, useState, MouseEvent } from 'react';
import { useParams, Link } from 'react-router-dom'; // Link for person names
import { mdService, MovieDetailData, MovieTeaserData } from '@src/services/mdService';
import { useAuth } from '@src/context/AuthContext'; // Import useAuth
// import { useAuth } from '@src/context/AuthContext'; // To get userId for user_rating
import Footer from '@components/app/Footer';
import './MovieDetailsPage.css'; // Your existing CSS
import { FaStar, FaRegStar, FaPlus, FaCheck, FaFilm, FaHeart, FaRegHeart, FaStarHalfAlt } from 'react-icons/fa'; // Example icons
import SimilarMoviesSection from '@components/movies/SimilarMoviesSection'; // Import SimilarMoviesSection
import { gql } from '@apollo/client';
import client from '@src/config/apolloClient';
import { useTranslation } from 'react-i18next';

// Query to fetch movie comments
const GET_MOVIE_COMMENTS = gql`
  query GetMovieComments($movieId: ID!, $limit: Int, $offset: Int) {
    comments(movieId: $movieId, limit: $limit, offset: $offset) {
      id
      content
      user {
        id
        username
        avatar_url
      }
      parent_comment_id
      likes_count
      created_at
      updated_at
      is_currently_censored
    }
  }
`;

// Local Comment type
interface Comment {
  id: string | number; // Can be number for local, string if from DB with UUID
  user: { // Nested user object for consistency with potential API response
    id: string | number;
    username: string;
    avatar_url?: string | null;
  };
  movie_id: string; // Added to link comment to movie
  content: string;
  parent_comment_id?: string | number | null;
  likes_count: number;
  is_currently_censored?: boolean;
  created_at: string; // ISO date string
  updated_at?: string;
  // Local-only for UI state if needed
  isSpoiler?: boolean; 
}

// const MOCK_CURRENT_USER_ID = "CurrentUser";

// Minimal CommentCard for local rendering
const CommentCard: React.FC<{ comment: Comment }> = ({ comment }) => (
  <div className="md-comment">
    <div className="md-comment-header">
      <div className="md-comment-user">
        <img 
          src={comment.user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user.username)}&background=random`}
          alt={comment.user.username} 
          className="md-user-avatar" 
        />
        <span className="md-username">{comment.user.username}</span>
      </div>
      <span className="md-comment-date">{new Date(comment.created_at).toLocaleDateString()}</span>
    </div>
    <p className={`md-comment-content ${comment.isSpoiler ? 'spoiler' : ''}`}>
      {comment.isSpoiler ? 'This comment contains spoilers. Click to reveal.' : comment.content}
    </p>
    {/* Add like/reply buttons, edit/delete for comment owner here */}
  </div>
);

// Helper to format duration (e.g., 120 -> 2h 0m)
const formatDuration = (minutes: number | null): string => {
  if (minutes === null || minutes <= 0) return 'N/A';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
};

// Helper to format date (e.g., "2023-10-01" -> "October 1, 2023")
const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (e) {
    return dateString; // Fallback to original string if parsing fails
  }
};

// const getReleaseYear = (dateString: string | null | undefined): string => {
//     return dateString ? new Date(dateString).getFullYear().toString() : 'N/A';
// };

// Updated to use Link and ensure slugs are handled
const formatPersonList = (persons: { id: string; person: { id: string; name: string; slug?: string | null; profile_image_url?: string | null }; job?: string | null; department?: string | null }[] | undefined | null, job?: string): React.ReactNode => {
    if (!persons || persons.length === 0) return 'N/A';
    return persons.map((p, index) => (
        <React.Fragment key={p.id}>
            <Link to={`/person/${(p.person.slug ?? p.person.id)}`} className="person-link">
                {p.person.name}
            </Link>
            {job && p.job === job ? ` (${job})` : ''}
            {index < persons.length - 1 ? ', ' : ''}
        </React.Fragment>
    ));
};

const formatGenreList = (genres: { id: string; name: string }[] | null | undefined): string => {
    if (!genres || genres.length === 0) return 'N/A';
    return genres.map(g => g.name).join(', ');
};

// Component for star rating
const StarRating: React.FC<{ 
  currentRating: number | null; 
  onSetRating: (rating: number) => void; 
  maxStars?: number;
  interactive?: boolean; // Add the missing interactive property
}> = ({ 
  currentRating, 
  onSetRating, 
  maxStars = 5, // Changed default from 10 to 5 to match our UI
  interactive = true // Default to true for backwards compatibility
}) => {
  const starColor = "#00e676";
  const emptyStarColor = "var(--star-empty-color, #ccc)";
  const starSize = '2.2em';

  const handleStarClick = (event: MouseEvent<HTMLSpanElement>, starValue: number) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const isFirstHalf = clickX < rect.width / 2;
  
    let newRating = starValue;
  
    // Convert current rating to actual 0-10 scale value
    const actualCurrentRating = currentRating !== null ? currentRating * 2 : 0;
    
    // Handle clicks based on current rating and where user clicked
    if (actualCurrentRating === (starValue - 0.5) * 2 && !isFirstHalf) {
      // Clicked right half of half-filled star - make it full
      newRating = starValue;
    } else if (actualCurrentRating === starValue * 2 && isFirstHalf) {
      // Clicked left half of filled star - make it half
      newRating = starValue - 0.5;
    } else if (actualCurrentRating === starValue * 2 && !isFirstHalf) {
      // Clicked right half of filled star - remove rating
      newRating = 0;
    } else if (actualCurrentRating === (starValue - 0.5) * 2 && isFirstHalf) {
      // Clicked left half of half-filled star - remove rating
      newRating = 0;
    } else if (isFirstHalf) {
      // Clicked left half of an unfilled star - make it half
      newRating = starValue - 0.5;
    } else {
      // Clicked right half of an unfilled star - make it full
      newRating = starValue;
    }
  
    // Convert 0-5 scale back to 0-10 for API
    onSetRating(newRating * 2);
  };
  

  return (
    <div className={`md-star-rating-area ${'interactive'}`} style={{ display: 'flex', alignItems: 'center' }}>
      <div className="md-stars-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
        {[...Array(maxStars)].map((_, index) => {
          const starValue = index + 1;
          let starIcon;
          const ratingVal = currentRating === null ? -1 : currentRating; // Handle null for comparison

          if (starValue <= ratingVal) {
            starIcon = <FaStar />;
          } else if (starValue - 0.5 === ratingVal) {
            starIcon = <FaStarHalfAlt />;
          } else {
            starIcon = <FaRegStar />;
          }
          const isFilledOrHalf = ratingVal >= starValue - 0.5;

          return (
            <span
              key={starValue}
              className={`star-icon ${'interactive-star'}`}
              onClick={(e) => handleStarClick(e, starValue)}
              style={{
                cursor: 'pointer',
                fontSize: starSize,
                marginRight: '8px', // Adjusted margin for larger stars
                color: isFilledOrHalf ? starColor : emptyStarColor,
                transition: 'color 0.1s ease-in-out',
                lineHeight: '1', // Helps with vertical alignment
              }}
            >
              {starIcon}
            </span>
          );
        })}
      </div>

      <span style={{ marginLeft: '15px', fontSize: '1.1em', color: 'var(--text-color)' }}>
        {currentRating !== null ? `${Math.round(currentRating * 2)} / 10` : 'X / 10'}
      </span>
        {interactive && (
        <button 
          onClick={() => onSetRating(0)} // 0 signifies reset
          className="md-reset-rating-btn"
          style={{ 
            marginLeft: '20px', 
            background: 'none', 
            border: '1px solid var(--border-color-light, #ddd)', 
            borderRadius: '4px',
            padding: '6px 12px', // Adjusted padding for vertical centering
            color: 'var(--text-color-secondary)', 
            cursor: 'pointer',
            fontSize: '0.9em', // Slightly smaller font for button
            alignSelf: 'center' // Helps vertically align button with stars
          }}
        >
          Reset
        </button>
        )}
    </div>
  );
};

const MovieDetailsPage: React.FC = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const { user, isLoggedIn, token } = useAuth(); // Get authenticated user and token
  const { t } = useTranslation();
  
  // Debug auth state more prominently
  useEffect(() => {
    console.log("💡 Auth state in MovieDetailsPage:", { 
      isLoggedIn, 
      userId: user?.id, 
      username: user?.username,
      token: token ? "exists" : "missing" 
    });
    
    // Force buttons to update when auth state changes
    if (isLoggedIn) {
      console.log("User is logged in - buttons should be enabled");
    } else {
      console.log("User is NOT logged in - buttons should be disabled");
    }
  }, [isLoggedIn, user, token]);
  
  const [movie, setMovie] = useState<MovieDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [displayedSimilarMovies, setDisplayedSimilarMovies] = useState<MovieTeaserData[] | null>(null);

  const [userRating, setUserRating] = useState<number | null>(null); // User's own rating for this movie - THIS WILL BE THE AUTHENTICATED USER'S RATING
  const [overallMovieRating, setOverallMovieRating] = useState<number | null>(null); // Movie's average rating
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [isInWatchlist, setIsInWatchlist] = useState<boolean>(false);
  const [isWatched, setIsWatched] = useState<boolean>(false);

  const COMMENTS_PER_PAGE = 5;
  const [comments, setComments] = useState<Comment[]>([]); // Initialize with empty array
  const [loadingComments, setLoadingComments] = useState<boolean>(false);
  const [currentCommentPage, setCurrentCommentPage] = useState<number>(1);
  const [newCommentText, setNewCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Style for buttons based on login state - for debugging
  useEffect(() => {
    const buttons = document.querySelectorAll('.md-action-button');
    if (isLoggedIn) {
      console.log(`Found ${buttons.length} action buttons - should be enabled`);
    } else {
      console.log(`Found ${buttons.length} action buttons - should be disabled`);
    }
    
    // Log each button's disabled state
    buttons.forEach((button, i) => {
      const buttonEl = button as HTMLButtonElement;
      console.log(`Button ${i} disabled: ${buttonEl.disabled}`);
    });
  }, [isLoggedIn, movie]);
  
  // Fetch comments
  const fetchComments = async () => {
    if (!movieId) return;
    
    setLoadingComments(true);
    try {
      const { data } = await client.query({
        query: GET_MOVIE_COMMENTS,
        variables: { 
          movieId: movieId,
          limit: 20,  // Adjust limit as needed
          offset: 0
        },
        fetchPolicy: 'network-only' // Don't use cache
      });
      
      if (data.comments) {
        // Transform comments to match the local Comment interface
        const fetchedComments: Comment[] = data.comments.map((c: any) => ({
          id: c.id,
          user: {
            id: c.user.id,
            username: c.user.username,
            avatar_url: c.user.avatar_url
          },
          movie_id: movieId, 
          content: c.content,
          parent_comment_id: c.parent_comment_id,
          likes_count: c.likes_count || 0,
          is_currently_censored: c.is_currently_censored,
          created_at: c.created_at || new Date().toISOString(),
          updated_at: c.updated_at,
        }));
        setComments(fetchedComments);
      }
    } catch (err) {
      console.error("Failed to fetch comments:", err);
      // Don't set error state to avoid disrupting page if just comments fail
    } finally {
      setLoadingComments(false);
    }
  };
  
  // Fetch movie details and existing comments
  useEffect(() => {
    if (!movieId) {
      setError('Movie ID is missing.');
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      setDisplayedSimilarMovies(null);
      
      try {
        const movieData = await mdService.getMovieDetails(String(movieId), user?.id);
        if (movieData) {
          setMovie(movieData);
          
          // Backend user_rating is 0-10, convert to 0-5 for UI display
          // Don't round here to preserve half-star values
          setUserRating(movieData.userRating !== null ? movieData.userRating / 2 : null); 
          // Convert overall rating to 0-5 scale for UI consistency
          setOverallMovieRating(movieData.movieq_rating !== null ? movieData.movieq_rating / 2 : null);
          
          // Set user list status based on data from API
          if (isLoggedIn && user?.id) {
            // Use the new GraphQL field names from our updated schema
            setIsFavorite(movieData.isFavorite || false);
            setIsWatched(movieData.isWatched || false);
            setIsInWatchlist(movieData.isInWatchlist || false);
          }

          // Fetch comments separately
          fetchComments();

          // Load similar movies
          if (movieData.similar && movieData.similar.length > 0) {
            setDisplayedSimilarMovies(movieData.similar);
          } else if (movieData.title) {
            try {
              // Try to find similar movies by searching with the movie title
              const similarByTitle = await mdService.getSimilarMoviesByTitle(movieData.title);
              if (similarByTitle && similarByTitle.length > 0) {
                // Filter out the current movie from results
                setDisplayedSimilarMovies(similarByTitle.filter(m => m.id !== movieData.id));
              }
            } catch (similarError) {
              console.error("Error fetching similar movies:", similarError);
              // Continue without similar movies
            }
          }
        } else {
          setError("Movie not found");
        }
      } catch (err: any) {
        console.error("Failed to fetch movie details:", err);
        
        // Provide a more user-friendly error message
        if (err.message?.includes("relation") && err.message?.includes("does not exist")) {
          setError("A database configuration error occurred. Please try again later.");
        } else if (err.message?.includes("object is not extensible")) {
          setError("Error loading movie details. Please try refreshing the page.");
        } else if (err.message?.includes("GRAPHQL_VALIDATION_FAILED")) {
          setError("API validation error. Please notify the development team.");  
        } else {
          setError(err.message || "An error occurred while loading the movie details");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [movieId, user?.id, isLoggedIn, token]); // Add user.id, isLoggedIn, token to dependencies

  const handleAddComment = async () => {
    if (!isLoggedIn || !user || !movieId) {
      alert("Please log in to comment.");
      return;
    }
    if (newCommentText.trim() === "") return;

    setIsSubmittingComment(true);
    try {
      const input = {
        userId: user.id,
        movieId: movieId,
        content: newCommentText,
      };
      const savedComment = await mdService.addComment(input);
      if (savedComment) {
        setComments(prevComments => [
          {
            id: savedComment.id,
            user: savedComment.user,
            movie_id: movieId,
            content: savedComment.content,
            parent_comment_id: savedComment.parent_comment_id,
            likes_count: savedComment.likes_count,
            is_currently_censored: (savedComment as any).is_currently_censored ?? false,
            created_at: savedComment.created_at,
            updated_at: savedComment.updated_at,
          },
          ...prevComments
        ]);
      }
      setNewCommentText("");
      setCurrentCommentPage(1);
    } catch (err: any) {
      console.error("Failed to add comment:", err);
      alert(`Error: ${err.message || 'Could not post comment.'}`);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const totalPages = Math.ceil(comments.length / COMMENTS_PER_PAGE);
  const indexOfLastComment = currentCommentPage * COMMENTS_PER_PAGE;
  const indexOfFirstComment = indexOfLastComment - COMMENTS_PER_PAGE;
  const currentCommentsToDisplay: Comment[] = comments.slice(indexOfFirstComment, indexOfLastComment);

  const handlePageChange = (pageNumber: number) => setCurrentCommentPage(pageNumber);

  // TODO: Implement API calls for these actions
  const handleSetRating = async (apiRating: number) => { // apiRating is already in 0-10 scale from StarRating component
    if (!isLoggedIn || !user?.id || !movieId) { alert("Please log in to rate movies."); return; }
    
    try {
      // apiRating already comes in 0-10 scale from the StarRating component's onSetRating call
      const response = await mdService.rateMovie(movieId, apiRating, user.id);
      
      if (response) {
        if (apiRating === 0) {
          // If we set rating to 0, it means we're removing the rating
          console.log("Rating removed");
          setUserRating(null);
        } else {
          // Backend sends 0-10, convert to 0-5 for UI state
          // Don't round here, we want to support half stars (0.5, 1.5, etc.)
          setUserRating(response.rating !== null ? response.rating / 2 : null);
        }
      }
    } catch (err) {
      console.error("Error setting rating:", err);
      alert("Could not save your rating.");
    }
  };
  const toggleFavorite = async () => {
    if (!isLoggedIn || !user?.id || !movieId) { 
      alert("Please log in to manage favorites."); 
      return; 
    }
    
    try {
      const newState = !isFavorite;
      console.log(`⭐ Toggling favorite status for movie ${movieId} to ${newState ? 'TRUE' : 'FALSE'}`);
      console.log(`Current user: ${user.id} (${user.username})`);
      
      setIsFavorite(newState); // Optimistically update UI
      
      console.log(`Adding movie ${movieId} to favorites: ${newState}`);
      // Use uppercase for GraphQL enum
      const result = await mdService.toggleUserListMovie(movieId, 'FAVORITES', newState, user.id);
      
      if (!result) {
        // If the API call failed, revert the UI
        console.error("Failed to toggle favorite status in the database");
        setIsFavorite(!newState);
        throw new Error("API returned unsuccessful result");
      } else {
        console.log(`Successfully ${newState ? 'added to' : 'removed from'} favorites`);
        // Update local state
        setIsFavorite(newState);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      alert("Could not update favorites. Please try again.");
    }
  };
  const toggleWatchlist = async () => {
    if (!isLoggedIn || !user?.id || !movieId) { 
      alert("Please log in to manage watchlist."); 
      return; 
    }
    
    try {
      const newState = !isInWatchlist;
      console.log(`📝 Toggling watchlist status for movie ${movieId} to ${newState ? 'TRUE' : 'FALSE'}`);
      console.log(`Current user: ${user.id} (${user.username})`);
      
      setIsInWatchlist(newState); // Optimistically update UI
      
      console.log(`Adding movie ${movieId} to watchlist: ${newState}`);
      // Use uppercase for GraphQL enum
      const result = await mdService.toggleUserListMovie(movieId, 'WATCHLIST', newState, user.id);
      
      if (!result) {
        // If the API call failed, revert the UI
        console.error("Failed to toggle watchlist status in the database");
        setIsInWatchlist(!newState);
        throw new Error("API returned unsuccessful result");
      } else {
        console.log(`Successfully ${newState ? 'added to' : 'removed from'} watchlist`);
        // Update local state
        setIsInWatchlist(newState);
      }
    } catch (error) {
      console.error("Error toggling watchlist:", error);
      alert("Could not update watchlist. Please try again.");
    }
  };
  const toggleWatched = async () => {
    if (!isLoggedIn || !user?.id || !movieId) { 
      alert("Please log in to manage watched list."); 
      return; 
    }
    
    try {
      const newState = !isWatched;
      console.log(`👁️ Toggling watched status for movie ${movieId} to ${newState ? 'TRUE' : 'FALSE'}`);
      console.log(`Current user: ${user.id} (${user.username})`);
      
      setIsWatched(newState); // Optimistically update UI
      
      console.log(`Adding movie ${movieId} to watched list: ${newState}`);
      // Use uppercase for GraphQL enum
      const result = await mdService.toggleUserListMovie(movieId, 'WATCHED', newState, user.id);
      
      if (!result) {
        // If the API call failed, revert the UI
        console.error("Failed to toggle watched status in the database");
        setIsWatched(!newState);
        throw new Error("API returned unsuccessful result");
      } else {
        console.log(`Successfully ${newState ? 'added to' : 'removed from'} watched list`);
        // Update local state
        setIsWatched(newState);
      }
    } catch (error) {
      console.error("Error toggling watched status:", error);
      alert("Could not update watched status. Please try again.");
    }
  };

  // --- Render Logic ---
  if (loading) {
    return (
      <div className="md-page-loading">
        <div className="loading-spinner"></div>
        <p>{t('loadingMovieDetails')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="md-page-error">
        <h3>{t('errorLoadingMovie')}</h3>
        <p>{error}</p>
        <div className="error-actions">
          <button onClick={() => window.location.reload()}>{t('retry')}</button>
          <Link to="/">{t('returnToHome')}</Link>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="md-page-error">
        <h3>{t('movieNotFound')}</h3>
        <p>{t('requestedMovieCouldNotBeLoaded')}</p>
        <div className="error-actions">
          <Link to="/">{t('returnToHome')}</Link>
        </div>
      </div>
    );
  }

  const directors = movie.crew?.filter(member => member.job?.toLowerCase() === 'director');
  const actors = movie.cast; // Already fetched as cast
  // const topLevelComments = comments.filter(comment => !comment.parent_comment_id);

  return (
    <div className="md-page">
      <div className="md-movie-detail-container">
        <header className="md-movie-header">
          <h1 className="md-movie-title">{movie.title}</h1>
          {/* Optional: Original Title if available and different */}
          {/* <p className="md-movie-original-title">Original Title Here</p> */}
        </header>

        <section className="md-movie-content">
          <div
            className="md-movie-poster1"
            style={{ width: '100%', maxWidth: '350px', margin: '0 auto' }}
          >
            <img
              src={movie.poster_url || undefined}
              alt={movie.title || ''}
              style={{ width: '100%', height: 'auto', borderRadius: '10px', maxWidth: '100%' }}
              className="movie-poster-img"
            />
          </div>

          <div className="md-movie-info">
            <div className="md-movie-ratings">
              <div className="md-rating-item md-average-user-rating-item">
                <span className="md-rating-label">Mov<span className="accent">i</span>e<span className="accent">Q</span></span>
                <div className="md-rating-value">
                  {typeof overallMovieRating === 'number' ? (overallMovieRating * 2).toFixed(1) : '-'}
                </div>
              </div>
              <div className="md-rating-item">
                <span className="md-rating-label">IMDb</span>
                <div className="md-rating-value">{typeof movie.imdb_rating === 'number' ? movie.imdb_rating.toFixed(1) : '-'}</div>
              </div>
              <div className="md-rating-item">
                <span className="md-rating-label">LTB</span>
                <div className="md-rating-value">{typeof movie.letterboxd_rating === 'number' ? movie.letterboxd_rating.toFixed(1) : '-'}</div>
              </div>
            </div>

            {/* Movie Info Rows (Release Date, Duration, Genres, etc.) */}
            <div className="md-detail-row">
              <strong className="md-detail-label">{t('releaseDate')}</strong>
              <span className="md-detail-value">{formatDate(movie.release_date)}</span>
            </div>
            <div className="md-detail-row">
              <strong className="md-detail-label">{t('duration')}</strong>
              <span className="md-detail-value">{formatDuration(movie.duration_minutes)}</span>
            </div>
            {movie.genres && movie.genres.length > 0 && (
              <div className="md-detail-row">
                <strong className="md-detail-label">{t('genres')}</strong>
                <span className="md-detail-value">
                  {formatGenreList(movie.genres)}
                </span>
              </div>
            )}
            {directors && directors.length > 0 && (
              <div className="md-detail-row">
                <strong className="md-detail-label">{t('director')}</strong>
                <span className="md-detail-value">
                  {formatPersonList(directors)}
                </span>
              </div>
            )}
            {actors && actors.length > 0 && (
              <div className="md-detail-row">
                <strong className="md-detail-label">{t('starring')}</strong>
                <span className="md-detail-value">
                  {(actors ?? []).slice(0, 10).map((actor, index) => (
                    <React.Fragment key={actor.person.id}>
                      <Link to={`/person/${actor.person.slug || actor.person.id}`} className="person-link">
                        {actor.person.name}
                      </Link>
                      {index < Math.min((actors ?? []).length, 10) - 1 && ', '}
                    </React.Fragment>
                  ))}
                </span>
              </div>
            )}

            <div className="spacer" style={{ flex: 1 }}></div>
            
            {/* User-specific interactive rating section */}
            {isLoggedIn && user ? (
              <div className="md-your-rating-section" 
                   style={{ 
                       margin: '25px 0 15px 0', 
                       padding: '15px 0', // Adjusted padding
                       borderTop: '1px solid var(--border-color)', 
                       borderBottom: '1px solid var(--border-color)',
                       display: 'flex', // Added for centering stars
                       justifyContent: 'left'
                   }}>
                <StarRating 
                  currentRating={userRating} 
                  onSetRating={handleSetRating} 
                  maxStars={5} 
                  interactive={true} 
                />
              </div>
            ) : (
              <div className="md-your-rating-section" 
                   style={{ 
                       margin: '25px 0 15px 0', 
                       padding: '15px 0',
                       borderTop: '1px solid var(--border-color)', 
                       borderBottom: '1px solid var(--border-color)',
                       display: 'flex',
                       justifyContent: 'left'
                   }}>
                <div className="md-non-interactive-rating">
                  <p style={{ margin: '0 0 10px 0' }}>{t('movieQ')} Rating:</p>
                  <StarRating 
                    currentRating={overallMovieRating !== null ? overallMovieRating : 0} 
                    onSetRating={() => {}} 
                    maxStars={5} 
                    interactive={false} 
                  />
                </div>
              </div>
            )}

            {/* User Actions with improved styling and proper disabled state */}
            <div className="md-user-actions">
              <button 
                className={`md-action-button favorites ${isFavorite ? 'active' : ''} ${!isLoggedIn ? 'not-logged' : ''}`} 
                onClick={toggleFavorite} 
                disabled={!isLoggedIn}
                title={!isLoggedIn ? t('pleaseLogInToAddToFavorites') : (isFavorite ? t('removeFromFavorites') : t('addToFavorites'))}
              >
                {isFavorite ? <FaHeart /> : <FaRegHeart />} {isFavorite ? t('favorited') : t('favorite')}
              </button>
              <button 
                className={`md-action-button watchlist ${isInWatchlist ? 'active' : ''} ${!isLoggedIn ? 'not-logged' : ''}`} 
                onClick={toggleWatchlist} 
                disabled={!isLoggedIn}
                title={!isLoggedIn ? t('pleaseLogInToAddToWatchlist') : (isInWatchlist ? t('removeFromWatchlist') : t('addToWatchlist'))}
              >
                {isInWatchlist ? <FaCheck /> : <FaPlus />} {t('watchlist')}
              </button>
              <button 
                className={`md-action-button watched ${isWatched ? 'active' : ''} ${!isLoggedIn ? 'not-logged' : ''}`} 
                onClick={toggleWatched} 
                disabled={!isLoggedIn}
                title={!isLoggedIn ? t('pleaseLogInToMarkAsWatched') : (isWatched ? t('markAsUnwatched') : t('markAsWatched'))}
              >
                {isWatched ? <FaCheck /> : <FaFilm />} {t('watched')}
              </button>
            </div>

          </div>
        </section>

        {movie.plot_summary && (
          <section className="md-movie-description">
            <h2>{t('plotSummary')}</h2>
            <p>{movie.plot_summary}</p>
          </section>
        )}

        {movie.trailer_url && (
          <section className="md-movie-trailer">
            <h2>{t('trailer')}</h2>
            <div className="md-trailer-container">
              <iframe
                src={movie.trailer_url.replace("watch?v=", "embed/")} // Basic YouTube embed conversion
                title={`${movie.title} Trailer`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </section>
        )}

        {/* Placeholder for Similar Movies Section */}
        {displayedSimilarMovies && displayedSimilarMovies.length > 0 && (
          <section className="md-similar-movies">
            <h2>{t('similarMovies')}</h2>
            <SimilarMoviesSection similarMovies={displayedSimilarMovies} />
          </section>
        )}

        {/* Comments Section */}
        <section className="md-comments-section">
          <h2>{t('comments')} ({comments.length})</h2>
          {isLoggedIn && user ? (
            <div className="md-add-comment">
              <textarea
                placeholder={`${t('commentingAs')} ${user.username}...`}
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                rows={3}
                disabled={isSubmittingComment}
              />
              <button className="md-submit-comment" onClick={handleAddComment} disabled={isSubmittingComment || newCommentText.trim() === ''}>
                {isSubmittingComment ? t('submitting') : t('submitComment')}
              </button>
            </div>
          ) : (
            <p className="md-login-prompt-comment">{t('pleaseLogInToPostAComment')}</p>
          )}
          <div className="md-comments-container">
            {loadingComments ? (
              <div className="md-loading-comments">{t('loadingComments')}</div>
            ) : currentCommentsToDisplay.length > 0 ? (
              currentCommentsToDisplay.map((comment) => (
                <CommentCard key={comment.id} comment={comment} />
              ))
            ) : (
              <p className="md-no-comments-message">{t('noCommentsYetBeTheFirstToComment')}</p>
            )}
          </div>
          {totalPages > 1 && (
            <div className="md-pagination">
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  className={`md-page-number${currentCommentPage === index + 1 ? ' active' : ''}`}
                  onClick={() => handlePageChange(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          )}
        </section>

      </div>
      <Footer />
    </div>
  );
};

export default MovieDetailsPage; 
