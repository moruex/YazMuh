import { gql } from '@apollo/client';
import client from '../config/apolloClient';
// User type might be imported if needed for request/response, but GQL handles types primarily
// import { User } from './authService'; 

// --- GraphQL Queries & Mutations (ensure these align with your backend schema) ---

const GET_MOVIE_DETAILS = gql`
  query GetMovieDetails($id: ID!, $userId: ID!, $skipUserData: Boolean = false) {
    movie(id: $id) {
      id
      title
      release_date
      poster_url
      plot_summary
      duration_minutes
      trailer_url
      movieq_rating
      imdb_rating
      letterboxd_rating
      slug
      genres {
        id
        name
      }
      cast {
        id
        person {
          id
          name
          profile_image_url
          slug
        }
        character_name
      }
      crew {
        id
        person {
          id
          name
          profile_image_url
          slug
        }
        job
        department
      }
    }
    
    # User specific data
    isFavorite: isMovieInUserList(userId: $userId, movieId: $id, listType: FAVORITES) @skip(if: $skipUserData)
    isWatched: isMovieInUserList(userId: $userId, movieId: $id, listType: WATCHED) @skip(if: $skipUserData)
    isInWatchlist: isMovieInUserList(userId: $userId, movieId: $id, listType: WATCHLIST) @skip(if: $skipUserData)
  }
`;

const GET_SIMILAR_MOVIES_BY_TITLE = gql`
  query GetSimilarMoviesByTitle($title: String!, $limit: Int) {
    movies(search: $title, limit: $limit) { 
      id
      title
      slug
      poster_url
      movieq_rating
      release_date
    }
  }
`;

const GET_USER_LISTS = gql`
  query GetUserLists($userId: ID!) {
    userFavorites: userMovieLists(userId: $userId, listType: FAVORITES) {
      id
      movie {
        id
        title
        poster_url
        release_date
        slug
      }
    }
    userWatched: userMovieLists(userId: $userId, listType: WATCHED) {
      id
      movie {
        id
        title
        poster_url
        release_date
        slug
      }
    }
    userWatchlist: userMovieLists(userId: $userId, listType: WATCHLIST) {
      id
      movie {
        id
        title
        poster_url
        release_date
        slug
      }
    }
  }
`;

const GET_USER_MOVIES = gql`
  query GetUserMovies($userId: ID!, $listType: ListType!) {
    userMovieLists(userId: $userId, listType: $listType) {
      id
      movie_id
      list_type
      movie {
        id
        title
        release_date
        poster_url
        slug
        movieq_rating
      }
    }
  }
`;

// Query to fetch a user's rating for a movie
const GET_USER_RATING = gql`
  query GetUserRating($userId: ID!, $movieId: ID!) {
    userRating(userId: $userId, movieId: $movieId) {
      id
      rating
    }
  }
`;

// --- TypeScript Interfaces (ensure these align with GQL schema and query responses) ---

export interface PersonTeaser {
  id: string;
  name: string;
  slug?: string | null;
  profile_image_url?: string | null;
}

export interface Genre {
  id: string;
  name: string;
}

export interface UserForComment {
    id: string;
    username: string;
    avatar_url: string | null;
}

export interface CommentData { // Corresponds to comments in GET_MOVIE_DETAILS
    id: string;
    content: string;
    user: UserForComment;
    parent_comment_id: string | null;
    likes_count: number;
    is_liked_by_me?: boolean | null; // Optional based on query
    created_at: string;
    updated_at: string;
    replies?: CommentData[]; // For nested comments, if handled client-side
}

export interface CastMember {
  id: string;
  person: PersonTeaser;
  character_name: string | null;
  // cast_order: number | null; // If queried
}

export interface CrewMember {
  id: string;
  person: PersonTeaser;
  job: string | null;
  department: string | null;
}

export interface MovieTeaserData { // For lists of movies (e.g., similar)
    id: string;
    title: string;
    slug?: string; // Add if your teaser links use slugs
    poster_url: string | null;
    movieq_rating: number | null;
    release_date: string | null;
}

// This is the main data structure for the movie details page
export interface MovieDetailData {
  id: string;
  title: string;
  release_date: string;
  plot_summary: string | null;
  poster_url: string | null;
  duration_minutes: number | null;
  trailer_url: string | null;
  movieq_rating: number | null;
  imdb_rating: number | null;
  letterboxd_rating: number | null;
  
