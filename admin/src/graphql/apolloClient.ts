// src/apolloClient.ts
import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client';

// Determine the backend URL based on environment
const backendUrl = import.meta.env.VITE_API_URL;

if (!backendUrl) {
  throw new Error('VITE_API_URL is not set. Please check your .env file.');
}

console.log('Using backend URL:', backendUrl);

// HTTP connection to your GraphQL API
const httpLink = createHttpLink({
  uri: backendUrl,
});

// Authorization link to add auth token from local storage if available
const authLink = new ApolloLink((operation, forward) => {
  // Get the authentication token from local storage if it exists
  const token = localStorage.getItem('authToken');
  const adminId = localStorage.getItem('adminId');
  
  // Debug
  console.log(`Apollo auth: Adding token to request: ${token ? 'Yes' : 'No'}, AdminID: ${adminId || 'None'}`);
  
  // Add the authorization header
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
      // Also add admin ID directly in header for simplicity
      'x-admin-id': adminId || "",
    }
  }));

  return forward(operation);
});

// Create the Apollo Client instance
const client = new ApolloClient({
  link: authLink.concat(httpLink), // Use combined links
  cache: new InMemoryCache(),
  connectToDevTools: true, // Enable DevTools integration
});

export default client;