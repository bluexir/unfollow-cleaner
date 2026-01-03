import { NextRequest, NextResponse } from "next/server";
import { neynarClient } from "@/lib/neynar";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fid = searchParams.get("fid");
  
  if (!fid) {
    return NextResponse.json({ error: "FID parametresi gerekli" }, { status: 400 });
  }

  const fidNumber = parseInt(fid);

  try {
    console.log(`🚀 [ANALİZ] Başlıyor - FID: ${fidNumber}`);

    const response = await neynarClient.fetchUserFollowing({
      fid: fidNumber,
      limit: 10,
    });

    console.log("📦 [RESPONSE STRUCTURE]:", JSON.stringify(response, null, 2));

    return NextResponse.json({
      debug: "Response structure logged to Vercel",
      response: response
    });

  } catch (error: any) {
    console.error("🔥 [API HATASI]:", error.message);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
