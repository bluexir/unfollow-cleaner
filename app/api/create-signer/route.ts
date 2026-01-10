import { NextRequest, NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';
import { mnemonicToAccount } from 'viem/accounts';

const APP_FID = 429973;

export async function POST(req: NextRequest) {
  try {
    const { fid } = await req.json();

    if (!fid) {
      return NextResponse.json(
        { error: 'FID required' },
        { status: 400 }
      );
    }

    console.log('[CREATE-SIGNER] Başlatılıyor, FID:', fid);

    // 1. Mnemonic kontrolü
    const mnemonic = process.env.FARCASTER_DEVELOPER_MNEMONIC?.trim();
    if (!mnemonic) {
      console.error('[CREATE-SIGNER] Mnemonic bulunamadı!');
      return NextResponse.json(
        { error: 'Mnemonic bulunamadı. Vercel Variables kontrol edin.' },
        { status: 500 }
      );
    }

    // 2. Signer oluştur
    const signer = await neynarClient.createSigner();
    console.log('[CREATE-SIGNER] Signer oluşturuldu:', signer.signer_uuid);

    // 3. Deadline (24 saat)
    const deadline = Math.floor(Date.now() / 1000) + 86400;

    // 4. Signature oluştur
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

    console.log('[CREATE-SIGNER] Signature oluşturuldu');

    // 5. Register et (Neynar sponsored)
    const registeredSigner = await neynarClient.registerSignedKey({
      signerUuid: signer.signer_uuid,
      appFid: APP_FID,
      deadline: deadline,
      signature: signature,
      sponsor: {
        sponsored_by_neynar: true
      }
    });

    console.log('[CREATE-SIGNER] Kayıt başarılı');
    console.log('[CREATE-SIGNER] Approval URL:', registeredSigner.signer_approval_url);

    return NextResponse.json({
      signer_uuid: registeredSigner.signer_uuid,
      signer_approval_url: registeredSigner.signer_approval_url,
      status: registeredSigner.status
    });

  } catch (error: any) {
    console.error('[CREATE-SIGNER] HATA:', error);
    return NextResponse.json(
      { error: error.message || 'İşlem başarısız' },
      { status: 500 }
    );
  }
}
