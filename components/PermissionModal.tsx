'use client';

import { useState } from 'react';
import { useFarcaster } from '@/app/providers';

interface PermissionModalProps {
  userFid: number;
  onPermissionGranted: (signerUuid: string) => void;
  onClose: () => void;
}

export default function PermissionModal({ userFid, onPermissionGranted, onClose }: PermissionModalProps) {
  const { requestSignIn } = useFarcaster();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const signerUuid = await requestSignIn();

      if (!signerUuid) {
        throw new Error('Sign in failed. Please try again.');
      }

      onPermissionGranted(signerUuid);
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
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
          Permission Required
        </h2>

        <p className="text-gray-400 text-sm text-center leading-relaxed mb-6">
          To unfollow users, you need to authenticate once. This is secure and handled by Farcaster.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSignIn}
            disabled={isProcessing}
            className="flex-1 bg-[#7C65C1] hover:bg-[#6952a3] disabled:opacity-50 text-white font-bold px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              'Authorize'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
