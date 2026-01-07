export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';
import { mnemonicToAccount } from 'viem/accounts';

const APP_FID = 429973; 

export async function POST() {
  try {
    const mnemonic = process.env.FARCASTER_DEVELOPER_MNEMONIC;
    if (!mnemonic) {
      throw new Error('Vercel Variables kısmında FARCASTER_DEVELOPER_MNEMONIC bulunamadı.');
    }

    // 1. Yeni Signer oluştur
    const signer = await neynarClient.createSigner();
    
    const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 saat geçerli

    // 2. viem ile dijital imza üret
    const account = mnemonicToAccount(mnemonic);
    const signature = await account.signTypedData({
      domain: {
        name: "Farcaster Verify Key",
        version: "1",
        chainId: 10,
        verifyingContract: "0x00000000fc7004726058f5509a5326c79561d871",
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
        appFid: BigInt(APP_FID),
        key: signer.publicKey as `0x${string}`,
        deadline: BigInt(deadline),
      },
    });

    // 3. İmzalı kayıt işlemini yap (URL buradan gelecek)
    const registeredSigner = await neynarClient.registerSignedKey({
      signerUuid: signer.signerUuid,
      appFid: APP_FID,
      deadline: deadline,
      signature: signature,
      sponsor: {
        sponsoredByNeynar: true
      }
    });

    return NextResponse.json({
      signer_uuid: registeredSigner.signerUuid,
      public_key: registeredSigner.publicKey,
      status: registeredSigner.status,
      signer_approval_url: registeredSigner.signerApprovalUrl
    });

  } catch (error: any) {
    console.error('[CREATE-SIGNER] Hata:', error);
    return NextResponse.json(
      { error: error.message || 'İmza oluşturma başarısız' },
      { status: 500 }
    );
  }
}
