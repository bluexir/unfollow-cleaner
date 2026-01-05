import { NextRequest, NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';

export async function POST(req: NextRequest) {
  try {
    const { message, signature } = await req.json();

    if (!message || !signature) {
      return NextResponse.json(
        { error: 'Message and signature required' },
        { status: 400 }
      );
    }

    const response = await neynarClient.fetchSigners({
      message,
      signature
    });

    if (!response?.signers || response.signers.length === 0) {
      return NextResponse.json(
        { error: 'No signers found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      signers: response.signers,
      signer_uuid: response.signers[0].signer_uuid
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch signers' },
      { status: 500 }
    );
  }
}
