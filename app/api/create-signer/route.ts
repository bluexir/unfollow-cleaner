export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import * as ed from '@noble/ed25519';
import { mnemonicToAccount } from 'viem/accounts';

const APP_FID = 429973;

const SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN = {
  name: 'Farcaster SignedKeyRequestValidator',
  version: '1',
  chainId: 10,
  verifyingContract: '0x00000000FC700472606ED4fA22623Acf62c60553' as `0x${string}`,
};

const SIGNED_KEY_REQUEST_TYPE = [
  { name: 'requestFid', type: 'uint256' },
  { name: 'key', type: 'bytes' },
  { name: 'deadline', type: 'uint256' },
];

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
    const mnemonic = process.env.APP_MNEMONIC?.trim();
    if (!mnemonic) {
      console.error('[CREATE-SIGNER] APP_MNEMONIC bulunamadı!');
      return NextResponse.json(
        { error: 'APP_MNEMONIC bulunamadı. Vercel Variables kontrol edin.' },
        { status: 500 }
      );
    }

    // 2. Ed25519 keypair oluştur
    const privateKey = ed.utils.randomPrivateKey();
    const publicKeyBytes = await ed.getPublicKeyAsync(privateKey);
    const publicKeyHex = `0x${Buffer.from(publicKeyBytes).toString('hex')}`;

    console.log('[CREATE-SIGNER] Keypair oluşturuldu');

    // 3. App account (mnemonic'ten)
    const appAccount = mnemonicToAccount(mnemonic);

    // 4. Deadline (24 saat)
    const deadline = Math.floor(Date.now() / 1000) + 86400;

    // 5. EIP-712 imzası
    const signature = await appAccount.signTypedData({
      domain: SIGNED_KEY_REQUEST_VALIDATOR_EIP_712_DOMAIN,
      types: { SignedKeyRequest: SIGNED_KEY_REQUEST_TYPE },
      primaryType: 'SignedKeyRequest',
      message: {
        requestFid: BigInt(APP_FID),
        key: publicKeyHex as `0x${string}`,
        deadline: BigInt(deadline),
      },
    });

    console.log('[CREATE-SIGNER] Signature oluşturuldu');

    // 6. Farcaster Client API'ye gönder
    const response = await fetch('https://api.warpcast.com/v2/signed-key-requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key: publicKeyHex,
        requestFid: APP_FID,
        signature: signature,
        deadline: deadline,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[CREATE-SIGNER] Farcaster API Error:', errorText);
      return NextResponse.json(
        { error: 'Farcaster API hatası', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    const token = data.result.signedKeyRequest.token;
    const deeplinkUrl = data.result.signedKeyRequest.deeplinkUrl;

    console.log('[CREATE-SIGNER] Başarılı, token:', token);

    // 7. Signer bilgilerini döndür
    // NOT: privateKey ve publicKey'i database'e kaydetmelisiniz!
    return NextResponse.json({
      signer_uuid: token, // Token'ı UUID gibi kullanacağız
      signer_approval_url: deeplinkUrl,
      status: 'pending_approval',
      // Bu bilgileri database'e kaydedin:
      _meta: {
        privateKey: Buffer.from(privateKey).toString('hex'),
        publicKey: publicKeyHex,
        userFid: fid,
      }
    });

  } catch (error: any) {
    console.error('[CREATE-SIGNER] HATA:', error);
    return NextResponse.json(
      { error: error.message || 'İşlem başarısız' },
      { status: 500 }
    );
  }
}
