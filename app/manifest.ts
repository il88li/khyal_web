// app/manifest.ts — PWA manifest (RTL، Light، standalone)
import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "خيال", short_name: "خيال", description: "منصة عربية لتحسين البرومبتات", start_url: "/", scope: "/", display: "standalone",
    orientation: "portrait", background_color: "#fafafa", theme_color: "#ffffff", lang: "ar", dir: "rtl",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
