import { NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';

export async function POST(req: Request) {
  try {
    const { targetFid } = await req.json();
    const signerUuid = process.env.FARCASTER_SIGNER_UUID;

    if (!signerUuid) {
      return NextResponse.json({ error: 'UUID eksik' }, { status: 500 });
    }

    // Doğrudan takipten çıkma emri
    await neynarClient.deleteFollow(signerUuid, [targetFid]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Unfollow Hatası:', error.response?.data || error);
    return NextResponse.json({ error: 'İşlem başarısız' }, { status: 400 });
  }
}
