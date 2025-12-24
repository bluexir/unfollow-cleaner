import { NextRequest, NextResponse } from "next/server";
import { neynarClient } from "@/lib/neynar";

const REQUIRED_FOLLOW_FID = 429973; 

export async function GET(req: NextRequest) {
  // --- KÖSTEBEK LOGLARI BAŞLIYOR ---
  console.log("🟢 API İsteği Alındı. İşlem Başlıyor...");

  const { searchParams } = new URL(req.url);
  const fid = searchParams.get("fid");

  if (!fid) {
    console.error("🔴 HATA: FID parametresi eksik!");
    return NextResponse.json({ error: "FID is required" }, { status: 400 });
  }

  const userFid = parseInt(fid);
  console.log(`👤 Analiz Edilen Kullanıcı FID: ${userFid}`);

  try {
    // API Anahtarı Kontrolü
    if (!process.env.NEYNAR_API_KEY) {
      throw new Error("NEYNAR_API_KEY bulunamadı! Vercel ayarlarını kontrol et.");
    }
    console.log("🔑 API Anahtarı mevcut. Neynar'a bağlanılıyor...");

    // 1. TAKİP ETTİKLERİNİ ÇEK
    console.log("📡 Takip edilenler çekiliyor...");
    let allFollowing: any[] = [];
    let followingCursor: string | null = "";
    let loopCount = 0; 

    // Güvenlik limiti: Max 20 sayfa (2000 kişi) - Test için düşürdük
    while (followingCursor !== null && loopCount < 20) {
      const res: any = await neynarClient.fetchUserFollowing({
        fid: userFid,
        limit: 100,
        cursor: followingCursor || undefined,
      });
      
      allFollowing = [...allFollowing, ...res.users];
      followingCursor = res.next.cursor;
      loopCount++;
      console.log(`   ↳ Sayfa ${loopCount} çekildi. Toplam: ${allFollowing.length} kişi.`);
    }

    // 2. SENİ TAKİP EDENLERİ ÇEK
    console.log("📡 Seni takip edenler çekiliyor...");
    let allFollowers: any[] = [];
    let followersCursor: string | null = "";
    loopCount = 0;

    while (followersCursor !== null && loopCount < 20) {
      const res: any = await neynarClient.fetchUserFollowers({
        fid: userFid,
        limit: 100,
        cursor: followersCursor || undefined,
      });

      allFollowers = [...allFollowers, ...res.users];
      followersCursor = res.next.cursor;
      loopCount++;
      console.log(`   ↳ Sayfa ${loopCount} çekildi. Toplam: ${allFollowers.length} kişi.`);
    }

    // 3. KARŞILAŞTIRMA
    console.log("⚡ Karşılaştırma yapılıyor...");
    const followerFids = new Set(allFollowers.map((u) => u.fid));
    const nonFollowers = allFollowing.filter((u) => !followerFids.has(u.fid));

    // Kilit Kontrolü
    const isFollowingDev = allFollowing.some((u) => u.fid === REQUIRED_FOLLOW_FID);
    console.log(`🔒 Geliştirici Takip Durumu: ${isFollowingDev ? "AÇIK" : "KİLİTLİ"}`);

    console.log("✅ İŞLEM BAŞARILI! Sonuçlar gönderiliyor.");
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
    // DETAYLI HATA RAPORU
    console.error("🔴 KRİTİK HATA OLUŞTU:", error);
    
    // Hatayı gizleme, direkt ekrana bas (Debugging için)
    return NextResponse.json({ 
      error: "Sunucu Hatası", 
      details: error.message || "Bilinmeyen hata",
      stack: error.stack 
    }, { status: 500 });
  }
}
