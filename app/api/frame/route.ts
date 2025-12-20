export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { untrustedData } = body;
    const fid = untrustedData?.fid;

    if (!fid) {
      return NextResponse.json({
        error: 'No FID provided'
      }, { status: 400 });
    }

    return NextResponse.json({
      type: 'frame',
      version: 'vNext',
      image: `${process.env.NEXT_PUBLIC_APP_URL || 'https://unfollow-cleaner.vercel.app'}/api/og`,
      buttons: [
        {
          label: 'Open App',
          action: 'post_redirect',
        },
      ],
      postUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://unfollow-cleaner.vercel.app'}/api/redirect?fid=${fid}`,
    });
  } catch (error) {
    console.error('Frame error:', error);
    return NextResponse.json({
      error: 'Frame processing failed'
    }, { status: 500 });
  }
}
