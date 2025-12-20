export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fid = body?.untrustedData?.fid;

    if (!fid) {
      return NextResponse.json({
        version: 'vNext',
        image: 'https://unfollow-cleaner.vercel.app/api/og',
        buttons: [
          {
            label: 'Open App',
            action: 'post',
          },
        ],
      });
    }

    const redirectUrl = `https://unfollow-cleaner.vercel.app/app?fid=${fid}`;
    
    return NextResponse.redirect(redirectUrl, { status: 302 });
  } catch (error) {
    console.error('Frame error:', error);
    return NextResponse.json({
      version: 'vNext',
      image: 'https://unfollow-cleaner.vercel.app/api/og',
      buttons: [
        {
          label: 'Try Again',
          action: 'post',
        },
      ],
    });
  }
}
