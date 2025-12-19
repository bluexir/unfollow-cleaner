export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

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
        const response = await fetch('https://api.neynar.com/v2/farcaster/user/follow', {
          method: 'DELETE',
          headers: {
            'accept': 'application/json',
            'api_key': process.env.NEYNAR_API_KEY!,
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            signer_uuid: signer_uuid,
            target_fids: [targetFid],
          }),
        });

        if (response.ok) {
          results.push({ fid: targetFid, success: true });
        } else {
          const errorData = await response.json();
          results.push({ fid: targetFid, success: false, error: errorData.message });
        }
      } catch (error: any) {
        console.error(`Failed to unfollow ${targetFid}:`, error);
        results.push({ fid: targetFid, success: false, error: error.message });
      }

      await new Promise(resolve => setTimeout(resolve, 500));
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
