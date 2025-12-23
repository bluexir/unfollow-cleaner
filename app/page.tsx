"use client";

import { useState, useEffect } from "react";
import { useFarcaster } from "./providers";
import UnfollowManager from "@/components/UnfollowManager";
import sdk from "@farcaster/frame-sdk";

// SENİN BİLGİLERİN - Bypass için sabitlendi
const ADMIN_FID = 429973; 

export default function Home() {
  const { context } = useFarcaster();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (context?.user.fid) {
      // 1. ADIM: Bypass Kontrolü
      if (context.user.fid === ADMIN_FID) {
        setIsFollowing(true);
        setLoading(false);
        return;
      }

      // 2. ADIM: Normal Kullanıcı İçin Takip Kontrolü
      checkFollowStatus(context.user.fid);
    }
  }, [context]);

  const checkFollowStatus = async (fid: number) => {
    try {
      const res = await fetch(`/api/check-follow?fid=${fid}`);
      const data = await res.json();
      setIsFollowing(data.isFollowing);
    } catch (e) {
      console.error("Takip kontrolü hatası.");
      // Hata durumunda güvenlik için kapalı tutuyoruz
      setIsFollowing(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#7C65C1]">
        <div className="text-white font-medium">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <main className="p-4 max-w-2xl mx-auto min-h-screen">
      {!isFollowing ? (
        <div className="text-center space-y-6 py-20 bg-white rounded-3xl shadow-xl p-8 mt-10">
          <div className="mx-auto w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Takip Etmeyenleri Gör</h2>
          <p className="text-gray-600 leading-relaxed">
            Analiz listesini görmek ve takibi bırakma aracını kullanmak için 
            <span className="font-bold text-purple-600"> @bluexir</span> hesabını takip etmelisiniz.
          </p>
          <div className="space-y-3">
            <button 
              onClick={() => sdk.actions.viewProfile({ fid: ADMIN_FID })}
              className="w-full bg-[#7C65C1] text-white px-8 py-4 rounded-2xl font-bold hover:opacity-90 transition active:scale-95"
            >
              @bluexir Takip Et
            </button>
            <button 
              onClick={() => checkFollowStatus(context?.user.fid!)}
              className="w-full py-3 text-sm text-gray-400 font-medium hover:text-purple-600 transition"
            >
              Zaten takip ediyorum, kontrol et
            </button>
          </div>
        </div>
      ) : (
        // Takip ediliyorsa veya sen giriş yaptıysan asıl uygulama açılır
        <UnfollowManager user={context?.user} isAdmin={context?.user.fid === ADMIN_FID} />
      )}
    </main>
  );
}
