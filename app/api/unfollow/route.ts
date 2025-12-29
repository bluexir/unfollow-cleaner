import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const signerUuid = body.signer_uuid as string | undefined;
    const targetFid = body.targetFid as number | undefined;
    const targetFidsInput = body.target_fids as number[] | undefined;

    let targets: number[] = [];
    if (Array.isArray(targetFidsInput)) {
      targets = targetFidsInput.map((x) => Number(x)).filter((x) => Number.isFinite(x));
    } else if (targetFid) {
      targets = [Number(targetFid)];
    }

    const API_KEY = process.env.NEYNAR_API_KEY;

    if (!API_KEY) {
      return NextResponse.json({ error: "API Key eksik" }, { status: 500 });
    }

    if (!signerUuid) {
      // Kullanıcı bazlı signer şart
      return NextResponse.json({ error: "Signer izni bulunamadı. Lütfen izin verip tekrar dene." }, { status: 400 });
    }

    if (targets.length === 0) {
      return NextResponse.json({ error: "Silinecek hedef bulunamadı" }, { status: 400 });
    }

    const results: Array<{ fid: number; success: boolean }> = [];
    const errors: Array<{ fid: number; error: string }> = [];

    for (const fid of targets) {
      try {
        const url = "https://api.neynar.com/v2/farcaster/user/follow";

        const res = await fetch(url, {
          method: "DELETE",
          headers: {
            accept: "application/json",
            api_key: API_KEY,
            "x-api-key": API_KEY,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            signer_uuid: signerUuid,
            target_fids: [fid],
          }),
        });

        const text = await res.text();

        if (!res.ok) {
          let msg = text;
          try {
            const jsonErr = JSON.parse(text);
            msg = jsonErr?.message || jsonErr?.error || text;
          } catch {
            // ignore
          }
          errors.push({ fid, error: msg || `Unfollow failed (${res.status})` });
        } else {
          results.push({ fid, success: true });
        }

        // rate limit koruması
        if (targets.length > 1) {
          await new Promise((r) => setTimeout(r, 250));
        }
      } catch (err: any) {
        errors.push({ fid, error: err?.message || "Beklenmedik hata" });
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      results,
      errors: errors.length ? errors : undefined,
    });
  } catch (error: any) {
    console.error("🔥 API Genel Hatası:", error?.message);
    return NextResponse.json({ error: error.message || "İşlem başarısız" }, { status: 500 });
  }
}
