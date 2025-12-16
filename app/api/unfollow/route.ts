import { NextRequest, NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';

export async function POST(request: NextRequest) {
  try {
    const { signerUuid, targetFids } = await request.json();

    if (!signerUuid || !targetFids || !Array.isArray(targetFids)) {
      return NextResponse.json(
        { error: 'Signer UUID and target FIDs are required' },
        { status: 400 }
      );
    }

    // Limit to 50 unfollows per request to avoid rate limits
    if (targetFids.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 users can be unfollowed at once' },
        { status: 400 }
      );
    }

    const results = [];
    const failed = [];

    // Unfollow each user with a small delay to avoid rate limits
    for (const targetFid of targetFids) {
      try {
        // Neynar SDK'nın doğru metodu: publishReactionRemove veya unfollowUser
        await (neynarClient as any).unfollowUser(signerUuid, targetFid);
        results.push({ fid: targetFid, success: true });
        
        // Small delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error: any) {
        console.error(`Failed to unfollow FID ${targetFid}:`, error);
        results.push({ fid: targetFid, success: false, error: error.message });
        failed.push(targetFid);
      }
    }

    return NextResponse.json({
      success: failed.length === 0,
      message: `Successfully unfollowed ${targetFids.length - failed.length} out of ${targetFids.length} users`,
      results,
      failed,
    });
  } catch (error: any) {
    console.error('Unfollow error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to unfollow users' },
      { status: 500 }
    );
  }
}
