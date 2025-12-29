import { NextRequest, NextResponse } from "next/server";
import { neynarClient } from "@/lib/neynar";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token gerekli" }, { status: 400 });
    }

    // Token'ı Neynar'a doğrulat
    const user = await neynarClient.lookupUserByVerification(token);

    if (!user || !user.fid) {
      return NextResponse.json({ error: "Geçersiz token" }, { status: 401 });
    }

    return NextResponse.json({
      fid: user.fid,
      username: user.username,
      display_name: user.display_name,
      pfp_url: user.pfp_url,
    });

  } catch (error: any) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: error.message || "Auth failed" },
      { status: 500 }
    );
  }
}
