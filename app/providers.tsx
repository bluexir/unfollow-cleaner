"use client";

import { useEffect, useState, createContext, useContext } from "react";
import sdk from "@farcaster/frame-sdk";

type FrameContext = Awaited<typeof sdk.context>;

const FarcasterContext = createContext<{ context: FrameContext | undefined }>({
  context: undefined,
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [context, setContext] = useState<FrameContext>();

  useEffect(() => {
    const init = async () => {
      try {
        // SDK'nın hazır olmasını bekle
        const frameContext = await sdk.context;
        setContext(frameContext);
        
        // KRİTİK HAMLE: Yükleme bitti, hemen sinyal gönder!
        // Bu komut o "Ready not called" hatasını siler.
        sdk.actions.ready();
        
      } catch (error) {
        console.error("SDK Yükleme Hatası:", error);
      }
    };

    // Tarayıcı ortamındaysak başlat
    if (typeof window !== "undefined") {
      init();
    }
  }, []);

  return (
    <FarcasterContext.Provider value={{ context }}>
      {children}
    </FarcasterContext.Provider>
  );
}

export const useFarcaster = () => useContext(FarcasterContext);
