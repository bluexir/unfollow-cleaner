import { NextRequest, NextResponse } from "next/server";

// --- AYARLAR ---
const REQUIRED_FOLLOW_FID = 429973; 
// Senin verdiğin çalışan son anahtar (Bunu değiştirmene gerek yok)
const NEYNAR_API_KEY = "9AE8AC85-3A93-4D79-ABAF-7AB279758724";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fid = searchParams.get("fid");

  if (!fid) {
    return NextResponse.json({ error: "FID gerekli" }, { status: 400 });
  }

  console.log(`🚀 [API START] Analiz Başlıyor: FID ${fid}`);

  try {
    // --- 1. TAKİP ETTİKLERİNİ (FOLLOWING) ÇEK ---
    let allFollowing = new Map();
    let cursor: string | null = "";
    let loop = 0;

    // Maksimum 30 sayfa (3000 kişi) tarar. Sonsuz döngüye girmez.
    while (loop < 30) { 
      const params = new URLSearchParams({
        fid: fid,
        viewer_fid: fid, 
        limit: "100", // Her seferinde 100 kişi iste
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
        console.error("🔴 Neynar API Hatası (Following):", err);
        break; 
      }

      const data = await res.json();
      const users = data.users || [];
      
      // Gelenleri listeye ekle
      users.forEach((u: any) => allFollowing.set(u.fid, u));
      
      console.log(`   -> Following Sayfa ${loop + 1}: ${users.length} kişi çekildi. Toplam: ${allFollowing.size}`);

      // Devamı var mı?
      cursor = data.next?.cursor || null;
      if (!cursor) break; // Yoksa çık
      loop++;
    }

    // --- 2. SENİ TAKİP EDENLERİ (FOLLOWERS) ÇEK ---
    let allFollowers = new Map();
    cursor = "";
    loop = 0;

    while (loop < 30) {
      const params = new URLSearchParams({
        fid: fid,
        viewer_fid: fid,
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

      if (!res.ok) {
        console.error("🔴 Neynar API Hatası (Followers):", res.status);
        break;
      }

      const data = await res.json();
      const users = data.users || [];
      
      users.forEach((u: any) => allFollowers.set(u.fid, u));
      
      console.log(`   -> Followers Sayfa ${loop + 1}: ${users.length} kişi çekildi. Toplam: ${allFollowers.size}`);

      cursor = data.next?.cursor || null;
      if (!cursor) break;
      loop++;
    }

    // --- SONUÇLARI DÖK ---
    const followingList = Array.from(allFollowing.values());
    const followersList = Array.from(allFollowers.values());

    console.log(`📊 ANALİZ SONUCU: ${followingList.length} Takip Edilen, ${followersList.length} Takipçi`);

    // Analiz (Hayaletleri Bul)
    const followerFids = new Set(allFollowers.keys());
    const nonFollowers = followingList.filter((u) => !followerFids.has(u.fid));
    
    // Geliştiriciyi takip ediyor mu?
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
    console.error("🔥 KRİTİK HATA:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
