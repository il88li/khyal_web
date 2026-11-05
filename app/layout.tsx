import "./globals.css";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { Providers, PwaBoot, Shell } from "@/components/chrome";
import { Toaster } from "@/components/ui";

const plex = IBM_Plex_Sans_Arabic({ subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700"], variable: "--font-plex", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://khiyal-web.vercel.app"),
  title: "خيال — مساحة صانع المحتوى العربي",
  description: "اكتب أفكارك بالعربية، حسّنها، واحفظ البرومبتات التي تستحق العودة إليها.",
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: "خيال", locale: "ar", title: "خيال — فكرتك تستحق صياغة أوضح", description: "مكتبة عربية لصنّاع المحتوى لبناء برومبتات أوضح وأقرب لأسلوبهم." },
  twitter: { card: "summary_large_image", title: "خيال", description: "مساحة عربية لصنّاع المحتوى." },
  icons: { icon: "/favicon.ico", apple: "/icons/khiyal-apple-touch-v5.png" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: [{ media: "(prefers-color-scheme: light)", color: "#F7F8FB" }, { media: "(prefers-color-scheme: dark)", color: "#121212" }] };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={plex.variable} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: `try { var t=localStorage.getItem("khiyal:theme"); if(t==="dark" || ((!t || t==="sys") && matchMedia("(prefers-color-scheme: dark)").matches)) document.documentElement.classList.add("dark"); } catch(e) {}` }} /></head>
      <body className="min-h-dvh overflow-x-hidden font-sans text-base text-charcoal"><Providers><Shell>{children}</Shell></Providers><PwaBoot /><Toaster /></body>
    </html>
  );
}
