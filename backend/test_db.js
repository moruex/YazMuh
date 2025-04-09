// test_db.js
require('dotenv').config(); // Load .env for DATABASE_URL
const { Pool } = require('pg');

const dbUrl = process.env.DATABASE_URL;
console.log(`Attempting connection using DATABASE_URL: ${dbUrl}`);

if (!dbUrl) {
    console.error("DATABASE_URL environment variable is not set!");
    process.exit(1);
}

const pool = new Pool({
    connectionString: dbUrl,
    ssl: {
        rejectUnauthorized: false, // Keep the setting
    },
    // Optional: Add connection timeout for testing
    // connectionTimeoutMillis: 5000, // 5 seconds
    // idleTimeoutMillis: 10000,
});

console.log('Pool configured with rejectUnauthorized: false');

async function runTest() {
    let client;
    try {
        console.log('Connecting to database...');
        client = await pool.connect(); // Attempt to get a client from the pool
        console.log('Successfully connected!');
        const result = await client.query('SELECT NOW() as current_time'); // Simple query
        console.log('Query successful:', result.rows[0]);
    } catch (err) {
        console.error('--- Connection Test FAILED ---');
        console.error(err); // Log the detailed error from this simple test
    } finally {
        if (client) {
            client.release(); // Always release the client
            console.log('Client released.');
        }
        await pool.end(); // Close the pool cleanly
        console.log('Pool ended.');
    }
}

runTest();