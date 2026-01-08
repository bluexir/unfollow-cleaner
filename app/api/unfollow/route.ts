import { NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';

export async function POST(req: Request) {
  try {
    const { targetFid } = await req.json();
    const signerUuid = process.env.FARCASTER_SIGNER_UUID; // Vercel'e eklediğin UUID

    if (!signerUuid) {
      return NextResponse.json({ error: 'Signer UUID bulunamadı' }, { status: 500 });
    }

    // Gerçek takipten çıkma işlemi
    const response = await neynarClient.deleteFollow(signerUuid, [targetFid]);

    return NextResponse.json({ success: true, response });
  } catch (error: any) {
    console.error('Unfollow Hatası:', error.response?.data || error);
    return NextResponse.json({ error: 'Takipten çıkılamadı' }, { status: 400 });
  }
}
