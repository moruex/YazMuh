import { useState } from 'react';
import './PersonDetailsPage.css';
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import Footer from '@components/app/Footer';
import { Movie } from '@src/types/Movie';
import MovieCard6 from '../movies/MovieCard6';

// --- Define Types ---
interface PersonDetailsData {
    id: number;
    name: string;
    birthDate?: string; // Optional
    placeOfBirth?: string; // Optional
    bio: string;
    profileImageUrl: string;
    knownForDepartment?: string; // e.g., Acting, Directing
    // Add other relevant fields like death date if applicable
}

// --- Mock Data ---
const samplePerson: PersonDetailsData = {
    id: 1,
    name: "Anthony Mackie",
    birthDate: "September 23, 1978",
    placeOfBirth: "New Orleans, Louisiana, USA",
    bio: "Anthony Mackie is an American actor. He has been featured in films, television series and Broadway and Off-Broadway plays, including Ma Rainey's Black Bottom, Drowning Crow, McReele, A Soldier's Play and Carl Hancock Rux's Talk, for which he won an Obie Award in 2002. He is best known for his role as Sam Wilson / Falcon / Captain America in the Marvel Cinematic Universe, appearing in films such as Captain America: The Winter Soldier, Avengers: Age of Ultron, Ant-Man, Captain America: Civil War, Avengers: Infinity War, and Avengers: Endgame, as well as the Disney+ miniseries The Falcon and the Winter Soldier.",
    profileImageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Anthony_Mackie_2024.png/330px-Anthony_Mackie_2024.png", // Replace with a real image URL
    knownForDepartment: "Acting",
};

const knownForCredits: Movie[] = [
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
    const [person] = useState<PersonDetailsData>(samplePerson);
    const [credits] = useState<Movie[]>(knownForCredits);
    const [isFavorite, setIsFavorite] = useState<boolean>(false);

    // --- Handlers ---
    const handleToggleFavorite = () => {
        setIsFavorite((prev: boolean) => !prev);
        console.log("Toggle Favorite clicked", !isFavorite);
        // Add API call logic here later
    };

    // Other actions can be added here (e.g., share)

    // --- Render JSX ---
    return (
        <div className='pd-page'>
            <div className="pd-person-detail-container"> {/* Renamed class */}
                <div className="pd-person-header"> {/* Renamed class */}
                    <h1 className="pd-person-name">{person.name}</h1> {/* Renamed class */}
                    {person.knownForDepartment && (
                        <p className="pd-person-known-for">Known For: {person.knownForDepartment}</p> /* Renamed class */
                    )}
                </div>

                <div className="pd-person-content"> {/* Renamed class */}
                    <div className="pd-person-profile-image">
                        <img src={person.profileImageUrl} alt={person.name} />
                    </div>

                    <div className="pd-person-info"> {/* Renamed class */}
                        {/* Basic Info Section */}
                        <div className="pd-person-basic-info"> {/* New class for layout */}
                            {person.birthDate && (
                                <div className="pd-detail-row">
                                    <span className="pd-detail-label">Born:</span>
                                    <span className="pd-detail-value">{person.birthDate} {person.placeOfBirth ? `in ${person.placeOfBirth}` : ''}</span>
                                </div>
                            )}
                            {/* Add more details like gender, etc. if needed */}
                        </div>

                        {/* Action Buttons */}
                        <div className="pd-user-actions">
                            <button
                                className={`pd-action-button favorites ${isFavorite ? 'active' : ''}`}
                                onClick={handleToggleFavorite}
                            >
                                {isFavorite ? <FaHeart /> : <FaRegHeart />} {isFavorite ? 'Favorited' : 'Favorites'}
                            </button>
                            {/* Add other buttons like 'Share' if needed */}
                        </div>

                        {/* Biography Section */}
                        <div className="pd-person-bio"> {/* Renamed class */}
                            <h2>Biography</h2>
                            <p>{person.bio}</p>
                        </div>
                    </div>
                </div>


                {/* Known For Section */}
                <div className="pd-known-for"> {/* Renamed class */}
                    <h2>Known For</h2>
                    <div className="pd-known-for-container"> {/* Renamed class */}
                        {credits.map((credit: Movie) => (
                            <MovieCard6 key={credit.id} movie={credit} />
                        ))}
                    </div>
                </div>

            </div>
            <Footer />
        </div>
    );
};

export default PersonDetailsPage;