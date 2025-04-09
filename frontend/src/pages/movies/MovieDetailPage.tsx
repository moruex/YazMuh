import React, { useState, useRef, useEffect } from 'react';
import './MovieDetailsPage.css';
import {
    FaStar, FaHeart, FaRegHeart, FaTrash, FaEye,
    FaReply, FaPencilAlt, FaSave, FaTimes, FaPlus, FaCheck // Keep needed icons
} from 'react-icons/fa';
import Footer from '@components/app/Footer'; // Assuming Footer path is correct
import MovieCard6 from './MovieCard6';

// --- Interfaces (Keep updated interfaces) ---
interface MovieDetailsData {
    id: number;
    title: string;
    originalTitle: string;
    releaseYear: number;
    rating: number; // KinoPoisk or site rating
    votes: number;
    imdbRating: number;
    imdbVotes: number;
    averageUserRating?: number; // Average rating from site users
    duration: string;
    genres: string[];
    directors: string[];
    actors: string[];
    description: string;
    posterUrl: string;
    trailerUrl: string;
}

interface Comment {
    id: number;
    userId: string | number; // ID of the user who posted
    username: string;
    avatar: string;
    date: string;
    content: string;
    likes: number;
    isSpoiler?: boolean; // Spoiler flag
}

interface SimilarMovie {
    id: number;
    title: string;
    posterUrl: string;
    year: number;
    rating: number;
}

// --- Mock Current User ---
const MOCK_CURRENT_USER_ID = "CurrentUser"; // Replace with actual auth logic

// --- CommentCard Component (Handles individual comment logic) ---
interface CommentCardProps {
    comment: Comment;
    currentUser: string | number;
    onDelete: (id: number) => void;
    onEdit: (id: number, newContent: string) => void;
    onLike: (id: number) => void;
}

