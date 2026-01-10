export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const fid = searchParams.get('fid');

    if (!fid) {
      return NextResponse.json(
        { error: 'FID gerekli' },
        { status: 400 }
      );
    }

    const userFid = parseInt(fid);
    console.log('[GET-NON-FOLLOWERS] Başlatılıyor, FID:', userFid);

    // 1. Following listesini al (pagination + viewer_fid ile)
    let followingList: any[] = [];
    let followingCursor: string | null = null;

    do {
      const followingResponse = await neynarClient.fetchUserFollowing({
        fid: userFid,
        viewerFid: userFid, // Filtrelenmiş sonuçlar için
        limit: 100,
        ...(followingCursor && { cursor: followingCursor })
      });

      followingList = followingList.concat(followingResponse.users || []);
      followingCursor = followingResponse.next?.cursor || null;

      console.log('[GET-NON-FOLLOWERS] Following batch:', followingResponse.users?.length, 'Total:', followingList.length);

    } while (followingCursor);

    console.log('[GET-NON-FOLLOWERS] Toplam following:', followingList.length);

    // 2. Followers listesini al (pagination + viewer_fid ile)
    let followersList: any[] = [];
    let followersCursor: string | null = null;

    do {
      const followersResponse = await neynarClient.fetchUserFollowers({
        fid: userFid,
        viewerFid: userFid, // Filtrelenmiş sonuçlar için
        limit: 100,
        ...(followersCursor && { cursor: followersCursor })
      });

      followersList = followersList.concat(followersResponse.users || []);
      followersCursor = followersResponse.next?.cursor || null;

      console.log('[GET-NON-FOLLOWERS] Followers batch:', followersResponse.users?.length, 'Total:', followersList.length);

    } while (followersCursor);

    console.log('[GET-NON-FOLLOWERS] Toplam followers:', followersList.length);

    // 3. Followers FID set'i oluştur
    const followerFids = new Set(followersList.map((u: any) => u.fid));

    // 4. Non-followers'ı filtrele
    const nonFollowers = followingList.filter((user: any) => !followerFids.has(user.fid));

    console.log('[GET-NON-FOLLOWERS] Non-followers sayısı:', nonFollowers.length);

    // 5. Formatlı veri döndür
    const formattedNonFollowers = nonFollowers.map((user: any) => ({
      fid: user.fid,
      username: user.username,
      display_name: user.display_name || user.username,
      pfp_url: user.pfp_url,
      follower_count: user.follower_count || 0,
      power_badge: user.power_badge || false,
      neynar_score: user.experimental?.neynar_user_score || null
    }));

    return NextResponse.json({
      nonFollowers: formattedNonFollowers,
      stats: {
        following: followingList.length,
        followers: followersList.length,
        nonFollowersCount: nonFollowers.length
      }
    });

  } catch (error: any) {
    console.error('[GET-NON-FOLLOWERS] Hata:', error);
    return NextResponse.json(
      { error: error.message || 'Liste alınamadı' },
      { status: 500 }
    );
  }
}
