// index.js (Main Server File)
const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('@apollo/server'); // Correct import
const { expressMiddleware } = require('@apollo/server/express4'); // Correct import
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer'); // Correct import
const http = require('http');
// Removed: const { graphqlUploadExpress } = require('graphql-upload');
const { mergeSchemas } = require('@graphql-tools/schema'); // Import mergeSchemas
const config = require('./config');
const schema = require('./schema');
const schemaFrontend = require('./schema-frontend');
const { db } = require('./db');

let serverlessHandler = null; // Store the handler

async function startApolloServer() {
    const app = express();
    const httpServer = http.createServer(app);

    // --- CORS Setup ---
    // Apply CORS before Apollo middleware
    const corsOptions = {
        origin: [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
            'https://movieeq.netlify.app',
            'https://movieq-admin.netlify.app'
        ],
        credentials: true,
    };
    app.use(cors(corsOptions));

    // Ensure body parsing middleware is applied *before* Apollo middleware
    app.use(express.json()); // Needed for expressMiddleware

    // --- Setup Apollo Server ---
    // Merge the schemas
    const mergedSchema = mergeSchemas({
      schemas: [schema, schemaFrontend],
    });

    const server = new ApolloServer({
        schema: mergedSchema, // Use the merged schema
        plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
        introspection: config.nodeEnv !== 'production',
    });

    // --- Start the server ---
    await server.start();

    // Apply Apollo GraphQL middleware and context function
    app.use(
        '/graphql',
        express.json(), // Ensure JSON body parsing for GraphQL requests
        expressMiddleware(server, {
            context: async ({ req }) => {
                // Context is now simpler, only db and req
                return {
                    db,
                    req,
                };
            },
        }),
    );

    return app; // Return the app instance
}

// Remove the direct call to start the server
// startApolloServer().catch(error => {
//     console.error('❌ Failed to start server:', error);
//     process.exit(1);
// });

// Initialize the serverless handler asynchronously
const initializeHandler = async () => {
    if (serverlessHandler) {
        return serverlessHandler;
     }

    try {
        console.log("🚀 Initializing Apollo Server for serverless function...");
        const app = await startApolloServer();
        console.log("✅ Apollo Server initialized.");
        serverlessHandler = serverless(app);
        console.log("✅ Serverless handler created.");
        return serverlessHandler;
    } catch (error) {
        console.error('❌ Failed to initialize serverless handler:', error);
        // Throw the error so Netlify knows initialization failed
        throw new Error(`Handler initialization failed: ${error.message}`);
    }
};


// Export the handler for Netlify
exports.handler = async (event, context) => {
    try {
        const handler = await initializeHandler();
        // Log incoming event for debugging (optional)
        // console.log('Incoming event:', JSON.stringify(event));
        // console.log('Context:', JSON.stringify(context));

        // Add a small delay if needed for cold starts, although usually not necessary
        // await new Promise(resolve => setTimeout(resolve, 50));

        const result = await handler(event, context);
        // Log outgoing result for debugging (optional)
        // console.log('Outgoing result:', JSON.stringify(result));
        return result;
    } catch (error) {
        console.error('❌ Error executing handler:', error);
        // Return a standard server error response
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error during handler execution', details: error.message }),
        };
    }
};

// Add this section for local development start
// This block will execute when running `node src/index.js` directly,
// but typically not in a deployed serverless environment.
if (process.env.NODE_ENV !== 'production' && !process.env.AWS_LAMBDA_FUNCTION_NAME /* Add other potential serverless env vars if needed */) {
    const PORT = process.env.PORT || 4000;

    startApolloServer().then(app => {
        // Create a standard HTTP server with the Express app configured by startApolloServer
        const localHttpServer = http.createServer(app);

        // Start listening on the specified port
        localHttpServer.listen(PORT, () => {
            console.log(`\n🚀 Local server ready at http://localhost:${PORT}`);
            // The GraphQL endpoint is configured within startApolloServer
            console.log(`   GraphQL endpoint: http://localhost:${PORT}/graphql\n`);
        });

    }).catch(error => {
        console.error('❌ Failed to start local development server:', error);
        process.exit(1);
    });
}
