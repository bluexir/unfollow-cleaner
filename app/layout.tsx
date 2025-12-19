import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Unfollow Cleaner - Clean Up Your Farcaster Following List',
  description: 'Discover who doesn\'t follow you back on Farcaster and clean up your following list with ease.',
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
