import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const domain = 'unfollow-cleaner.vercel.app';
    const API_KEY = process.env.NEYNAR_API_KEY;

    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/app?url=${encodeURIComponent(domain)}`,
      {
        headers: {
          'api_key': API_KEY!,
          'accept': 'application/json'
        }
      }
    );

    const data = await response.json();

    return NextResponse.json({
      status: response.status,
      data: data
    });

  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}
```

Deploy edin, sonra şu URL'i açın:
```
https://unfollow-cleaner.vercel.app/api/test-app-fid
