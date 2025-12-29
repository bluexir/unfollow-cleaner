export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';

export async function POST(request: NextRequest) {
  try {
    // Body'yi şimdilik sadece logik akış için alıyoruz (ileride doğrulama eklenebilir)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _body = await request.json().catch(() => ({}));

    const signer = await neynarClient.createSigner();

    // Warpcast SIWN deep link
    const deepLink = `https://warpcast.com/~/siwn?token=${signer.signer_uuid}`;

    return NextResponse.json({
      signer_uuid: signer.signer_uuid,
      deep_link: deepLink,
    });
  } catch (error: any) {
    console.error('Create signer error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create signer' },
      { status: 500 }
    );
  }
}
