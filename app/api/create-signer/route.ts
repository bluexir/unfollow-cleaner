export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';
import { mnemonicToAccount } from 'viem/accounts';

// Senin FID numaran (bluexir)
const APP_FID = 429973; 

export async function POST() {
  try {
    // 1. Vercel'deki 12 kelimeyi alıyoruz
    const mnemonic = process.env.FARCASTER_DEVELOPER_MNEMONIC;
    if (!mnemonic) {
      throw new Error('Vercel Variables kısmında FARCASTER_DEVELOPER_MNEMONIC bulunamadı.');
    }

    // 2. Neynar'dan ham bir Signer (anahtar) oluşturuyoruz
    const signer = await neynarClient.createSigner();
    
    // 3. İmzanın geçerlilik süresi (Şu andan itibaren 24 saat)
    const deadline = Math.floor(Date.now() / 1000) + 86400;

    // 4. viem kütüphanesi ile 12 kelimeyi kullanarak EIP-712 imzasını atıyoruz
    const account = mnemonicToAccount(mnemonic);
    const signature = await account.signTypedData({
      domain: {
        name: "Farcaster Verify Key",
        version: "1",
        chainId: 10, // OP Mainnet
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

    // 5. İmzalı kayıt işlemini yapıyoruz
    const registeredSigner = await neynarClient.registerSignedKey({
      signerUuid: signer.signerUuid,
      appFid: APP_FID,
      deadline: deadline,
      signature: signature,
      // DÜZELTME: Gaz ücretini KULLANICI öder, senin kredilerin korunur.
      sponsor: {
        sponsoredByNeynar: false
      }
    });

    // 6. Sonuç: Onay linki kullanıcıya iletilmek üzere hazır
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
