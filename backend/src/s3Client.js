// src/s3Client.js
const { S3Client } = require('@aws-sdk/client-s3');
const config = require('./config');

if (!config.r2.endpoint || !config.r2.accessKeyId || !config.r2.secretAccessKey) {
    console.warn("⚠️ R2 configuration missing in .env file. File operations will likely fail.");
    // Optionally throw an error if R2 is critical
    // throw new Error("Missing Cloudflare R2 configuration.");
}

// Configure Cloudflare R2 S3 Client
const s3Client = new S3Client({
    region: 'auto',
    endpoint: config.r2.endpoint,
    credentials: {
        accessKeyId: config.r2.accessKeyId,
        secretAccessKey: config.r2.secretAccessKey,
    },
});

module.exports = { s3Client };