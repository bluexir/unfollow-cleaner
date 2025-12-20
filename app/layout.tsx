import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://unfollow-cleaner.vercel.app'),
  title: 'Unfollow Cleaner - Clean Up Your Farcaster Following List',
  description: 'Discover who doesn\'t follow you back on Farcaster and clean up your following list with ease.',
  openGraph: {
    title: 'Unfollow Cleaner',
    description: 'Clean up your Farcaster following list. Find who doesn\'t follow you back.',
    images: ['/frame-image.png'],
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': 'https://unfollow-cleaner.vercel.app/frame-image.png',
    'fc:frame:image:aspect_ratio': '1.91:1',
    'fc:frame:button:1': 'Open App',
    'fc:frame:button:1:action': 'link',
    'fc:frame:button:1:target': 'https://unfollow-cleaner.vercel.app/app',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
