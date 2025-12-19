import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Unfollow Cleaner - Clean Up Your Farcaster Following List',
  description: 'Discover who doesn\'t follow you back on Farcaster and clean up your following list with ease.',
  openGraph: {
    title: 'Unfollow Cleaner',
    description: 'Clean up your Farcaster following list',
    images: ['/og-image.png'],
  },
  other: {
    'fc:frame': 'vNext',
    'fc:frame:image': 'https://unfollow-cleaner.vercel.app/og-image.png',
    'fc:frame:button:1': 'Open Unfollow Cleaner',
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
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="https://unfollow-cleaner.vercel.app/og-image.png" />
        <meta property="fc:frame:button:1" content="Open Unfollow Cleaner" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="https://unfollow-cleaner.vercel.app/app" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
