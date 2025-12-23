import { NextRequest, NextResponse } from "next/server";
import { neynarClient, REQUIRED_FOLLOW_FID } from "@/lib/neynar";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fid = searchParams.get("fid");

  if (!fid) {
    return NextResponse.json({ error: "FID required" }, { status: 400 });
  }

  try {
    const userFid = parseInt(fid);

    // --- AJAN 1: Kimi Takip Ediyorsun? (Hepsini Çek) ---
    let allFollowing: any[] = [];
    let followingCursor: string | null = "";
    let loopCount = 0; 

    // Sonsuz döngü koruması (Max 50 sayfa)
    while (followingCursor !== null && loopCount < 50) {
      const res: any = await neynarClient.fetchUserFollowing({
        fid: userFid,
        limit: 100,
        cursor: followingCursor || undefined,
      });
      
      allFollowing = [...allFollowing, ...res.users];
      followingCursor = res.next.cursor;
      loopCount++;
    }

    // --- AJAN 2: Seni Kim Takip Ediyor? (Hepsini Çek) ---
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

    // --- AJAN 3: Karşılaştırma ve İhbar ---
    const followerFids = new Set(allFollowers.map((u) => u.fid));
    const nonFollowers = allFollowing.filter((u) => !followerFids.has(u.fid));

    // KRİTİK KONTROL: Kullanıcının takip ettikleri listesinde SEN (Bluexir) var mısın?
    // REQUIRED_FOLLOW_FID (429973) lib/neynar.ts dosyasından geliyor.
    const isFollowingDev = allFollowing.some((u) => u.fid === REQUIRED_FOLLOW_FID);

    return NextResponse.json({ 
      users: nonFollowers,
      isFollowingDev: isFollowingDev, // Kilit anahtarı burada
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
