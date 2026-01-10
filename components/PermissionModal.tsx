'use client';

import { useEffect, useRef, useState } from 'react';
import sdk from '@farcaster/frame-sdk';

interface PermissionModalProps {
  userFid: number;
  onPermissionGranted: (signerUuid: string) => void;
  onClose: () => void;
}

export default function PermissionModal({ userFid, onPermissionGranted, onClose }: PermissionModalProps) {
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

      if (!data?.signer_uuid || !data?.signer_approval_url) {
        throw new Error('Eksik signer verisi döndü');
      }

      setSignerData({ 
        signer_uuid: data.signer_uuid, 
        signer_approval_url: data.signer_approval_url 
      });

      // Warpcast içinde aç
      try {
        await sdk.actions.openUrl(data.signer_approval_url);
      } catch (err) {
        console.error('[PERMISSION] openUrl başarısız:', err);
        // Fallback: yeni sekme
        window.open(data.signer_approval_url, '_blank');
      }

      startPolling(data.signer_uuid);

    } catch (err: any) {
      setError(err?.message || 'Signer oluşturulamadı. Tekrar deneyin.');
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

        // Approved ve FID eşleşiyorsa tamamla
        if (response.ok && data?.status === 'approved' && Number(data?.fid) === userFid) {
          if (intervalRef.current) window.clearInterval(intervalRef.current);
          if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
          setIsChecking(false);
          onPermissionGranted(signerUuid);
          return;
        }

        if (response.status === 404 || data?.status === 'not_found') {
          throw new Error('Signer bulunamadı. Tekrar deneyin.');
        }

        if (response.ok && data?.status === 'revoked') {
          throw new Error('İzin iptal edildi. Yeniden deneyin.');
        }

      } catch (err: any) {
        setError(err?.message || 'İzin kontrolünde hata');
        if (intervalRef.current) window.clearInterval(intervalRef.current);
        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        setIsChecking(false);
      }
    }, 3000); // 3 saniye

    // 3 dakika timeout
    timeoutRef.current = window.setTimeout(() => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      setIsChecking(false);
      setError('Onay çok uzun sürdü. Lütfen tekrar deneyin.');
    }, 180000);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-b from-[#1c1f2e] to-[#151823] border border-purple-500/20 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-purple-900/20 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl leading-none transition-colors"
        >
          ×
        </button>

        <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/20">
          <span className="text-4xl">🛡️</span>
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-3">
          {isChecking ? 'Waiting for Approval...' : 'Permission Required'}
        </h2>

        <p className="text-gray-400 text-center leading-relaxed mb-6">
          {isChecking
            ? 'Please approve in the opened Warpcast screen. This will allow the app to unfollow on your behalf.'
            : 'To unfollow users, you need to grant permission once. This is secure and handled by Farcaster.'}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 animate-shake">
            <p className="text-red-300 text-sm text-center">{error}</p>
          </div>
        )}

        {!signerData && !isCreating && (
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold px-6 py-3 rounded-xl transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              onClick={createSigner}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-purple-500/30 transition-all active:scale-95"
            >
              Authorize
            </button>
          </div>
        )}

        {isCreating && !signerData && (
          <div className="flex items-center justify-center gap-3 py-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div>
            <span className="text-gray-300 text-sm font-medium">Preparing authorization...</span>
          </div>
        )}

        {isChecking && signerData && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 py-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
              <span className="text-white text-sm font-semibold">Waiting for approval...</span>
            </div>
            
            <p className="text-xs text-gray-500 text-center">
              Approve in the opened Warpcast screen. If it didn't open, tap below.
            </p>

            <button
              onClick={async () => {
                if (!signerData?.signer_approval_url) return;
                try {
                  await sdk.actions.openUrl(signerData.signer_approval_url);
                } catch {
                  window.open(signerData.signer_approval_url, '_blank');
                }
              }}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-4 py-3 rounded-xl transition-all active:scale-95"
            >
              Open Approval Screen Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
