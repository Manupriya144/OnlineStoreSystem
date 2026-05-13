VitePWA({
  registerType: "autoUpdate",

  manifest: {
    name: "Tazz Electronics",
    short_name: "Tazz",
    description: "Premium electronics shopping experience",

    theme_color: "#0b0b0b",
    background_color: "#0b0b0b",

    display: "standalone",
    start_url: "/",

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
      }
    ],
  },
})