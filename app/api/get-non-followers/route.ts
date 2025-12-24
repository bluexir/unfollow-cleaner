import { NextRequest, NextResponse } from "next/server";

// --- AYARLAR ---
const REQUIRED_FOLLOW_FID = 429973; // Bluexir

// Test için API Anahtarını doğrudan buraya yazdık. 
// Çalıştığını gördükten sonra Vercel ayarlarına geri dönebiliriz.
const NEYNAR_API_KEY = "018A8963-2A8F-4ADD-92C7-C3CFD7C511D3";

// Yardımcı Fonksiyon: Neynar'a Direkt İstek Atar (SDK Kullanmadan)
async function fetchNeynar(endpoint: string, params: string) {
  const url = `https://api.neynar.com/v2/farcaster/${endpoint}?${params}`;
  
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "accept": "application/json",
      "api_key": NEYNAR_API_KEY,
    },
    cache: "no-store", // Her zaman taze veri çek
  });

  if (!res.ok) {
    const errorBody = await res.text();
    // Hatayı detaylı görelim
    throw new Error(`Neynar API Hatası (${res.status}): ${errorBody}`);
  }

  return res.json();
}

export async function GET(req: NextRequest) {
  console.log("🟢 (Direct-Mode) API İsteği Başladı...");

  const { searchParams } = new URL(req.url);
  const fid = searchParams.get("fid");

  if (!fid) {
    return NextResponse.json({ error: "FID gerekli" }, { status: 400 });
  }

  try {
    const userFid = fid; 

    // 1. TAKİP ETTİKLERİNİ ÇEK (Following)
    console.log("📡 Takip edilenler çekiliyor...");
    let allFollowing: any[] = [];
    let cursor: string | null = "";
    let loop = 0;

    // Güvenlik limiti: Max 15 sayfa
    while (cursor !== null && loop < 15) {
      const params = `fid=${userFid}&limit=100${cursor ? `&cursor=${cursor}` : ""}`;
      const data = await fetchNeynar("following", params);
      
      const users = data.users || [];
      allFollowing = [...allFollowing, ...users];
      
      cursor = data.next?.cursor || null;
      loop++;
    }

    // 2. SENİ TAKİP EDENLERİ ÇEK (Followers)
    console.log(`📡 Seni takip edenler çekiliyor... (Şu an bulunan takip edilen: ${allFollowing.length})`);
    let allFollowers: any[] = [];
    cursor = "";
    loop = 0;

    while (cursor !== null && loop < 15) {
      const params = `fid=${userFid}&limit=100${cursor ? `&cursor=${cursor}` : ""}`;
      const data = await fetchNeynar("followers", params);

      const users = data.users || [];
      allFollowers = [...allFollowers, ...users];
      
      cursor = data.next?.cursor || null;
      loop++;
    }

    // 3. KARŞILAŞTIRMA
    console.log("⚡ Analiz yapılıyor...");
    const followerFids = new Set(allFollowers.map((u: any) => u.fid));
    
    // Takip ettiklerinden, seni takip etmeyenleri süzüyoruz
    const nonFollowers = allFollowing.filter((u: any) => !followerFids.has(u.fid));

    // Kilit Kontrolü (Geliştiriciyi takip ediyor mu?)
    const isFollowingDev = allFollowing.some((u: any) => u.fid === REQUIRED_FOLLOW_FID);

    console.log(`✅ BİTTİ! Hayalet Sayısı: ${nonFollowers.length}`);

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
    console.error("🔴 KRİTİK HATA:", error.message);
    return NextResponse.json({ 
      error: "Sunucu Hatası", 
      details: error.message 
    }, { status: 500 });
  }
}
