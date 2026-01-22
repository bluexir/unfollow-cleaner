export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

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

    const neynarApiKey = process.env.NEYNAR_API_KEY;
    if (!neynarApiKey) {
      return NextResponse.json({ error: 'NEYNAR_API_KEY missing' }, { status: 500 });
    }

    const headers = {
      'accept': 'application/json',
      'api_key': neynarApiKey,
    };

    const userProfileRes = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${userFid}`,
      { headers }
    );
    const userProfileData = await userProfileRes.json();
    const userProfile = userProfileData.users[0];

    let followingList: any[] = [];
    let followingCursor: string | null = null;

    do {
      const url = `https://api.neynar.com/v2/farcaster/following?fid=${userFid}&limit=100${followingCursor ? `&cursor=${followingCursor}` : ''}`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      
      followingList = followingList.concat(data.users || []);
      followingCursor = data.next?.cursor || null;

      console.log('[GET-NON-FOLLOWERS] Following batch:', data.users?.length, 'Total:', followingList.length);
    } while (followingCursor);

    console.log('[GET-NON-FOLLOWERS] Total following:', followingList.length);

    let followersList: any[] = [];
    let followersCursor: string | null = null;

    do {
      const url = `https://api.neynar.com/v2/farcaster/followers?fid=${userFid}&limit=100${followersCursor ? `&cursor=${followersCursor}` : ''}`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      
      followersList = followersList.concat(data.users || []);
      followersCursor = data.next?.cursor || null;

      console.log('[GET-NON-FOLLOWERS] Followers batch:', data.users?.length, 'Total:', followersList.length);
    } while (followersCursor);

    console.log('[GET-NON-FOLLOWERS] Total followers:', followersList.length);

    const followerFids = new Set(followersList.map((u: any) => u.fid));
    const nonFollowers = followingList.filter((u: any) => !followerFids.has(u.fid));

    console.log('[GET-NON-FOLLOWERS] Non-followers:', nonFollowers.length);

    return NextResponse.json({
      nonFollowers: nonFollowers,
      stats: {
        following: followingList.length,
        followers: followersList.length,
        nonFollowersCount: nonFollowers.length
      },
      userProfile: {
        fid: userProfile.fid,
        username: userProfile.username,
        display_name: userProfile.display_name,
        pfp_url: userProfile.pfp_url,
        neynar_score: userProfile.experimental?.neynar_user_score || null
      }
    });

  } catch (error: any) {
    console.error('[GET-NON-FOLLOWERS] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed' },
      { status: 500 }
    );
  }
}
