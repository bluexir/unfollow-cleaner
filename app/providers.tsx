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
        const frameContext = await sdk.context;
        setContext(frameContext);
        sdk.actions.ready(); // ← BU SATIR OLMALI!
      } catch (error) {
        console.error("SDK Yükleme Hatası:", error);
      }
    };

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
