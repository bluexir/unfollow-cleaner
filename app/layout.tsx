import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

// Mini app embed data
const embedData = {
  version: "1",
  imageUrl: "https://unfollow-cleaner.vercel.app/og-image.png",
  button: {
    title: "Başla",
    action: {
      type: "launch_miniapp",
      name: "Unfollow Cleaner",
      url: "https://unfollow-cleaner.vercel.app",
      splashImageUrl: "https://unfollow-cleaner.vercel.app/icon.png",
      splashBackgroundColor: "#0f1117"
    }
  }
};

// Backward compatibility
const frameData = {
  ...embedData,
  button: {
    ...embedData.button,
    action: {
      ...embedData.button.action,
      type: "launch_frame"
    }
  }
};

export const metadata: Metadata = {
  title: "Unfollow Cleaner",
  description: "Farcaster Takipçi Temizleme Aracı - Seni takip etmeyenleri bul ve temizle",
  
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
  
  other: {
    "fc:miniapp": JSON.stringify(embedData),
    "fc:frame": JSON.stringify(frameData),
  },
  
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
