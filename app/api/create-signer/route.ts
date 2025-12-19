export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';

export async function POST(request: NextRequest) {
  try {
    const signer = await neynarClient.createSigner();

    const deepLink = `https://warpcast.com/~/siwn?token=${signer.signer_uuid}`;

    return NextResponse.json({
      signer_uuid: signer.signer_uuid,
      deep_link: deepLink,
    });
  } catch (error: any) {
    console.error('Create signer error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create signer' },
      { status: 500 }
    );
  }
}
