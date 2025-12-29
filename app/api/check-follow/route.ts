import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const DEV_FID = 429973; // @bluexir

// Bu endpoint: "kullanıcı @bluexir'i takip ediyor mu?" kontrolü yapar.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userFid = searchParams.get("fid");

  if (!userFid) {
    return NextResponse.json({ error: "FID gerekli" }, { status: 400 });
  }

  if (!NEYNAR_API_KEY) {
    return NextResponse.json({ error: "API Key eksik" }, { status: 500 });
  }

  try {
    // Viewer: kullanıcı, hedef: developer
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${DEV_FID}&viewer_fid=${encodeURIComponent(userFid)}`,
      {
        headers: {
          api_key: NEYNAR_API_KEY,
          "x-api-key": NEYNAR_API_KEY,
          accept: "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data?.message || "Follow kontrolü başarısız" }, { status: 500 });
    }

    const dev = data.users?.[0];
    const isFollowing = Boolean(dev?.viewer_context?.following);

    return NextResponse.json({ isFollowing });
  } catch (error) {
    console.error("Takip kontrol hatası:", error);
    return NextResponse.json({ isFollowing: false, error: "Sunucu hatası" }, { status: 500 });
  }
}
