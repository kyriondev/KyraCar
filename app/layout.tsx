import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { BottomNav } from "@/components/bottom-nav";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "latin-ext"],
  weight: ["200", "300", "400", "500", "600", "700"],
});

// Kyra's voice only.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "latin-ext"],
  weight: "500",
});

export const metadata: Metadata = {
  title: "Kyra",
  description: "Osobní appka do auta: deník, servis a asistentka Kyra.",
  applicationName: "Kyra",
  appleWebApp: {
    capable: true,
    title: "Kyra",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0B0C0B",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="cs" className={`${manrope.variable} ${cormorant.variable}`}>
      <body className="flex h-dvh flex-col bg-bg font-sans text-ink">
        <main className="flex min-h-0 flex-1 flex-col pt-safe-top">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
