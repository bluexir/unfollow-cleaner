export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

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

    const response = await fetch(
      `https://api.warpcast.com/v2/signed-key-request?token=${signer_uuid}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { status: 'not_found' },
          { status: 404 }
        );
      }
      const errorText = await response.text();
      console.error('[CHECK-SIGNER] API Error:', errorText);
      return NextResponse.json(
        { error: 'API error', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const state = data.result.signedKeyRequest.state;
    const userFid = data.result.signedKeyRequest.userFid;

    console.log('[CHECK-SIGNER] State:', state);
    console.log('[CHECK-SIGNER] User FID:', userFid);

    return NextResponse.json({
      status: state === 'completed' ? 'approved' : 'pending',
      fid: userFid
    });

  } catch (error: any) {
    console.error('[CHECK-SIGNER] Hata:', error);
    
    return NextResponse.json(
      { error: error.message || 'Signer kontrolü başarısız' },
      { status: 500 }
    );
  }
}
