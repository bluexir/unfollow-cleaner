export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';
import { mnemonicToAccount } from 'viem/accounts';

// Senin FID numaran (bluexir)
const APP_FID = 429973; 

export async function POST() {
  try {
    // 1. Vercel Logları için kontrol başlatıyoruz
    console.log("--- SIGNER OLUŞTURMA BAŞLADI ---");
    
    // Değişkeni okuyoruz ve varsa başındaki/sonundaki boşlukları siliyoruz
    const mnemonic = process.env.FARCASTER_DEVELOPER_MNEMONIC?.trim();

    // 2. Teknik Denetim: Değişken Vercel'de var mı?
    if (!mnemonic) {
      console.error("KRİTİK HATA: FARCASTER_DEVELOPER_MNEMONIC çevresel değişkeni okunamadı!");
      console.log("Mevcut Değişkenler Listesi (Güvenlik için sadece varlık kontrolü):", {
        HAS_MNEMONIC: !!process.env.FARCASTER_DEVELOPER_MNEMONIC,
        HAS_NEYNAR_KEY: !!process.env.NEYNAR_API_KEY,
        NODE_ENV: process.env.NODE_ENV
      });
      
      return NextResponse.json(
        { error: 'Vercel Variables kısmında FARCASTER_DEVELOPER_MNEMONIC bulunamadı. Lütfen Redeploy yapın.' },
        { status: 500 }
      );
    }

    console.log("Mnemonic başarıyla algılandı. Uzunluk:", mnemonic.split(' ').length, "kelime.");

    // 3. Neynar'dan ham anahtar (Signer) oluştur
    const signer = await neynarClient.createSigner();
    console.log("Neynar Signer oluşturuldu. UUID:", signer.signerUuid);
    
    const deadline = Math.floor(Date.now() / 1000) + 86400; // 24 saat geçerli

    // 4. viem ile dijital imza üret
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

    console.log("Dijital imza (Signature) başarıyla üretildi.");

    // 5. İmzalı kayıt işlemini yapıyoruz (Kullanıcı gaz öder)
    const registeredSigner = await neynarClient.registerSignedKey({
      signerUuid: signer.signerUuid,
      appFid: APP_FID,
      deadline: deadline,
      signature: signature,
      sponsor: {
        sponsoredByNeynar: false // Kullanıcı kendi gazını/warpsunu ödeyecek
      }
    });

    console.log("Signer kaydı tamamlandı. URL üretildi.");

    // 6. Başarılı yanıt gönder
    return NextResponse.json({
      signer_uuid: registeredSigner.signerUuid,
      public_key: registeredSigner.publicKey,
      status: registeredSigner.status,
      signer_approval_url: registeredSigner.signerApprovalUrl
    });

  } catch (error: any) {
    console.error('[CREATE-SIGNER] Sistemsel Hata:', error);
    return NextResponse.json(
      { error: error.message || 'İmza işlemi sırasında hata oluştu' },
      { status: 500 }
    );
  }
}
