import { NextRequest, NextResponse } from "next/server";
import { neynarClient } from "@/lib/neynar";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const signerUuid = searchParams.get("signer_uuid");

  if (!signerUuid) {
    return NextResponse.json({ error: "Signer UUID gerekli" }, { status: 400 });
  }

  try {
    // Hata buradaydı: signerUuid doğrudan değil, obje içinde gönderilmeli
    const signer = await neynarClient.lookupSigner({ signerUuid });

    if (signer.status === 'approved' && signer.fid) {
      return NextResponse.json({
        approved: true,
        fid: signer.fid
      });
    }

    return NextResponse.json({ approved: false });
  } catch (error) {
    console.error("Signer kontrol hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
