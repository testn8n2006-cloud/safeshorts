import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

// ── Cairo Font (Arabic-first) ─────────────────────────────────
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "SafeShorts | بصمة أمان",
  description: "فيديوهات آمنة ومختارة بعناية لأطفالك — بدون إعلانات أو توصيات ضارة",
  keywords: ["أطفال", "فيديو", "آمن", "تعليمي", "كرتون", "أناشيد"],
  authors: [{ name: "SafeShorts" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "بصمة أمان",
  },
  openGraph: {
    title: "SafeShorts | بصمة أمان",
    description: "فيديوهات آمنة ومختارة بعناية لأطفالك",
    type: "website",
    locale: "ar_SA",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f0a1e",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <head>
        {/* PWA iOS icons */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        {/* Prevent phone-number detection on iOS */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="font-cairo bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}
