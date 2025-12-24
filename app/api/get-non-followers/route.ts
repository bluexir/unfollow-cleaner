import { NextRequest, NextResponse } from "next/server";

// --- CACHE İPTAL (Her zaman taze veri) ---
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fid = searchParams.get("fid");
  
  const API_KEY = process.env.NEYNAR_API_KEY;
  // const SIGNER_UUID = process.env.NEYNAR_SIGNER_UUID; // Okuma işlemi için şart değil ama varsa iyi olur

  if (!fid) {
    return NextResponse.json({ error: "FID gerekli" }, { status: 400 });
  }

  if (!API_KEY) {
    return NextResponse.json({ error: "API Key eksik" }, { status: 500 });
  }

  const fidNumber = parseInt(fid);

  try {
    console.log(`🚀 [STRICT-MODE] Analiz Başlıyor - FID: ${fidNumber}`);

    const headers = {
      "accept": "application/json",
      "api_key": API_KEY,
      "x-api-key": API_KEY 
    };

    // 1️⃣ FOLLOWINGS (Senin Takip Ettiklerin - Hepsini alıyoruz)
    const followingMap = new Map();
    let followingCursor = "";
    let followingLoop = 0;

    console.log("📡 [FOLLOWING] İstek başlıyor...");

    do {
      let url = `https://api.neynar.com/v2/farcaster/following?fid=${fidNumber}&limit=100`;
      if (followingCursor) url += `&cursor=${followingCursor}`;

      const res = await fetch(url, { headers });
      
      if (!res.ok) {
        console.error(`❌ [FOLLOWING] API Hatası:`, await res.text());
        break;
      }

      const data = await res.json();
      const users = data.users || [];

      users.forEach((item: any) => {
        const user = item.user || item; 
        if (user && user.fid) {
          followingMap.set(user.fid, {
            fid: user.fid,
            username: user.username,
            display_name: user.display_name || user.username,
            pfp_url: user.pfp_url,
            follower_count: user.follower_count,
            power_badge: user.power_badge
          });
        }
      });

      followingCursor = data.next?.cursor || "";
      followingLoop++;
      if (followingLoop >= 50) break;
    } while (followingCursor);

    console.log(`✅ [FOLLOWING] Bitti. Toplam: ${followingMap.size} kişi`);

    // 2️⃣ FOLLOWERS (Seni Takip Edenler - FİLTRELİ)
    const followersSet = new Set<number>();
    let followersCursor = "";
    let followersLoop = 0;
    let totalRawFollowers = 0;
    let ignoredBots = 0;

    console.log("📡 [FOLLOWERS] İstek ve FİLTRELEME başlıyor...");

    do {
      let url = `https://api.neynar.com/v2/farcaster/followers?fid=${fidNumber}&limit=100`;
      if (followersCursor) url += `&cursor=${followersCursor}`;

      const res = await fetch(url, { headers });
      
      if (!res.ok) break;

      const data = await res.json();
      const users = data.users || [];
      
      totalRawFollowers += users.length;

      users.forEach((item: any) => {
        const user = item.user || item;
        if (user && user.fid) {
          
          // --- SPAM / GHOST FİLTRESİ ---
          // Warpcast'in gizlediği hesapları biz de gizliyoruz.
          // Kriter: Power Badge yoksa VE (Resmi yoksa VEYA Takipçi sayısı 2'den azsa) -> BOT SAY
          const hasPowerBadge = user.power_badge === true;
          const hasPfp = user.pfp_url && user.pfp_url.length > 0;
          const hasFollowers = user.follower_count >= 2; 

          // Eğer kaliteli bir hesap değilse, takipçi setine EKLEME!
          // Yani: PowerBadge yoksa... VE (Resmi yok YA DA Takipçisi çok azsa)
          if (!hasPowerBadge && (!hasPfp || !hasFollowers)) {
             ignoredBots++;
             // Bu kişiyi sete eklemiyoruz, yani seni takip etmiyor sayıyoruz.
             return; 
          }

          followersSet.add(user.fid);
        }
      });

      followersCursor = data.next?.cursor || "";
      followersLoop++;
      if (followersLoop >= 50) break;
    } while (followersCursor);

    console.log(`✅ [FOLLOWERS] Bitti.`);
    console.log(`   📊 API'den Gelen Ham Veri: ${totalRawFollowers}`);
    console.log(`   🗑️ Çöp Sayılıp Atılan: ${ignoredBots}`);
    console.log(`   💎 Geçerli Takipçi Sayın: ${followersSet.size}`);

    // 3️⃣ ANALİZ (GHOST TESPİTİ)
    const followingList = Array.from(followingMap.values());
    
    // Ghost Mantığı: Ben takip ediyorum (Listede var) AMA O beni geçerli şekilde takip etmiyor (Set içinde yok)
    const nonFollowers = followingList.filter(
      (user) => !followersSet.has(user.fid)
    );

    console.log(`🎯 [SONUÇ] Ghost Sayısı: ${nonFollowers.length}`);

    // Admin (Senin) Kontrolü
    const isFollowingDev = followersSet.has(429973); // 429973 senin ID'n ise

    return NextResponse.json({
      nonFollowers: nonFollowers,
      users: nonFollowers, 
      isFollowingDev: isFollowingDev, 
      stats: {
        following: followingMap.size,
        followers: followersSet.size, // Artık filtrelenmiş sayı görünecek (80'e yakın)
        raw_followers: totalRawFollowers, // Merak edersen diye API verisi
        ghosts: nonFollowers.length
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
