export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';
import { mnemonicToAccount } from 'viem/accounts';

// Neynar'ın resmi App FID'si (Kendi FID'in kayıtlı olmadığı için bunu kullanmalıyız)
const NEYNAR_APP_FID = 24; 

export async function POST() {
  try {
    console.log("--- SIGNER İŞLEMİ BAŞLATILDI ---");

    const mnemonic = process.env.FARCASTER_DEVELOPER_MNEMONIC?.trim();
    if (!mnemonic) {
      return NextResponse.json({ error: 'Mnemonic (24 kelime) bulunamadı.' }, { status: 500 });
    }

    // 1. 24 Kelimelik Mnemonic ile yetkili hesabı oluştur
    const account = mnemonicToAccount(mnemonic);
    console.log("[CREATE-SIGNER] Yetkili Adres (Custody):", account.address);

    // 2. Neynar'dan yeni Signer oluştur
    const signer = await neynarClient.createSigner();
    
    // 3. Deadline (Süreyi 1 saate çekiyoruz - Daha güvenli)
    const deadline = Math.floor(Date.now() / 1000) + 3600;

    // 4. EIP-712 İmzası (Farcaster Standart Formatı)
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

    console.log("[CREATE-SIGNER] İmza başarıyla oluşturuldu.");

    // 5. Neynar'a İmzalı Kaydı Gönder (KRİTİK: sponsoredByNeynar AKTİF EDİLDİ)
    const registeredSigner = await neynarClient.registerSignedKey({
      signerUuid: signer.signer_uuid, 
      appFid: NEYNAR_APP_FID,
      deadline: deadline,
      signature: signature,
      // Kendi FID'in uygulama olarak kayıtlı olmadığı için bu ayar ZORUNLUDUR
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
    console.error('[CREATE-SIGNER] HATA DETAYI:', error.response?.data || error);
    return NextResponse.json(
      { error: error.response?.data?.message || 'İmza doğrulanamadı' },
      { status: 400 }
    );
  }
}
