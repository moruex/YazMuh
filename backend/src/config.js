// src/config.js
require('dotenv').config(); // Load .env file contents into process.env

const r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL || null;
if (!r2PublicUrl) {
    console.warn("⚠️ CLOUDFLARE_R2_PUBLIC_URL is not set in .env. Public file URLs will not be available.");
}

module.exports = {
    port: process.env.PORT || 4000,
    databaseUrl: process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV || 'development',
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),

    // R2 Configuration
    r2:  {
        endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
        bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        publicUrl: r2PublicUrl,
        signedUrlExpiresIn: parseInt(process.env.R2_SIGNED_URL_EXPIRES_IN || '3600', 10),
    },
};
