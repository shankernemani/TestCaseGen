import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pathfinder",
  description:
    "A private AI mentorship app for Sarvagna's journey from Grade 8 to university.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Pathfinder",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0E6E6B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        {/* Fraunces for display type; falls back to Georgia offline. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
