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
      const userResponse = await neynarClient.fetchBulkUsers([signer.fid]);
      const user = userResponse.users[0];

      return NextResponse.json({
        authenticated: true,
        user: {
          fid: user.fid,
          username: user.username,
          display_name: user.display_name,
          pfp_url: user.pfp_url,
        },
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
