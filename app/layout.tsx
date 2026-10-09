// app/layout.tsx — جذر التطبيق: RTL + خط عربي + فاتح/داكن (يتابع النظام مع يدوي)
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { Providers, PwaBoot, Shell } from "@/components/chrome";
import { Splash, Toaster } from "@/components/ui";

// يُنفَّذ قبل الرسم: لون التطبيق المحفوظ، وتخطّي الافتتاح إن ظهر في هذه الجلسة
const INIT = 'try{var a=localStorage.getItem("khiyal:accent");if(a)document.documentElement.style.setProperty("--brand",a);var t=localStorage.getItem("khiyal:theme");if(t==="dark"||((!t||t==="sys")&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark");if(sessionStorage.getItem("khiyal:splash"))document.documentElement.setAttribute("data-nosplash","1")}catch(e){}';

const font = IBM_Plex_Sans_Arabic({ subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700"], variable: "--font-sans", display: "swap" });
export const metadata: Metadata = { metadataBase: new URL("https://khiyal-web.vercel.app"), title: "خيال", description: "منصة عربية لتحسين البرومبتات", manifest: "/manifest.webmanifest", icons: { apple: "/icons/apple-touch.png" }, appleWebApp: { capable: true, title: "خيال", statusBarStyle: "default", startupImage: [{ url: "/splash/750x1334.png", media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" }, { url: "/splash/1170x2532.png", media: "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" }, { url: "/splash/1179x2556.png", media: "(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" }, { url: "/splash/1284x2778.png", media: "(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)" }, { url: "/splash/1290x2796.png", media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" }] } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#ffffff" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={font.variable} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: INIT }} /></head>
      <body className="min-h-dvh bg-fog font-sans text-sm text-charcoal">
        <Splash />
        <Providers><Shell>{children}</Shell></Providers>
        <PwaBoot /><Toaster />
      </body>
    </html>
  );
}
