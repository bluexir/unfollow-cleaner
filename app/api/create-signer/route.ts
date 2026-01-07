import { NextRequest, NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';

const APP_FID = 429973; // bluexir FID

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

    const signer = await neynarClient.createSigner();

    console.log('[CREATE-SIGNER] Signer UUID:', signer.signer_uuid);

    // MANUEL DEEP LINK OLUŞTUR
    const deep_link = `https://client.farcaster.xyz/deeplinks/signed-key-request?key=${signer.public_key}&requestFid=${APP_FID}`;

    console.log('[CREATE-SIGNER] Deep link:', deep_link);

    return NextResponse.json({
      signer_uuid: signer.signer_uuid,
      deep_link: deep_link
    });

  } catch (error: any) {
    console.error('[CREATE-SIGNER] Hata:', error);
    return NextResponse.json(
      { error: error.message || 'Signer creation failed' },
      { status: 500 }
    );
  }
}
