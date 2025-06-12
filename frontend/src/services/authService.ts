import { gql } from '@apollo/client';
import client from '@src/config/apolloClient';

// Basic GraphQL client setup
// You might use a more robust client like Apollo Client or urql in a real app
// let GQL_ENDPOINT = 'https://localhost:4000/graphql'; // Default fallback if not set

// interface GraphQLResponse<T> {
//   data?: T;
//   errors?: Array<{ message: string; [key: string]: any }>;
// }

// async function fetchGraphQL<T>(query: string, variables?: Record<string, any>): Promise<T> {
//   const headers: HeadersInit = {
//     'Content-Type': 'application/json',
//   };
//   const token = localStorage.getItem('authToken');
//   if (token) {
//     headers['Authorization'] = `Bearer ${token}`;
//   }

//   let response;
//   try {
//     response = await fetch(GQL_ENDPOINT, {
//       method: 'POST',
//       headers,
//       body: JSON.stringify({ query, variables }),
//     });
//   } catch (networkError: any) {
//     console.error("Network error during fetch:", networkError);
//     throw new Error(`Network error: ${networkError.message}`);
//   }

//   if (!response.ok) {
//     // Attempt to get more info from the response body if possible, but it might not be JSON
//     const errorBody = await response.text(); // Get raw text to avoid JSON parse error on HTML 404 pages
//     console.error("GraphQL request not OK:", response.status, response.statusText, errorBody);
//     throw new Error(`Server error: ${response.status} ${response.statusText}. Endpoint: ${GQL_ENDPOINT}. Details: ${errorBody.substring(0,100)}...`);
//   }

//   let body;
//   try {
//     body = await response.json() as GraphQLResponse<T>;
//   } catch (jsonParseError: any) {
//     console.error("JSON parsing error:", jsonParseError);
//     const rawText = await response.text(); // Attempt to re-read as text if json fails, though response might be consumed
//     console.error("Raw response text that failed JSON parsing:", rawText);
//     throw new Error(`Failed to parse JSON response from server. ${jsonParseError.message}`);
//   }

//   if (body.errors) {
//     console.error("GraphQL Errors in response body:", body.errors);
//     const errorMessage = body.errors.map(e => e.message).join('\\n');
//     throw new Error(errorMessage || 'GraphQL request reported errors');
//   }

//   if (!body.data) {
//     throw new Error('No data returned from GraphQL server, though request was successful.');
//   }

//   return body.data;
// }

// --- Types based on your backend/src/schema/user.js ---

// User type (subset of fields, adjust as needed for frontend use)
export interface User {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  username: string;
  email: string;
  secondary_email: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  // Add other fields you might need from the User type in your backend
}

// For loginUser mutation
export interface LoginInput {
  login: string; // username or email
  password: string;
}

// For registerUser mutation
export interface UserInput {
  first_name?: string;
  last_name?: string;
  username: string;
  email: string;
  password: string;
  avatar_url?: string;
  bio?: string;
}

// For updateUser mutation - NEW
export interface UserUpdateInput {
  first_name?: string;
  last_name?: string;
  username?: string;
  email?: string;
  password?: string;
  currentPassword?: string;
  avatar_url?: string;
  bio?: string;
}

// Payload for loginUser
interface AuthPayload {
  token: string;
  user: User;
}

// --- Service methods ---

// Login User
const LOGIN_USER_MUTATION = gql`
  mutation LoginUser($input: LoginInput!) {
    loginUser(input: $input) {
      token
      user {
        id
        username
        email
        first_name
        last_name
        avatar_url
        bio
      }
    }
  }
`;

// interface LoginUserResponse {
//   loginUser: AuthPayload;
// }

export const login = async (credentials: LoginInput): Promise<AuthPayload> => {
  const { data, errors } = await client.mutate<{ loginUser: AuthPayload }>({
    mutation: LOGIN_USER_MUTATION,
    variables: { input: credentials },
  });
  if (errors) throw new Error(errors.map(e => e.message).join('\n'));
  if (!data?.loginUser) throw new Error('Login failed: No token or user returned.');
  return data.loginUser;
};

// Register User
const REGISTER_USER_MUTATION = gql`
  mutation RegisterUser($input: UserInput!) {
    registerUser(input: $input) {
      id
      username
      email
      first_name
      last_name
      avatar_url
      bio
    }
  }
`;

// interface RegisterUserResponse {
//   registerUser: User;
// }

export const register = async (userData: UserInput): Promise<User> => {
  const { data, errors } = await client.mutate<{ registerUser: User }>({
    mutation: REGISTER_USER_MUTATION,
    variables: { input: userData },
  });
  if (errors) throw new Error(errors.map(e => e.message).join('\n'));
  if (!data?.registerUser) throw new Error('Registration failed: No user data returned.');
  return data.registerUser;
};

// NEW: Update User
const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($userId: ID!, $input: UserUpdateInput!) {
    updateUser(userId: $userId, input: $input) {
      id
      username
      email
      first_name
      last_name
      avatar_url
      bio
    }
  }
`;

export const updateUser = async (userId: string, input: UserUpdateInput): Promise<User> => {
  const { data, errors } = await client.mutate<{ updateUser: User }>({
    mutation: UPDATE_USER_MUTATION,
    variables: { userId, input },
    // Useful for ensuring user data is fresh after update.
    refetchQueries: ['GetUserDetails'], 
  });
  if (errors) throw new Error(errors.map(e => e.message).join('\n'));
  if (!data?.updateUser) throw new Error('Update failed: No user data returned.');
  return data.updateUser;
};

// NEW: Delete User Account
const DELETE_MY_ACCOUNT_MUTATION = gql`
  mutation DeleteMyAccount {
    deleteMyAccount
  }
`;

export const deleteMyAccount = async (): Promise<boolean> => {
  const { data, errors } = await client.mutate<{ deleteMyAccount: boolean }>({
    mutation: DELETE_MY_ACCOUNT_MUTATION,
  });
  if (errors) throw new Error(errors.map(e => e.message).join('\n'));
  return data?.deleteMyAccount || false;
};

export const authService = {
  login,
  register,
  updateUser,
  deleteMyAccount,
  // You can add other auth-related API calls here, e.g., refreshToken, forgotPassword, etc.
};

// Utility to get the current user from localStorage (can be used by other services if needed)
export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('authUser');
  if (userStr) {
    try {
      return JSON.parse(userStr) as User;
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      localStorage.removeItem('authUser');
      return null;
    }
  }
  return null;
};

export const getToken = (): string | null => {
  return localStorage.getItem('authToken');
}; 