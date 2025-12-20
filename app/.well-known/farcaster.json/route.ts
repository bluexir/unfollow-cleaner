export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    accountAssociation: {
      header: "",
      payload: "",
      signature: ""
    },
    frame: {
      version: "1",
      name: "Unfollow Cleaner",
      iconUrl: "https://unfollow-cleaner.vercel.app/api/icon",
      homeUrl: "https://unfollow-cleaner.vercel.app/app",
      imageUrl: "https://unfollow-cleaner.vercel.app/api/splash",
      buttonTitle: "Open App",
      splashImageUrl: "https://unfollow-cleaner.vercel.app/api/splash",
      splashBackgroundColor: "#8B5CF6",
      webhookUrl: "https://unfollow-cleaner.vercel.app/api/webhook"
    }
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
