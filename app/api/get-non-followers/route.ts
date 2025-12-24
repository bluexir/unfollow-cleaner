import { NextRequest, NextResponse } from "next/server";

// --- AYARLAR ---
const REQUIRED_FOLLOW_FID = 429973; 
// Senin verdiğin çalışan anahtar
const NEYNAR_API_KEY = "9AE8AC85-3A93-4D79-ABAF-7AB279758724";

export async function GET(req: NextRequest) {
  // 1. FID KONTROLÜ
  const { searchParams } = new URL(req.url);
  const fid = searchParams.get("fid");

  if (!fid) {
    console.error("❌ HATA: FID parametresi URL'de yok!");
    return NextResponse.json({ error: "FID gerekli" }, { status: 400 });
  }

  console.log(`🚀 API BAŞLATILDI. Hedef FID: ${fid}`);

  try {
    // --- TAKİP ETTİKLERİNİ (FOLLOWING) ÇEK ---
    let allFollowing: any[] = [];
    let cursor: string | null = "";
    let pageCount = 0;

    console.log("📡 'Following' listesi çekiliyor...");

    while (pageCount < 30) { // Sonsuz döngü koruması
      const params = new URLSearchParams({
        fid: fid,
        viewer_fid: fid, // Neynar v2 bazen bunu ister
        limit: "100",
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
        const errText = await res.text();
        console.error(`🔴 NEYNAR HATASI (Following): ${res.status} - ${errText}`);
        break;
      }

      const data = await res.json();
      const users = data.users || [];
      
      allFollowing = [...allFollowing, ...users];
      console.log(`   📄 Sayfa ${pageCount + 1}: ${users.length} kişi çekildi. (Toplam: ${allFollowing.length})`);

      // Cursor kontrolü (Devamı var mı?)
      cursor = data.next?.cursor || null;
      if (!cursor) {
        console.log("   ✅ 'Following' listesi bitti.");
        break;
      }
      pageCount++;
    }

    // --- SENİ TAKİP EDENLERİ (FOLLOWERS) ÇEK ---
    let allFollowers: any[] = [];
    cursor = "";
    pageCount = 0;

    console.log("📡 'Followers' listesi çekiliyor...");

    while (pageCount < 30) {
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
        const errText = await res.text();
        console.error(`🔴 NEYNAR HATASI (Followers): ${res.status} - ${errText}`);
        break;
      }

      const data = await res.json();
      const users = data.users || [];
      
      allFollowers = [...allFollowers, ...users];
      console.log(`   📄 Sayfa ${pageCount + 1}: ${users.length} kişi çekildi. (Toplam: ${allFollowers.length})`);

      cursor = data.next?.cursor || null;
      if (!cursor) {
        console.log("   ✅ 'Followers' listesi bitti.");
        break;
      }
      pageCount++;
    }

    // --- SONUÇLARI HESAPLA ---
    console.log(`📊 ANALİZ SONUCU: Following: ${allFollowing.length} | Followers: ${allFollowers.length}`);

    // Takipçi FID'lerini bir kümeye (Set) koy (Hızlı arama için)
    const followerFids = new Set(allFollowers.map((u: any) => u.fid));
    
    // Seni takip etmeyenleri bul (Following listesinde olup, Follower setinde olmayanlar)
    const nonFollowers = allFollowing.filter((u: any) => !followerFids.has(u.fid));

    // Geliştirici takibi kontrolü
    const isFollowingDev = allFollowing.some((u: any) => u.fid === REQUIRED_FOLLOW_FID);

    console.log(`💀 BULUNAN GHOST SAYISI: ${nonFollowers.length}`);

    return NextResponse.json({ 
      users: nonFollowers,
      isFollowingDev: isFollowingDev,
      stats: {
        following: allFollowing.length,
        followers: allFollowers.length,
        notFollowingBack: nonFollowers.length
      }
    });

  } catch (error: any) {
    console.error("🔥 KRİTİK SUNUCU HATASI:", error);
    return NextResponse.json({ 
      error: "Sunucu içi hata oluştu", 
      details: error.message 
    }, { status: 500 });
  }
}
