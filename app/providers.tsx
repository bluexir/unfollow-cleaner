"use client";
import { useEffect, useState, createContext, useContext } from "react";
import sdk from "@farcaster/frame-sdk";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
});

const queryClient = new QueryClient();

type FrameContext = Awaited<typeof sdk.context>;

const FarcasterContext = createContext<{ context: FrameContext | undefined }>({
  context: undefined,
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [context, setContext] = useState<FrameContext>();

  useEffect(() => {
    const init = async () => {
      console.log("[DEBUG] SDK başlatılıyor...");
      try {
        console.log("[DEBUG] sdk.context çekiliyor...");
        const frameContext = await sdk.context;
        console.log("[DEBUG] Context alındı:", frameContext);
        setContext(frameContext);
        
        console.log("[DEBUG] sdk.actions.ready() çağrılıyor...");
        sdk.actions.ready();
        console.log("[SUCCESS] SDK hazır!");
      } catch (error) {
        console.error("[ERROR] SDK Yükleme Hatası:", error);
        console.error("[ERROR] Hata detayı:", JSON.stringify(error));
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
