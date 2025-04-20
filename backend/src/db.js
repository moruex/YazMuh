// src/db.js
const fs = require("fs");
const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({
  // Your existing connection details:
  // connectionString: process.env.DATABASE_URL,
  // OR
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  //ssl: {
  //   rejectUnauthorized: true,
  //   ca: fs.readFileSync("./ca.pem").toString(),
  // },
  ssl: {
    rejectUnauthorized: false // Use this for many cloud providers if not using a specific CA
  },
  // ssl: {
  //   rejectUnauthorized: false // Add or ensure this line exists and is set to false
  // }
});

console.log('>>> db.js: Pool created with SSL configuration:', pool.options.ssl);

pool.on('connect', () => {
  console.log('🐘 Database pool connected');
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
