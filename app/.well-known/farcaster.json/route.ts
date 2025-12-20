export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    frame: {
      version: '0.0.0',
      name: 'Unfollow Cleaner',
      iconUrl: 'https://unfollow-cleaner.vercel.app/api/icon',
      splashImageUrl: 'https://unfollow-cleaner.vercel.app/api/splash',
      splashBackgroundColor: '#8B5CF6',
      homeUrl: 'https://unfollow-cleaner.vercel.app/app',
    },
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
