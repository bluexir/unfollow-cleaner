import { NextRequest, NextResponse } from "next/server";

// --- CACHE İPTAL (Her zaman taze veri) ---
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fid = searchParams.get("fid");

  // Vercel'den anahtarları al
  const API_KEY = process.env.NEYNAR_API_KEY;
  const SIGNER_UUID = process.env.NEYNAR_SIGNER_UUID;

  if (!fid) return NextResponse.json({ error: "FID gerekli" }, { status: 400 });
  if (!API_KEY) return NextResponse.json({ error: "API Key eksik" }, { status: 500 });

  console.log(`🚀 [MODERN-FIX] Analiz Başlıyor. FID: ${fid}`);

  // --- ORTAK HEADER AYARLARI (Senin görselindeki x-api-key formatı) ---
  const headers: any = {
    "accept": "application/json",
    "x-api-key": API_KEY // Kritik Değişiklik: api_key -> x-api-key
  };
  
  // Eğer UUID varsa, okuma işlemine de yetki katıyoruz
  if (SIGNER_UUID) {
    headers["x-neynar-signer-uuid"] = SIGNER_UUID;
  }

  try {
    // 1. FOLLOWINGS (Takip Ettiklerin)
    const followingMap = new Map();
    let cursor: string | null = "";
    let loop = 0;

    console.log("📡 'Following' listesi çekiliyor...");

    while (loop < 50) {
      // viewer_fid ekliyoruz ki "Ajan" gözüyle baksın, ama limit=100 ile
      let url = `https://api.neynar.com/v2/farcaster/following?fid=${fid}&viewer_fid=${fid}&limit=100`;
      if (cursor) url += `&cursor=${cursor}`;

      const res = await fetch(url, { headers }); // Güncellenmiş Headerlar

      if (!res.ok) {
        console.error("🔴 API Hatası (Following):", await res.text());
        break;
      }

      const data = await res.json();
      const users = data.users || [];
      
      users.forEach((u: any) => followingMap.set(u.fid, u));
      
      // LOG: Gelen ilk kişinin adını yazdıralım ki "1" kişi kimmiş görelim
      if (loop === 0 && users.length > 0) {
        console.log(`   🔎 İlk çekilen kişi örneği: ${users[0].username} (FID: ${users[0].fid})`);
      }

      cursor = data.next?.cursor;
      if (!cursor) break;
      loop++;
    }
    console.log(`✅ Following Bitti. Toplam Unique: ${followingMap.size}`);

    // 2. FOLLOWERS (Seni Takip Edenler)
    const followersMap = new Map();
    cursor = "";
    loop = 0;

    console.log("📡 'Followers' listesi çekiliyor...");

    while (loop < 50) {
      let url = `https://api.neynar.com/v2/farcaster/followers?fid=${fid}&viewer_fid=${fid}&limit=100`;
      if (cursor) url += `&cursor=${cursor}`;

      const res = await fetch(url, { headers });

      if (!res.ok) break;

      const data = await res.json();
      const users = data.users || [];
      
      users.forEach((u: any) => followersMap.set(u.fid, u));
      
      cursor = data.next?.cursor;
      if (!cursor) break;
      loop++;
    }
    console.log(`✅ Followers Bitti. Toplam Unique: ${followersMap.size}`);

    // 3. ANALİZ
    const followingList = Array.from(followingMap.values());
    const followerFids = new Set(followersMap.keys());
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
    console.error("🔥 KRİTİK HATA:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
