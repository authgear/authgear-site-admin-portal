import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    modules: {
      localsConvention: "camelCase",
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  // Exclude reference directory from processing
  optimizeDeps: {
    exclude: ["reference"],
  },
});
