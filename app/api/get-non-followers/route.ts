import { NextRequest, NextResponse } from "next/server";
import { neynarClient } from "@/lib/neynar";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fid = searchParams.get("fid");

  if (!fid) {
    return NextResponse.json({ error: "FID gerekli" }, { status: 400 });
  }

  try {
    const userFid = parseInt(fid);

    const followingResponse = await neynarClient.fetchUserFollowing({
      fid: userFid,
      limit: 100
    });

    const followersResponse = await neynarClient.fetchUserFollowers({
      fid: userFid,
      limit: 100
    });

    const following = followingResponse.users || [];
    const followers = followersResponse.users || [];

    const followerFids = new Set(followers.map((user: any) => user.fid));
    const nonFollowers = following.filter((user: any) => !followerFids.has(user.fid));

    return NextResponse.json({ users: nonFollowers });
  } catch (error) {
    console.error("Takipçi listesi alınamadı:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
