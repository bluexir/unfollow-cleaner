import { NextRequest, NextResponse } from 'next/server';
import {
  FarcasterNetwork,
  makeLinkRemove,
  NobleEd25519Signer,
} from '@farcaster/hub-nodejs';

export async function POST(req: NextRequest) {
  try {
    const { signer_private_key, user_fid, target_fids } = await req.json();

    if (!signer_private_key || !user_fid) {
      return NextResponse.json(
        { error: 'signer_private_key and user_fid gerekli' },
        { status: 400 }
      );
    }

    if (!target_fids || !Array.isArray(target_fids) || target_fids.length === 0) {
      return NextResponse.json(
        { error: 'target_fids gerekli (array)' },
        { status: 400 }
      );
    }

    console.log('[UNFOLLOW] Başlatılıyor, User FID:', user_fid);
    console.log('[UNFOLLOW] Hedef sayısı:', target_fids.length);

    const privateKeyBytes = Buffer.from(signer_private_key.replace('0x', ''), 'hex');
    const signer = new NobleEd25519Signer(privateKeyBytes);

    const results = [];
    const errors = [];

    for (const targetFid of target_fids) {
      try {
        const linkRemove = await makeLinkRemove(
          {
            type: 'follow',
            targetFid: targetFid,
          },
          { fid: user_fid, network: FarcasterNetwork.MAINNET },
          signer
        );

        if (linkRemove.isErr()) {
          throw new Error(linkRemove.error.message);
        }

        const messageBytes = linkRemove.value.toJSON();
        const response = await fetch('https://hub.farcaster.xyz:2281/v1/submitMessage', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
          },
          body: Buffer.from(messageBytes),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText);
        }

        console.log('[UNFOLLOW] Başarılı:', targetFid);
        results.push({ fid: targetFid, success: true });

        await new Promise(resolve => setTimeout(resolve, 150));

      } catch (err: any) {
        console.error('[UNFOLLOW] Hata:', targetFid, err.message);
        errors.push({ fid: targetFid, error: err.message });
      }
    }

    console.log('[UNFOLLOW] Tamamlandı. Başarılı:', results.length, 'Hatalı:', errors.length);

    return NextResponse.json({
      success: true,
      unfollowed: results.length,
      failed: errors.length,
      results: results,
      errors: errors
    });

  } catch (error: any) {
    console.error('[UNFOLLOW] Genel hata:', error);
    return NextResponse.json(
      { error: error.message || 'Unfollow işlemi başarısız' },
      { status: 500 }
    );
  }
}
