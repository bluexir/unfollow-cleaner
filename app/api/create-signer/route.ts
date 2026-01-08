export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';
import { mnemonicToAccount } from 'viem/accounts';

const APP_FID = 429973; 

export async function POST() {
  try {
    console.log("--- SIGNER İŞLEMİ BAŞLATILDI ---");

    const mnemonic = process.env.FARCASTER_DEVELOPER_MNEMONIC?.trim();
    if (!mnemonic) {
      console.error("HATA: FARCASTER_DEVELOPER_MNEMONIC bulunamadı!");
      return NextResponse.json(
        { error: 'Mnemonic bulunamadı' },
        { status: 500 }
      );
    }

    // 1. Signer oluştur
    const signer = await neynarClient.createSigner();
    console.log('[CREATE-SIGNER] Signer oluşturuldu:', signer.signer_uuid);

    // 2. Deadline
    const deadline = Math.floor(Date.now() / 1000) + 86400;

    // 3. İmza oluştur
    const account = mnemonicToAccount(mnemonic);
    const signature = await account.signTypedData({
      domain: {
        name: "Farcaster SignedKeyRequestValidator",
        version: "1",
        chainId: 10,
        verifyingContract: "0x00000000fc700472606ed4fa22623acf62c60553",
      },
      types: {
        SignedKeyRequest: [
          { name: "requestFid", type: "uint256" },
          { name: "key", type: "bytes" },
          { name: "deadline", type: "uint256" },
        ],
      },
      primaryType: "SignedKeyRequest",
      message: {
        requestFid: BigInt(APP_FID),
        key: signer.public_key as `0x${string}`,
        deadline: BigInt(deadline),
      },
    });

    console.log('[CREATE-SIGNER] İmza oluşturuldu');

    // 4. Register et
    const registeredSigner = await neynarClient.registerSignedKey({
      signerUuid: signer.signer_uuid,
      appFid: APP_FID,
      deadline: deadline,
      signature: signature,
    });

    console.log('[CREATE-SIGNER] Register başarılı, approval URL:', registeredSigner.signer_approval_url);

    return NextResponse.json({
      signer_uuid: registeredSigner.signer_uuid,
      public_key: registeredSigner.public_key,
      status: registeredSigner.status,
      signer_approval_url: registeredSigner.signer_approval_url
    });

  } catch (error: any) {
    console.error('[CREATE-SIGNER] HATA:', error);
    return NextResponse.json(
      { error: error.message || 'İşlem başarısız' },
      { status: 500 }
    );
  }
}
