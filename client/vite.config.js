import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Load the shared .env from the project root (one level up) instead of
  // requiring a separate .env file inside client/.
  envDir: "..",
  server: {
    port: 5173,
  },
});
