import { NextRequest, NextResponse } from "next/server";

// --- CACHE İPTAL (Her zaman taze veri) ---
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
    console.log(`🚀 [SUPER-STRICT-MODE] Analiz Başlıyor - FID: ${fidNumber}`);

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
          // Takip ettiklerini olduğu gibi al, filtreleme
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

    // 2️⃣ FOLLOWERS (Seni Takip Edenler - AGRESİF FİLTRELİ)
    const followersSet = new Set<number>();
    let followersCursor = "";
    let followersLoop = 0;
    let totalRawFollowers = 0;
    let ignoredBots = 0;

    console.log("📡 [FOLLOWERS] İstek ve AGRESİF FİLTRELEME başlıyor...");

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
          
          // --- SÜPER AGRESİF FİLTRE ---
          // Warpcast'in gizlediği hesapları "Takipçi" saymamak için kriterler:
          
          const hasPowerBadge = user.power_badge === true;
          const hasPfp = user.pfp_url && user.pfp_url.length > 0;
          // Eşik değeri: En az 3 takipçisi olmalı. Yoksa muhtemelen spam bottur.
          const hasDecentFollowers = user.follower_count >= 3; 
          
          let isQualityUser = false;

          if (hasPowerBadge) {
            // Rozeti varsa her türlü geçerlidir.
            isQualityUser = true;
          } else {
            // Rozeti yoksa: Hem resmi olacak HEM DE en az 3 takipçisi olacak.
            if (hasPfp && hasDecentFollowers) {
                isQualityUser = true;
            }
          }

          if (!isQualityUser) {
             ignoredBots++;
             // Bu kişiyi sete EKLEMİYORUZ. 
             // Böylece sistem "Bu kişi seni takip etmiyor" sanacak ve Ghost listesine düşecek.
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
    console.log(`   💎 Geçerli (Kaliteli) Takipçi Sayın: ${followersSet.size}`);

    // 3️⃣ ANALİZ (GHOST TESPİTİ)
    const followingList = Array.from(followingMap.values());
    
    // Ghost Mantığı: Ben takip ediyorum (Listede var) AMA O beni GEÇERLİ şekilde takip etmiyor (Set içinde yok)
    const nonFollowers = followingList.filter(
      (user) => !followersSet.has(user.fid)
    );

    console.log(`🎯 [SONUÇ] Ghost Sayısı: ${nonFollowers.length}`);

    // Admin (Senin) Kontrolü
    const isFollowingDev = followersSet.has(429973); 

    return NextResponse.json({
      nonFollowers: nonFollowers,
      users: nonFollowers, 
      isFollowingDev: isFollowingDev, 
      stats: {
        following: followingMap.size,
        followers: followersSet.size, // Artık filtrelenmiş sayı görünecek (80'e yakın olmalı)
        raw_followers: totalRawFollowers,
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
