import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pathfinder",
  description:
    "A private AI mentorship app for Sarvagna — Grade 8 to University, 2026–2031",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Pathfinder",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#116466",
  width: "device-width",
  initialScale: 1,
  // Keep pinch-zoom available (accessibility); resize the layout when the
  // soft keyboard opens so the chat composer stays visible on Android.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto min-h-dvh max-w-lg">{children}</div>
      </body>
    </html>
  );
}
