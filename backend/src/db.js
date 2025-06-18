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

// Always use ca.pem for SSL in all environments
const caPath = require('path').join(__dirname, '../ca.pem');
poolConfig.ssl = {
    rejectUnauthorized: true, // Enforce certificate validation
    ca: fs.readFileSync(caPath).toString(),
};
console.log('>>> db.js: SSL enabled with ca.pem for all environments');

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
