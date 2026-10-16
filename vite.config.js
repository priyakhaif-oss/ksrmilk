import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    // The Google OAuth client ID is public by design; reuse the same ID for
    // browser sign-in and server-side ID-token verification.
    define: { "import.meta.env.VITE_GOOGLE_CLIENT_ID": JSON.stringify(env.GOOGLE_CLIENT_ID || env.VITE_GOOGLE_CLIENT_ID || "") },
    server: { port: 5173 }
  };
});
