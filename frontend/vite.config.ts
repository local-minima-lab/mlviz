import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
    base: "./",
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        // Only use proxy in development mode
        proxy: mode === "development" ? {
            // Proxying requests that start with /api
            "/api": {
                target: "http://127.0.0.1:8000", // Your Flask backend address
                changeOrigin: true, // Needed for virtual hosted sites
                // rewrite: (path) => path.replace(/^\/api/, ""), // Only if your backend routes were e.g., /dt/train_model and not /api/dt/train_model
            },
        } : undefined,
    },
}));
