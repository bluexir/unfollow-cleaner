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

    // 1️⃣ FOLLOWINGS
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

      console.log(`   ✅ [FOLLOWING] Loop ${followingLoop + 1} - ${users.length} kişi geldi`);

      // ✅ DÜZELTİLDİ: item.user kullan!
      users.forEach((item: any) => {
        const user = item.user; // ← Önce user objesini al
        if (user && user.fid) {
          followingMap.set(user.fid, {
            fid: user.fid,
            username: user.username,
            display_name: user.display_name || user.username,
            pfp_url: user.pfp_url,
            follower_count: user.follower_count,
          });
        }
      });

      console.log(`   📊 Map size şu anda: ${followingMap.size}`);

      followingCursor = data.next?.cursor || "";
      followingLoop++;

      if (followingLoop >= 50) break;
    } while (followingCursor);

    console.log(`✅ [FOLLOWING] TAMAMLANDI - Toplam: ${followingMap.size} kişi, Loop: ${followingLoop}`);

    // 2️⃣ FOLLOWERS
    const followersSet = new Set<number>();
    let followersCursor = "";
    let followersLoop = 0;

    console.log("📡 [FOLLOWERS] İstek başlıyor...");

    do {
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

      console.log(`   ✅ [FOLLOWERS] Loop ${followersLoop + 1} - ${users.length} kişi geldi`);

      // ✅ DÜZELTİLDİ: item.user kullan!
      users.forEach((item: any) => {
        const user = item.user; // ← Önce user objesini al
        if (user && user.fid) {
          followersSet.add(user.fid);
        }
      });

      console.log(`   📊 Set size şu anda: ${followersSet.size}`);

      followersCursor = data.next?.cursor || "";
      followersLoop++;

      if (followersLoop >= 50) break;
    } while (followersCursor);

    console.log(`✅ [FOLLOWERS] TAMAMLANDI - Toplam: ${followersSet.size} kişi, Loop: ${followersLoop}`);

    // 3️⃣ ANALİZ
    const followingList = Array.from(followingMap.values());
    const nonFollowers = followingList.filter(
      (user) => !followersSet.has(user.fid)
    );

    console.log(`🎯 [SONUÇ] Non-followers: ${nonFollowers.length} kişi`);
    console.log(`📊 [STATS] Following: ${followingMap.size}, Followers: ${followersSet.size}`);

    return NextResponse.json({
      nonFollowers: nonFollowers,
      stats: {
        following: followingMap.size,
        followers: followersSet.size,
        nonFollowersCount: nonFollowers.length,
      },
    });

  } catch (error: any) {
    console.error("🔥 [ERROR] HATA:", error.message);
    return NextResponse.json(
      { error: error.message || "Bir hata oluştu" },
      { status: 500 }
    );
  }
}
