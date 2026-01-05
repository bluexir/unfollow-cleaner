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

type FrameContext = Awaited<typeof sdk.context>;

const FarcasterContext = createContext<{ 
  context: FrameContext | undefined; 
  isSDKLoaded: boolean;
  signerUuid: string | null;
  requestSignIn: () => Promise<string | null>;
}>({
  context: undefined,
  isSDKLoaded: false,
  signerUuid: null,
  requestSignIn: async () => null,
});

export function Providers({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<FrameContext>();
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [signerUuid, setSignerUuid] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      console.log("🛠️ [SDK] Başlatma süreci başladı...");
      
      try {
        const frameContext = await sdk.context;
        setContext(frameContext);
        console.log("✅ [SDK] Context başarıyla alındı.");
        
        await sdk.actions.ready();
        console.log("🚀 [SDK] Uygulama 'Ready' durumuna geçti.");
      } catch (error) {
        console.error("❌ [SDK] Yükleme sırasında hata:", error);
      } finally {
        setIsSDKLoaded(true);
      }
    };

    if (typeof window !== "undefined") {
      init();
    }
  }, []);

  const requestSignIn = async (): Promise<string | null> => {
    try {
      console.log("🔐 [AUTH] Sign in başlatılıyor...");

      // Mini App SDK direkt signer_uuid verir!
      const result = await sdk.actions.signIn();
      
      if (!result?.signer_uuid) {
        throw new Error('Signer UUID alınamadı');
      }

      console.log("✅ [AUTH] Signer UUID alındı:", result.signer_uuid);

      setSignerUuid(result.signer_uuid);
      return result.signer_uuid;

    } catch (error: any) {
      console.error("❌ [AUTH] Hata:", error);
      return null;
    }
  };

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <FarcasterContext.Provider value={{ 
          context, 
          isSDKLoaded, 
          signerUuid,
          requestSignIn 
        }}>
          {children}
        </FarcasterContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export const useFarcaster = () => useContext(FarcasterContext);
