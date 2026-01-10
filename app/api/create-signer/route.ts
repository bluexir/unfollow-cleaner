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

    // SADECE createSigner - registerSignedKey YOK!
    // Kullanıcı Warpcast'te onaylayacak, gas ödeyecek
    const signer = await neynarClient.createSigner();

    console.log('[CREATE-SIGNER] Signer UUID:', signer.signer_uuid);
    console.log('[CREATE-SIGNER] Public Key:', signer.public_key);
    console.log('[CREATE-SIGNER] Status:', signer.status);

    // Manuel deep link oluştur
    const deep_link = `https://client.warpcast.com/deeplinks/signed-key-request?key=${signer.public_key}`;

    console.log('[CREATE-SIGNER] Deep link:', deep_link);

    return NextResponse.json({
      signer_uuid: signer.signer_uuid,
      signer_approval_url: deep_link,
      status: signer.status
    });

  } catch (error: any) {
    console.error('[CREATE-SIGNER] Hata:', error);
    return NextResponse.json(
      { error: error.message || 'Signer oluşturulamadı' },
      { status: 500 }
    );
  }
}
