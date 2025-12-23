"use client";

import { useState, useEffect, useCallback } from "react";
import sdk from "@farcaster/frame-sdk";

interface User {
  fid: number;
  username?: string;
  pfpUrl?: string;
}

interface UnfollowManagerProps {
  user: User | undefined;
  isAdmin: boolean;
}

export default function UnfollowManager({ user, isAdmin }: UnfollowManagerProps) {
  const [nonFollowers, setNonFollowers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNonFollowers = useCallback(async () => {
    if (!user?.fid) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/get-non-followers?fid=${user.fid}`);
      const data = await res.json();
      setNonFollowers(data.users || []);
    } catch (error) {
      console.error("Liste alınamadı:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.fid]);

  useEffect(() => {
    fetchNonFollowers();
  }, [fetchNonFollowers]);

  const handleUnfollow = async (targetFid: number) => {
    try {
      const res = await fetch("/api/unfollow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetFid }),
      });

      if (res.ok) {
        setNonFollowers((prev) => prev.filter((u) => u.fid !== targetFid));
      }
    } catch (error) {
      console.error("Unfollow hatası:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7C65C1]"></div>
        <p className="text-gray-500 text-sm italic">Analiz ediliyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-sm flex justify-between items-center">
        <div>
          <h3 className="font-extrabold text-xl text-gray-900 dark:text-white">Analiz Raporu</h3>
          <p className="text-sm text-gray-500">{nonFollowers.length} kişi seni takip etmiyor</p>
        </div>
        <button onClick={fetchNonFollowers} className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-full">
          🔄
        </button>
      </div>

      <div className="grid gap-3">
        {nonFollowers.length === 0 ? (
          <div className="text-center py-12 bg-green-50 dark:bg-green-900/10 rounded-3xl border border-green-100">
            <p className="text-green-700 font-medium">Harika! Herkes seni takip ediyor.</p>
          </div>
        ) : (
          nonFollowers.map((u) => (
            <div key={u.fid} className="flex items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-50 dark:border-zinc-800">
              <div className="flex items-center gap-4">
                <img src={u.pfp_url || ""} alt={u.username} className="w-12 h-12 rounded-full border border-gray-100" />
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">@{u.username}</p>
                  <p className="text-[10px] text-gray-400">FID: {u.fid}</p>
                </div>
              </div>
              <button
                onClick={() => handleUnfollow(u.fid)}
                className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform"
              >
                Takibi Bırak
              </button>
            </div>
          ))
        )}
      </div>

      <div className="p-8 bg-gradient-to-br from-[#7C65C1] to-[#6a54a8] rounded-[2.5rem] text-center text-white">
        <h4 className="font-bold text-lg mb-4">Geliştiriciyi Destekle</h4>
        <button 
          onClick={() => sdk.actions.openUrl("https://warpcast.com/bluexir")}
          className="bg-white text-[#7C65C1] w-full py-4 rounded-2xl font-bold active:scale-95 transition-transform"
        >
          Kahve Ismarla ☕
        </button>
      </div>
    </div>
  );
}
