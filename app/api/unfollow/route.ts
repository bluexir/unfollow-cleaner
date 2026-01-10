import { NextRequest, NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';

export async function POST(req: NextRequest) {
  try {
    const { signer_uuid, target_fids } = await req.json();

    if (!signer_uuid) {
      return NextResponse.json(
        { error: 'signer_uuid gerekli' },
        { status: 400 }
      );
    }

    if (!target_fids || !Array.isArray(target_fids) || target_fids.length === 0) {
      return NextResponse.json(
        { error: 'target_fids gerekli (array)' },
        { status: 400 }
      );
    }

    console.log('[UNFOLLOW] Başlatılıyor, Signer:', signer_uuid);
    console.log('[UNFOLLOW] Hedef sayısı:', target_fids.length);

    const results = [];
    const errors = [];

    // Her bir FID için unfollow işlemi
    for (const targetFid of target_fids) {
      try {
        // DOĞRU METOD: unfollowUser
        await neynarClient.unfollowUser(signer_uuid, [targetFid]);

        console.log('[UNFOLLOW] Başarılı:', targetFid);
        results.push({ fid: targetFid, success: true });

        // Rate limit için 150ms bekle
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
