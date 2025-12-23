/**
 * Farcaster Bildirim Gönderme Modülü
 * Döküman: Sending Notifications rehberine uygun
 */
export async function sendFarcasterNotification(fid: number, title: string, body: string) {
  const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY;

  try {
    const response = await fetch("https://api.neynar.com/v2/farcaster/frame/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api_key": NEYNAR_API_KEY || "",
      },
      body: JSON.stringify({
        fid: fid,
        notification: {
          title: title,
          body: body,
        },
      }),
    });

    return await response.json();
  } catch (error) {
    console.error("Bildirim gönderilemedi:", error);
    return null;
  }
}
