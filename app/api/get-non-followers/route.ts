import { NextRequest, NextResponse } from "next/server";

// --- AYARLAR ---
const REQUIRED_FOLLOW_FID = 429973; // Bluexir

// 🔥 YENİ VE TEMİZ ANAHTAR (Kodun içine gömüldü)
const NEYNAR_API_KEY = "9AE8AC85-3A93-4D79-ABAF-7AB279758724";

// Yardımcı Fonksiyon: Neynar'a Direkt İstek
async function fetchNeynar(endpoint: string, params: string) {
  const url = `https://api.neynar.com/v2/farcaster/${endpoint}?${params}`;
  
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "accept": "application/json",
      "api_key": NEYNAR_API_KEY,
    },
    cache: "no-store", 
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Neynar API Hatası (${res.status}): ${errorBody}`);
  }

  return res.json();
}

export async function GET(req: NextRequest) {
  console.log("🟢 (Safe-Mode) API İsteği Başladı...");

  const { searchParams } = new URL(req.url);
  const fid = searchParams.get("fid");

  if (!fid) {
    return NextResponse.json({ error: "FID gerekli" }, { status: 400 });
  }

  try {
    const userFid = fid; 

    // --- 1. TAKİP ETTİKLERİNİ ÇEK (Following) ---
    console.log("📡 Takip edilenler çekiliyor...");
    // Map kullanarak aynı kişilerin tekrar eklenmesini %100 engelliyoruz
    let followingMap = new Map(); 
    let cursor: string | null = "";
    let loop = 0;

    while (cursor !== null && loop < 20) { 
      const params = `fid=${userFid}&limit=100${cursor ? `&cursor=${cursor}` : ""}`;
      const data = await fetchNeynar("following", params);
      
      const users = data.users || [];
      users.forEach((u: any) => followingMap.set(u.fid, u)); // Varsa üstüne yazar, çift olmaz
      
      cursor = data.next?.cursor || null;
      loop++;
    }
    // Map'ten temiz listeyi oluştur
    const allFollowing = Array.from(followingMap.values());


    // --- 2. SENİ TAKİP EDENLERİ ÇEK (Followers) ---
    console.log(`📡 Seni takip edenler çekiliyor...`);
    let followersMap = new Map(); // Yine Map kullanıyoruz (Süzgeç)
    cursor = ""; 
    loop = 0;

    while (cursor !== null && loop < 20) { 
      const params = `fid=${userFid}&limit=100${cursor ? `&cursor=${cursor}` : ""}`;
      const data = await fetchNeynar("followers", params);

      const users = data.users || [];
      users.forEach((u: any) => followersMap.set(u.fid, u)); // Çiftleri eliyoruz

      cursor = data.next?.cursor || null;
      loop++;
    }
    const allFollowers = Array.from(followersMap.values());


    // --- 3. ANALİZ VE SONUÇ ---
    console.log(`📊 TEMİZ SONUÇLAR: ${allFollowing.length} Takip Edilen, ${allFollowers.length} Takipçi`);

    // Hızlı karşılaştırma için Set kullan
    const followerFids = new Set(allFollowers.map((u: any) => u.fid));
    
    // Seni takip etmeyenleri bul
    const nonFollowers = allFollowing.filter((u: any) => !followerFids.has(u.fid));

    // Kilit Kontrolü
    const isFollowingDev = allFollowing.some((u: any) => u.fid === REQUIRED_FOLLOW_FID);

    console.log(`✅ ANALİZ BİTTİ! Hayalet Sayısı: ${nonFollowers.length}`);

    return NextResponse.json({ 
      users: nonFollowers,
      isFollowingDev: isFollowingDev,
      stats: {
        following: allFollowing.length,
        followers: allFollowers.length, // Artık gerçek sayı (78 civarı) gelecek
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
