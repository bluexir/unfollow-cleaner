import { NextRequest, NextResponse } from "next/server";

// --- ÖNEMLİ: Cache (Önbellek) İptali ---
// Farcaster dinamik bir yer, verinin her zaman taze olması lazım.
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fid = searchParams.get("fid");
  
  const API_KEY = process.env.NEYNAR_API_KEY;

  // Temel güvenlik kontrolleri
  if (!fid) {
    return NextResponse.json({ error: "FID gerekli" }, { status: 400 });
  }

  if (!API_KEY) {
    return NextResponse.json({ error: "API Key eksik" }, { status: 500 });
  }

  const fidNumber = parseInt(fid);

  try {
    console.log(`🚀 [ANALİZ BAŞLIYOR] FID: ${fidNumber}`);

    const headers = {
      "accept": "application/json",
      "api_key": API_KEY,
      "x-api-key": API_KEY 
    };

    // ---------------------------------------------------------
    // 1️⃣ SENİN TAKİP ETTİKLERİN (Following) - FİLTRESİZ
    // ---------------------------------------------------------
    // Burası değişmedi. Senin kimi takip ettiğini eksiksiz öğreniyoruz.
    const followingMap = new Map();
    let followingCursor = "";
    let safeLoopFollowing = 0; 

    do {
      let url = `https://api.neynar.com/v2/farcaster/following?fid=${fidNumber}&limit=100`;
      if (followingCursor) url += `&cursor=${followingCursor}`;

      const res = await fetch(url, { headers });
      
      if (!res.ok) {
        console.error("API Hatası (Following):", await res.text());
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
            // Profilde göstermek için ek veriler
            power_badge: user.power_badge,
            profile: user.profile
          });
        }
      });

      followingCursor = data.next?.cursor || "";
      safeLoopFollowing++;
      if (safeLoopFollowing > 50) break; // Sonsuz döngü koruması

    } while (followingCursor);

    console.log(`✅ [FOLLOWING] Senin Takip Ettiklerin: ${followingMap.size}`);


    // ---------------------------------------------------------
    // 2️⃣ SENİ TAKİP EDENLER (Followers) - RELEVANT MOD (YENİ)
    // ---------------------------------------------------------
    // BURASI KRİTİK DEĞİŞİKLİK!
    // Artık 'relevant' endpoint kullanıyoruz ve 'viewer_fid' gönderiyoruz.
    // Bu işlem, Warpcast'teki o "Temiz Liste"yi (109 kişi) getirecek.
    
    const followersSet = new Set<number>();
    let followersCursor = "";
    let safeLoopFollowers = 0;

    console.log("📡 [FOLLOWERS] Warpcast filtreli (Relevant) liste çekiliyor...");

    do {
      // viewer_fid ekledik: Senin engellediğin veya sessize aldığın kişileri de eler.
      let url = `https://api.neynar.com/v2/farcaster/followers/relevant?fid=${fidNumber}&viewer_fid=${fidNumber}&limit=100`;
      if (followersCursor) url += `&cursor=${followersCursor}`;

      const res = await fetch(url, { headers });
      
      if (!res.ok) {
        console.error("API Hatası (Followers/Relevant):", await res.text());
        break;
      }

      const data = await res.json();
      // Relevant endpoint yapısında bazen users dizisi farklı gelebilir, standart kontrol:
      const users = data.users || [];
      
      users.forEach((item: any) => {
        const user = item.user || item;
        if (user && user.fid) {
          followersSet.add(user.fid);
        }
      });

      followersCursor = data.next?.cursor || "";
      safeLoopFollowers++;
      if (safeLoopFollowers > 50) break;

    } while (followersCursor);

    console.log(`✅ [FOLLOWERS] Filtreli Takipçi Sayısı: ${followersSet.size}`);


    // ---------------------------------------------------------
    // 3️⃣ KARŞILAŞTIRMA VE GHOST TESPİTİ
    // ---------------------------------------------------------
    const followingList = Array.from(followingMap.values());
    
    // FORMÜL: Takip Ettiklerim (Listesi) İÇİNDEKİ kişi -> Takipçilerim (Seti) içinde YOKSA -> GHOSTTUR
    const nonFollowers = followingList.filter(
      (user) => !followersSet.has(user.fid)
    );

    console.log(`🎯 [SONUÇ] Ghost Sayısı: ${nonFollowers.length}`);

    // Admin (Senin) Kontrolün
    const isFollowingDev = followersSet.has(429973); 

    return NextResponse.json({
      nonFollowers: nonFollowers,
      users: nonFollowers, // Frontend uyumluluğu için
      isFollowingDev: isFollowingDev, 
      stats: {
        following: followingMap.size,    // Örn: 203
        followers: followersSet.size,    // Örn: 109 (Temizlenmiş)
        nonFollowersCount: nonFollowers.length // Örn: ~94 (Yakalananlar)
      },
    });

  } catch (error: any) {
    console.error("🔥 [ERROR] Kritik Hata:", error.message);
    return NextResponse.json(
      { error: error.message || "Sunucu hatası oluştu" },
      { status: 500 }
    );
  }
}
