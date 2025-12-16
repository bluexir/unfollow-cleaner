import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Unfollow Cleaner - Farcaster Tool',
  description: 'Clean up your Farcaster following list by identifying non-followers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