  // Updated properties to match our GraphQL query response
  userRating?: number | null;
  isFavorite?: boolean;
  isWatched?: boolean;
  isInWatchlist?: boolean;
  
  genres: Genre[] | null;
  cast: CastMember[] | null;
  crew: CrewMember[] | null;
  comments: CommentData[] | null;
  similar: MovieTeaserData[] | null;
}

interface UserListsResponse {
  userFavorites: {
    id: string;
    movie: {
      id: string;
      title: string;
      poster_url: string;
      release_date: string;
      slug: string;
    };
  }[] | null;
  userWatched: {
    id: string;
    movie: {
      id: string;
      title: string;
      poster_url: string;
      release_date: string;
      slug: string;
    };
  }[] | null;
  userWatchlist: {
    id: string;
    movie: {
      id: string;
      title: string;
      poster_url: string;
      release_date: string;
      slug: string;
    };
  }[] | null;
}

interface UserMoviesResponse {
  userMovieLists: {
    id: string;
    movie_id: string;
    list_type: string;
    movie: {
      id: string;
      title: string;
      release_date: string;
      poster_url: string;
      slug: string;
      movieq_rating: number;
    };
  }[];
}

// --- Service Functions ---

const getMovieDetails = async (
  id: string,
  userId: string | null = null,
  skipUserData: boolean = userId === null
): Promise<any> => {
  console.log(`Fetching movie details for movie ${id} and user ${userId || 'none'}`);
  try {
          if (!userId) {
      // If no userId is provided, use a simplified query that doesn't require userId
      const { data } = await client.query({
        query: gql`
          query GetMovieDetailsNoUser($id: ID!) {
            movie(id: $id) {
              id
              title
              release_date
              poster_url
              plot_summary
              duration_minutes
              trailer_url
              movieq_rating
              imdb_rating
              letterboxd_rating
              slug
              genres {
                id
                name
              }
              cast {
                id
                person {
                  id
                  name
                  profile_image_url
                  slug
                }
                character_name
              }
              crew {
                id
                person {
                  id
                  name
                  profile_image_url
                  slug
                }
                job
                department
              }
            }
          }
        `,
        variables: { id },
        fetchPolicy: 'network-only',
      });
      return data.movie;
    }
    
    // If userId is provided, use the full query with user-specific data
    const { data } = await client.query({
      query: GET_MOVIE_DETAILS,
      variables: { id, userId, skipUserData },
      fetchPolicy: 'network-only', // Don't use cache
    });
    
    // Fetch user rating separately
    if (userId && !skipUserData) {
      try {
        const ratingResponse = await client.query({
          query: GET_USER_RATING,
          variables: { userId, movieId: id },
          fetchPolicy: 'network-only',
        });
        
        // Combine user rating with movie data
        if (ratingResponse.data?.userRating) {
          return {
            ...data.movie,
            isFavorite: data.isFavorite,
            isWatched: data.isWatched,
            isInWatchlist: data.isInWatchlist,
            userRating: ratingResponse.data.userRating.rating,
          };
        }
      } catch (ratingError) {
        console.error('Error fetching user rating:', ratingError);
        // Continue with movie data even if rating fetch fails
      }
    }
    
    // Return combined data structure
    return {
      ...data.movie,
      isFavorite: data.isFavorite,
      isWatched: data.isWatched,
      isInWatchlist: data.isInWatchlist,
    };
  } catch (error) {
    console.error('Error fetching movie details:', error);
    throw error;
  }
};

const getSimilarMoviesByTitle = async (title: string, limit: number = 6): Promise<MovieTeaserData[] | null> => {
  if (!title) return null;
  try {
    const { data, errors } = await client.query<{ movies: MovieTeaserData[] | null }>({
      query: GET_SIMILAR_MOVIES_BY_TITLE,
      variables: { title, limit },
    });
    if (errors) throw new Error(errors.map(e => e.message).join('\\n'));
    return data?.movies || [];
  } catch (err) {
    console.error(`Error fetching similar movies for "${title}":`, err);
    return []; 
  }
};

const getUserLists = async (userId: string): Promise<UserListsResponse | null> => {
  try {
    const { data } = await client.query<UserListsResponse>({
      query: GET_USER_LISTS,
      variables: { userId },
      fetchPolicy: 'network-only', // Don't use cache
    });
    
    // Return the data directly, it already matches our expected format
    return data;
  } catch (error) {
    console.error('Error fetching user lists:', error);
    return null;
  }
};

