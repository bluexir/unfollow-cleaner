import { NextRequest, NextResponse } from "next/server";
import { neynarClient } from "@/lib/neynar";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const signerUuid = searchParams.get("signer_uuid");

  if (!signerUuid) {
    return NextResponse.json({ error: "Signer UUID gerekli" }, { status: 400 });
  }

  try {
    // DÜZELTME: { signerUuid } yerine doğrudan signerUuid yazıldı.
    const signer = await neynarClient.lookupSigner(signerUuid);

    return NextResponse.json({
      status: signer.status, // pending | approved | revoked
      fid: signer.fid ?? null,
      signer_uuid: signer.signer_uuid,
    });
  } catch (error: any) {
    console.error("Signer kontrol hatası:", error);

    // Hata durumunda (404 vs) polling'i durdurmak için not_found dönüyoruz
    return NextResponse.json(
      {
        status: 'not_found',
        fid: null,
        signer_uuid: signerUuid,
        error: 'Signer not found or expired',
      },
      { status: 404 }
    );
  }
}
