export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';
import { mnemonicToAccount } from 'viem/accounts';

const NEYNAR_APP_FID = 24; 

export async function POST() {
  try {
    const mnemonic = process.env.FARCASTER_DEVELOPER_MNEMONIC?.trim();
    if (!mnemonic) return NextResponse.json({ error: 'Mnemonic yok.' }, { status: 500 });

    const account = mnemonicToAccount(mnemonic);
    const signer = await neynarClient.createSigner();
    const deadline = Math.floor(Date.now() / 1000) + 3600;

    const signature = await account.signTypedData({
      domain: {
        name: "Farcaster",
        version: "1",
        chainId: 10,
        verifyingContract: "0x00000000fc700472606ed4fa22623acf62c60553",
      },
      types: {
        SignedKeyRequest: [
          { name: "appFid", type: "uint256" },
          { name: "key", type: "bytes" },
          { name: "deadline", type: "uint256" },
        ],
      },
      primaryType: "SignedKeyRequest",
      message: {
        appFid: BigInt(NEYNAR_APP_FID),
        key: signer.public_key as `0x${string}`,
        deadline: BigInt(deadline),
      },
    });

    const registeredSigner = await neynarClient.registerSignedKey({
      signerUuid: signer.signer_uuid, 
      appFid: NEYNAR_APP_FID,
      deadline: deadline,
      signature: signature,
      sponsor: {
        sponsoredByNeynar: true
      }
    });

    return NextResponse.json({
      signer_uuid: registeredSigner.signer_uuid,
      public_key: registeredSigner.public_key,
      status: registeredSigner.status,
      signer_approval_url: registeredSigner.signerApprovalUrl
    });

  } catch (error: any) {
    console.error('HATA:', error.response?.data || error);
    return NextResponse.json(
      { error: error.response?.data?.message || 'Başarısız' },
      { status: 400 }
    );
  }
}
