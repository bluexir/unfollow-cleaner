export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'No authorization code provided' },
        { status: 400 }
      );
    }

    const response = await fetch('https://api.neynar.com/v2/farcaster/login/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.NEYNAR_API_KEY!,
      },
      body: JSON.stringify({
        code: code,
        client_id: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID!,
      }),
    });

    const data = await response.json();

    if (!data.fid) {
      throw new Error('Invalid response from Neynar');
    }

    return NextResponse.json({
      signer_uuid: data.signer_uuid || code,
      fid: data.fid,
      username: data.username,
      display_name: data.display_name,
      pfp_url: data.pfp_url,
    });
  } catch (error: any) {
    console.error('Neynar callback error:', error);
    return NextResponse.json(
      { error: error.message || 'Authentication failed' },
      { status: 500 }
    );
  }
}
