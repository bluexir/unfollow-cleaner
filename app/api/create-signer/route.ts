export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';
import { mnemonicToAccount } from 'viem/accounts';

// Senin hem kişisel hem uygulama FID numaran
const APP_FID = 24; 

export async function POST() {
  try {
    console.log("--- SIGNER İŞLEMİ BAŞLATILDI ---");

    const mnemonic = process.env.FARCASTER_DEVELOPER_MNEMONIC?.trim();
    if (!mnemonic) {
      return NextResponse.json({ error: 'Mnemonic bulunamadı.' }, { status: 500 });
    }

    // 1. 24 Kelimelik Mnemonic ile "Tapu Sahibi" hesabı oluştur
    const account = mnemonicToAccount(mnemonic);
    console.log("[CREATE-SIGNER] Yetkili Adres:", account.address);

    // 2. Neynar'dan yeni Signer oluştur
    const signer = await neynarClient.createSigner();
    
    // 3. İmza son kullanma tarihi (24 saat sonrası)
    const deadline = Math.floor(Date.now() / 1000) + 86400;

    // 4. EIP-712 Standart imzasını üret
    const signature = await account.signTypedData({
      domain: {
        // EN STANDART KOMBİNASYON
        name: "Farcaster", 
        version: "1",
        chainId: 10, // Optimism Mainnet
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
        appFid: BigInt(APP_FID),
        key: signer.public_key as `0x${string}`,
        deadline: BigInt(deadline),
      },
    });

    console.log("[CREATE-SIGNER] İmza başarıyla oluşturuldu.");

    // 5. Neynar'a imzayı ve signer_uuid'yi gönder
    const registeredSigner = await neynarClient.registerSignedKey({
      signerUuid: signer.signer_uuid, 
      appFid: APP_FID,
      deadline: deadline,
      signature: signature,
      sponsor: {
        sponsoredByNeynar: false
      }
    });

    return NextResponse.json({
      signer_uuid: registeredSigner.signer_uuid,
      public_key: registeredSigner.public_key,
      status: registeredSigner.status,
      signer_approval_url: registeredSigner.signerApprovalUrl
    });

  } catch (error: any) {
    // Hatanın tam içeriğini loglarda görelim
    console.error('[CREATE-SIGNER] HATA DETAYI:', error.response?.data || error);
    return NextResponse.json(
      { error: error.response?.data?.message || 'İşlem başarısız' },
      { status: 400 }
    );
  }
}
