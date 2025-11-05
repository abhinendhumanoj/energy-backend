import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // optional
    open: true, // automatically open in browser
    host: true,
    historyApiFallback: true, // ✅ Fix for React Router routes like /reports, /predictions
  },
  build: {
    outDir: "dist",
  },
});
