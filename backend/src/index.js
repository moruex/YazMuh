// index.js (Main Server File)
const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('@apollo/server'); // Correct import
const { expressMiddleware } = require('@apollo/server/express4'); // Correct import
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer'); // Correct import
const http = require('http');
const jwt = require('jsonwebtoken');
// Removed: const { graphqlUploadExpress } = require('graphql-upload');
const config = require('./config');
const schema = require('./schema');
const { db } = require('./db');

async function startApolloServer() {
    const app = express();
    const httpServer = http.createServer(app);

    // --- Minimal Authentication Middleware (Keep existing logic) ---
    const attachUserContext = async (req) => {
        // ... (your existing attachUserContext logic remains the same)
        const authorization = req.headers.authorization;
        let tokenPayload = null;
        let tokenType = null; // 'admin' or 'user'

        if (authorization && authorization.startsWith('Bearer ')) {
            const token = authorization.split(' ')[1];
            if (token) {
                try {
                    tokenPayload = jwt.verify(token, config.adminJwtSecret);
                    tokenType = 'admin';
                } catch (adminError) {
                    try {
                        tokenPayload = jwt.verify(token, config.jwtSecret);
                        tokenType = 'user';
                    } catch (userError) {
                         if (!(adminError instanceof jwt.TokenExpiredError) && !(adminError instanceof jwt.JsonWebTokenError)) {
                           console.error('Admin JWT Verification Error:', adminError.message);
                         }
                         if (!(userError instanceof jwt.TokenExpiredError) && !(userError instanceof jwt.JsonWebTokenError)) {
                            console.error('User JWT Verification Error:', userError.message);
                         }
                        tokenPayload = null;
                        tokenType = null;
                    }
                }
            }
        }
        return { tokenPayload, tokenType };
    };

    // --- CORS Setup ---
    // Apply CORS before Apollo middleware
    app.use(cors({
        origin: '*', // Adjust for production (e.g., specific frontend URL)
        credentials: true,
    }));

    // Ensure body parsing middleware is applied *before* Apollo middleware
    app.use(express.json()); // Needed for expressMiddleware

    // --- Setup Apollo Server ---
    const server = new ApolloServer({
        schema,
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
                const { tokenPayload, tokenType } = await attachUserContext(req);

                const context = {
                    db,
                    req,
                    user: null,
                    admin: null,
                    tokenPayload: tokenPayload
                };

                // Populate user or admin based on verified token type
                if (tokenPayload && tokenType === 'admin' && tokenPayload.adminId) {
                    context.admin = { id: tokenPayload.adminId, role: tokenPayload.role };
                } else if (tokenPayload && tokenType === 'user' && tokenPayload.userId) {
                    context.user = { id: tokenPayload.userId, role: 'USER' }; // Assume role or get from token
                }

                context.getCurrentActor = () => {
                    if (context.admin) return { type: 'admin', id: context.admin.id, role: context.admin.role };
                    if (context.user) return { type: 'user', id: context.user.id, role: context.user.role };
                    return null;
                };

                return context;
            },
        }),
    );

    // --- Start Listening ---
    await new Promise(resolve => httpServer.listen({ port: config.port }, resolve));
    console.log(`🚀 Server ready at http://localhost:${config.port}/graphql`);
    console.log(`🌱 Node Environment: ${config.nodeEnv}`);
    if (!config.r2.endpoint || !config.r2.accessKeyId) {
        console.warn("⚠️ R2 configuration missing or incomplete.");
    } else {
        console.log(`☁️  R2 Bucket: ${config.r2.bucketName}`);
    }
}

startApolloServer().catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});
