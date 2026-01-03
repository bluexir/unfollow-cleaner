"use client";
import { useEffect, useState, createContext, useContext, ReactNode } from "react";
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

// SDK Context tipini güvenli hale getiriyoruz
type FrameContext = Awaited<typeof sdk.context>;

const FarcasterContext = createContext<{ 
  context: FrameContext | undefined; 
  isSDKLoaded: boolean 
}>({
  context: undefined,
  isSDKLoaded: false,
});

export function Providers({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<FrameContext>();
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  useEffect(() => {
    const init = async () => {
      console.log("🛠️ [SDK] Başlatma süreci başladı...");
      
      try {
        // SDK Context'ini yükle
        const frameContext = await sdk.context;
        setContext(frameContext);
        console.log("✅ [SDK] Context başarıyla alındı.");

        // ÖNEMLİ: Uygulamanın Warpcast içinde görünür olması için 'ready' şarttır.
        // Hata olsa bile 'ready' çağrılmalıdır ki splash screen kapansın.
        await sdk.actions.ready();
        console.log("🚀 [SDK] Uygulama 'Ready' durumuna geçti.");
      } catch (error) {
        console.error("❌ [SDK] Yükleme sırasında hata:", error);
      } finally {
        // Hata olsa da olmasa da yükleme durumunu tamamla
        setIsSDKLoaded(true);
      }
    };

    if (typeof window !== "undefined") {
      init();
    }
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <FarcasterContext.Provider value={{ context, isSDKLoaded }}>
          {children}
        </FarcasterContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export const useFarcaster = () => useContext(FarcasterContext);
