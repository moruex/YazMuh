import { useMutation } from "@apollo/client";
import { ADD_CAST_MEMBER, ADD_CREW_MEMBER } from "@graphql/mutations/movie.mutations";
import { useAuth } from "@contexts/AuthContext";

interface UseMoviePersonnelProps {
  onError: (message: string) => void;
  onSuccess?: () => void;
}

const useMoviePersonnel = ({ onError, onSuccess }: UseMoviePersonnelProps) => {
  const { admin } = useAuth();
  
  const [addCastMemberMutation, { loading: addCastLoading }] = useMutation(ADD_CAST_MEMBER, {
    onError: (err) => {
      onError(`Failed to add actor: ${err.message}`);
    },
    onCompleted: () => {
      if (onSuccess) onSuccess();
    }
  });
  
  const [addCrewMemberMutation, { loading: addCrewLoading }] = useMutation(ADD_CREW_MEMBER, {
    onError: (err) => {
      onError(`Failed to add crew member: ${err.message}`);
    },
    onCompleted: () => {
      if (onSuccess) onSuccess();
    }
  });
  
  const addActorsToMovie = async (movieId: string, actorIds: string[]) => {
    if (!admin?.id) {
      onError("You must be logged in as an admin to perform this action.");
      return false;
    }
    
    if (!actorIds || actorIds.length === 0) {
      // No actors to add
      return true;
    }
    
    try {
      // Add actors to the movie with sequential mutations
      for (let i = 0; i < actorIds.length; i++) {
        await addCastMemberMutation({
          variables: {
            performingAdminId: admin.id,
            movieId,
            personId: actorIds[i],
            castOrder: i + 1 // Give them an order based on their array position
          }
        });
      }
      return true;
    } catch (error) {
      console.error("Error adding actors to movie:", error);
      return false;
    }
  };
  
  const addDirectorsToMovie = async (movieId: string, directorIds: string[]) => {
    if (!admin?.id) {
      onError("You must be logged in as an admin to perform this action.");
      return false;
    }
    
    if (!directorIds || directorIds.length === 0) {
      // No directors to add
      return true;
    }
    
    try {
      // Add directors to the movie with sequential mutations
      for (const directorId of directorIds) {
        await addCrewMemberMutation({
          variables: {
            performingAdminId: admin.id,
            movieId,
            personId: directorId,
            job: "Director",
            department: "Directing"
          }
        });
      }
      return true;
    } catch (error) {
      console.error("Error adding directors to movie:", error);
      return false;
    }
  };
  
  return {
    addActorsToMovie,
    addDirectorsToMovie,
    isLoading: addCastLoading || addCrewLoading
  };
};

export default useMoviePersonnel; 