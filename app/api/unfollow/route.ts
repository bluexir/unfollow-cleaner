import { NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';

export async function POST(req: Request) {
  try {
    const { targetFid } = await req.json();
    
    // Vercel üzerindeki UUID
    const signerUuid = process.env.FARCASTER_SIGNER_UUID;

    if (!signerUuid) {
      console.error("[UNFOLLOW] HATA: Signer UUID bulunamadı.");
      return NextResponse.json({ error: 'Signer UUID eksik.' }, { status: 500 });
    }

    console.log(`[UNFOLLOW] İşlem deneniyor. Target FID: ${targetFid}, Signer: ${signerUuid}`);

    // Hata aldığımız o satır
    const response = await neynarClient.deleteFollow(signerUuid, [targetFid]);

    return NextResponse.json({ success: true, response });
  } catch (error: any) {
    // Aldığımız o meşhur hata detayları
    console.error('[UNFOLLOW] HATA DETAYI:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data?.message || 'İşlem başarısız oldu' },
      { status: 400 }
    );
  }
}
