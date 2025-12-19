'use client';

import { useEffect, useState } from 'react';

interface PermissionGateProps {
  userFid: number;
  onPermissionGranted: (signerUuid: string) => void;
}

export default function PermissionGate({ userFid, onPermissionGranted }: PermissionGateProps) {
  const [isGranting, setIsGranting] = useState(false);
  const [signerUuid, setSignerUuid] = useState<string | null>(null);
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!signerUuid) return;

    const checkSigner = async () => {
      try {
        const response = await fetch(`/api/check-signer?signer_uuid=${signerUuid}`);
        const data = await response.json();

        if (data.authenticated) {
          onPermissionGranted(signerUuid);
        }
      } catch (error) {
        console.error('Signer check error:', error);
      }
    };

    const interval = setInterval(checkSigner, 2000);

    return () => clearInterval(interval);
  }, [signerUuid, onPermissionGranted]);

  const handleGrantPermission = async () => {
    setIsGranting(true);
    setError(null);

    try {
      const response = await fetch('/api/create-signer', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setSignerUuid(data.signer_uuid);
      setApprovalUrl(data.deep_link);
      
      window.open(data.deep_link, '_blank');
    } catch (error: any) {
      setError(error.message || 'Failed to create permission request');
      setIsGranting(false);
    }
  };

  if (signerUuid && approvalUrl) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="bg-gradient-to-br from-farcaster-purple/20 to-purple-900/20 border border-farcaster-purple/30 rounded-2xl p-8 backdrop-blur-sm">
          <div className="mb-6">
            <div className="w-20 h-20 bg-farcaster-purple/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <svg className="w-10 h-10 text-farcaster-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-3">Waiting for Approval</h2>
            <p className="text-gray-400 text-lg mb-4">
              Please approve the permission request in Warpcast
            </p>
            <p className="text-sm text-gray-500">
              This will allow the app to unfollow users on your behalf
            </p>
          </div>

          
            href={approvalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-farcaster-purple hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
          >
            Open Approval Page
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className="bg-gradient-to-br from-farcaster-purple/20 to-purple-900/20 border border-farcaster-purple/30 rounded-2xl p-8 backdrop-blur-sm">
        <div className="mb-6">
          <div className="w-20 h-20 bg-farcaster-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-farcaster-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-3">Permission Required</h2>
          <p className="text-gray-400 text-lg mb-4">
            To unfollow users, this app needs your permission
          </p>
          <p className="text-sm text-gray-500">
            You'll be redirected to Warpcast to approve
          </p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <button
          onClick={handleGrantPermission}
          disabled={isGranting}
          className="bg-farcaster-purple hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105"
        >
          {isGranting ? 'Creating request...' : 'Grant Permission'}
        </button>
      </div>
    </div>
  );
}
