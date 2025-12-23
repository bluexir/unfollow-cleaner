import { NextRequest, NextResponse } from "next/server";
import { neynarClient } from "@/lib/neynar";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fid = searchParams.get("fid");

  if (!fid) {
    return NextResponse.json({ error: "FID is required" }, { status: 400 });
  }

  try {
    const userFid = parseInt(fid);

    // --- 1. ADIM: Kimi Takip Ediyorsun? (Hepsini Çek) ---
    let allFollowing: any[] = [];
    let followingCursor: string | null = "";
    
    // Güvenlik Limiti: Sonsuz döngüye girmesin diye max 50 sayfa (5000 kişi)
    let loopCount = 0; 

    while (followingCursor !== null && loopCount < 50) {
      const res: any = await neynarClient.fetchUserFollowing({
        fid: userFid,
        limit: 100, // API limiti
        cursor: followingCursor || undefined,
      });
      
      allFollowing = [...allFollowing, ...res.users];
      followingCursor = res.next.cursor;
      loopCount++;
    }

    // --- 2. ADIM: Seni Kim Takip Ediyor? (Hepsini Çek) ---
    let allFollowers: any[] = [];
    let followersCursor: string | null = "";
    loopCount = 0;

    while (followersCursor !== null && loopCount < 50) {
      const res: any = await neynarClient.fetchUserFollowers({
        fid: userFid,
        limit: 100,
        cursor: followersCursor || undefined,
      });

      allFollowers = [...allFollowers, ...res.users];
      followersCursor = res.next.cursor;
      loopCount++;
    }

    // --- 3. ADIM: Büyük Karşılaştırma ---
    // Performans için Set yapısı kullanıyoruz (O(1) hızında arama yapar)
    const followerFids = new Set(allFollowers.map((u) => u.fid));

    // Seni takip etmeyenleri süzüyoruz
    const nonFollowers = allFollowing.filter((u) => !followerFids.has(u.fid));

    return NextResponse.json({ 
      users: nonFollowers,
      stats: {
        following: allFollowing.length,
        followers: allFollowers.length,
        notFollowingBack: nonFollowers.length
      }
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
