export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { signer_uuid, target_fids } = body;

    if (!signer_uuid || !target_fids || !Array.isArray(target_fids)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const results = [];

    for (const targetFid of target_fids) {
      try {
        await neynarClient.deleteFollow(signer_uuid, targetFid);
        results.push({ fid: targetFid, success: true });
      } catch (error: any) {
        console.error(`Failed to unfollow ${targetFid}:`, error);
        results.push({ fid: targetFid, success: false, error: error.message });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: true,
      unfollowed: successCount,
      total: target_fids.length,
      results,
    });
  } catch (error: any) {
    console.error('Unfollow error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to unfollow users' },
      { status: 500 }
    );
  }
}