// Remove the incorrect local typeDefs for ListType
export type UserListType = 'favorites' | 'watched' | 'watchlist';

// Helper function to normalize list type to lowercase
export function normalizeListType(listType: string): UserListType {
  // Always return lowercase version
  return listType.toLowerCase() as UserListType;
}

export function toGraphQLEnumListType(listType: string): string {
  const upperCaseType = listType.toUpperCase();
  if (!['FAVORITES', 'WATCHED', 'WATCHLIST'].includes(upperCaseType)) {
    throw new Error(`Invalid list type: ${listType}`);
  }
  return upperCaseType;
}

const getUserMovies = async (userId: string, listType: string): Promise<any[]> => {
  // Always ensure listType is uppercase for GraphQL enum
  const gqlListType = toGraphQLEnumListType(listType);
  console.log(`Getting movies for user ${userId}, list type: ${gqlListType}`);
  
  try {
    // Clear relevant cache entries first
    await client.cache.evict({
      fieldName: 'userMovieLists',
      args: { userId, listType: gqlListType }
    });
    await client.cache.gc();
    
    const { data } = await client.query<UserMoviesResponse>({
      query: GET_USER_MOVIES,
      variables: { userId, listType: gqlListType },
      fetchPolicy: 'network-only', // Don't use cache
    });
    
    // Extract the movie objects from the userMovieLists response
    return data.userMovieLists.map((item: any) => item.movie) || [];
  } catch (error) {
    console.error(`Error fetching ${gqlListType} movies for user ${userId}:`, error);
    return [];
  }
};

// --- Mutations for User Interactions (using Apollo Client) ---

const RATE_MOVIE_MUTATION = gql`
  mutation RateMovie($userId: ID!, $movieId: ID!, $rating: Int!) {
    rateMovie(userId: $userId, movieId: $movieId, rating: $rating) {
      id
      movieId
      rating
    }
  }
`;

const rateMovie = async (movieId: string, rating: number, userId: string): Promise<any> => {
  try {
    const { data } = await client.mutate({
      mutation: RATE_MOVIE_MUTATION,
      variables: { userId, movieId, rating },
      refetchQueries: [
        { query: GET_MOVIE_DETAILS, variables: { id: movieId, userId, skipUserData: false } },
        { query: GET_USER_RATING, variables: { userId, movieId } }
      ],
    });
    
    return data.rateMovie;
  } catch (error) {
    console.error('Error rating movie:', error);
    throw error;
  }
};

const ADD_MOVIE_TO_LIST_MUTATION = gql`
  mutation AddMovieToList($userId: ID!, $movieId: ID!, $listType: ListType!) {
    addMovieToList(userId: $userId, movieId: $movieId, listType: $listType) {
      id
      list_type
      movie {
        id
        title
      }
    }
  }
`;

const REMOVE_MOVIE_FROM_LIST_MUTATION = gql`
  mutation RemoveMovieFromList($userId: ID!, $movieId: ID!, $listType: ListType!) {
    removeMovieFromList(userId: $userId, movieId: $movieId, listType: $listType)
  }
`;

const toggleUserListMovie = async (
  movieId: string,
  listType: string,
  shouldBeInList: boolean,
  userId: string
): Promise<boolean> => {
  // Always ensure listType is uppercase for GraphQL enum
  const gqlListType = toGraphQLEnumListType(listType);
  console.log(`Toggling movie ${movieId} in ${gqlListType} list to ${shouldBeInList ? 'add' : 'remove'} for user ${userId}`);
  
  try {
    // Clear cache for any affected queries first
    await client.cache.evict({
      fieldName: 'isMovieInUserList',
      args: { userId, movieId, listType: gqlListType }
    });
    
    // Select the appropriate mutation based on the action
    const mutation = shouldBeInList ? ADD_MOVIE_TO_LIST_MUTATION : REMOVE_MOVIE_FROM_LIST_MUTATION;
    
    const { data, errors } = await client.mutate({
      mutation,
      variables: { userId, movieId, listType: gqlListType },
      refetchQueries: [
        // Refetch movie details to update UI
        { query: GET_MOVIE_DETAILS, variables: { id: movieId, userId, skipUserData: false } },
        // Refetch user's movies for this list type
        { query: GET_USER_MOVIES, variables: { userId, listType: gqlListType } }
      ],
      awaitRefetchQueries: true,
    });
    
    if (errors) throw new Error(errors.map((e: any) => e.message).join('\n'));
    
    // For add, check if we got the new list item back
    // For remove, check if the operation returned true
    const success = shouldBeInList
      ? !!data?.addMovieToList?.id
      : data?.removeMovieFromList === true;
      
    return success;
  } catch (error) {
    console.error(`Failed to ${shouldBeInList ? 'add to' : 'remove from'} ${gqlListType} list:`, error);
    throw error;
  }
};


