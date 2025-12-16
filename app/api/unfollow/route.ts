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

    try {
      // Neynar SDK'nın doğru kullanımı - tüm FID'leri bir seferde gönder
      const result = await neynarClient.unfollowUser(signerUuid, targetFids);
      
      // Response'u parse et
      const successCount = result.details?.filter((d: any) => d.success).length || 0;
      const failed = result.details?.filter((d: any) => !d.success).map((d: any) => d.target_fid) || [];

      return NextResponse.json({
        success: failed.length === 0,
        message: `Successfully unfollowed ${successCount} out of ${targetFids.length} users`,
        results: result.details,
        failed,
      });
    } catch (error: any) {
      console.error('Unfollow API error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to unfollow users' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Unfollow error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to unfollow users' },
      { status: 500 }
    );
  }
}
