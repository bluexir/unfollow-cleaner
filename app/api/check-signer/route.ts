export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const signer_uuid = searchParams.get('signer_uuid');

    if (!signer_uuid) {
      return NextResponse.json(
        { error: 'signer_uuid required' },
        { status: 400 }
      );
    }

    console.log('[CHECK-SIGNER] Kontrol ediliyor:', signer_uuid);

    // Neynar SDK v3: camelCase kullanır
    const signer = await neynarClient.lookupSigner({
      signerUuid: signer_uuid
    });

    console.log('[CHECK-SIGNER] Status:', signer.status);
    console.log('[CHECK-SIGNER] FID:', signer.fid);

    return NextResponse.json({
      status: signer.status,
      fid: signer.fid
    });

  } catch (error: any) {
    console.error('[CHECK-SIGNER] Hata:', error);
    
    if (error.message?.includes('not found') || error.message?.includes('404')) {
      return NextResponse.json(
        { status: 'not_found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Signer kontrolü başarısız' },
      { status: 500 }
    );
  }
}
