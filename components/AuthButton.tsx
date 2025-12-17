'use client';

import { useEffect, useState } from 'react';

interface AuthButtonProps {
  onAuthSuccess: (data: any) => void;
}

export default function AuthButton({ onAuthSuccess }: AuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [signerUuid, setSignerUuid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedAuth = localStorage.getItem('farcaster_auth');
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        if (authData.signer_uuid && authData.fid) {
          onAuthSuccess(authData);
          return;
        }
      } catch (error) {
        localStorage.removeItem('farcaster_auth');
      }
    }
  }, [onAuthSuccess]);

  useEffect(() => {
    if (!signerUuid) return;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/check-signer?signer_uuid=${signerUuid}`);
        const data = await response.json();

        if (data.authenticated && data.user) {
          const authData = {
            signer_uuid: signerUuid,
            fid: data.user.fid,
            username: data.user.username,
            display_name: data.user.display_name,
            pfp_url: data.user.pfp_url,
          };

          localStorage.setItem('farcaster_auth', JSON.stringify(authData));
          onAuthSuccess(authData);
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Poll error:', error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [signerUuid, onAuthSuccess]);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/create-signer', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setQrCodeUrl(data.qr_code_url);
      setDeepLink(data.deep_link);
      setSignerUuid(data.signer_uuid);
      setIsLoading(false);
    } catch (error: any) {
      setError(error.message || 'Failed to create signer');
      setIsLoading(false);
    }
  };

  if (qrCodeUrl) {
    return (
      <div className="text-center">
        <h3 className="text-xl font-bold mb-4">Scan with Warpcast</h3>
        <div className="bg-white p-4 rounded-lg inline-block mb-4">
          <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
        </div>
        <p className="text-gray-400 text-sm mb-4">
          Scan this QR code with your Warpcast mobile app
        </p>
        {deepLink && (
          
            href={deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-farcaster-purple hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg inline-block mb-2"
          >
            Open in Warpcast
          </a>
        )}
        <button
          onClick={() => {
            setQrCodeUrl(null);
            setDeepLink(null);
            setSignerUuid(null);
          }}
          className="block mx-auto text-gray-400 hover:text-white text-sm mt-4"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="text-center">
      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <button
        onClick={handleSignIn}
        disabled={isLoading}
        className="bg-farcaster-purple hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200"
      >
        {isLoading ? 'Loading...' : 'Sign in with Farcaster'}
      </button>
    </div>
  );
}
