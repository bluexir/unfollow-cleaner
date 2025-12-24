import { NextRequest, NextResponse } from "next/server";

// --- AYARLAR ---
const REQUIRED_FOLLOW_FID = 429973; 
// Senin verdiğin yeni anahtar
const NEYNAR_API_KEY = "9AE8AC85-3A93-4D79-ABAF-7AB279758724";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fid = searchParams.get("fid");

  if (!fid) return NextResponse.json({ error: "FID gerekli" }, { status: 400 });

  console.log(`🚀 Analiz Başlıyor: FID ${fid}`);

  try {
    // --- 1. TAKİP ETTİKLERİNİ ÇEK (Following) ---
    let allFollowing = new Map();
    let cursor: string | null = "";
    let loop = 0;

    while (loop < 20) { // Cursor null olana kadar veya 20 sayfa
      const params = new URLSearchParams({
        fid: fid,
        limit: "100", // String olarak '100'
      });
      if (cursor) params.append("cursor", cursor);

      const url = `https://api.neynar.com/v2/farcaster/following?${params.toString()}`;
      
      const res = await fetch(url, {
        headers: { 
          "accept": "application/json",
          "api_key": NEYNAR_API_KEY 
        },
        cache: "no-store",
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("Neynar API Hatası:", err);
        break; 
      }

      const data = await res.json();
      const users = data.users || [];
      
      users.forEach((u: any) => allFollowing.set(u.fid, u));
      
      console.log(`   -> Following Sayfa ${loop + 1}: ${users.length} kişi geldi.`);

      cursor = data.next?.cursor || null;
      if (!cursor) break; // Cursor bittiyse çık
      loop++;
    }

    // --- 2. SENİ TAKİP EDENLERİ ÇEK (Followers) ---
    let allFollowers = new Map();
    cursor = "";
    loop = 0;

    while (loop < 20) {
      const params = new URLSearchParams({
        fid: fid,
        limit: "100",
      });
      if (cursor) params.append("cursor", cursor);

      const url = `https://api.neynar.com/v2/farcaster/followers?${params.toString()}`;
      
      const res = await fetch(url, {
        headers: { 
          "accept": "application/json",
          "api_key": NEYNAR_API_KEY 
        },
        cache: "no-store",
      });

      if (!res.ok) break;

      const data = await res.json();
      const users = data.users || [];
      
      users.forEach((u: any) => allFollowers.set(u.fid, u));
      
      console.log(`   -> Followers Sayfa ${loop + 1}: ${users.length} kişi geldi.`);

      cursor = data.next?.cursor || null;
      if (!cursor) break;
      loop++;
    }

    // --- SONUÇ ---
    const followingList = Array.from(allFollowing.values());
    const followersList = Array.from(allFollowers.values());

    console.log(`📊 TOPLAM: ${followingList.length} Takip Edilen, ${followersList.length} Takipçi`);

    const followerFids = new Set(allFollowers.keys());
    const nonFollowers = followingList.filter((u) => !followerFids.has(u.fid));
    const isFollowingDev = allFollowing.has(REQUIRED_FOLLOW_FID);

    return NextResponse.json({ 
      users: nonFollowers,
      isFollowingDev: isFollowingDev,
      stats: {
        following: followingList.length,
        followers: followersList.length,
        notFollowingBack: nonFollowers.length
      }
    });

  } catch (error: any) {
    console.error("🔴 Kritik Hata:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
