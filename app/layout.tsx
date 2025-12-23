import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Unfollow Cleaner",
  description: "Farcaster Takipçi Temizleme Aracı",
  // Hosted Manifest kullandığımız için 'other' kısmındaki frame etiketlerini kaldırdık.
  // Farcaster artık bilgiyi /.well-known/farcaster.json üzerinden alacak.
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
