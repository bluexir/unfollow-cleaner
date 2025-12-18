import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { NeynarContextProvider, Theme } from '@neynar/react';

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
      <body className={inter.className}>
        <NeynarContextProvider
          settings={{
            clientId: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || '',
            defaultTheme: Theme.Dark,
          }}
        >
          {children}
        </NeynarContextProvider>
      </body>
    </html>
  );
}
