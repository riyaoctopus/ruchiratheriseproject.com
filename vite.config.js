import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  server: {
    port: 5180,
    strictPort: true,
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
});
