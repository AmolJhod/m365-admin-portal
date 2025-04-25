import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  define: {
    "process.env": {}, // Define `process.env` to avoid errors
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // Ensure this alias is set up
    },
  },
  server: {
    port: 3000,
  },
});