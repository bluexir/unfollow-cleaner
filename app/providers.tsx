"use client";

import { useEffect, useState, createContext, useContext } from "react";
import sdk from "@farcaster/frame-sdk";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// --- 1. FARCASTER AYARLARI (MEVCUT) ---
type FrameContext = Awaited<typeof sdk.context>;

const FarcasterContext = createContext<{ context: FrameContext | undefined }>({
  context: undefined,
});

// --- 2. CÜZDAN AYARLARI (YENİ) ---
// React Query istemcisi
const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  // A) Farcaster State
  const [context, setContext] = useState<FrameContext>();

  // B) Wagmi (Cüzdan) Config
  const [config] = useState(() =>
    createConfig({
      chains: [base],
      transports: {
        [base.id]: http(),
      },
      connectors: [
        injected(), // MetaMask, Coinbase vb.
      ],
    })
  );

  useEffect(() => {
    const init = async () => {
      try {
        // SDK Hazırlığı
        const frameContext = await sdk.context;
        setContext(frameContext);
        
        // KRİTİK HAMLE: Sinyal gönder
        sdk.actions.ready();
        
      } catch (error) {
        console.error("SDK Yükleme Hatası:", error);
      }
    };

    if (typeof window !== "undefined") {
      init();
    }
  }, []);

  // --- 3. BİRLEŞTİRİLMİŞ PROVIDER YAPISI ---
  // En dışta Wagmi (Cüzdan), içerde Farcaster
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
