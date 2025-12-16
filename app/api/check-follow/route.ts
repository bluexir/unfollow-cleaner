import { NextRequest, NextResponse } from 'next/server';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';

const client = new NeynarAPIClient(process.env.NEYNAR_API_KEY || '');

const REQUIRED_FOLLOW_FID = 429973; // @bluexir

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fid = searchParams.get('fid');

  if (!fid) {
    return NextResponse.json({ error: 'FID required' }, { status: 400 });
  }

  try {
    const response = await client.fetchUserFollowing(parseInt(fid));
    
    const isFollowing = response.result?.users?.some(
      (user: any) => user.fid === REQUIRED_FOLLOW_FID
    ) ?? false;

    return NextResponse.json({ isFollowing });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check follow status' }, { status: 500 });
  }
}
