"use client";

import { useEffect, createContext, useContext, useState } from "react";
import sdk from "@farcaster/frame-sdk";

/**
 * KUSURSUZ ÇÖZÜM:
 * 'FrameContext' ismini import etmek yerine, SDK'nın kendisinden tipi türetiyoruz.
 * Bu yöntem, "Exported member not found" hatasını %100 çözer.
 */
type FrameContext = Awaited<typeof sdk.context>;

const FarcasterContext = createContext<{ context: FrameContext | undefined }>({ context: undefined });

export function Providers({ children }: { children: React.ReactNode }) {
  const [context, setContext] = useState<FrameContext>();

  useEffect(() => {
    const init = async () => {
      try {
        // Context'i yükle
        const frameContext = await sdk.context;
        setContext(frameContext);
        
        // Uygulamanın hazır olduğunu bildir
        sdk.actions.ready();
      } catch (error) {
        console.error("Frame SDK başlatılamadı:", error);
      }
    };
    init();
  }, []);

  return (
    <FarcasterContext.Provider value={{ context }}>
      {children}
    </FarcasterContext.Provider>
  );
}

export const useFarcaster = () => useContext(FarcasterContext);
