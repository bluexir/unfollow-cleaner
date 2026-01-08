import { NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';

const MY_FID = 429973; // Senin FID numaran

export async function GET() {
  try {
    const followingResponse = await neynarClient.fetchUserFollowing(MY_FID);
    const following = followingResponse.users;

    const followersResponse = await neynarClient.fetchUserFollowers(MY_FID);
    const followers = new Set(followersResponse.users.map(u => u.fid));

    const untrustworthy = following.filter(u => !followers.has(u.fid));

    return NextResponse.json(untrustworthy);
  } catch (error) {
    console.error("Liste Hatası:", error);
    return NextResponse.json({ error: 'Liste çekilemedi' }, { status: 500 });
  }
}
