"use client";

import { useEffect, useState, createContext, useContext } from "react";
import sdk from "@farcaster/frame-sdk";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// 1. TEMİZ WAGMI AYARI (WalletConnect YOK!)
// Sadece Base ağına bağlanır, gereksiz dış sunuculara gitmez.
export const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(), // Standart güvenli bağlantı
  },
  // Connectors kısmını bilerek boş bıraktık veya sildik.
  // Böylece otomatik olarak WalletConnect yüklemeye çalışmaz.
});

// 2. Query Client (Wagmi'nin çalışması için motor yağı)
const queryClient = new QueryClient();

type FrameContext = Awaited<typeof sdk.context>;

const FarcasterContext = createContext<{ context: FrameContext | undefined }>({
  context: undefined,
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [context, setContext] = useState<FrameContext>();

  useEffect(() => {
    const init = async () => {
      try {
        const frameContext = await sdk.context;
        setContext(frameContext);
        
        // Farcaster'a "Ben hazırım, splash ekranını kaldır" diyoruz
        sdk.actions.ready(); 
      } catch (error) {
        console.error("SDK Yükleme Hatası:", error);
      }
    };

    if (typeof window !== "undefined") {
      init();
    }
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <FarcasterContext.Provider value={{ context }}>
          {children}
        </FarcasterContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export const useFarcaster = () => useContext(FarcasterContext);
