import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "./",
  root: ".", // 👈 index.html is at project root
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // 👈 for @/ imports
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
