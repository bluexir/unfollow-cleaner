import { NextRequest, NextResponse } from "next/server";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;
const TARGET_FID = 429973; // Senin FID numaran

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fid = searchParams.get("fid");

  if (!fid) {
    return NextResponse.json({ error: "FID gerekli" }, { status: 400 });
  }

  try {
    // Neynar API üzerinden takip kontrolü
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}&viewer_fid=${TARGET_FID}`,
      {
        headers: {
          api_key: NEYNAR_API_KEY || "",
        },
      }
    );

    const data = await response.json();
    
    // Kullanıcı bilgisi içinde takip durumu kontrolü
    const user = data.users?.[0];
    const isFollowing = user?.viewer_context?.following || false;

    return NextResponse.json({ isFollowing });
  } catch (error) {
    console.error("Takip kontrol hatası:", error);
    return NextResponse.json({ isFollowing: false, error: "Sunucu hatası" }, { status: 500 });
  }
}
