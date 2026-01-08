export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { neynarClient } from '@/lib/neynar';
import { mnemonicToAccount } from 'viem/accounts';

export async function POST() {
  try {
    // Log ekleyerek Vercel'in ne gördüğünü kontrol ediyoruz
    console.log("Checking Environment Variables...");
    
    // .trim() ekleyerek görünmez boşlukları temizliyoruz
    const mnemonic = process.env.FARCASTER_DEVELOPER_MNEMONIC?.trim();

    if (!mnemonic) {
      console.error("HATA: FARCASTER_DEVELOPER_MNEMONIC bulunamadı!");
      // Loglarda diğer anahtarların durumunu kontrol et (Kendilerini yazdırma!)
      console.log("NEYNAR_API_KEY durumu:", process.env.NEYNAR_API_KEY ? "Dolu" : "Boş");
      
      return NextResponse.json({ error: 'Mnemonic bulunamadı. Lütfen Vercel ayarlarını kontrol edin.' }, { status: 500 });
    }

    console.log("Mnemonic başarıyla okundu, imza oluşturuluyor...");

    // ... (Geri kalan imza kodları aynı kalıyor)
// ...
