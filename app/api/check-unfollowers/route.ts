import { NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';

export async function GET() {
  try {
    // Senin FID numaran
    const fid = 429973; 

    console.log("[CHECK-UNFOLLOWERS] Veri çekme işlemi başlatıldı, FID:", fid);

    // Takip ettiklerini çek
    const followingResponse = await neynarClient.fetchUserFollowing(fid);
    const following = followingResponse.users;

    // Seni takip edenleri çek
    const followersResponse = await neynarClient.fetchUserFollowers(fid);
    const followers = new Set(followersResponse.users.map((u: any) => u.fid));

    // Geri takip yapmayanları filtrele
    const untrustworthy = following.filter((u: any) => !followers.has(u.fid));

    console.log(`[CHECK-UNFOLLOWERS] İşlem tamam. Toplam takip edilen: ${following.length}, Takip etmeyen: ${untrustworthy.length}`);

    return NextResponse.json(untrustworthy);
  } catch (error: any) {
    console.error("[CHECK-UNFOLLOWERS] HATA:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
