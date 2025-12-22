'use client';

import { useState, useEffect } from 'react';

interface PermissionGateProps {
  userFid: number;
  onPermissionGranted: (signerUuid: string) => void;
}

export default function PermissionGate({ userFid, onPermissionGranted }: PermissionGateProps) {
  const [signerData, setSignerData] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSigner = async () => {
    setIsCreating(true);
    setError(null);
    
    try {
      console.log('🚀 Creating signer for FID:', userFid);
      
      const response = await fetch('/api/create-signer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid: userFid }),
      });

      console.log('📡 Response status:', response.status);
      
      const data = await response.json();
      console.log('📦 Response data:', data);

      if (data.error) {
        console.error('❌ API Error:', data.error);
        setError(data.error);
        setIsCreating(false);
        return;
      }

      setSignerData(data);
      
      if (data.deep_link) {
        console.log('🔗 Opening approval URL:', data.deep_link);
        window.open(data.deep_link, '_blank');
        startPolling(data.signer_uuid);
      }
    } catch (err) {
      console.error('❌ Create signer error:', err);
      setError('Failed to create signer. Please try again.');
      setIsCreating(false);
    }
  };

  const startPolling = async (signerUuid: string) => {
    setIsChecking(true);
    console.log('⏳ Starting polling for signer:', signerUuid);
    
    const pollInterval = setInterval(async () => {
      try {
        console.log('🔄 Checking signer status...');
        
        const response = await fetch(`/api/check-signer?signer_uuid=${signerUuid}`);
        const data = await response.json();
        
        console.log('📊 Signer status:', data.status);

        if (data.status === 'approved') {
          console.log('✅ Signer approved!');
          clearInterval(pollInterval);
          setIsChecking(false);
          onPermissionGranted(signerUuid);
        } else if (data.status === 'pending') {
          console.log('⏳ Still pending...');
        } else {
          console.log('❓ Unknown status:', data.status);
        }
      } catch (err) {
        console.error('❌ Polling error:', err);
      }
    }, 2000);

    setTimeout(() => {
      clearInterval(pollInterval);
      setIsChecking(false);
      console.log('⏰ Polling timeout');
    }, 120000);
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
      <div className="mb-6">
        <div className="w-16 h-16 bg-farcaster-purple rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Grant Permission</h2>
        <p className="text-gray-400">
          {isChecking 
            ? 'Waiting for approval in Warpcast...' 
            : 'Allow this app to perform actions on your behalf'}
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-4">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      {!signerData && !isCreating && (
        <button
          onClick={createSigner}
          className="bg-farcaster-purple hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200"
        >
          Grant Permission
        </button>
      )}

      {isCreating && !signerData && (
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-farcaster-purple"></div>
          <span className="text-gray-400">Creating signer...</span>
        </div>
      )}

      {isChecking && (
        <div className="mt-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-farcaster-purple"></div>
            <span className="text-gray-400">Checking approval status...</span>
          </div>
          <p className="text-sm text-gray-500">
            Please approve the request in the Warpcast window
          </p>
        </div>
      )}
    </div>
  );
}
