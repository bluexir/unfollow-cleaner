export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';
import { mnemonicToAccount } from 'viem/accounts';

// Senin FID numaran (bluexir)
const APP_FID = 429973; 

export async function POST() {
  try {
    console.log("--- SIGNER İŞLEMİ BAŞLATILDI ---");

    // 1. Mnemonic'i Vercel'den çekiyoruz ve boşlukları temizliyoruz
    const mnemonic = process.env.FARCASTER_DEVELOPER_MNEMONIC?.trim();

    if (!mnemonic) {
      console.error("HATA: Vercel panelinde FARCASTER_DEVELOPER_MNEMONIC bulunamadı!");
      return NextResponse.json(
        { error: 'Mnemonic bulunamadı. Lütfen Vercel Variables kısmını kontrol edin.' },
        { status: 500 }
      );
    }

    // 2. Neynar'dan ham anahtar (Signer) oluştur
    const signer = await neynarClient.createSigner();
    
    // 3. İmza süresi (24 saat)
    const deadline = Math.floor(Date.now() / 1000) + 86400;

    // 4. viem ile dijital imza üret (Mnemonic burada devreye giriyor)
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

    // 5. İmzalı kayıt işlemi (Kullanıcı kendi gazını/warpsunu öder)
    const registeredSigner = await neynarClient.registerSignedKey({
      signerUuid: signer.signerUuid,
      appFid: APP_FID,
      deadline: deadline,
      signature: signature,
      sponsor: {
        sponsoredByNeynar: false
      }
    });

    console.log("Onay Linki Başarıyla Üretildi.");

    // 6. Frontend'e (PermissionModal) gereken verileri gönderiyoruz
    return NextResponse.json({
      signer_uuid: registeredSigner.signerUuid,
      public_key: registeredSigner.publicKey,
      status: registeredSigner.status,
      signer_approval_url: registeredSigner.signerApprovalUrl
    });

  } catch (error: any) {
    console.error('[CREATE-SIGNER] HATA:', error);
    return NextResponse.json(
      { error: error.message || 'İşlem başarısız' },
      { status: 500 }
    );
  }
}
