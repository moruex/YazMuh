import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useRef, useEffect } from 'react';
import './MovieDetailsPage.css';
import { FaStar, FaHeart, FaRegHeart, FaTrash, FaEye, FaReply, FaPencilAlt, FaSave, FaTimes, FaPlus, FaCheck // Keep needed icons
 } from 'react-icons/fa';
import Footer from '@components/app/Footer'; // Assuming Footer path is correct
import MovieCard6 from './MovieCard6';
// --- Mock Current User ---
const MOCK_CURRENT_USER_ID = "CurrentUser"; // Replace with actual auth logic
const CommentCard = ({ comment, currentUser, onDelete, onEdit, onLike, }) => {
    const [showSpoiler, setShowSpoiler] = useState(false);
    const [isLiked, setIsLiked] = useState(false); // Local like state
    const [likeCount, setLikeCount] = useState(comment.likes);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(comment.content);
    const editTextAreaRef = useRef(null);
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
        if (editedContent.trim() === "")
            return;
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
    return (_jsxs("div", { className: "md-comment", children: [" ", _jsxs("div", { className: "md-comment-header", children: [_jsxs("div", { className: "md-comment-user", children: [_jsx("img", { src: comment.avatar, alt: comment.username, className: "md-user-avatar" // Original avatar class
                             }), _jsx("span", { className: "md-username", children: comment.username }), " "] }), _jsx("span", { className: "md-comment-date", children: comment.date }), " "] }), isEditing ? (_jsxs("div", { className: "md-comment-edit-form", children: [" ", _jsx("textarea", { ref: editTextAreaRef, className: "md-comment-edit-textarea" // New class
                        , value: editedContent, onChange: (e) => setEditedContent(e.target.value), rows: 3 }), _jsxs("div", { className: "md-comment-edit-actions", children: [" ", _jsxs("button", { className: "md-comment-edit-button cancel", onClick: handleCancelEdit, children: [" ", _jsx(FaTimes, {}), " Cancel"] }), _jsxs("button", { className: "md-comment-edit-button save", onClick: handleSaveEdit, children: [" ", _jsx(FaSave, {}), " Save"] })] })] })) : (_jsx(_Fragment, { children: comment.isSpoiler && !showSpoiler ? (_jsxs("button", { className: "md-spoiler-button" // New class for spoiler button
                    , onClick: () => setShowSpoiler(true), children: [_jsx(FaEye, {}), " Show Spoiler"] })) : (_jsx("div", { className: "md-comment-content", children: comment.content }) /* Original content class */) })), !isEditing && (_jsxs("div", { className: "md-comment-actions", children: [" ", _jsxs("button", { className: "md-like-button" // Original like button class
                        , onClick: handleLike, title: isLiked ? "Unlike" : "Like", children: [isLiked ? _jsx(FaHeart, { style: { color: "#d32f2f" } }) : _jsx(FaRegHeart, {}), " ", likeCount] }), _jsxs("button", { className: "md-reply-button", title: "Reply", children: [_jsx(FaReply, {}), " Reply"] }), isOwner && (_jsxs(_Fragment, { children: [_jsxs("button", { className: "md-edit-button" /* New specific class + generic action */, onClick: handleEditClick, title: "Edit Comment", children: [_jsx(FaPencilAlt, {}), " Edit"] }), _jsx("button", { className: "md-delete-button" /* New specific class + generic action */, onClick: handleDelete, title: "Delete Comment", children: _jsx(FaTrash, {}) })] }))] }))] }));
};
const MovieDetailsPage = () => {
    var _a, _b;
    const [userRating, setUserRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [currentCommentPage, setCurrentCommentPage] = useState(1);
    const [newCommentText, setNewCommentText] = useState("");
    const [isFavorite, /* setIsFavorite */] = useState(false); // Commented out setter
    const [/* isWatchlist */ , /* setIsWatchlist */] = useState(false); // Commented out state and setter
    const [/* isWatched */ , /* setIsWatched */] = useState(false); // Commented out state and setter
    // Use the same sample data including averageUserRating and comment userId/isSpoiler
    const movie = {
        id: 1, title: "Captain America: New World", originalTitle: "Captain America: New World", releaseYear: 2024, rating: 8.4, votes: 890, imdbRating: 8.2, imdbVotes: 7292, averageUserRating: 4.5, duration: "115 min", genres: ["Action", "Adventure", "Comedy", "Sci-Fi"], directors: ["Julius Onah"], actors: ["Harrison Ford", "Anthony Mackie", "Liv Tyler", "Tim Blake Nelson", "Carl Lumbly", "Shira Haas"], description: "Former Falcon now Captain America Sam Wilson (Anthony Mackie), in his role as the new superhero, faces a conspiracy that threatens the United States. He teams up with scientist Albertus to track down a mysterious mercenary. The villain's motivations are still unknown to the main character, which makes it difficult to stop him before his actions cause chaos. Sam has to rely on his own surroundings, the new Captain America and his mission: Save the world from evil through his skills of balancing humanity and patriotism.", posterUrl: "https://static.hdrezka.ac/i/2025/2/2/n276dc30a37e3ui87r65q.jpg", trailerUrl: "https://www.youtube.com/embed/MZ5i8_1Za3A"
    };
    const initialComments = [{
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
    const similarMovies = [
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
    const [comments, setComments] = useState(initialComments);
    const commentsPerPage = 5;
    // --- Handlers (Keep all handlers from second version) ---
    const handleAddComment = () => {
        if (newCommentText.trim() === "")
            return;
        const newComment = {
            id: Date.now(), userId: MOCK_CURRENT_USER_ID, username: "CurrentUser", avatar: "https://via.placeholder.com/40/cccccc/000000?text=ME", date: new Date().toISOString().split("T")[0], content: newCommentText, likes: 0, isSpoiler: false,
        };
        setComments(prevComments => [newComment, ...prevComments]);
        setNewCommentText("");
        setCurrentCommentPage(1);
        console.log("Adding comment:", newComment);
    };
    const handleDeleteComment = (id) => {
        setComments(prevComments => prevComments.filter(comment => comment.id !== id));
        console.log("Deleting comment:", id);
    };
    const handleEditComment = (id, newContent) => {
        setComments(prevComments => prevComments.map(comment => comment.id === id ? Object.assign(Object.assign({}, comment), { content: newContent }) : comment));
        console.log("Editing comment:", id, "New content:", newContent);
    };
    const handleLikeComment = (id) => { console.log("Liking/Unliking comment:", id); };
    const handlePageChange = (pageNumber) => { setCurrentCommentPage(pageNumber); };
    const handleRatingClick = (rating) => { setUserRating(rating); console.log("User rated:", rating); };
    const handleRatingHover = (rating) => { setHoverRating(rating); };
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
    _jsxs("div", { className: 'md-page', children: [_jsxs("div", { className: "md-movie-detail-container", children: [" ", _jsxs("div", { className: "md-movie-header", children: [" ", _jsx("h1", { className: "md-movie-title", children: movie.title }), " ", _jsxs("p", { className: "md-movie-original-title", children: [movie.originalTitle, " (", movie.releaseYear, ")"] }), " "] }), _jsxs("div", { className: "md-movie-content", children: [" ", _jsx("div", { className: "md-movie-poster1", children: _jsx("img", { src: movie.posterUrl, alt: movie.title }) }), _jsxs("div", { className: "md-movie-info", children: [" ", _jsxs("div", { className: "md-movie-ratings", children: [" ", movie.averageUserRating && (_jsxs("div", { className: "md-rating-item md-average-user-rating-item", children: [" ", _jsxs("a", { className: "md-rating-label", children: ["Mov", _jsx("span", { className: "accent", children: "i" }), "e", _jsx("span", { className: "accent", children: "Q" })] }), _jsxs("div", { className: "md-rating-value", children: [" ", movie.averageUserRating.toFixed(1), _jsx("span", { className: "md-rating-scale", children: " / 5" }), " ", _jsxs("span", { className: "md-votes", children: ["(", movie.votes, ")"] })] })] })), _jsxs("div", { className: "md-rating-item", children: [_jsx("span", { className: "md-rating-label", children: "IMDb" }), _jsxs("div", { className: "md-rating-value", children: [(_a = movie.imdbRating) === null || _a === void 0 ? void 0 : _a.toFixed(1), " ", _jsxs("span", { className: "md-votes", children: ["(", movie.imdbVotes, ")"] })] })] }), _jsxs("div", { className: "md-rating-item", children: [_jsx("span", { className: "md-rating-label", children: "KinoPoisk" }), _jsxs("div", { className: "md-rating-value", children: [(_b = movie.rating) === null || _b === void 0 ? void 0 : _b.toFixed(1), " ", _jsxs("span", { className: "md-votes", children: ["(", movie.votes, ")"] })] })] })] }), _jsxs("div", { className: "md-movie-details", children: [" ", _jsxs("div", { className: "md-detail-row", children: [" ", _jsx("span", { className: "md-detail-label", children: "Country:" }), " ", _jsx("span", { className: "md-detail-value", children: "USA" }), " "] }), _jsxs("div", { className: "md-detail-row", children: [" ", _jsx("span", { className: "md-detail-label", children: "Genre:" }), " ", _jsx("span", { className: "md-detail-value", children: movie.genres.join(", ") }), " "] }), _jsxs("div", { className: "md-detail-row", children: [" ", _jsx("span", { className: "md-detail-label", children: "Director:" }), " ", _jsx("span", { className: "md-detail-value", children: movie.directors.join(", ") }), " "] }), _jsxs("div", { className: "md-detail-row", children: [_jsx("span", { className: "md-detail-label", children: "Starring:" }), _jsx("span", { className: "md-detail-value", children: movie.actors.map((actor, index) => (_jsxs(React.Fragment, { children: [_jsx("a", { href: `/person/${index + 1}`, className: "person-link", children: actor }), index < movie.actors.length - 1 && ", "] }, index))) })] }), _jsxs("div", { className: "md-detail-row", children: [" ", _jsx("span", { className: "md-detail-label", children: "Duration:" }), " ", _jsx("span", { className: "md-detail-value", children: movie.duration }), " "] })] }), _jsxs("div", { className: "md-user-rating-container", children: [" ", _jsxs("div", { className: "md-star-rating", onMouseLeave: handleRatingLeave, children: [[...Array(5)].map((_, index) => {
                                                        const ratingValue = index + 1;
                                                        return (_jsx(FaStar, { 
                                                            // Use original star class 'star'
                                                            className: `md-star ${ratingValue <= (hoverRating || userRating) ? 'active' : ''}`, onClick: () => handleRatingClick(ratingValue), onMouseEnter: () => handleRatingHover(ratingValue) }, index));
                                                    }), userRating > 0 && _jsx("span", { className: "user-rating-value", children: userRating })] })] }), _jsxs("div", { className: "md-user-actions", children: [_jsxs("button", { className: "md-action-button favorites", onClick: handleAddToFavorites, children: [isFavorite ? _jsx(FaHeart, {}) : _jsx(FaRegHeart, {}), " ", isFavorite ? 'Favorited' : 'Favorites'] }), _jsxs("button", { className: "md-action-button watchlist", onClick: handleAddToWatchlist, children: [_jsx(FaPlus, {}), " Watchlist"] }), _jsxs("button", { className: "md-action-button watched", onClick: handleMarkAsWatched, children: [_jsx(FaCheck, {}), " Watched"] })] })] })] }), _jsxs("div", { className: "md-movie-description", children: [_jsxs("h2", { children: ["About the movie \"", movie.title, "\""] }), _jsx("p", { children: movie.description })] }), _jsxs("div", { className: "md-movie-trailer", children: [_jsx("h2", { children: "Movie Trailer" }), _jsx("div", { className: "md-trailer-container", children: _jsx("iframe", { src: movie.trailerUrl, title: `${movie.title} - trailer`, frameBorder: "0", allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture", allowFullScreen: true }) })] }), _jsxs("div", { className: "md-similar-movies", children: [_jsx("h2", { children: "Similar Movies" }), _jsx("div", { className: "md-similar-movies-container", children: similarMovies.map(simMovie => (_jsx(MovieCard6, { movie: simMovie }, simMovie.id))) })] }), _jsxs("div", { className: "md-comments-section", children: [_jsxs("h2", { children: ["Comments (", comments.length, ")"] }), _jsxs("div", { className: "md-add-comment", children: [_jsx("textarea", { placeholder: "Write your comment...", value: newCommentText, onChange: (e) => setNewCommentText(e.target.value), rows: 3 }), _jsx("button", { className: "md-submit-comment", onClick: handleAddComment, children: "Submit" })] }), _jsx("div", { className: "md-comments-container", children: currentComments.length > 0 ? (currentComments.map(comment => (_jsx(CommentCard, { comment: comment, currentUser: MOCK_CURRENT_USER_ID, onDelete: handleDeleteComment, onEdit: handleEditComment, onLike: handleLikeComment }, comment.id)))) : (
                                // Add a class for styling the 'no comments' message if needed
                                _jsx("p", { className: "md-no-comments-message", children: "No comments yet. Be the first to comment!" })) }), totalPages > 1 && (_jsx("div", { className: "pagination", children: [...Array(totalPages)].map((_, index) => (_jsx("button", { 
                                    // Use original page number class
                                    className: `page-number ${currentCommentPage === index + 1 ? 'active' : ''}`, onClick: () => handlePageChange(index + 1), children: index + 1 }, index))) }))] })] }), _jsx(Footer, {})] }));
};
export default MovieDetailsPage;
