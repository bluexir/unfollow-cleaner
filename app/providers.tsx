"use client";

import { useEffect, createContext, useContext, useState } from "react";
import sdk, { type FrameContext } from "@farcaster/frame-sdk";

const FarcasterContext = createContext<{ context: FrameContext | undefined }>({ context: undefined });

export function Providers({ children }: { children: React.ReactNode }) {
  const [context, setContext] = useState<FrameContext>();

  useEffect(() => {
    const init = async () => {
      // SDK'yı yükle ve kullanıcı bilgisini al
      const frameContext = await sdk.context;
      setContext(frameContext);
      
      // Warpcast'e uygulamanın hazır olduğunu bildir (Zorunlu)
      sdk.actions.ready();
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
