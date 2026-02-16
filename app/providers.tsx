"use client";

import { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
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

type MiniAppContext = Awaited<typeof sdk.context>;

const FarcasterContext = createContext<{
  context: MiniAppContext | undefined;
  isSDKLoaded: boolean;
}>({
  context: undefined,
  isSDKLoaded: false,
});

export function Providers({ children }: { children: ReactNode }) {
  const [context, setContext] = useState<MiniAppContext>();
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  useEffect(() => {
    const init = async () => {
      console.log("🛠️ [SDK] Başlatma süreci başladı...");

      try {
        const miniappContext = await sdk.context;
        setContext(miniappContext);
        console.log("✅ [SDK] Context başarıyla alındı.");

        await sdk.actions.ready();
        console.log("🚀 [SDK] Uygulama 'Ready' durumuna geçti.");

        // Mini app kaydet / bildirimleri aç prompt'u:
        // Not: Her açılışta spam olmasın diye 1 kere deniyoruz.
        const key = "miniapp_add_prompt_shown_v1";
        const already = localStorage.getItem(key) === "1";

        if (!already) {
          try {
            await sdk.actions.addMiniApp();
            localStorage.setItem(key, "1");
            console.log("⭐ [SDK] addMiniApp prompt tetiklendi.");
          } catch (_e) {
            // Host desteklemiyor olabilir, kullanıcı iptal etmiş olabilir,
            // ya da domain/manifest eşleşmesi yoksa fail olur.
            console.log("ℹ️ [SDK] addMiniApp başarısız/iptal (normal olabilir).");
          }
        }
      } catch (error) {
        console.error("❌ [SDK] Yükleme sırasında hata:", error);
      } finally {
        setIsSDKLoaded(true);
      }
    };

    if (typeof window !== "undefined") init();
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
