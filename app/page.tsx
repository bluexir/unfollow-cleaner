"use client";

import { useState, useEffect, useCallback } from "react";
import { useFarcaster } from "./providers";
import UnfollowManager from "@/components/UnfollowManager";
import sdk from "@farcaster/frame-sdk";

/**
 * ADMIN_FID: Uygulama sahibi (Senin FID: 429973)
 * Bu ID, takip kilidini bypass eder ve geliştirme/kullanım sürecini kesintisiz kılar.
 */
const ADMIN_FID = 429973; 

export default function Home() {
  const { context } = useFarcaster();
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Takip durumunu Neynar API üzerinden sunucu tarafında sorgular.
   * Depondaki /api/check-follow ucunu Mini App bağlamında kullanır.
   */
  const checkFollowStatus = useCallback(async (fid: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/check-follow?fid=${fid}`);
      if (!res.ok) throw new Error("API hatası oluştu.");
      const data = await res.json();
      setIsFollowing(data.isFollowing);
    } catch (e) {
      console.error("Takip kontrolü başarısız:", e);
      setError("Takip durumu doğrulanırken bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }, []);

  // SDK Context'i yüklendiğinde akışı başlatır
  useEffect(() => {
    if (context?.user.fid) {
      // Bypass Mekanizması: Eğer sensen doğrudan içeri al
      if (context.user.fid === ADMIN_FID) {
        setIsFollowing(true);
        setLoading(false);
      } else {
        checkFollowStatus(context.user.fid);
      }
    }
  }, [context, checkFollowStatus]);

  // Yükleme ekranı (Frames v2 splash screen ile uyumlu arka plan)
  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-[#7C65C1] text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white mb-4"></div>
        <p className="font-medium">Farcaster Verileri Yükleniyor...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-4 max-w-2xl mx-auto">
      {!isFollowing ? (
        <div className="mt-12 text-center space-y-6 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-8 border border-gray-100 dark:border-zinc-800 transition-all">
          <div className="mx-auto w-24 h-24 bg-purple-50 dark:bg-purple-900/20 rounded-full flex items-center justify-center mb-2">
            <span className="text-4xl">🔐</span>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Takip Kilidi Aktif</h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto text-sm">
              Analiz listesine erişmek için geliştiriciyi takip etmelisiniz.
            </p>
          </div>

          {error && <p className="text-red-500 text-xs font-medium bg-red-50 dark:bg-red-900/10 p-2 rounded-lg">{error}</p>}

          <div className="flex flex-col gap-3">
            <button 
              onClick={() => sdk.actions.viewProfile({ fid: ADMIN_FID })} // Profil açma aksiyonu
              className="w-full bg-[#7C65C1] hover:bg-[#6a54a8] text-white px-8 py-4 rounded-2xl font-bold transition-all active:scale-[0.98] shadow-lg shadow-purple-500/20"
            >
              @bluexir Takip Et
            </button>
            
            <button 
              onClick={() => checkFollowStatus(context?.user.fid!)}
              className="w-full py-3 text-sm text-[#7C65C1] font-semibold hover:underline transition-all"
            >
              Takip ettim, içeri al
            </button>
          </div>
          
          <p className="text-[10px] text-gray-400 uppercase tracking-widest pt-4">Powered by Frames v2</p>
        </div>
      ) : (
        /* Ana Uygulama: Takip ediliyorsa veya Adminseniz render edilir */
        <UnfollowManager 
          user={context?.user} 
          isAdmin={context?.user.fid === ADMIN_FID} 
        />
      )}
    </main>
  );
}
