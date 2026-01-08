export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';
import { mnemonicToAccount } from 'viem/accounts';

// Senin FID numaran (bluexir)
const APP_FID = 429973; 

export async function POST() {
  try {
    console.log("--- SIGNER İŞLEMİ BAŞLATILDI ---");

    const mnemonic = process.env.FARCASTER_DEVELOPER_MNEMONIC?.trim();
    if (!mnemonic) {
      return NextResponse.json({ error: 'Mnemonic bulunamadı.' }, { status: 500 });
    }

    // 1. Mnemonic'ten hesap oluştur
    const account = mnemonicToAccount(mnemonic);
    console.log("[CREATE-SIGNER] Kullanılan Adres:", account.address);

    // 2. Neynar'dan yeni Signer oluştur
    const signer = await neynarClient.createSigner();
    console.log("[CREATE-SIGNER] Signer UUID:", signer.signer_uuid);
    
    const deadline = Math.floor(Date.now() / 1000) + 86400;

    // 3. viem ile dijital imza üret (DOMAIN İSMİ GÜNCELLENDİ)
    const signature = await account.signTypedData({
      domain: {
        // KRİTİK DÜZELTME: Sadece "Farcaster" olmalı
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
        appFid: BigInt(APP_FID),
        key: signer.public_key as `0x${string}`,
        deadline: BigInt(deadline),
      },
    });

    console.log("[CREATE-SIGNER] İmza oluşturuldu.");

    // 4. İmzalı kayıt işlemi (Snake_case düzeltmeleriyle)
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
    console.error('[CREATE-SIGNER] HATA DETAYI:', error.response?.data || error);
    return NextResponse.json(
      { error: error.response?.data?.message || 'İşlem başarısız' },
      { status: 400 }
    );
  }
}
