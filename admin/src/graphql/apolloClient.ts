// src/apolloClient.ts
import { ApolloClient, InMemoryCache, createHttpLink, ApolloLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// HTTP connection to your GraphQL API
const httpLink = createHttpLink({
  // uri: 'YOUR_GRAPHQL_ENDPOINT', // Replace with your API endpoint URL
  uri: 'http://localhost:4000/graphql', // Example using Vite env var
});

// Middleware link to set the Authorization header dynamically
const authLink = setContext((_, { headers }) => {
  // Get the authentication token from local storage if it exists
  const token = localStorage.getItem('jwt_token'); // Use the same key as in App.tsx/LoginPage.tsx

  // Return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers, // Spread existing headers
      authorization: token ? `Bearer ${token}` : "", // Add the Authorization header
    }
  }
});

// Chain the links: authLink runs before httpLink
const link = ApolloLink.from([authLink, httpLink]);

// Create the Apollo Client instance
const client = new ApolloClient({
  link: link,
  cache: new InMemoryCache(),
  connectToDevTools: true, // Enable DevTools integration
});

export default client;