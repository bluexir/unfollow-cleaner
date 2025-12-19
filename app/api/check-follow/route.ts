export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fid = searchParams.get('fid');

    if (!fid) {
      return NextResponse.json(
        { error: 'FID is required' },
        { status: 400 }
      );
    }

    const bluexirUser = await neynarClient.lookupUserByUsername('bluexir');
    const bluexirFid = bluexirUser.result.user.fid;

    if (parseInt(fid) === bluexirFid) {
      return NextResponse.json({
        isFollowing: true,
        isBluexir: true,
      });
    }

    const followersResponse = await neynarClient.fetchUserFollowers(bluexirFid, {
      limit: 100,
    });

    const isFollowing = followersResponse.result.users.some(
      (user) => user.fid === parseInt(fid)
    );

    return NextResponse.json({
      isFollowing,
      isBluexir: false,
    });
  } catch (error: any) {
    console.error('Check follow error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check follow status' },
      { status: 500 }
    );
  }
}
