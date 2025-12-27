import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fid = searchParams.get("fid");
  
  const API_KEY = process.env.NEYNAR_API_KEY;

  if (!fid) {
    return NextResponse.json({ error: "FID gerekli" }, { status: 400 });
  }

  if (!API_KEY) {
    return NextResponse.json({ error: "API Key eksik" }, { status: 500 });
  }

  const fidNumber = parseInt(fid);

  try {
    console.log(`🚀 [START] Analiz başlıyor - FID: ${fidNumber}`);

    const headers = {
      "accept": "application/json",
      "api_key": API_KEY,
    };

    // 1️⃣ FOLLOWINGS (Takip Ettiklerin)
    const followingMap = new Map();
    let followingCursor = "";
    let followingLoop = 0;

    console.log("📡 [FOLLOWING] İstek başlıyor...");

    do {
      let url = `https://api.neynar.com/v2/farcaster/following?fid=${fidNumber}&limit=100`;
      if (followingCursor) url += `&cursor=${followingCursor}`;

      const res = await fetch(url, { headers });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`❌ [FOLLOWING] API Hatası:`, errorText);
        throw new Error(`Following API failed: ${res.status}`);
      }

      const data = await res.json();
      const users = data.users || [];

      users.forEach((item: any) => {
        const user = item.user || item;
        if (user && user.fid) {
          followingMap.set(user.fid, {
            fid: user.fid,
            username: user.username,
            display_name: user.display_name || user.username,
            pfp_url: user.pfp_url,
            follower_count: user.follower_count,
            power_badge: user.power_badge,
            profile: user.profile
          });
        }
      });

      followingCursor = data.next?.cursor || "";
      followingLoop++;

      if (followingLoop >= 50) break;
    } while (followingCursor);

    console.log(`✅ [FOLLOWING] Toplam: ${followingMap.size} kişi`);

    // 2️⃣ FOLLOWERS (Seni Takip Edenler) - NORMAL ENDPOINT
    const followersSet = new Set<number>();
    let followersCursor = "";
    let followersLoop = 0;

    console.log("📡 [FOLLOWERS] İstek başlıyor...");

    do {
      // ✅ NORMAL ENDPOINT KULLAN (relevant değil!)
      let url = `https://api.neynar.com/v2/farcaster/followers?fid=${fidNumber}&limit=100`;
      if (followersCursor) url += `&cursor=${followersCursor}`;

      const res = await fetch(url, { headers });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error(`❌ [FOLLOWERS] API Hatası:`, errorText);
        throw new Error(`Followers API failed: ${res.status}`);
      }

      const data = await res.json();
      const users = data.users || [];

      users.forEach((item: any) => {
        const user = item.user || item;
        if (user && user.fid) {
          followersSet.add(user.fid);
        }
      });

      followersCursor = data.next?.cursor || "";
      followersLoop++;

      if (followersLoop >= 50) break;
    } while (followersCursor);

    console.log(`✅ [FOLLOWERS] Toplam: ${followersSet.size} kişi`);

    // 3️⃣ ANALİZ
    const followingList = Array.from(followingMap.values());
    const nonFollowers = followingList.filter(
      (user) => !followersSet.has(user.fid)
    );

    console.log(`🎯 [SONUÇ] Non-followers: ${nonFollowers.length} kişi`);

    return NextResponse.json({
      nonFollowers: nonFollowers,
      stats: {
        following: followingMap.size,
        followers: followersSet.size,
        nonFollowersCount: nonFollowers.length,
      },
    });

  } catch (error: any) {
    console.error("🔥 [ERROR]:", error.message);
    return NextResponse.json(
      { error: error.message || "Bir hata oluştu" },
      { status: 500 }
    );
  }
}
