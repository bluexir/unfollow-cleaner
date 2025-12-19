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

    const userFid = parseInt(fid);

    const followingResponse = await neynarClient.fetchUserFollowing(userFid, {
      limit: 200,
    });

    const followersResponse = await neynarClient.fetchUserFollowers(userFid, {
      limit: 200,
    });

    const following = followingResponse.result.users;
    const followers = followersResponse.result.users;

    const followerFids = new Set(followers.map(u => u.fid));

    const nonFollowers = following
      .filter(user => !followerFids.has(user.fid))
      .map(user => ({
        fid: user.fid,
        username: user.username,
        display_name: user.display_name || user.username,
        pfp_url: user.pfp_url || '',
        follower_count: user.follower_count || 0,
      }));

    return NextResponse.json({
      nonFollowers,
      total: nonFollowers.length,
    });
  } catch (error: any) {
    console.error('Get non-followers error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch non-followers' },
      { status: 500 }
    );
  }
}
