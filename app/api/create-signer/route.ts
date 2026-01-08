export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';
import { mnemonicToAccount } from 'viem/accounts';

// Senin FID numaran
const APP_FID = 429973; 

export async function POST() {
  try {
    console.log("--- SIGNER İŞLEMİ BAŞLATILDI ---");

    const mnemonic = process.env.FARCASTER_DEVELOPER_MNEMONIC?.trim();

    if (!mnemonic) {
      return NextResponse.json(
        { error: 'Mnemonic bulunamadı.' },
        { status: 500 }
      );
    }

    // 1. Neynar'dan yeni Signer oluştur
    const signer = await neynarClient.createSigner();
    console.log("[CREATE-SIGNER] Signer oluşturuldu:", signer.signerUuid);
    
    const deadline = Math.floor(Date.now() / 1000) + 86400;

    // 2. viem ile dijital imza üret (GROK DÜZELTMELERİ UYGULANDI)
    const account = mnemonicToAccount(mnemonic);
    const signature = await account.signTypedData({
      domain: {
        // DÜZELTME 1: Güncel Domain Name
        name: "Farcaster SignedKeyRequestValidator",
        version: "1",
        chainId: 10,
        // DÜZELTME 2: Güncel Kontrat Adresi (...62c60553)
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
        // DÜZELTME 3: public_key kullanımı (snake_case)
        key: signer.public_key as `0x${string}`,
        deadline: BigInt(deadline),
      },
    });

    console.log("[CREATE-SIGNER] İmza başarıyla oluşturuldu.");

    // 3. İmzalı kayıt (Kullanıcı kendi gazını öder)
    const registeredSigner = await neynarClient.registerSignedKey({
      signerUuid: signer.signerUuid,
      appFid: APP_FID,
      deadline: deadline,
      signature: signature,
      sponsor: {
        sponsoredByNeynar: false
      }
    });

    return NextResponse.json({
      signer_uuid: registeredSigner.signerUuid,
      public_key: registeredSigner.public_key,
      status: registeredSigner.status,
      signer_approval_url: registeredSigner.signerApprovalUrl
    });

  } catch (error: any) {
    // Neynar'dan dönen detaylı hatayı loglarda görmek için:
    console.error('[CREATE-SIGNER] HATA:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.response?.data?.message || 'İmza doğrulanamadı' },
      { status: 400 }
    );
  }
}
