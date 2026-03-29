import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@ecovision/shared": resolve(__dirname, "../shared/src/index.ts"),
      "@": resolve(__dirname, "src")
    }
  },
  server: {
    port: 5173
  }
});
