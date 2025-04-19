import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import './PersonDetailsPage.css';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import Footer from '@components/app/Footer';
import MovieCard6 from '../movies/MovieCard6';
// --- Mock Data ---
const samplePerson = {
    id: 1,
    name: "Anthony Mackie",
    birthDate: "September 23, 1978",
    placeOfBirth: "New Orleans, Louisiana, USA",
    bio: "Anthony Mackie is an American actor. He has been featured in films, television series and Broadway and Off-Broadway plays, including Ma Rainey's Black Bottom, Drowning Crow, McReele, A Soldier's Play and Carl Hancock Rux's Talk, for which he won an Obie Award in 2002. He is best known for his role as Sam Wilson / Falcon / Captain America in the Marvel Cinematic Universe, appearing in films such as Captain America: The Winter Soldier, Avengers: Age of Ultron, Ant-Man, Captain America: Civil War, Avengers: Infinity War, and Avengers: Endgame, as well as the Disney+ miniseries The Falcon and the Winter Soldier.",
    profileImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Anthony_Mackie_2024.png/330px-Anthony_Mackie_2024.png", // Replace with a real image URL
    knownForDepartment: "Acting",
};
const knownForCredits = [
    {
        id: 1,
        title: "The Shawshank Redemption",
        year: 1994,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzMtY2YzZC00NmNlLWJiNDMtZDViZWM2MzIxZDYwXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_FMjpg_UX1000_.jpg",
        rating: 9.3,
        genres: ["Drama"],
        director: "Frank Darabont",
        runtime: 142,
        language: "English"
    },
    {
        id: 2,
        title: "The Godfather",
        year: 1972,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg",
        rating: 9.2,
        genres: ["Crime", "Drama"],
        director: "Francis Ford Coppola",
        runtime: 175,
        language: "English"
    },
    {
        id: 3,
        title: "Pulp Fiction",
        year: 1994,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItYzViMjE3YzI5MjljXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_.jpg",
        rating: 8.9,
        genres: ["Crime", "Drama"],
        director: "Quentin Tarantino",
        runtime: 154,
        language: "English"
    },
    {
        id: 6,
        title: "Inception",
        year: 2010,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_FMjpg_UX1000_.jpg",
        rating: 8.8,
        genres: ["Action", "Adventure", "Sci-Fi"],
        director: "Christopher Nolan",
        runtime: 148,
        language: "English"
    },
    {
        id: 7,
        title: "Interstellar",
        year: 2014,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BZjdkOTU3MDktN2IxOS00OGEyLWFmMjktY2FiMmZkNWIyODZiXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_FMjpg_UX1000_.jpg",
        rating: 8.6,
        genres: ["Adventure", "Drama", "Sci-Fi"],
        director: "Christopher Nolan",
        runtime: 169,
        language: "English"
    },
    {
        id: 9,
        title: "The Dark Knight",
        year: 2008,
        posterUrl: "https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_FMjpg_UX1000_.jpg",
        rating: 9.0,
        genres: ["Action", "Crime", "Drama"],
        director: "Christopher Nolan",
        runtime: 152,
        language: "English"
    },
];
const PersonDetailsPage = () => {
    const [person] = useState(samplePerson);
    const [credits] = useState(knownForCredits);
    const [isFavorite, setIsFavorite] = useState(false);
    // --- Handlers ---
    const handleToggleFavorite = () => {
        setIsFavorite((prev) => !prev);
        console.log("Toggle Favorite clicked", !isFavorite);
        // Add API call logic here later
    };
    // Other actions can be added here (e.g., share)
    // --- Render JSX ---
    return (_jsxs("div", { className: 'pd-page', children: [_jsxs("div", { className: "pd-person-detail-container", children: [" ", _jsxs("div", { className: "pd-person-header", children: [" ", _jsx("h1", { className: "pd-person-name", children: person.name }), " ", person.knownForDepartment && (_jsxs("p", { className: "pd-person-known-for", children: ["Known For: ", person.knownForDepartment] }) /* Renamed class */)] }), _jsxs("div", { className: "pd-person-content", children: [" ", _jsx("div", { className: "pd-person-profile-image", children: _jsx("img", { src: person.profileImageUrl, alt: person.name }) }), _jsxs("div", { className: "pd-person-info", children: [" ", _jsxs("div", { className: "pd-person-basic-info", children: [" ", person.birthDate && (_jsxs("div", { className: "pd-detail-row", children: [_jsx("span", { className: "pd-detail-label", children: "Born:" }), _jsxs("span", { className: "pd-detail-value", children: [person.birthDate, " ", person.placeOfBirth ? `in ${person.placeOfBirth}` : ''] })] }))] }), _jsx("div", { className: "pd-user-actions", children: _jsxs("button", { className: `pd-action-button favorites ${isFavorite ? 'active' : ''}`, onClick: handleToggleFavorite, children: [isFavorite ? _jsx(FaHeart, {}) : _jsx(FaRegHeart, {}), " ", isFavorite ? 'Favorited' : 'Favorites'] }) }), _jsxs("div", { className: "pd-person-bio", children: [" ", _jsx("h2", { children: "Biography" }), _jsx("p", { children: person.bio })] })] })] }), _jsxs("div", { className: "pd-known-for", children: [" ", _jsx("h2", { children: "Known For" }), _jsxs("div", { className: "pd-known-for-container", children: [" ", credits.map((credit) => (_jsx(MovieCard6, { movie: credit }, credit.id)))] })] })] }), _jsx(Footer, {})] }));
};
export default PersonDetailsPage;
