import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Frontend bazen 'targetFid' (tekil) bazen 'target_fids' (çoğul) gönderebilir.
    // İkisini de kapsayacak şekilde birleştiriyoruz.
    const targetFid = body.targetFid; // Frontend'den gelen tekli ID
    const targetFidsInput = body.target_fids; // Veya toplu liste

    // Hepsini tek bir dizide toplayalım
    let targets = [];
    if (Array.isArray(targetFidsInput)) {
      targets = targetFidsInput;
    } else if (targetFid) {
      targets = [targetFid];
    }

    // --- KRİTİK AYARLAR (Server Side) ---
    // Signer UUID'yi frontend göndermez, biz buradaki kasadan alırız.
    const SIGNER_UUID = process.env.NEYNAR_SIGNER_UUID;
    const API_KEY = process.env.NEYNAR_API_KEY;

    if (!SIGNER_UUID) {
      console.error("❌ HATA: Server tarafında NEYNAR_SIGNER_UUID bulunamadı.");
      return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    if (targets.length === 0) {
      return NextResponse.json({ error: "Silinecek FID bulunamadı" }, { status: 400 });
    }

    console.log(`🔄 Unfollow Başlıyor. Hedef Sayısı: ${targets.length}`);
    console.log(`🔑 Kullanılan Signer: ${SIGNER_UUID.slice(0, 5)}...`);

    const results = [];
    const errors = [];

    // --- DÖNGÜ BAŞLIYOR ---
    for (const fid of targets) {
      try {
        // Neynar v2 API - Delete Follow
        const url = "https://api.neynar.com/v2/farcaster/user/follow";
        
        const options = {
          method: "DELETE",
          headers: {
            "accept": "application/json",
            "api_key": API_KEY || "",
            "content-type": "application/json"
          },
          body: JSON.stringify({
            signer_uuid: SIGNER_UUID,
            target_fid: parseInt(fid) // Sayıya çevirip gönderelim
          })
        };

        const res = await fetch(url, options);
        const responseText = await res.text();

        if (!res.ok) {
          console.error(`❌ Unfollow Başarısız (FID: ${fid}):`, responseText);
          errors.push({ fid, error: responseText });
        } else {
          console.log(`✅ Unfollow Başarılı (FID: ${fid})`);
          results.push({ fid, success: true });
        }

        // Çok hızlı istek atıp banlanmamak için minik bekleme (150ms)
        if (targets.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 150));
        }

      } catch (err: any) {
        console.error(`🔥 Beklenmedik Hata (FID: ${fid}):`, err.message);
        errors.push({ fid, error: err.message });
      }
    }

    console.log(`🏁 İşlem Bitti: ${results.length} Silindi, ${errors.length} Hata.`);

    return NextResponse.json({
      success: true,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    console.error("🔥 API Genel Hatası:", error.message);
    return NextResponse.json(
      { error: error.message || "İşlem başarısız" },
      { status: 500 }
    );
  }
}
