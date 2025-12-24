import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Frontend'den gelen veriyi alıyoruz
    const targetFid = body.targetFid; 
    const targetFidsInput = body.target_fids; 

    // Hepsini tek bir dizide toplayalım
    let targets = [];
    if (Array.isArray(targetFidsInput)) {
      targets = targetFidsInput;
    } else if (targetFid) {
      targets = [targetFid];
    }

    // --- SERVER AYARLARI ---
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
            "api_key": API_KEY || "", // Eski header
            "x-api-key": API_KEY || "", // Yeni header (Garanti olsun)
            "content-type": "application/json"
          },
          // İŞTE DÜZELTİLEN KISIM BURASI:
          body: JSON.stringify({
            signer_uuid: SIGNER_UUID,
            target_fids: [parseInt(fid)] // <--- target_fid YERİNE target_fids (LİSTE HALİNDE)
          })
        };

        const res = await fetch(url, options);
        const responseText = await res.text();

        // Neynar bazen boş body döndürür başarılı olunca, o yüzden status check önemli
        if (!res.ok) {
            // Hata mesajını parse edelim
            let errorMsg = responseText;
            try {
                const jsonErr = JSON.parse(responseText);
                errorMsg = jsonErr.message || responseText;
            } catch (e) {}

            console.error(`❌ Unfollow Başarısız (FID: ${fid}):`, errorMsg);
            errors.push({ fid, error: errorMsg });
        } else {
            console.log(`✅ Unfollow Başarılı (FID: ${fid})`);
            results.push({ fid, success: true });
        }

        // Rate limit önlemi (Hızlı istek atıp banlanmamak için)
        if (targets.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
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