// --- Comment Related Mutations (using Apollo Client) ---

export const ADD_COMMENT_MUTATION = gql`
  mutation CreateComment($input: CommentInput!) { 
    createComment(input: $input) {
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
    }
  }
`;

export const UPDATE_COMMENT_MUTATION = gql`
  mutation UpdateComment($commentId: ID!, $content: String!) {
    updateComment(commentId: $commentId, content: $content) {
      id
      content
      updated_at
    }
  }
`;

export const DELETE_COMMENT_MUTATION = gql`
  mutation DeleteComment($commentId: ID!) {
    deleteComment(commentId: $commentId)
  }
`;

export const LIKE_COMMENT_MUTATION = gql`
  mutation LikeComment($userId: ID!, $commentId: ID!) {
    likeComment(userId: $userId, commentId: $commentId) {
      id
      likes_count
      is_liked_by_me(userId: $userId) 
    }
  }
`;

export const UNLIKE_COMMENT_MUTATION = gql`
  mutation UnlikeComment($userId: ID!, $commentId: ID!) {
    unlikeComment(userId: $userId, commentId: $commentId) {
      id
      likes_count
      is_liked_by_me(userId: $userId)
    }
  }
`;

export interface CommentInput { 
  userId: string;
  movieId: string;
  content: string;
  parentCommentId?: string | null;
}

interface AddCommentResponse {
    createComment: CommentData;
}

const addComment = async (input: CommentInput): Promise<CommentData | null> => {
    try {
        const { data, errors } = await client.mutate<AddCommentResponse>({
            mutation: ADD_COMMENT_MUTATION,
            variables: { input }, 
        });
        if (errors) throw new Error(errors.map(e => e.message).join('\n'));
        return data?.createComment || null;
    } catch (error) {
        console.error("Error adding comment:", error);
        throw error;
    }
};

interface LikeUnlikeResponse {
    id: string;
    likes_count: number;
    is_liked_by_me: boolean;
}

const updateComment = async (commentId: string, content: string): Promise<CommentData | null> => {
  try {
    const { data, errors } = await client.mutate({
      mutation: UPDATE_COMMENT_MUTATION,
      variables: { commentId, content },
    });
    if (errors) throw new Error(errors.map(e => e.message).join('\n'));
    return data?.updateComment || null;
  } catch (error) {
    console.error("Error updating comment:", error);
    throw error;
  }
};

const deleteComment = async (commentId: string): Promise<boolean> => {
  try {
    const { data, errors } = await client.mutate({
      mutation: DELETE_COMMENT_MUTATION,
      variables: { commentId },
    });
    if (errors) throw new Error(errors.map(e => e.message).join('\n'));
    return data?.deleteComment === true;
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
};

const likeComment = async (userId: string, commentId: string): Promise<LikeUnlikeResponse | null> => {
    try {
        const { data, errors } = await client.mutate<{ likeComment: LikeUnlikeResponse }>({
            mutation: LIKE_COMMENT_MUTATION,
            variables: { userId, commentId },
        });
        if (errors) throw new Error(errors.map(e => e.message).join('\\n'));
        return data?.likeComment || null;
    } catch (error) {
        console.error("Error liking comment:", error);
        throw error;
    }
};

const unlikeComment = async (userId: string, commentId: string): Promise<LikeUnlikeResponse | null> => {
    try {
        const { data, errors } = await client.mutate<{ unlikeComment: LikeUnlikeResponse }>({
            mutation: UNLIKE_COMMENT_MUTATION,
            variables: { userId, commentId },
        });
        if (errors) throw new Error(errors.map(e => e.message).join('\\n'));
        return data?.unlikeComment || null;
    } catch (error) {
        console.error("Error unliking comment:", error);
        throw error;
    }
};

export const mdService = {
  getMovieDetails,
  getSimilarMoviesByTitle,
  rateMovie, 
  toggleUserListMovie,
  addComment,
  updateComment,
  deleteComment,
  likeComment,
  unlikeComment,
  getUserLists,
  getUserMovies,
};