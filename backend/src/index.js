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
const serverless = require('serverless-http');

let serverlessHandler = null; // Store the handler

async function startApolloServer() {
    const app = express();
    const httpServer = http.createServer(app);

    // --- CORS Setup ---

    // Log incoming origins for debugging
    app.use((req, res, next) => {
        console.log('CORS request from:', req.headers.origin);
        next();
    });

    const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
        'https://movieeq.netlify.app',
        'https://movieq.com.tr',
        'https://movieq-admin.netlify.app'
    ];

    const corsOptions = {
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-id'],
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
    // Handle CORS preflight request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': event.headers.origin || '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-id',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Credentials': 'true',
            },
            body: '',
        };
    }

    try {
        const handler = await initializeHandler();
        const result = await handler(event, context);

        // Add CORS headers to the response
        result.headers = {
            ...(result.headers || {}),
            'Access-Control-Allow-Origin': event.headers.origin || '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-id',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
            'Access-Control-Allow-Credentials': 'true',
        };

        return result;
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': event.headers.origin || '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-admin-id',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Credentials': 'true',
            },
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
