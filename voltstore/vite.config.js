import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",

      manifest: {
        id: "/",

        name: "Tazz Electronics",
        short_name: "Tazz",

        description: "Premium electronics shopping experience",

        theme_color: "#0b0b0b",
        background_color: "#0b0b0b",

        display: "fullscreen",
        display_override: [
          "fullscreen",
          "standalone",
          "minimal-ui"
        ],

        orientation: "portrait",

        scope: "/",
        start_url: "/",

        prefer_related_applications: false,

        icons: [
          {
            src: "/icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },

          {
            src: "/icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },

          {
            src: "/icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
});