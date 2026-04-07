import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RelativityGrid from "@/components/RelativityGrid";
import { siteConfig } from "@/lib/site-config";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.siteUrl),
  keywords: [
    "política",
    "filosofía",
    "geopolítica",
    "sociología",
    "pensamiento crítico",
    "ideologías",
    "análisis político",
  ],
  openGraph: {
    title: siteConfig.name,
    description: "Un canal para quienes prefieren pensar antes que repetir esloganes.",
    type: "website",
    url: siteConfig.siteUrl,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <RelativityGrid />
        <Navbar />
        <main className="page-transition">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