const CommentCard: React.FC<CommentCardProps> = ({
    comment,
    currentUser,
    onDelete,
    onEdit,
    onLike,
}) => {
    const [showSpoiler, setShowSpoiler] = useState(false);
    const [isLiked, setIsLiked] = useState(false); // Local like state
    const [likeCount, setLikeCount] = useState(comment.likes);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);
    const editTextAreaRef = useRef<HTMLTextAreaElement>(null);
    const isOwner = comment.userId === currentUser;

    const handleLike = () => {
        const newLikeStatus = !isLiked;
        setIsLiked(newLikeStatus);
        setLikeCount(newLikeStatus ? likeCount + 1 : likeCount - 1);
        onLike(comment.id); // Notify parent
    };

    const handleDelete = () => {
        if (isOwner) {
            onDelete(comment.id);
        }
    };

    const handleEditClick = () => {
        if (isOwner) {
            setEditedContent(comment.content);
            setIsEditing(true);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    const handleSaveEdit = () => {
        if (editedContent.trim() === "") return;
        if (editedContent !== comment.content && isOwner) {
            onEdit(comment.id, editedContent);
        }
        setIsEditing(false);
    };

    useEffect(() => {
        if (isEditing && editTextAreaRef.current) {
            editTextAreaRef.current.focus();
            editTextAreaRef.current.selectionStart = editTextAreaRef.current.value.length;
            editTextAreaRef.current.selectionEnd = editTextAreaRef.current.value.length;
        }
    }, [isEditing]);

    // Use class names from the *first* CSS file where appropriate
    return (
        <div className="md-comment"> {/* Use original comment class */}
            <div className="md-comment-header">
                <div className="md-comment-user">
                    <img
                        src={comment.avatar}
                        alt={comment.username}
                        className="md-user-avatar" // Original avatar class
                    />
                    <span className="md-username">{comment.username}</span> {/* Original username class */}
                </div>
                <span className="md-comment-date">{comment.date}</span> {/* Original date class */}
            </div>

            {isEditing ? (
                <div className="md-comment-edit-form"> {/* New class for edit form */}
                    <textarea
                        ref={editTextAreaRef}
                        className="md-comment-edit-textarea" // New class
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        rows={3}
                    />
                    <div className="md-comment-edit-actions"> {/* New class */}
                        <button className="md-comment-edit-button cancel" onClick={handleCancelEdit}> {/* New class */}
                            <FaTimes /> Cancel
                        </button>
                        <button className="md-comment-edit-button save" onClick={handleSaveEdit}> {/* New class */}
                            <FaSave /> Save
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {comment.isSpoiler && !showSpoiler ? (
                        <button
                            className="md-spoiler-button" // New class for spoiler button
                            onClick={() => setShowSpoiler(true)}
                        >
                            <FaEye /> Show Spoiler
                        </button>
                    ) : (
                        <div className="md-comment-content">{comment.content}</div> /* Original content class */
                    )}
                </>
            )}

            {!isEditing && (
                <div className="md-comment-actions"> {/* Original actions class */}
                    {/* Use original button classes if they make sense, or new specific ones */}
                    <button
                        className="md-like-button" // Original like button class
                        onClick={handleLike}
                        title={isLiked ? "Unlike" : "Like"}
                    >
                        {/* Keep dynamic icon based on like state */}
                        {isLiked ? <FaHeart style={{ color: "#d32f2f" }} /> : <FaRegHeart />} {/* Use original active color */}
                        {likeCount}
                    </button>
                    <button className="md-reply-button" title="Reply">
                        <FaReply /> Reply
                    </button>
                    {/* Add new Edit/Delete buttons using appropriate classes */}
                    {isOwner && (
                        <>
                            <button
                                className="md-edit-button" /* New specific class + generic action */
                                onClick={handleEditClick}
                                title="Edit Comment"
                            >
                                <FaPencilAlt /> Edit
                            </button>
                            <button
                                className="md-delete-button" /* New specific class + generic action */
                                onClick={handleDelete}
                                title="Delete Comment"
                            >
                                <FaTrash />
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

const MovieDetailsPage = () => {
    const [userRating, setUserRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [currentCommentPage, setCurrentCommentPage] = useState<number>(1);
    const [newCommentText, setNewCommentText] = useState("");

    const [isFavorite, setIsFavorite] = useState(false);
    const [isWatchlist, setIsWatchlist] = useState(false);
    const [isWatched, setIsWatched] = useState(false);

    // Use the same sample data including averageUserRating and comment userId/isSpoiler
    const movie: MovieDetailsData = {
        id: 1, title: "Captain America: New World", originalTitle: "Captain America: New World", releaseYear: 2024, rating: 8.4, votes: 890, imdbRating: 8.2, imdbVotes: 7292, averageUserRating: 4.5, duration: "115 min", genres: ["Action", "Adventure", "Comedy", "Sci-Fi"], directors: ["Julius Onah"], actors: ["Harrison Ford", "Anthony Mackie", "Liv Tyler", "Tim Blake Nelson", "Carl Lumbly", "Shira Haas"], description: "Former Falcon now Captain America Sam Wilson (Anthony Mackie), in his role as the new superhero, faces a conspiracy that threatens the United States. He teams up with scientist Albertus to track down a mysterious mercenary. The villain's motivations are still unknown to the main character, which makes it difficult to stop him before his actions cause chaos. Sam has to rely on his own surroundings, the new Captain America and his mission: Save the world from evil through his skills of balancing humanity and patriotism.", posterUrl: "https://static.hdrezka.ac/i/2025/2/2/n276dc30a37e3ui87r65q.jpg", trailerUrl: "https://www.youtube.com/embed/MZ5i8_1Za3A"
    };
    const initialComments: Comment[] = [{
        id: 1,
        userId: "CurrentUser",
        username: "MarvelFan",
        avatar: "https://static.hdrezka.ac/i/2025/2/2/n276dc30a37e3ui87r65q.jpg",
        date: "2025-03-15",
        content: "Great movie! Anthony Mackie perfectly fits the role of Captain America.",
        likes: 24
    },
    {
        id: 2,
        userId: "CurrentUser",
        username: "SuperheroLover",
        avatar: "https://static.hdrezka.ac/i/2025/2/2/n276dc30a37e3ui87r65q.jpg",
        date: "2025-03-14",
        content: "The plot is a bit predictable, but the action scenes are excellent!",
        likes: 18,
        isSpoiler: true
    },
    {
        id: 3,
        userId: "bakd",
        username: "CinemaExpert",
        avatar: "https://static.hdrezka.ac/i/2025/2/2/n276dc30a37e3ui87r65q.jpg",
        date: "2025-03-13",
        content: "Harrison Ford is magnificent in his role, as always!",
        likes: 32
    },
    {
        id: 4,
        userId: "bakd",
        username: "MCUfanatic",
        avatar: "https://static.hdrezka.ac/i/2025/2/2/n276dc30a37e3ui87r65q.jpg",
        date: "2025-03-12",
        content: "Special effects are top-notch, but the script could have been better.",
        likes: 15
    },
    {
        id: 5,
        userId: "bakd",
        username: "FilmCritic",
        avatar: "https://static.hdrezka.ac/i/2025/2/2/n276dc30a37e3ui87r65q.jpg",
        date: "2025-03-11",
        content: "A worthy continuation of the franchise, I recommend watching it!",
        likes: 27
    },
    {
        id: 6,
        userId: "bakd",
        username: "MovieBuff",
        avatar: "https://static.hdrezka.ac/i/2025/2/2/n276dc30a37e3ui87r65q.jpg",
        date: "2025-03-10",
        content: "One of the best Marvel movies in recent times!",
        likes: 41
    }
    ];
    const similarMovies: SimilarMovie[] = [
        {
            id: 101,
            title: "Avengers: Endgame",
            posterUrl: "https://static.hdrezka.ac/i/2025/2/2/n276dc30a37e3ui87r65q.jpg",
            year: 2019,
            rating: 8.9
        },
        {
            id: 102,
            title: "Iron Man 3",
            posterUrl: "https://static.hdrezka.ac/i/2025/2/2/n276dc30a37e3ui87r65q.jpg",
            year: 2013,
            rating: 7.8
        },
        {
            id: 103,
            title: "Black Widow",
            posterUrl: "https://static.hdrezka.ac/i/2025/2/2/n276dc30a37e3ui87r65q.jpg",
            year: 2021,
            rating: 7.5
        },
        {
            id: 104,
            title: "Thor: Love and Thunder",
            posterUrl: "https://static.hdrezka.ac/i/2025/2/2/n276dc30a37e3ui87r65q.jpg",
            year: 2022,
            rating: 7.2
        },
        {
            id: 104,
            title: "Thor: Love and Thunder",
            posterUrl: "https://static.hdrezka.ac/i/2025/2/2/n276dc30a37e3ui87r65q.jpg",
            year: 2022,
            rating: 7.2
        }
    ];

    const [comments, setComments] = useState<Comment[]>(initialComments);
    const commentsPerPage = 5;

    // --- Handlers (Keep all handlers from second version) ---
    const handleAddComment = () => {
        if (newCommentText.trim() === "") return;
        const newComment: Comment = {
            id: Date.now(), userId: MOCK_CURRENT_USER_ID, username: "CurrentUser", avatar: "https://via.placeholder.com/40/cccccc/000000?text=ME", date: new Date().toISOString().split("T")[0], content: newCommentText, likes: 0, isSpoiler: false,
        };
        setComments(prevComments => [newComment, ...prevComments]); setNewCommentText(""); setCurrentCommentPage(1); console.log("Adding comment:", newComment);
    };
    const handleDeleteComment = (id: number) => {
        setComments(prevComments => prevComments.filter(comment => comment.id !== id)); console.log("Deleting comment:", id);
    };
    const handleEditComment = (id: number, newContent: string) => {
        setComments(prevComments => prevComments.map(comment => comment.id === id ? { ...comment, content: newContent } : comment)); console.log("Editing comment:", id, "New content:", newContent);
    };
    const handleLikeComment = (id: number) => { console.log("Liking/Unliking comment:", id); };
    const handlePageChange = (pageNumber: number) => { setCurrentCommentPage(pageNumber); };
    const handleRatingClick = (rating: number) => { setUserRating(rating); console.log("User rated:", rating); };
    const handleRatingHover = (rating: number) => { setHoverRating(rating); };
    const handleRatingLeave = () => { setHoverRating(0); };
    const handleAddToFavorites = () => console.log("Add to Favorites clicked");
    const handleAddToWatchlist = () => console.log("Add to Watchlist clicked");
    const handleMarkAsWatched = () => console.log("Mark as Watched clicked");

    // --- Pagination Logic (Keep from second version) ---
    const totalPages = Math.ceil(comments.length / commentsPerPage);
    const indexOfLastComment = currentCommentPage * commentsPerPage;
    const indexOfFirstComment = indexOfLastComment - commentsPerPage;
    const currentComments = comments.slice(indexOfFirstComment, indexOfLastComment);

    // --- Render JSX (Use original CSS classes where possible) ---
    return (
        // Use original wrapper class 'md-page'
        <div className='md-page'>
            <div className="md-movie-detail-container"> {/* Original container */}
                <div className="md-movie-header"> {/* Original header */}
                    <h1 className="md-movie-title">{movie.title}</h1> {/* Original title */}
                    <p className="md-movie-original-title">{movie.originalTitle} ({movie.releaseYear})</p> {/* Original original title */}
                </div>

                <div className="md-movie-content"> {/* Original content layout */}
                    {/* Use md-movie-poster1 if that was the original class */}
                    <div className="md-movie-poster1">
                        <img src={movie.posterUrl} alt={movie.title} />
                    </div>

                    <div className="md-movie-info"> {/* Original info section */}
                        <div className="md-movie-ratings"> {/* Original ratings container */}
                            {/* New Average User Rating Item - needs new CSS or adapt existing */}
                            {movie.averageUserRating && (
                                <div className="md-rating-item md-average-user-rating-item"> {/* Add specific class */}
                                    <a className="md-rating-label">Mov<span className="accent">i</span>e<span className="accent">Q</span></a>
                                    <div className="md-rating-value"> {/* Add specific class */}
                                        {movie.averageUserRating.toFixed(1)}
                                        <span className="md-rating-scale"> / 5</span> {/* Add specific class */}
                                        <span className="md-votes">({movie.votes})</span>
                                    </div>
                                </div>
                            )}
                            <div className="md-rating-item">
                                <span className="md-rating-label">IMDb</span>
                                <div className="md-rating-value">{movie.imdbRating?.toFixed(1)} <span className="md-votes">({movie.imdbVotes})</span></div>
                            </div>
                            {/* Use original rating item structure */}
                            <div className="md-rating-item">
                                <span className="md-rating-label">KinoPoisk</span>
                                <div className="md-rating-value">{movie.rating?.toFixed(1)} <span className="md-votes">({movie.votes})</span></div>
                            </div>
                        </div>

                        <div className="md-movie-details"> {/* Original details */}
                            {/* Use original detail row structure */}
                            <div className="md-detail-row"> <span className="md-detail-label">Country:</span> <span className="md-detail-value">USA</span> </div>
                            <div className="md-detail-row"> <span className="md-detail-label">Genre:</span> <span className="md-detail-value">{movie.genres.join(", ")}</span> </div>
                            <div className="md-detail-row"> <span className="md-detail-label">Director:</span> <span className="md-detail-value">{movie.directors.join(", ")}</span> </div>
                            {/* <div className="md-detail-row"> <span className="md-detail-label">Starring:</span> <span className="md-detail-value">{movie.actors.join(", ")}</span> </div> */}
                            <div className="md-detail-row">
                                <span className="md-detail-label">Starring:</span>
                                <span className="md-detail-value">
                                    {movie.actors.map((actor, index) => (
                                        <React.Fragment key={index}>
                                            <a href={`/person/${index + 1}`} className="person-link">
                                                {actor}
                                            </a>
                                            {index < movie.actors.length - 1 && ", "}
                                        </React.Fragment>
                                    ))}
                                </span>
                            </div>
                            <div className="md-detail-row"> <span className="md-detail-label">Duration:</span> <span className="md-detail-value">{movie.duration}</span> </div>
                        </div>

                        {/* User's Personal Rating - Use original structure but keep logic */}
                        <div className="md-user-rating-container"> {/* Keep this structure/class if alignment depends on it */}
                            {/* <span className="rating-title">Your Rating:</span> Maybe remove title if not in original */}
                            <div className="md-star-rating" onMouseLeave={handleRatingLeave}>
                                {[...Array(5)].map((_, index) => {
                                    const ratingValue = index + 1;
                                    return (
                                        <FaStar
                                            key={index}
                                            // Use original star class 'star'
                                            className={`md-star ${ratingValue <= (hoverRating || userRating) ? 'active' : ''}`}
                                            onClick={() => handleRatingClick(ratingValue)}
                                            onMouseEnter={() => handleRatingHover(ratingValue)}
                                        />
                                    );
                                })}
                                {userRating > 0 && <span className="user-rating-value">{userRating}</span>}
                            </div>
                        </div>

                        {/* Action Buttons - Use original wrapper, but new buttons */}
                        <div className="md-user-actions">
                            {/* Use original button class 'md-action-button' for base style */}
                            <button className="md-action-button favorites" onClick={handleAddToFavorites}>
                                {isFavorite ? <FaHeart /> : <FaRegHeart />} {isFavorite ? 'Favorited' : 'Favorites'}
                            </button>
                            <button className="md-action-button watchlist" onClick={handleAddToWatchlist}>
                                <FaPlus /> Watchlist
                            </button>
                            <button className="md-action-button watched" onClick={handleMarkAsWatched}>
                                <FaCheck /> Watched
                            </button>
                        </div>
                    </div>
                </div>

                {/* Keep remaining sections using original classes */}
                <div className="md-movie-description">
                    <h2>About the movie "{movie.title}"</h2>
                    <p>{movie.description}</p>
                </div>

                <div className="md-movie-trailer">
                    <h2>Movie Trailer</h2>
                    <div className="md-trailer-container">
                        <iframe src={movie.trailerUrl} title={`${movie.title} - trailer`} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                    </div>
                </div>

                <div className="md-similar-movies">
                    <h2>Similar Movies</h2>
                    <div className="md-similar-movies-container">
                        {similarMovies.map(simMovie => (
                            <MovieCard6 movie={simMovie} index={undefined} />
                        ))}
                    </div>
                </div>

                <div className="md-comments-section">
                    <h2>Comments ({comments.length})</h2>
                    {/* Use original add comment structure */}
                    <div className="md-add-comment">
                        <textarea
                            placeholder="Write your comment..."
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                            rows={3}
                        />
                        {/* Use original submit button class */}
                        <button className="md-submit-comment" onClick={handleAddComment}>
                            Submit
                        </button>
                    </div>
                    <div className="md-comments-container">
                        {currentComments.length > 0 ? (
                            currentComments.map(comment => (
                                <CommentCard
                                    key={comment.id}
                                    comment={comment}
                                    currentUser={MOCK_CURRENT_USER_ID}
                                    onDelete={handleDeleteComment}
                                    onEdit={handleEditComment}
                                    onLike={handleLikeComment}
                                />
                            ))
                        ) : (
                            // Add a class for styling the 'no comments' message if needed
                            <p className="md-no-comments-message">
                                No comments yet. Be the first to comment!
                            </p>
                        )}
                    </div>
                    {/* Use original pagination structure */}
                    {totalPages > 1 && (
                        <div className="pagination">
                            {[...Array(totalPages)].map((_, index) => (
                                <button
                                    key={index}
                                    // Use original page number class
                                    className={`page-number ${currentCommentPage === index + 1 ? 'active' : ''}`}
                                    onClick={() => handlePageChange(index + 1)}
                                >
                                    {index + 1}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default MovieDetailsPage;
