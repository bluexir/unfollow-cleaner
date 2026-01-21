export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const fid = searchParams.get('fid');

    if (!fid) {
      return NextResponse.json(
        { error: 'FID required' },
        { status: 400 }
      );
    }

    const userFid = parseInt(fid);
    console.log('[GET-NON-FOLLOWERS] Starting, FID:', userFid);

    // 0. Fetch user profile
    const { users: userProfiles } = await neynarClient.fetchBulkUsers({ fids: [userFid] });
    const userProfile = userProfiles[0];

    // 1. Fetch following list (with pagination)
    let followingList: any[] = [];
    let followingCursor: string | null = null;

    do {
      const followingResponse = await neynarClient.fetchUserFollowing({
        fid: userFid,
        limit: 100,
        ...(followingCursor && { cursor: followingCursor })
      });

      followingList = followingList.concat(followingResponse.users || []);
      followingCursor = followingResponse.next?.cursor || null;

      console.log('[GET-NON-FOLLOWERS] Following batch:', followingResponse.users?.length, 'Total:', followingList.length);

    } while (followingCursor);

    console.log('[GET-NON-FOLLOWERS] Total following:', followingList.length);

    // 2. Fetch followers list (with pagination)
    let followersList: any[] = [];
    let followersCursor: string | null = null;

    do {
      const followersResponse = await neynarClient.fetchUserFollowers({
        fid: userFid,
        limit: 100,
        ...(followersCursor && { cursor: followersCursor })
      });

      followersList = followersList.concat(followersResponse.users || []);
      followersCursor = followersResponse.next?.cursor || null;

      console.log('[GET-NON-FOLLOWERS] Followers batch:', followersResponse.users?.length, 'Total:', followersList.length);

    } while (followersCursor);

    console.log('[GET-NON-FOLLOWERS] Total followers:', followersList.length);

    // 3. Create followers FID set (with type casting!)
    const followerFids = new Set(followersList.map((u: any) => Number(u.user?.fid)));

    console.log('[GET-NON-FOLLOWERS] Follower FIDs set size:', followerFids.size);

    // 4. Filter non-followers (with type casting!)
    const nonFollowers = followingList.filter((follow: any) => !followerFids.has(Number(follow.user?.fid)));

    console.log('[GET-NON-FOLLOWERS] Non-followers count:', nonFollowers.length);

    // 5. Format and return data (with u.user.*)
    const formattedNonFollowers = nonFollowers.map((follow: any) => {
      const user = follow.user;
      return {
        fid: user.fid,
        username: user.username,
        display_name: user.display_name || user.username,
        pfp_url: user.pfp_url,
        follower_count: user.follower_count || 0,
        power_badge: user.power_badge || false,
        neynar_score: user.score || user.experimental?.neynar_user_score || null
      };
    });

    return NextResponse.json({
      nonFollowers: formattedNonFollowers,
      stats: {
        following: followingList.length,
        followers: followersList.length,
        nonFollowersCount: nonFollowers.length
      },
      userProfile: {
        fid: userProfile.fid,
        username: userProfile.username,
        display_name: userProfile.display_name || userProfile.username,
        pfp_url: userProfile.pfp_url,
        neynar_score: userProfile.score || userProfile.experimental?.neynar_user_score || null
      }
    });

  } catch (error: any) {
    console.error('[GET-NON-FOLLOWERS] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch list' },
      { status: 500 }
    );
  }
}
