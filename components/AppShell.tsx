'use client';

import { useEffect, useState } from 'react';
import sdk from '@farcaster/frame-sdk';
import NonFollowersList from './NonFollowersList';

const DEV_FID = 429973;
const SIGNER_STORAGE_KEY = 'unfollow_cleaner_signer_uuid_v1';

export default function AppShell({ user }: { user: { fid: number } }) {
  const userFid = user.fid;

  const [isCheckingFollow, setIsCheckingFollow] = useState(true);
  const [isFollowingDev, setIsFollowingDev] = useState(false);
  const [followError, setFollowError] = useState<string | null>(null);

  const [signerUuid, setSignerUuid] = useState<string | null>(null);
  const [isCheckingSigner, setIsCheckingSigner] = useState(true);

  const [storedSigner, setStoredSigner] = useState<string | null>(null);
  const [signerRestoreAttempted, setSignerRestoreAttempted] = useState(false);

  // 1. LocalStorage'dan signer oku
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(SIGNER_STORAGE_KEY);
    setStoredSigner(stored);
    setSignerRestoreAttempted(true);
  }, []);

  // 2. Follow gate kontrolü
  useEffect(() => {
    let cancelled = false;

    const checkFollow = async () => {
      setIsCheckingFollow(true);
      setFollowError(null);

      // Developer kendisini kontrol etmez
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

    checkFollow();
    return () => {
      cancelled = true;
    };
  }, [userFid]);

  // 3. Stored signer'ı doğrula
  useEffect(() => {
    let cancelled = false;

    if (!signerRestoreAttempted) return;

    const verifySigner = async (uuid: string) => {
      try {
        const res = await fetch(`/api/check-signer?signer_uuid=${encodeURIComponent(uuid)}`);
        const data = await res.json().catch(() => ({}));

        if (res.ok && data?.status === 'approved' && data?.fid === userFid) {
          return { ok: true as const };
        }

        if (res.status === 404 || data?.status === 'not_found') {
          return { ok: false as const, reason: 'not_found' as const };
        }

        return { ok: false as const, reason: 'not_approved' as const };
      } catch {
        return { ok: false as const, reason: 'network' as const };
      }
    };

    const checkStoredSigner = async () => {
      setIsCheckingSigner(true);

      if (!storedSigner) {
        if (!cancelled) {
          setSignerUuid(null);
          setIsCheckingSigner(false);
        }
        return;
      }

      const result = await verifySigner(storedSigner);
      if (!cancelled) {
        if (result.ok) {
          setSignerUuid(storedSigner);
        } else {
          // Geçersiz signer, temizle
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem(SIGNER_STORAGE_KEY);
          }
          setStoredSigner(null);
          setSignerUuid(null);
        }
        setIsCheckingSigner(false);
      }
    };

    checkStoredSigner();
    return () => {
      cancelled = true;
    };
  }, [storedSigner, userFid, signerRestoreAttempted]);

  const handleSignerGranted = (uuid: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SIGNER_STORAGE_KEY, uuid);
    }
    setStoredSigner(uuid);
    setSignerUuid(uuid);
  };

  const openDevProfile = () => {
    try {
      sdk.actions.viewProfile({ fid: DEV_FID });
    } catch {
      window.open('https://warpcast.com/bluexir', '_blank');
    }
  };

  // Loading state
  if (isCheckingFollow || isCheckingSigner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
        <div className="w-12 h-12 border-3 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-4" />
        <p className="text-gray-400 text-sm font-mono tracking-wider animate-pulse">LOADING...</p>
      </div>
    );
  }

  // Follow gate
  if (!isFollowingDev) {
    return (
      <div className="px-4 pt-8 pb-12 max-w-md mx-auto">
        <div className="bg-gradient-to-b from-[#1c1f2e] to-[#151823] border border-purple-500/20 rounded-2xl p-8 shadow-2xl shadow-purple-900/20">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20">
              <span className="text-purple-300 text-2xl">🔒</span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white mb-2">Follow Required</h1>
              <p className="text-gray-400 text-sm leading-relaxed mb-1">
                To use this tool, please follow{' '}
                <span className="text-purple-400 font-semibold">@bluexir</span>.
              </p>
              {followError && (
                <p className="text-red-400 text-xs mt-3 font-mono bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                  {followError}
                </p>
              )}
              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={openDevProfile}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-3 px-6 rounded-xl font-bold shadow-lg shadow-purple-500/30 transition-all active:scale-95"
                >
                  Follow @bluexir
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="text-sm text-gray-500 hover:text-white underline decoration-dashed transition-colors"
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

  // Main app
  return (
    <div className="px-4 pt-8 pb-24 max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
          Unfollow Cleaner
        </h1>
        <p className="text-gray-500 text-sm">Find non-followers and clean up with one tap.</p>
      </div>

      <NonFollowersList 
        userFid={userFid} 
        signerUuid={signerUuid} 
        onSignerGranted={handleSignerGranted} 
      />
    </div>
  );
}
