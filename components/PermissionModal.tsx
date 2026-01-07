'use client';

import { useEffect, useRef, useState } from 'react';
import sdk from '@farcaster/frame-sdk';

interface PermissionModalProps {
  userFid: number;
  onPermissionGranted: (signerUuid: string) => void;
  onClose: () => void;
}

export default function PermissionModal({ userFid, onPermissionGranted, onClose }: PermissionModalProps) {
  // Değişken ismini backend ile uyumlu hale getirdik: signer_approval_url
  const [signerData, setSignerData] = useState<{ signer_uuid: string; signer_approval_url: string } | null>(null);
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

      // Backend'den gelen 'signer_approval_url' bilgisini kontrol ediyoruz
      if (!data?.signer_uuid || !data?.signer_approval_url) {
        throw new Error('Eksik signer verisi döndü');
      }

      setSignerData({ 
        signer_uuid: data.signer_uuid, 
        signer_approval_url: data.signer_approval_url 
      });

      // Mini App içinde URL'yi açıyoruz
      try {
        await sdk.actions.openUrl(data.signer_approval_url);
      } catch (err) {
        console.error('openUrl failed:', err);
        window.open(data.signer_approval_url, '_blank');
      }

      startPolling(data.signer_uuid);
    } catch (err: any) {
      setError(err?.message || 'Signer oluşturulamadı. Tekrar dene.');
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
        const data = await response.json().catch(() => ({}));

        // Durum 'approved' olduğunda ve FID eşleştiğinde işlemi tamamla
        if (response.ok && data?.status === 'approved' && Number(data?.fid) === userFid) {
          if (intervalRef.current) window.clearInterval(intervalRef.current);
          setIsChecking(false);
          onPermissionGranted(signerUuid);
          return;
        }

        if (response.status === 404 || data?.status === 'not_found') {
          throw new Error('İzin linki süresi dolmuş. Tekrar deneyin.');
        }

        if (response.ok && data?.status === 'revoked') {
          throw new Error('İzin iptal edilmiş. Yeniden deneyin.');
        }
      } catch (err: any) {
        setError(err?.message || 'İzin kontrolünde hata oluştu');
        if (intervalRef.current) window.clearInterval(intervalRef.current);
        setIsChecking(false);
      }
    }, 3000); // 3 saniye (daha akıcı bir deneyim için)

    timeoutRef.current = window.setTimeout(() => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      setIsChecking(false);
      setError('Onay çok uzun sürdü. Lütfen tekrar deneyin.');
    }, 180000); // 3 dakika
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[#1c1f2e] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl leading-none"
        >
          ×
        </button>

        <div className="w-16 h-16 bg-purple-500/15 border border-purple-500/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🛡️</span>
        </div>

        <h2 className="text-xl font-bold text-white text-center mb-2">
          {isChecking ? 'Waiting for Approval...' : 'Permission Required'}
        </h2>

        <p className="text-gray-400 text-sm text-center leading-relaxed mb-6">
          {isChecking
            ? 'Waiting for approval in Warpcast. Click "Approve" in the opened screen.'
            : 'To unfollow users, you need to approve once in Warpcast. A small gas fee will be paid from your wallet.'}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {!signerData && !isCreating && (
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={createSigner}
              className="flex-1 bg-[#7C65C1] hover:bg-[#6952a3] text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              Authorize
            </button>
          </div>
        )}

        {isCreating && !signerData && (
          <div className="flex items-center justify-center gap-2 py-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div>
            <span className="text-gray-400 text-sm">Preparing authorization screen...</span>
          </div>
        )}

        {isChecking && signerData && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 py-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div>
              <span className="text-gray-300 text-sm font-medium">Waiting for approval...</span>
            </div>
            
            <button
              onClick={async () => {
                if (!signerData?.signer_approval_url) return;
                try {
                  await sdk.actions.openUrl(signerData.signer_approval_url);
                } catch {
                  window.open(signerData.signer_approval_url, '_blank');
                }
              }}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-4 py-3 rounded-xl transition-colors"
            >
              Open in Warpcast Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
