import { NextRequest, NextResponse } from "next/server";

// --- Vercel Cache Kapatma (Her zaman taze veri) ---
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fid = searchParams.get("fid");

  // Vercel'den anahtarı al
  const API_KEY = process.env.NEYNAR_API_KEY;

  if (!fid) return NextResponse.json({ error: "FID gerekli" }, { status: 400 });
  if (!API_KEY) return NextResponse.json({ error: "API Key sunucuda eksik" }, { status: 500 });

  console.log(`🚀 [ANALİZ] FID: ${fid} için tarama başlıyor...`);

  try {
    // 1. TAKİP ETTİKLERİN (FOLLOWING)
    const followingMap = new Map();
    let cursor: string | null = "";
    let loop = 0;

    console.log("📡 'Following' listesi çekiliyor...");
    
    // Güvenlik limiti: 50 sayfa (5000 kişi)
    while (loop < 50) {
      // URL'i manuel oluşturuyoruz (Hata riskini sıfırlamak için)
      let url = `https://api.neynar.com/v2/farcaster/following?fid=${fid}&limit=100`;
      if (cursor) url += `&cursor=${cursor}`;

      const res = await fetch(url, {
        headers: { "accept": "application/json", "api_key": API_KEY }
      });

      if (!res.ok) {
        console.error("🔴 API Hatası (Following):", await res.text());
        break;
      }

      const data = await res.json();
      const users = data.users || [];
      
      // Tekilleştirme (Aynı kişi 2 kere gelirse listeye ekleme)
      users.forEach((u: any) => followingMap.set(u.fid, u));
      
      cursor = data.next?.cursor;
      if (!cursor) break;
      loop++;
    }
    console.log(`✅ Following Bitti. Toplam: ${followingMap.size}`);

    // 2. SENİ TAKİP EDENLER (FOLLOWERS)
    const followersMap = new Map();
    cursor = "";
    loop = 0;

    console.log("📡 'Followers' listesi çekiliyor...");

    while (loop < 50) {
      let url = `https://api.neynar.com/v2/farcaster/followers?fid=${fid}&limit=100`;
      if (cursor) url += `&cursor=${cursor}`;

      const res = await fetch(url, {
        headers: { "accept": "application/json", "api_key": API_KEY }
      });

      if (!res.ok) {
        console.error("🔴 API Hatası (Followers):", await res.text());
        break;
      }

      const data = await res.json();
      const users = data.users || [];
      
      users.forEach((u: any) => followersMap.set(u.fid, u));
      
      cursor = data.next?.cursor;
      if (!cursor) break;
      loop++;
    }
    console.log(`✅ Followers Bitti. Toplam: ${followersMap.size}`);

    // 3. KARŞILAŞTIRMA (GHOST BULMA)
    const followingList = Array.from(followingMap.values());
    // Seni takip edenlerin ID'lerini bir kutuya atıyoruz
    const followerFids = new Set(followersMap.keys());

    // Eğer bir kişi (u), follower kutusunda YOKSA (!has), o bir Ghost'tur.
    const nonFollowers = followingList.filter((u) => !followerFids.has(u.fid));

    return NextResponse.json({ 
      users: nonFollowers,
      stats: {
        following: followingMap.size,
        followers: followersMap.size,
        ghosts: nonFollowers.length
      }
    });

  } catch (error: any) {
    console.error("🔥 KRİTİK SUNUCU HATASI:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
