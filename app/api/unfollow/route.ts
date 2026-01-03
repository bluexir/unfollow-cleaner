import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * Farcaster Toplu Unfollow API
 * Neynar v2 standartlarına uygun olarak hedef FID'leri tek bir paket halinde siler.
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const signerUuid = body.signer_uuid as string | undefined;
    const targetFidsInput = body.target_fids as number[] | undefined;
    const singleTargetFid = body.targetFid as number | undefined;

    // Hedef FID'leri belirle ve tek bir "paket" haline getir
    let targets: number[] = [];
    if (Array.isArray(targetFidsInput)) {
      targets = targetFidsInput.map((x) => Number(x)).filter((x) => Number.isFinite(x));
    } else if (singleTargetFid) {
      targets = [Number(singleTargetFid)];
    }

    const API_KEY = process.env.NEYNAR_API_KEY;

    // 1. Güvenlik ve Gerekli Veri Kontrolleri
    if (!API_KEY) {
      return NextResponse.json({ error: "Sistem hatası: API Key eksik" }, { status: 500 });
    }

    if (!signerUuid) {
      return NextResponse.json({ error: "İşlem izni (Signer) bulunamadı. Lütfen önce onay verin." }, { status: 400 });
    }

    if (targets.length === 0) {
      return NextResponse.json({ error: "İşlem yapılacak hesap seçilmedi." }, { status: 400 });
    }

    // 2. Neynar'a Tek Bir "Paket" İstek Gönder
    // Dökümantasyon: DELETE metodu 'target_fids' dizisini gövdede (body) kabul eder.
    const url = "https://api.neynar.com/v2/farcaster/user/follow";

    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        "accept": "application/json",
        "api_key": API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        signer_uuid: signerUuid,
        target_fids: targets, // Tüm listeyi tek seferde gönderiyoruz
      }),
    });

    const responseData = await res.json();

    // 3. Yanıt Kontrolü
    if (!res.ok) {
      console.error("Neynar API Hatası:", responseData);
      return NextResponse.json(
        { error: responseData?.message || `İşlem başarısız (Hata kodu: ${res.status})` },
        { status: res.status }
      );
    }

    // Başarılı yanıt
    return NextResponse.json({
      success: true,
      count: targets.length,
      message: `${targets.length} kişi başarıyla takipten çıkarıldı.`,
    });

  } catch (error: any) {
    console.error("API Genel Hatası:", error?.message);
    return NextResponse.json(
      { error: "İşlem sırasında beklenmedik bir hata oluştu." },
      { status: 500 }
    );
  }
}
