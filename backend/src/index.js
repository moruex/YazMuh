// index.js (Main Server File)
const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('apollo-server-express');
const jwt = require('jsonwebtoken');
const { ApolloServerPluginDrainHttpServer } = require('apollo-server-core');
const http = require('http');
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

    // --- Set up very permissive CORS for testing ---
    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
        
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            return res.status(200).end();
        }
        next();
    });

    // --- Also keep the standard CORS middleware ---
    app.use(cors({
        origin: '*',
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
        allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
    }));


    // --- Setup Apollo Server ---
    const server = new ApolloServer({
        schema,
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
        plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
        introspection: config.nodeEnv !== 'production',
        // uploads: false, // This option might not be needed/valid depending on Apollo Server version
    });

    // --- Start the server ---
    await server.start();

    // Apply Apollo GraphQL middleware
    server.applyMiddleware({ app, path: '/graphql', cors: false }); // Use Express CORS

    // --- Start Listening ---
    await new Promise(resolve => httpServer.listen({ port: config.port }, resolve));
    console.log(`🚀 Server ready at http://localhost:${config.port}${server.graphqlPath}`);
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
