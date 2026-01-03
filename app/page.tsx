"use client";
import { useFarcaster } from "./providers";
import AppShell from "@/components/AppShell";

/**
 * Unfollow Cleaner - Ana Giriş
 * Sadece veri hazır olduğunda AppShell'i yükler.
 * Gereksiz yönlendirme veya dış dünya uyarısı içermez.
 */
export default function Home() {
  const { context, isSDKLoaded } = useFarcaster();

  // SDK yüklenene veya kullanıcı verisi gelene kadar boş ekran (Siyah)
  // Bu aşama, AppShell'in boş veriyle çökmesini (crash) önlemek için şarttır.
  if (!isSDKLoaded || !context?.user) {
    return <div className="min-h-screen bg-black" />;
  }

  // Veri doğrulanmışsa uygulamayı başlat
  return (
    <main className="min-h-screen bg-black">
      <AppShell user={context.user} />
    </main>
  );
}
