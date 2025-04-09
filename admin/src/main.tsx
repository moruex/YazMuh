import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './pages/app/App.js'

import './index.css'
import client from '@graphql/apolloClient.js'
import { ApolloProvider } from '@apollo/client'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </StrictMode>,
)
