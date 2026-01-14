import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    accountAssociation: {
      header: "eyJmaWQiOjQyOTk3MywidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweGI3YkEyNTk3NjI0MTRFMjRGOTI0MTVFRjc4MDE5Y2RjM2FlM0M5ZEUifQ",
      payload: "eyJkb21haW4iOiJ1bmZvbGxvdy1jbGVhbmVyLnZlcmNlbC5hcHAifQ",
      signature: "PqaN7O2suobRJQs8X1dzrgIfw38dfdgD40O3AhdXX4JuhiAMtWS6vaqdyY3Gth9aJGc1SrbvGRV9acu0+BaLrRw="
    },
    miniapp: {
      version: "1",
      name: "Unfollow Cleaner",
      iconUrl: "https://unfollow-cleaner.vercel.app/icon.png",
      homeUrl: "https://unfollow-cleaner.vercel.app",
      splashImageUrl: "https://unfollow-cleaner.vercel.app/icon.png",
      splashBackgroundColor: "#0f1117",
      webhookUrl: "https://unfollow-cleaner.vercel.app/api/webhook",
      
      // EKLENEN ALANLAR (Arama için kritik!)
      subtitle: "Find your ghosts on Farcaster",
      description: "Discover who doesn't follow you back on Farcaster. Sort by Neynar quality score and clean up with one tap. No spam, just real insights.",
      primaryCategory: "social",
      tags: ["social", "tools", "analytics", "followers"],
      tagline: "Clean up your Farcaster follow list instantly",
      
      // OG Tags (Paylaşım için)
      ogTitle: "Unfollow Cleaner - Find Your Farcaster Ghosts",
      ogDescription: "Discover who doesn't follow you back and clean up with one tap",
      ogImageUrl: "https://unfollow-cleaner.vercel.app/icon.png"
    }
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
