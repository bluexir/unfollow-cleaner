import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

const embedData = {
  version: "1",
  imageUrl: "https://unfollow-cleaner.vercel.app/icon.png",
  button: {
    title: "Start",
    action: {
      type: "launch_miniapp",
      name: "Unfollow Cleaner",
      url: "https://unfollow-cleaner.vercel.app",
      splashImageUrl: "https://unfollow-cleaner.vercel.app/icon.png",
      splashBackgroundColor: "#0f1117"
    }
  }
};

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
  description: "Farcaster Follower Management Tool - Find and unfollow non-followers",
  
  openGraph: {
    title: "Unfollow Cleaner",
    description: "Find and unfollow non-followers",
    images: [
      {
        url: "https://unfollow-cleaner.vercel.app/icon.png",
        width: 512,
        height: 512,
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
    <html lang="en">
      <body className={`${inter.className} bg-black text-white min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
