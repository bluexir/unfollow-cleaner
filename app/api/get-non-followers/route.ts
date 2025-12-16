import { NextRequest, NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';
import { NeynarFollowResponse, FarcasterUser } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { fid } = await request.json();

    if (!fid) {
      return NextResponse.json(
        { error: 'FID is required' },
        { status: 400 }
      );
    }

    // Get users the logged-in user follows
    const followingResponse = await neynarClient.fetchUserFollowing(fid, {
      limit: 200,
    }) as unknown as NeynarFollowResponse;
    const following = followingResponse.users;

    // Get users who follow the logged-in user
    const followersResponse = await neynarClient.fetchUserFollowers(fid, {
      limit: 200,
    }) as unknown as NeynarFollowResponse;
    const followers = followersResponse.users;

    // Create a set of follower FIDs for quick lookup
    const followerFids = new Set(followers.map((user) => user.fid));

    // Filter out users who don't follow back
    const nonFollowers = following.filter(
      (user) => !followerFids.has(user.fid)
    );

    // Format the response
    const formattedNonFollowers = nonFollowers.map((user): FarcasterUser => ({
      fid: user.fid,
      username: user.username,
      display_name: user.display_name || user.username,
      pfp_url: user.pfp_url,
      profile: {
        bio: {
          text: user.profile?.bio?.text || '',
        },
      },
      follower_count: user.follower_count || 0,
      following_count: user.following_count || 0,
    }));

    return NextResponse.json({
      nonFollowers: formattedNonFollowers,
      total: formattedNonFollowers.length,
    });
  } catch (error: any) {
    console.error('Get non-followers error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch non-followers' },
      { status: 500 }
    );
  }
}
