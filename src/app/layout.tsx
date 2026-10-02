import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/layout/BottomNav";
import { Providers } from "@/components/Providers";
import { SWRegister } from "@/components/shared/SWRegister";
import { NotificationPrompt } from "@/components/shared/NotificationPrompt";
import { AntiCopy } from "@/components/shared/AntiCopy";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export const metadata: Metadata = {
  title: "خيال | Khiyal",
  description: "منصة عربية لتحسين مطالبات البرومبت",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "خيال",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f4f4f5",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="font-arabic antialiased">
        <Providers>
          <ErrorBoundary>
            <AntiCopy />
            <SWRegister />
            <main className="min-h-dvh pb-nav">{children}</main>
            <BottomNav />
            <NotificationPrompt />
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
