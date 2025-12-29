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

interface FarcasterContextType {
  context: FrameContext | undefined;
  isAuthenticated: boolean;
  fid: number | null;
  login: () => Promise<void>;
  logout: () => void;
}

const FarcasterContext = createContext<FarcasterContextType>({
  context: undefined,
  isAuthenticated: false,
  fid: null,
  login: async () => {},
  logout: () => {},
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [context, setContext] = useState<FrameContext>();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [fid, setFid] = useState<number | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const frameContext = await sdk.context;
        setContext(frameContext);
        
        // Context'ten user bilgisi varsa direkt authenticated sayıyoruz
        if (frameContext.user?.fid) {
          setIsAuthenticated(true);
          setFid(frameContext.user.fid);
        }
        
        sdk.actions.ready();
      } catch (error) {
        console.error("SDK Yükleme Hatası:", error);
      }
    };
    
    if (typeof window !== "undefined") {
      init();
    }
  }, []);

  const login = async () => {
    try {
      // quickAuth kullanarak token al
      const result = await sdk.quickAuth.getToken();
      
      if (result?.token) {
        // Token'ı backend'e gönder
        const response = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: result.token }),
        });

        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(true);
          setFid(data.fid);
          
          // Context'i güncelle
          const newContext = await sdk.context;
          setContext(newContext);
        }
      }
    } catch (error) {
      console.error("Login hatası:", error);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setFid(null);
  };

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <FarcasterContext.Provider value={{ context, isAuthenticated, fid, login, logout }}>
          {children}
        </FarcasterContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export const useFarcaster = () => useContext(FarcasterContext);
