// SERVER-ONLY admin defaults. Never import this file from src/ or any browser bundle.
// Change these values before deploying. Keep the GitHub repository PRIVATE.
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "ksradmin";
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "KSR-Dairy@2026";
export const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "KSR-Dairy-Session-Change-This-9f41b6d0-2026";
