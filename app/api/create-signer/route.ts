import { NextRequest, NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';

export async function POST(req: NextRequest) {
  try {
    const { fid } = await req.json();

    if (!fid) {
      return NextResponse.json(
        { error: 'FID required' },
        { status: 400 }
      );
    }

    console.log('[CREATE-SIGNER] Signer oluşturuluyor, FID:', fid);

    // 1. Signer oluştur
    const signer = await neynarClient.createSigner();

    console.log('[CREATE-SIGNER] Signer UUID:', signer.signer_uuid);

    // 2. Register et (NEYNAR SPONSORED)
    await neynarClient.registerSignedKey({
      signer_uuid: signer.signer_uuid,
      sponsor: {
        sponsored_by_neynar: true
      }
    });

    console.log('[CREATE-SIGNER] Register başarılı');

    return NextResponse.json({
      signer_uuid: signer.signer_uuid,
      deep_link: signer.signer_approval_url
    });

  } catch (error: any) {
    console.error('[CREATE-SIGNER] Hata:', error);
    return NextResponse.json(
      { error: error.message || 'Signer creation failed' },
      { status: 500 }
    );
  }
}
