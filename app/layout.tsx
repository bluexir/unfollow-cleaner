import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Unfollow Cleaner",
  description: "Farcaster Takipçi Temizleme Aracı",
  other: {
    "fc:frame": JSON.stringify({
      version: "next",
      imageUrl: "https://unfollow-cleaner.vercel.app/og-image.png",
      button: {
        title: "Temizliğe Başla",
        action: {
          type: "launch_frame",
          name: "Unfollow Cleaner",
          url: "https://unfollow-cleaner.vercel.app",
          splashImageUrl: "https://unfollow-cleaner.vercel.app/splash.png",
          splashBackgroundColor: "#7C65C1",
        },
      },
    }),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
