import { NextRequest, NextResponse } from "next/server";
import { neynarClient } from "@/lib/neynar";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { signer_uuid, target_fids } = body;

    if (!signer_uuid || !target_fids || !Array.isArray(target_fids)) {
      return NextResponse.json(
        { error: "signer_uuid ve target_fids gerekli" },
        { status: 400 }
      );
    }

    console.log(`🔄 Unfollow başlıyor: ${target_fids.length} kişi`);

    const results = [];
    const errors = [];

    // Her FID için unfollow (rate limiting için gecikme ekle)
    for (const targetFid of target_fids) {
      try {
        await neynarClient.unfollowUser(signer_uuid, targetFid);
        results.push({ fid: targetFid, success: true });
        
        // Rate limiting için küçük bekleme (100ms)
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error: any) {
        console.error(`❌ Unfollow hatası (FID: ${targetFid}):`, error.message);
        errors.push({ fid: targetFid, error: error.message });
      }
    }

    console.log(`✅ Unfollow tamamlandı: ${results.length} başarılı, ${errors.length} hata`);

    return NextResponse.json({
      success: true,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error: any) {
    console.error("🔥 Unfollow API hatası:", error.message);
    return NextResponse.json(
      { error: error.message || "Unfollow işlemi başarısız" },
      { status: 500 }
    );
  }
}
