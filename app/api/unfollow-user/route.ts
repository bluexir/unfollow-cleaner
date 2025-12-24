import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { target_fid } = body;

    const API_KEY = process.env.NEYNAR_API_KEY;
    const SIGNER_UUID = process.env.NEYNAR_SIGNER_UUID; // Senin yeni aldığın UUID

    if (!target_fid || !API_KEY || !SIGNER_UUID) {
      return NextResponse.json({ error: "Eksik parametreler (UUID veya FID)" }, { status: 400 });
    }

    console.log(`🗑️ Unfollow İsteği: ${target_fid} (UUID kullanılıyor)`);

    const response = await fetch("https://api.neynar.com/v2/farcaster/user/follow", {
      method: "DELETE", // Silme işlemi (Unfollow)
      headers: {
        "accept": "application/json",
        "api_key": API_KEY,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        signer_uuid: SIGNER_UUID, // İŞTE KRİTİK NOKTA BURASI
        target_fids: [target_fid]
      })
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Neynar Unfollow Hatası:", result);
      return NextResponse.json({ error: result.message || "Unfollow başarısız" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Kullanıcı silindi" });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
