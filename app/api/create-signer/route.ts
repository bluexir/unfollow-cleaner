export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';

export async function POST(request: NextRequest) {
  try {
    const signer = await neynarClient.createSigner();

    return NextResponse.json({
      signer_uuid: signer.signer_uuid,
      qr_code_url: signer.signer_approval_url,
      deep_link: `https://warpcast.com/~/siwn?token=${signer.signer_uuid}`,
    });
  } catch (error: any) {
    console.error('Create signer error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create signer' },
      { status: 500 }
    );
  }
}
