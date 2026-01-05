import { NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';

export async function GET() {
  try {
    const response = await neynarClient.fetchNonce();
    
    return NextResponse.json({
      nonce: response.nonce
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch nonce' },
      { status: 500 }
    );
  }
}
