import { NextRequest, NextResponse } from "next/server";
import { neynarClient } from "@/lib/neynar";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fid = searchParams.get("fid");
  
  if (!fid) {
    return NextResponse.json({ error: "FID parametresi gerekli" }, { status: 400 });
  }

  const fidNumber = parseInt(fid);

  try {
    console.log(`🚀 [ANALİZ] Başlıyor - FID: ${fidNumber}`);

    const followingMap = new Map();
    let followingCursor: string | undefined = undefined;
    let followingCount = 0;

    while (followingCursor !== null) {
      const response = await neynarClient.fetchUserFollowing({
        fid: fidNumber,
        limit: 100,
        cursor: followingCursor,
      });

      response.users.forEach((item: any) => {
        const user = item.user || item;
        if (user && user.fid) {
          followingMap.set(user.fid, {
            fid: user.fid,
            username: user.username,
            display_name: user.display_name || user.username,
            pfp_url: user.pfp_url,
            follower_count: user.follower_count,
            power_badge: user.power_badge,
            neynar_score: user.score ?? null,
          });
        }
      });

      followingCursor = response.next?.cursor;
      followingCount += response.users.length;
      
      if (followingCount >= 3000) break;
    }

    console.log(`✅ [FOLLOWING] ${followingMap.size} kişi alındı.`);

    const followersSet = new Set<number>();
    let followersCursor: string | undefined = undefined;
    let followersCount = 0;

    while (followersCursor !== null) {
      const response = await neynarClient.fetchUserFollowers({
        fid: fidNumber,
        limit: 100,
        cursor: followersCursor,
      });

      response.users.forEach((item: any) => {
        const user = item.user || item;
        if (user && user.fid) {
          followersSet.add(user.fid);
        }
      });

      followersCursor = response.next?.cursor;
      followersCount += response.users.length;

      if (followersCount >= 3000) break;
    }

    console.log(`✅ [FOLLOWERS] ${followersSet.size} kişi alındı.`);

    const followingList = Array.from(followingMap.values());
    const nonFollowers = followingList.filter(
      (user) => !followersSet.has(user.fid)
    );

    const sortedNonFollowers = nonFollowers.sort((a, b) => a.follower_count - b.follower_count);

    console.log(`🎯 [SONUÇ] ${sortedNonFollowers.length} kişi seni takip etmiyor.`);

    return NextResponse.json({
      nonFollowers: sortedNonFollowers,
      stats: {
        following: followingMap.size,
        followers: followersSet.size,
        nonFollowersCount: sortedNonFollowers.length,
      },
    });

  } catch (error: any) {
    console.error("🔥 [API HATASI]:", error.message);
    return NextResponse.json(
      { error: "Kullanıcı verileri analiz edilemedi. Neynar bağlantısını kontrol edin." },
      { status: 500 }
    );
  }
}
