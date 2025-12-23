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
        // SDK Context verisini çek
        const frameContext = await sdk.context;
        setContext(frameContext);
        
        // KRİTİK NOKTA: Context geldikten hemen sonra Ready sinyalini gönder
        sdk.actions.ready();
      } catch (error) {
        console.error("SDK Error:", error);
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
