"use client";

import { useState, useEffect, useCallback } from "react";
import sdk from "@farcaster/frame-sdk";

interface User {
  fid: number;
  username: string;
  pfp_url: string;
  display_name?: string;
}

interface Stats {
  following: number;
  followers: number;
  notFollowingBack: number;
}

// Configuration
const WALLET_ADDR = "0xaDBd1712D5c6e2A4D7e08F50a9586d3C054E30c8";
const USDC_ADDR = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base USDC
const DEGEN_ADDR = "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed"; // Base DEGEN

export default function UnfollowManager({ user }: { user: { fid: number } | undefined }) {
  const [nonFollowers, setNonFollowers] = useState<User[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState<"ETH" | "DEGEN" | "USDC">("ETH");

  const fetchData = useCallback(async () => {
    if (!user?.fid) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/get-non-followers?fid=${user.fid}`);
      const data = await res.json();
      setNonFollowers(data.users || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setLoading(false);
    }
  }, [user?.fid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUnfollow = async (targetFid: number) => {
    try {
      const res = await fetch("/api/unfollow", {
        method: "POST",
        body: JSON.stringify({ targetFid }),
      });
      if (res.ok) {
        setNonFollowers((prev) => prev.filter((u) => u.fid !== targetFid));
        sdk.actions.addFrame(); // Trigger UI update if needed
      }
    } catch (error) {
      console.error("Unfollow failed", error);
    }
  };

  const handleTip = async (amount: number) => {
    try {
      let txData = {
        to: WALLET_ADDR,
        value: "0",
        data: "0x",
        chainId: "eip155:8453", // Base Mainnet
      };

      if (currency === "ETH") {
        // ETH Transfer (Wei conversion)
        const wei = BigInt(amount * 1000000000000000000).toString();
        txData.value = wei;
      } else {
        // ERC20 Transfer (USDC or DEGEN)
        const contract = currency === "USDC" ? USDC_ADDR : DEGEN_ADDR;
        const decimals = currency === "USDC" ? 6 : 18;
        const rawAmount = BigInt(amount * (10 ** decimals));
        
        // Encode transfer(address,uint256) -> 0xa9059cbb
        const amountHex = rawAmount.toString(16).padStart(64, "0");
        const addressHex = WALLET_ADDR.replace("0x", "").padStart(64, "0");
        const data = `0xa9059cbb${addressHex}${amountHex}`;

        txData.to = contract;
        txData.data = data;
      }

      await sdk.wallet.sendTransaction(txData);
      
    } catch (error) {
      console.error("Transaction failed", error);
    }
  };

  const getTipOptions = () => {
    switch (currency) {
      case "ETH": return [0.001, 0.003, 0.005];
      case "DEGEN": return [100, 500, 1000];
      case "USDC": return [1, 3, 5];
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="loader"></div>
        <p className="text-purple-400 font-mono text-sm animate-pulse">SCANNING GHOSTS...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 px-4 pt-6 max-w-md mx-auto">
      {/* Stats Card */}
      <div className="bg-[#1c1f2e]/80 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/5 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-white bg-clip-text text-transparent">
            ANALYSIS REPORT
          </h1>
          <button onClick={fetchData} className="text-gray-400 hover:text-white transition-colors">
            🔄
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <span className="text-2xl font-bold text-white block">{stats?.following || 0}</span>
            <span className="text-[10px] text-gray-500 tracking-wider">FOLLOWING</span>
          </div>
          <div className="text-center border-l border-white/5 border-r">
            <span className="text-2xl font-bold text-white block">{stats?.followers || 0}</span>
            <span className="text-[10px] text-gray-500 tracking-wider">FOLLOWERS</span>
          </div>
          <div className="text-center">
            <span className="text-2xl font-bold text-red-400 block">{stats?.notFollowingBack || 0}</span>
            <span className="text-[10px] text-red-400/80 tracking-wider">GHOSTS</span>
          </div>
        </div>
      </div>

      {/* Non-Followers List */}
      <div className="mb-10">
        <h3 className="text-sm font-bold text-gray-400 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          DETECTED GHOSTS ({nonFollowers.length})
        </h3>
        
        {nonFollowers.length === 0 ? (
          <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
            <span className="text-4xl block mb-2">✨</span>
            <p className="text-gray-400 text-sm">No ghosts found. You are clean!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {nonFollowers.map((u) => (
              <div key={u.fid} className="flex items-center justify-between bg-[#151722] p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <img src={u.pfp_url} alt={u.username} className="w-10 h-10 rounded-full bg-gray-800" />
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-gray-200">{u.display_name}</span>
                    <span className="text-xs text-gray-500">@{u.username}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleUnfollow(u.fid)}
                  className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-red-500/20"
                >
                  Unfollow
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Smart Tip System */}
      <div className="bg-gradient-to-b from-[#252836] to-[#1c1f2e] rounded-2xl p-1 border border-white/10 shadow-lg">
        {/* Currency Tabs */}
        <div className="grid grid-cols-3 gap-1 mb-4 bg-black/20 p-1 rounded-xl">
          {(["ETH", "DEGEN", "USDC"] as const).map((curr) => (
            <button
              key={curr}
              onClick={() => setCurrency(curr)}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                currency === curr 
                ? "bg-[#7C65C1] text-white shadow-lg" 
                : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {curr}
            </button>
          ))}
        </div>

        <div className="px-5 pb-5 text-center">
          <p className="text-gray-400 text-xs mb-4">Support the developer with {currency}</p>
          <div className="grid grid-cols-3 gap-3">
            {getTipOptions().map((amount) => (
              <button
                key={amount}
                onClick={() => handleTip(amount)}
                className="bg-white/5 hover:bg-white/10 border border-white/5 py-3 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
              >
                {amount} {currency === 'ETH' ? '' : currency === 'USDC' ? '$' : ''}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
