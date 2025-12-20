export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { untrustedData } = body;
    const fid = untrustedData?.fid;

    if (!fid) {
      return NextResponse.redirect('https://unfollow-cleaner.vercel.app');
    }

    return NextResponse.json({
      type: 'frame',
      version: 'vNext',
      location: `https://unfollow-cleaner.vercel.app/app?fid=${fid}`,
    });
  } catch (error) {
    return NextResponse.redirect('https://unfollow-cleaner.vercel.app');
  }
}
