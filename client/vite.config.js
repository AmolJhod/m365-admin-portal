import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills"; // Correct import

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      protocolImports: true, // Enable polyfills for protocol imports like `node:crypto`
    }),
  ],
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
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis", // Polyfill `global` for browser compatibility
      },
    },
  },
});