import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: "ok", message: "Webhook is active" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event } = body;

    switch (event) {
      case "notifications_enabled":
        console.log(`Bildirimler açıldı: ${body.fid}`);
        break;
      case "notifications_disabled":
        console.log(`Bildirimler kapatıldı: ${body.fid}`);
        break;
      case "app_uninstalled":
        console.log(`Uygulama silindi: ${body.fid}`);
        break;
      default:
        console.log("Bilinmeyen olay türü:", event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook hatası:", error);
    return NextResponse.json({ error: "İstek işlenemedi" }, { status: 400 });
  }
}
