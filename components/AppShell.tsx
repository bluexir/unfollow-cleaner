'use client';

import { useEffect, useState } from 'react';
import sdk from '@farcaster/frame-sdk';
import NonFollowersList from './NonFollowersList';
import { useFarcaster } from '@/app/providers';

const DEV_FID = 429973;

export default function AppShell({ user }: { user: { fid: number } }) {
  const userFid = user.fid;
  const { signerUuid } = useFarcaster();

  const [isCheckingFollow, setIsCheckingFollow] = useState(true);
  const [isFollowingDev, setIsFollowingDev] = useState(false);
  const [followError, setFollowError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsCheckingFollow(true);
      setFollowError(null);

      if (userFid === DEV_FID) {
        if (!cancelled) {
          setIsFollowingDev(true);
          setIsCheckingFollow(false);
        }
        return;
      }

      try {
        const res = await fetch(`/api/check-follow?fid=${userFid}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error || 'Follow kontrolü başarısız');
        }

        if (!cancelled) {
          setIsFollowingDev(Boolean(data?.isFollowing));
        }
      } catch (e: any) {
        if (!cancelled) {
          setFollowError(e?.message || 'Follow kontrolü başarısız');
          setIsFollowingDev(false);
        }
      } finally {
        if (!cancelled) setIsCheckingFollow(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [userFid]);

  const openDevProfile = () => {
    try {
      sdk.actions.viewProfile({ fid: DEV_FID });
    } catch {
      window.open('https://warpcast.com/bluexir', '_blank');
    }
  };

  if (isCheckingFollow) {
    return (
      <div data-testid="app-shell-loading" className="flex flex-col items-center justify-center min-h-[70vh] px-6">
        <div className="loader mb-4" />
        <p className="text-gray-500 text-xs tracking-[0.25em] animate-pulse">SECURITY CHECK...</p>
      </div>
    );
  }

  if (!isFollowingDev) {
    return (
      <div data-testid="follow-gate-screen" className="px-4 pt-6 pb-12 max-w-md mx-auto animate-fade-up">
        <div className="bg-[#1c1f2e]/80 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-purple-300 text-xl">🔒</span>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">Follow Required</h1>
              <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                To use this tool, follow <span className="text-purple-300 font-semibold">@bluexir</span>.
              </p>
              {followError && (
                <p className="text-red-400 text-xs mt-3 font-mono bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                  {followError}
                </p>
              )}
              <div className="mt-4 flex flex-col gap-3">
                <button
                  data-testid="follow-gate-follow-button"
                  onClick={openDevProfile}
                  className="bg-[#7C65C1] hover:bg-[#6952a3] text-white py-3 px-6 rounded-xl font-bold shadow-lg shadow-purple-900/20 transition-colors active:scale-[0.99]"
                >
                  Follow @bluexir
                </button>
                <button
                  data-testid="follow-gate-refresh-button"
                  onClick={() => window.location.reload()}
                  className="text-xs text-gray-500 hover:text-white underline decoration-dashed"
                >
                  I followed, refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="app-shell-main" className="px-4 pt-6 max-w-3xl mx-auto animate-fade-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Unfollow Cleaner</h1>
        <p className="text-gray-500 text-sm mt-1">Find non-followers and clean up with one tap.</p>
      </div>

      <NonFollowersList userFid={userFid} signerUuid={signerUuid} />
    </div>
  );
}
