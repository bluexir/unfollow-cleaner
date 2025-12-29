'use client';

import { useEffect, useMemo, useState } from 'react';
import sdk from '@farcaster/frame-sdk';
import PermissionGate from './PermissionGate';
import NonFollowersList from './NonFollowersList';

const DEV_FID = 429973; // @bluexir
const SIGNER_STORAGE_KEY = 'unfollow_cleaner_signer_uuid_v1';

export default function AppShell({ user }: { user: { fid: number } }) {
  const userFid = user.fid;

  const [isCheckingFollow, setIsCheckingFollow] = useState(true);
  const [isFollowingDev, setIsFollowingDev] = useState(false);
  const [followError, setFollowError] = useState<string | null>(null);

  const [signerUuid, setSignerUuid] = useState<string | null>(null);
  const [isCheckingSigner, setIsCheckingSigner] = useState(true);

  const storedSigner = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(SIGNER_STORAGE_KEY);
  }, []);

  // 1) Follow gate (senin FID bypass)
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsCheckingFollow(true);
      setFollowError(null);

      // Admin bypass
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

  // 2) Signer restore + verify
  useEffect(() => {
    let cancelled = false;

    const verifySigner = async (uuid: string) => {
      try {
        const res = await fetch(`/api/check-signer?signer_uuid=${encodeURIComponent(uuid)}`);
        const data = await res.json();

        // approved + fid match
        if (res.ok && data?.status === 'approved' && data?.fid === userFid) {
          return true;
        }
        return false;
      } catch {
        return false;
      }
    };

    const run = async () => {
      setIsCheckingSigner(true);

      if (!storedSigner) {
        if (!cancelled) {
          setSignerUuid(null);
          setIsCheckingSigner(false);
        }
        return;
      }

      const ok = await verifySigner(storedSigner);
      if (!cancelled) {
        if (ok) {
          setSignerUuid(storedSigner);
        } else {
          window.localStorage.removeItem(SIGNER_STORAGE_KEY);
          setSignerUuid(null);
        }
        setIsCheckingSigner(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [storedSigner, userFid]);

  const openDevProfile = () => {
    try {
      sdk.actions.viewProfile({ fid: DEV_FID });
    } catch {
      window.open('https://warpcast.com/bluexir', '_blank');
    }
  };

  if (isCheckingFollow || isCheckingSigner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
        <div className="loader mb-4" />
        <p className="text-gray-500 text-xs tracking-[0.25em] animate-pulse">SECURITY CHECK...</p>
      </div>
    );
  }

  // Follow gate
  if (!isFollowingDev) {
    return (
      <div className="px-4 pt-6 pb-12 max-w-md mx-auto">
        <div className="bg-[#1c1f2e]/80 backdrop-blur-md rounded-2xl p-6 border border-white/5 shadow-2xl">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-purple-300 text-xl">🔒</span>
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">Listeyi açmak için takip şart</h1>
              <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                Bu aracı kullanmak için <span className="text-purple-300 font-semibold">@bluexir</span> hesabını takip et.
              </p>
              {followError && (
                <p className="text-red-400 text-xs mt-3 font-mono bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
                  {followError}
                </p>
              )}
              <div className="mt-4 flex flex-col gap-3">
                <button
                  onClick={openDevProfile}
                  className="bg-[#7C65C1] hover:bg-[#6952a3] text-white py-3 px-6 rounded-xl font-bold shadow-lg shadow-purple-900/20 transition-colors active:scale-[0.99]"
                >
                  @bluexir Takip Et
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="text-xs text-gray-500 hover:text-white underline decoration-dashed"
                >
                  Takip ettim, yenile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Permission gate (signer)
  if (!signerUuid) {
    return (
      <div className="px-4 pt-6 pb-12 max-w-md mx-auto">
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-white">İzin ver, temizliğe başla</h1>
          <p className="text-gray-400 text-sm mt-1">
            Unfollow işlemi için Warpcast içinde bir kere izin vermen gerekiyor.
          </p>
        </div>

        <PermissionGate
          userFid={userFid}
          onPermissionGranted={(uuid) => {
            window.localStorage.setItem(SIGNER_STORAGE_KEY, uuid);
            setSignerUuid(uuid);
          }}
        />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Unfollow Cleaner</h1>
        <p className="text-gray-500 text-sm mt-1">Seni takip etmeyenleri bul, seç ve tek tuşla temizle.</p>
      </div>

      <NonFollowersList userFid={userFid} signerUuid={signerUuid} />
    </div>
  );
}
