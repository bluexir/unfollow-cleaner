export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
import { NextRequest, NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';

export async function POST(request: NextRequest) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _body = await request.json().catch(() => ({}));

    // 1. Signer oluştur
    const signer = await neynarClient.createSigner();
    
    // 2. RegisterSignedKey çağır (Neynar otomatik imzalar, sponsor YOK)
    const registered = await neynarClient.registerSignedKey({
      signerUuid: signer.signer_uuid,
      // sponsor parametresi YOK = kullanıcı gas öder
    });

    // 3. Neynar'ın verdiği DOĞRU approval URL'i kullan
    return NextResponse.json({
      signer_uuid: signer.signer_uuid,
      deep_link: registered.signer_approval_url, // ✅ DOĞRU URL!
    });
  } catch (error: any) {
    console.error('Create signer error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create signer' },
      { status: 500 }
    );
  }
}
