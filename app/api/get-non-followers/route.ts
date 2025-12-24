import { NextRequest, NextResponse } from "next/server";
import { neynarClient } from "@/lib/neynar";

// Sabiti buraya da manuel ekliyoruz (Sunucu tarafı olduğu için sorun yok)
const REQUIRED_FOLLOW_FID = 429973; 

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fid = searchParams.get("fid");

  if (!fid) {
    return NextResponse.json({ error: "FID required" }, { status: 400 });
  }

  try {
    const userFid = parseInt(fid);

    // --- AJAN 1: Kimi Takip Ediyorsun? ---
    let allFollowing: any[] = [];
    let followingCursor: string | null = "";
    let loopCount = 0; 

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

    // --- AJAN 2: Seni Kim Takip Ediyor? ---
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

    // KİLİT KONTROLÜ
    const isFollowingDev = allFollowing.some((u) => u.fid === REQUIRED_FOLLOW_FID);

    return NextResponse.json({ 
      users: nonFollowers,
      isFollowingDev: isFollowingDev,
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
