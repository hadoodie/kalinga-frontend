import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["kalinga-logo.svg", "KALINGA-MOBILE-ICON-WITH-NAME.png"],
      manifest: {
        name: "Kalinga Web App",
        short_name: "Kalinga",
        description: "Kalinga Incident Management and Response System",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "/KALINGA-MOBILE-ICON-WITH-NAME.png?v=2",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/KALINGA-MOBILE-ICON-WITH-NAME.png?v=2",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
      }
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@images": path.resolve(__dirname, "./src/assets/images"),
    },
  },
  server: {
    port: 4000,
  },
});
