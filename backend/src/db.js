// src/db.js
const fs = require("fs");
const { Pool } = require('pg');
const { parse } = require('pg-connection-string');
const config = require('./config');

// Pool configuration
let poolConfig;

// Check if DATABASE_URL is provided (docker environment)
if (process.env.DATABASE_URL) {
  console.log('>>> Using DATABASE_URL for connection');
  // Parse the connection string
  const connectionConfig = parse(process.env.DATABASE_URL);
  poolConfig = {
    user: connectionConfig.user,
    host: connectionConfig.host,
    database: connectionConfig.database,
    password: connectionConfig.password,
    port: connectionConfig.port || 5432,
  };
} else {
  console.log('>>> Using individual environment variables for connection');
  // Fallback to individual parameters
  poolConfig = {
    user: process.env.DB_USER,
    host: process.env.DB_HOST || 'postgres', // Default to 'postgres' for Docker Compose
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
  };
}

// Add SSL configuration only for production environment
if (config.nodeEnv === 'production') {
    // Assuming production requires SSL, adjust as needed
    poolConfig.ssl = {
        rejectUnauthorized: false, // More secure for production
        // ca: fs.readFileSync("./ca.pem").toString(), // Uncomment if using self-signed certs
    };
    console.log('>>> db.js: Production SSL enabled');
} else {
    // For development or other environments, disable SSL
    poolConfig.ssl = false; 
    console.log('>>> db.js: SSL disabled for non-production environment');
}

const pool = new Pool(poolConfig);

console.log('>>> db.js: Connecting to database:', poolConfig.host, poolConfig.port);

pool.on('connect', () => {
  console.log('🐘 Database pool connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Database pool error:', err);
  // Optional: attempt to reconnect or exit process based on error type
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  db: pool,
};
