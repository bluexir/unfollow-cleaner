import { NextRequest, NextResponse } from 'next/server';
import { neynarClient, REQUIRED_FOLLOW_FID } from '@/lib/neynar';
import { NeynarFollowResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { fid } = await request.json();

    if (!fid) {
      return NextResponse.json(
        { error: 'FID is required' },
        { status: 400 }
      );
    }

    // Check if user follows @bluexir
    const response = await neynarClient.fetchUserFollowing(fid, {
      limit: 100,
    }) as unknown as NeynarFollowResponse;

    const isFollowing = response.users.some(
      (user) => user.fid === REQUIRED_FOLLOW_FID
    );

    return NextResponse.json({ isFollowing });
  } catch (error: any) {
    console.error('Check follow error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check follow status' },
      { status: 500 }
    );
  }
}
