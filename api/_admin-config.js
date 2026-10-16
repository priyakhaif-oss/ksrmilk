// SERVER-ONLY admin defaults. Never import this file from src/ or any browser bundle.
// Change these values before deploying. Keep the GitHub repository PRIVATE.
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "ksradmin";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "KSR2026";
export const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "75a719a8723b50f38d8964be576cbba847e8b1b9dafbe0889411e6893228823d";
