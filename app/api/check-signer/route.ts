export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const signerUuid = searchParams.get('signer_uuid');

    if (!signerUuid) {
      return NextResponse.json(
        { error: 'Signer UUID is required' },
        { status: 400 }
      );
    }

    const signer = await neynarClient.lookupSigner(signerUuid);

    if (signer.status === 'approved' && signer.fid) {
      return NextResponse.json({
        authenticated: true,
        fid: signer.fid,
      });
    }

    return NextResponse.json({
      authenticated: false,
      status: signer.status,
    });
  } catch (error: any) {
    console.error('Check signer error:', error);
    return NextResponse.json(
      { authenticated: false, error: error.message },
      { status: 500 }
    );
  }
}
