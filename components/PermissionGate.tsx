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
      const response = await fetch('/api/create-signer', { method: 'POST' });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
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
        <div className="bg-gradient-to-br from-farcaster-purple/20 to-purple-900/20 border border-farcaster-purple/30 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">Waiting for Approval</h2>
          <p className="text-gray-400 mb-6">Please approve in Warpcast</p>
          <a href={approvalUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-farcaster-purple hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg">
            Open Approval
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className="bg-gradient-to-br from-farcaster-purple/20 to-purple-900/20 border border-farcaster-purple/30 rounded-2xl p-8">
        <h2 className="text-2xl font-bold mb-4">Permission Required</h2>
        <p className="text-gray-400 mb-6">Grant permission to unfollow users</p>
        {error && <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-4">{error}</div>}
        <button onClick={handleGrantPermission} disabled={isGranting} className="bg-farcaster-purple hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-4 px-8 rounded-lg">
          {isGranting ? 'Creating...' : 'Grant Permission'}
        </button>
      </div>
    </div>
  );
}
