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
    console.log(`🚀 Analiz başlıyor - FID: ${fidNumber}`);

    // ORTAK HEADER
    const headers = {
      "accept": "application/json",
      "api_key": API_KEY,
    };

    // 1️⃣ FOLLOWINGS (Takip Ettiklerin) - V2 API
    const followingMap = new Map();
    let followingCursor = "";
    let followingLoop = 0;

    console.log("📡 Following listesi çekiliyor (V2 API)...");

    do {
      let url = `https://api.neynar.com/v2/farcaster/following?fid=${fidNumber}&limit=100`;
      if (followingCursor) url += `&cursor=${followingCursor}`;

      const res = await fetch(url, { headers });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Following API Hatası:", errorText);
        throw new Error(`Following API failed: ${res.status}`);
      }

      const data = await res.json();
      const users = data.users || [];

      users.forEach((user: any) => {
        followingMap.set(user.fid, {
          fid: user.fid,
          username: user.username,
          display_name: user.display_name || user.username,
          pfp_url: user.pfp_url,
          follower_count: user.follower_count,
        });
      });

      followingCursor = data.next?.cursor || "";
      followingLoop++;

      if (followingLoop >= 50) break; // Güvenlik
    } while (followingCursor);

    console.log(`✅ Following tamamlandı: ${followingMap.size} kişi`);

    // 2️⃣ FOLLOWERS (Seni Takip Edenler) - V2 API
    const followersSet = new Set<number>();
    let followersCursor = "";
    let followersLoop = 0;

    console.log("📡 Followers listesi çekiliyor (V2 API)...");

    do {
      let url = `https://api.neynar.com/v2/farcaster/followers?fid=${fidNumber}&limit=100`;
      if (followersCursor) url += `&cursor=${followersCursor}`;

      const res = await fetch(url, { headers });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Followers API Hatası:", errorText);
        throw new Error(`Followers API failed: ${res.status}`);
      }

      const data = await res.json();
      const users = data.users || [];

      users.forEach((user: any) => {
        followersSet.add(user.fid);
      });

      followersCursor = data.next?.cursor || "";
      followersLoop++;

      if (followersLoop >= 50) break; // Güvenlik
    } while (followersCursor);

    console.log(`✅ Followers tamamlandı: ${followersSet.size} kişi`);

    // 3️⃣ ANALİZ
    const followingList = Array.from(followingMap.values());
    const nonFollowers = followingList.filter(
      (user) => !followersSet.has(user.fid)
    );

    console.log(`🎯 Sonuç: ${nonFollowers.length} kişi seni takip etmiyor`);

    return NextResponse.json({
      nonFollowers: nonFollowers,
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
