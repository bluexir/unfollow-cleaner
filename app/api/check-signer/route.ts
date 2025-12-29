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
    const signer = await neynarClient.lookupSigner({ signerUuid });

    // Frontend'in polling'ine uyumlu tek format
    return NextResponse.json({
      status: signer.status, // pending | approved | revoked
      fid: signer.fid ?? null,
      signer_uuid: signer.signer_uuid,
    });
  } catch (error: any) {
    // Invalid/expired signer durumunda SDK throw edebiliyor.
    // Bu durumda 500 dönmek polling'i sonsuz retry'ya sokuyor.
    console.error("Signer kontrol hatası:", error);

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
