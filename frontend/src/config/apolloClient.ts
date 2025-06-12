// src/config/apolloClient.js
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const backendUrl = import.meta.env.VITE_API_URL;

if (!backendUrl) {
  throw new Error('VITE_API_URL is not set. Please check your .env file.');
}

console.log('Apollo Client is using backend URL:', backendUrl);

const httpLink = new HttpLink({
  uri: backendUrl,
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('authToken');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export default client;