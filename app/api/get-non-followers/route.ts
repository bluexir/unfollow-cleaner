import { NextRequest, NextResponse } from "next/server";
import { neynarClient } from "@/lib/neynar";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * Farcaster Takip Etmeyenleri Bulma API (Production Sürümü)
 * Neynar SDK kullanarak takipçi ve takip edilen listelerini karşılaştırır.
 * Vercel'in 10-30 saniyelik timeout sınırlarını korumak için optimize edilmiştir.
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fid = searchParams.get("fid");
  
  if (!fid) {
    return NextResponse.json({ error: "FID parametresi gerekli" }, { status: 400 });
  }

  const fidNumber = parseInt(fid);

  try {
    console.log(`🚀 [ANALİZ] Başlıyor - FID: ${fidNumber}`);

    // 1. Takip Edilenleri (Following) Çek
    // Neynar paketleme (limit 100) kullanarak listeyi oluşturuyoruz.
    const followingMap = new Map();
    let followingCursor: string | null = "";
    let followingCount = 0;

    while (followingCursor !== null) {
      const response = await neynarClient.fetchUserFollowing(fidNumber, {
        limit: 100,
        cursor: followingCursor || undefined,
      });

      response.users.forEach((item: any) => {
        // SDK bazen iç içe user objesi dönebilir, güvenli okuma yapıyoruz
        const user = item.user || item;
        if (user && user.fid) {
          followingMap.set(user.fid, {
            fid: user.fid,
            username: user.username,
            display_name: user.display_name || user.username,
            pfp_url: user.pfp_url,
            follower_count: user.follower_count,
            power_badge: user.power_badge,
            neynar_score: user.experimental?.neynar_user_score ?? null,
          });
        }
      });

      followingCursor = response.next?.cursor || null;
      followingCount += response.users.length;
      
      // Güvenlik sınırı: 3000 kişi. 
      // Vercel serverless fonksiyonlarının 10 sn zaman aşımına düşmemesi için gerçekçi bir limit.
      if (followingCount >= 3000) break;
    }

    console.log(`✅ [FOLLOWING] ${followingMap.size} kişi paketler halinde alındı.`);

    // 2. Takipçileri (Followers) Çek
    const followersSet = new Set<number>();
    let followersCursor: string | null = "";
    let followersCount = 0;

    while (followersCursor !== null) {
      const response = await neynarClient.fetchUserFollowers(fidNumber, {
        limit: 100,
        cursor: followersCursor || undefined,
      });

      response.users.forEach((item: any) => {
        const user = item.user || item;
        if (user && user.fid) {
          followersSet.add(user.fid);
        }
      });

      followersCursor = response.next?.cursor || null;
      followersCount += response.users.length;

      // Karşılaştırma için Following sayısı kadar takipçi bakmak yeterlidir.
      if (followersCount >= 3000) break;
    }

    console.log(`✅ [FOLLOWERS] ${followersSet.size} kişi paketler halinde alındı.`);

    // 3. Hayaletleri (Ghosts) Filtrele
    const followingList = Array.from(followingMap.values());
    const nonFollowers = followingList.filter(
      (user) => !followersSet.has(user.fid)
    );

    // Takipçi sayısına göre artan sıralama (Gerçek hayaletler genelde düşük takipçilidir)
    const sortedNonFollowers = nonFollowers.sort((a, b) => a.follower_count - b.follower_count);

    console.log(`🎯 [SONUÇ] ${sortedNonFollowers.length} kişi seni takip etmiyor.`);

    return NextResponse.json({
      nonFollowers: sortedNonFollowers,
      stats: {
        following: followingMap.size,
        followers: followersSet.size,
        nonFollowersCount: sortedNonFollowers.length,
      },
    });

  } catch (error: any) {
    console.error("🔥 [API HATASI]:", error.message);
    return NextResponse.json(
      { error: "Kullanıcı verileri analiz edilemedi. Neynar bağlantısını kontrol edin." },
      { status: 500 }
    );
  }
}
