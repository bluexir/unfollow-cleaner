import { NextRequest, NextResponse } from "next/server";
import { neynarClient } from "@/lib/neynar";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fid = searchParams.get("fid");

  if (!fid) {
    return NextResponse.json({ error: "FID gerekli" }, { status: 400 });
  }

  const fidNumber = parseInt(fid);

  try {
    console.log(`🚀 Analiz başlıyor - FID: ${fidNumber}`);

    // 1️⃣ FOLLOWINGS (Takip Ettiklerin) - SDK ile
    const followingMap = new Map();
    let followingCursor: string | undefined = undefined;
    let followingLoop = 0;

    console.log("📡 Following listesi çekiliyor (SDK)...");

    do {
      const result = await neynarClient.fetchUserFollowing(
        fidNumber,
        {
          limit: 100,
          cursor: followingCursor,
        }
      );

      result.users.forEach((user) => {
        followingMap.set(user.fid, {
          fid: user.fid,
          username: user.username,
          display_name: user.display_name || user.username,
          pfp_url: user.pfp_url,
          follower_count: user.follower_count,
        });
      });

      followingCursor = result.next?.cursor;
      followingLoop++;

      if (followingLoop >= 50) break; // Güvenlik
    } while (followingCursor);

    console.log(`✅ Following tamamlandı: ${followingMap.size} kişi`);

    // 2️⃣ FOLLOWERS (Seni Takip Edenler) - SDK ile
    const followersSet = new Set<number>();
    let followersCursor: string | undefined = undefined;
    let followersLoop = 0;

    console.log("📡 Followers listesi çekiliyor (SDK)...");

    do {
      const result = await neynarClient.fetchUserFollowers(
        fidNumber,
        {
          limit: 100,
          cursor: followersCursor,
        }
      );

      result.users.forEach((user) => {
        followersSet.add(user.fid);
      });

      followersCursor = result.next?.cursor;
      followersLoop++;

      if (followersLoop >= 50) break; // Güvenlik
    } while (followersCursor);

    console.log(`✅ Followers tamamlandı: ${followersSet.size} kişi`);

    // 3️⃣ ANALİZ: Seni takip etmeyenleri bul
    const followingList = Array.from(followingMap.values());
    const nonFollowers = followingList.filter(
      (user) => !followersSet.has(user.fid)
    );

    console.log(`🎯 Sonuç: ${nonFollowers.length} kişi seni takip etmiyor`);

    return NextResponse.json({
      nonFollowers: nonFollowers, // ← Frontend'in beklediği property
      stats: {
        following: followingMap.size,
        followers: followersSet.size,
        nonFollowersCount: nonFollowers.length,
      },
    });

  } catch (error: any) {
    console.error("🔥 HATA:", error.message);
    return NextResponse.json(
      { error: error.message || "Bir hata oluştu" },
      { status: 500 }
    );
  }
}
