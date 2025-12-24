import { NextRequest, NextResponse } from "next/server";

// --- AYARLAR ---
const REQUIRED_FOLLOW_FID = 429973; 
// Senin verdiğin çalışan son anahtar
const NEYNAR_API_KEY = "9AE8AC85-3A93-4D79-ABAF-7AB279758724";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fid = searchParams.get("fid");

  if (!fid) return NextResponse.json({ error: "FID gerekli" }, { status: 400 });

  console.log(`🚀 [Hybrid-Fix] Analiz Başlıyor: FID ${fid}`);

  try {
    // --- 1. TAKİP ETTİKLERİNİ (FOLLOWING) ÇEK ---
    // Map kullanarak "Süzgeç" yapıyoruz. Aynı ID gelirse üstüne yazar, çift olmaz.
    let followingMap = new Map(); 
    let cursor: string | null = "";
    let loop = 0;

    while (loop < 50) { 
      // URLSearchParams KULLANMIYORUZ. Manuel yazıyoruz (197'yi bulan yöntem)
      let url = `https://api.neynar.com/v2/farcaster/following?fid=${fid}&limit=100`;
      if (cursor) {
        url += `&cursor=${cursor}`;
      }

      const res = await fetch(url, {
        headers: { 
          "accept": "application/json",
          "api_key": NEYNAR_API_KEY 
        },
        cache: "no-store",
      });

      if (!res.ok) {
        console.error("🔴 API Hatası (Following):", await res.text());
        break; 
      }

      const data = await res.json();
      const users = data.users || [];
      
      // SÜZGEÇ: Gelenleri Map'e at (Varsa ezer, yoksa ekler)
      users.forEach((u: any) => followingMap.set(u.fid, u));
      
      console.log(`   -> Following Çekildi: ${users.length} kişi. (Toplam Unique: ${followingMap.size})`);

      cursor = data.next?.cursor || null;
      if (!cursor) break; 
      loop++;
    }

    // --- 2. SENİ TAKİP EDENLERİ (FOLLOWERS) ÇEK ---
    let followersMap = new Map(); // Süzgeç
    cursor = "";
    loop = 0;

    while (loop < 50) {
      // Manuel URL inşası
      let url = `https://api.neynar.com/v2/farcaster/followers?fid=${fid}&limit=100`;
      if (cursor) {
        url += `&cursor=${cursor}`;
      }
      
      const res = await fetch(url, {
        headers: { 
          "accept": "application/json",
          "api_key": NEYNAR_API_KEY 
        },
        cache: "no-store",
      });

      if (!res.ok) {
        console.error("🔴 API Hatası (Followers):", await res.text());
        break;
      }

      const data = await res.json();
      const users = data.users || [];
      
      // SÜZGEÇ: Gelenleri Map'e at
      users.forEach((u: any) => followersMap.set(u.fid, u));
      
      console.log(`   -> Followers Çekildi: ${users.length} kişi. (Toplam Unique: ${followersMap.size})`);

      cursor = data.next?.cursor || null;
      if (!cursor) break;
      loop++;
    }

    // --- SONUÇLARI LİSTEYE ÇEVİR ---
    const followingList = Array.from(followingMap.values());
    const followersList = Array.from(followersMap.values());

    console.log(`📊 FİNAL RAPOR: ${followingList.length} Takip Edilen, ${followersList.length} Takipçi`);

    // Karşılaştırma
    const followerFids = new Set(followersMap.keys());
    const nonFollowers = followingList.filter((u) => !followerFids.has(u.fid));
    const isFollowingDev = followingMap.has(REQUIRED_FOLLOW_FID);

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
    console.error("🔥 HATA:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
