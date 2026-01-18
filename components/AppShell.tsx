'use client';

import { useEffect, useState } from 'react';
import NonFollowersList from './NonFollowersList';

const SIGNER_STORAGE_KEY = 'unfollow_cleaner_signer_uuid_v1';

export default function AppShell({ user }: { user: { fid: number } }) {
  const userFid = user.fid;

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

  // 2. Stored signer'ı doğrula
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

  // Loading state
  if (isCheckingSigner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
        <div className="w-12 h-12 border-3 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-4" />
        <p className="text-gray-400 text-sm font-mono tracking-wider animate-pulse">LOADING...</p>
      </div>
    );
  }

  // Main app (follow gate kaldırıldı!)
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
