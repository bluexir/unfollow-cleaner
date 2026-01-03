import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    accountAssociation: {
      header: "eyJmaWQiOjQyOTk3MywidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweGI3YkEyNTk3NjI0MTRFMjRGOTI0MTVFRjc4MDE5Y2RjM2FlM0M5ZEUifQ",
      payload: "eyJkb21haW4iOiJ1bmZvbGxvdy1jbGVhbmVyLnZlcmNlbC5hcHAifQ",
      signature: "PqaN7O2suobRJQs8X1dzrgIfw38dfdgD40O3AhdXX4JuhiAMtWS6vaqdyY3Gth9aJGc1SrbvGRV9acu0+BaLrRw="
    },
    miniapp: {
      version: "1.0.0",
      manifest_version: "1",
      name: "Unfollow Cleaner",
      icon_url: "https://unfollow-cleaner.vercel.app/icon.png",
      home_url: "https://unfollow-cleaner.vercel.app",
      splash_image_url: "https://unfollow-cleaner.vercel.app/icon.png",
      splash_background_color: "#0f1117"
    }
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
