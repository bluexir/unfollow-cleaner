import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google"; // Space Grotesk Swiss stiline çok uyar
import "./globals.css";

const sans = Space_Grotesk({ subsets: ["latin"], variable: "--font-geist-sans" });
const mono = { variable: "--font-geist-mono" }; // Mono font fallback kullanıyoruz hata olmasın diye

export const metadata: Metadata = {
  title: "Unfollow Cleaner | Swiss Kinetic",
  description: "Clean your Farcaster feed with precision.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} font-sans bg-canvas text-ink antialiased`}>
        {children}
      </body>
    </html>
  );
}
