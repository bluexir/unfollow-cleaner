"use client";

import { useFarcaster } from "./providers";
import AppShell from "@/components/AppShell";

export default function Home() {
  const { context } = useFarcaster();

  // 1) SDK yüklenirken
  if (!context) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f1117]">
        <div className="loader mb-4"></div>
        <p className="text-gray-500 text-xs tracking-[0.2em] animate-pulse">SYSTEM INITIALIZING...</p>
      </div>
    );
  }

  // 2) Warpcast dışında açıldıysa
  if (!context.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f1117] p-8 text-center text-white">
        <div className="text-5xl mb-6">📱</div>
        <h1 className="text-2xl font-bold mb-4">Mobile App Only</h1>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Unfollow Cleaner, Warpcast mini app deneyimi için tasarlandı.
          Lütfen bu linki Warpcast içinde aç.
        </p>
        <a
          href="https://warpcast.com/bluexir"
          className="bg-[#7C65C1] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#6952a3] transition-colors"
        >
          Warpcast'ı Aç
        </a>
      </div>
    );
  }

  return (
    <main data-testid="app-root" className="min-h-screen bg-app">
      <AppShell user={context.user} />
    </main>
  );
}
