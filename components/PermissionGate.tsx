'use client';

import { useEffect, useRef, useState } from 'react';

interface PermissionGateProps {
  userFid: number;
  onPermissionGranted: (signerUuid: string) => void;
}

export default function PermissionGate({ userFid, onPermissionGranted }: PermissionGateProps) {
  const [signerData, setSignerData] = useState<{ signer_uuid: string; deep_link: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const createSigner = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch('/api/create-signer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid: userFid }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Signer oluşturulamadı');
      }

      if (!data?.signer_uuid || !data?.deep_link) {
        throw new Error('Eksik signer verisi döndü');
      }

      setSignerData({ signer_uuid: data.signer_uuid, deep_link: data.deep_link });

      // Warpcast içinde approval penceresini aç
      window.open(data.deep_link, '_blank');

      startPolling(data.signer_uuid);
    } catch (err: any) {
      setError(err?.message || 'Failed to create signer. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const startPolling = (signerUuid: string) => {
    setIsChecking(true);

    if (intervalRef.current) window.clearInterval(intervalRef.current);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);

    intervalRef.current = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/check-signer?signer_uuid=${encodeURIComponent(signerUuid)}`);
        const data = await response.json();

        if (response.ok && data?.status === 'approved' && data?.fid === userFid) {
          if (intervalRef.current) window.clearInterval(intervalRef.current);
          setIsChecking(false);
          onPermissionGranted(signerUuid);
        }

        if (response.ok && data?.status === 'revoked') {
          throw new Error('İzin iptal edilmiş görünüyor. Yeniden deneyin.');
        }
      } catch (err: any) {
        setError(err?.message || 'İzin kontrolünde hata oluştu');
        if (intervalRef.current) window.clearInterval(intervalRef.current);
        setIsChecking(false);
      }
    }, 2000);

    timeoutRef.current = window.setTimeout(() => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      setIsChecking(false);
      setError('Onay çok uzun sürdü. Warpcast penceresinden onaylayıp tekrar deneyin.');
    }, 120000);
  };

  return (
    <div className="bg-[#1c1f2e]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 text-center shadow-2xl">
      <div className="mb-5">
        <div className="w-16 h-16 bg-purple-500/15 border border-purple-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🛡️</span>
        </div>
        <h2 className="text-xl font-bold mb-2">İzin Gerekli</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          {isChecking
            ? 'Warpcast içinde onay bekleniyor…'
            : 'Bu uygulamanın senin adına unfollow yapabilmesi için bir kere izin vermen gerekiyor.'}
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {!signerData && !isCreating && (
        <button
          onClick={createSigner}
          className="bg-[#7C65C1] hover:bg-[#6952a3] text-white font-bold px-6 py-3 rounded-xl transition-colors"
        >
          İzin Ver
        </button>
      )}

      {isCreating && !signerData && (
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div>
          <span className="text-gray-400 text-sm">İzin ekranı hazırlanıyor…</span>
        </div>
      )}

      {isChecking && signerData && (
        <div className="mt-5">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div>
            <span className="text-gray-300 text-sm font-medium">Onay bekleniyor</span>
          </div>
          <p className="text-xs text-gray-500">Warpcast açılan pencerede “Approve” de.</p>
        </div>
      )}
    </div>
  );
}
