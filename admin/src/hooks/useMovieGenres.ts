import { useMutation } from "@apollo/client";
import { ADD_GENRE_TO_MOVIE } from "@graphql/mutations/movie.mutations";
import { useAuth } from "@contexts/AuthContext";

interface UseMovieGenresProps {
  onError: (message: string) => void;
  onSuccess?: () => void;
}

const useMovieGenres = ({ onError, onSuccess }: UseMovieGenresProps) => {
  const { admin } = useAuth();
  
  const [addGenreMutation, { loading: addGenreLoading }] = useMutation(ADD_GENRE_TO_MOVIE, {
    onError: (err) => {
      onError(`Failed to add genre: ${err.message}`);
    },
    onCompleted: () => {
      if (onSuccess) onSuccess();
    }
  });
  
  const addGenresToMovie = async (movieId: string, genreIds: string[]) => {
    if (!admin?.id) {
      onError("You must be logged in as an admin to perform this action.");
      return false;
    }
    
    if (!genreIds || genreIds.length === 0) {
      // No genres to add
      return true;
    }
    
    try {
      // Execute genre mutations sequentially to avoid race conditions
      for (const genreId of genreIds) {
        await addGenreMutation({
          variables: {
            performingAdminId: admin.id,
            movieId,
            genreId
          }
        });
      }
      return true;
    } catch (error) {
      console.error("Error adding genres to movie:", error);
      return false;
    }
  };
  
  return {
    addGenresToMovie,
    addGenreLoading
  };
};

export default useMovieGenres; 