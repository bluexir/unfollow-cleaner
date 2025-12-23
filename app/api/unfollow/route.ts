import { NextRequest, NextResponse } from "next/server";

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { targetFid } = await req.json();

    if (!targetFid) {
      return NextResponse.json({ error: "Hedef FID gerekli" }, { status: 400 });
    }

    // Neynar üzerinden takibi bırakma işlemi
    const response = await fetch("https://api.neynar.com/v2/farcaster/user/follow", {
      method: "DELETE",
      headers: {
        accept: "application/json",
        api_key: NEYNAR_API_KEY || "",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        target_fids: [targetFid],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Takibi bırakma başarısız");
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Unfollow API Hatası:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
