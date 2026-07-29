import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const base = mode === "github-pages" ? "/golden-keys-salary/" : "/";

  return {
    base,
    plugins: [
      react(),
      ...(mode === "github-pages"
        ? []
        : [
            VitePWA({
              registerType: "autoUpdate",
              includeAssets: ["favicon.svg"],
              manifest: {
                name: "Golden Keys Salary",
                short_name: "GK Salary",
                description: "Work-hours and salary tracking for a small team.",
                theme_color: "#0f766e",
                background_color: "#f8fafc",
                display: "standalone",
                start_url: base,
                icons: [
                  { src: `${base}pwa-192.png`, sizes: "192x192", type: "image/png" },
                  { src: `${base}pwa-512.png`, sizes: "512x512", type: "image/png" }
                ]
              }
            })
          ])
    ]
  };
});
