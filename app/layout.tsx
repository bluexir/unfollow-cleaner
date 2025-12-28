import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Unfollow Cleaner",
  description: "Farcaster Takipçi Temizleme Aracı - Seni takip etmeyenleri bul ve temizle",
  
  // Open Graph (Farcaster için gerekli)
  openGraph: {
    title: "Unfollow Cleaner",
    description: "Seni takip etmeyenleri bul ve temizle",
    images: [
      {
        url: "https://unfollow-cleaner.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Unfollow Cleaner",
      },
    ],
  },
  
  // Farcaster Frame Metadata
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": "https://unfollow-cleaner.vercel.app/og-image.png",
    "fc:frame:button:1": "Başla",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": "https://unfollow-cleaner.vercel.app",
  },
  
  // Mini App spesifik
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.className} bg-black text-white min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
