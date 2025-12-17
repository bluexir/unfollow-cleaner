'use client';

import { useEffect, useState } from 'react';

interface AuthButtonProps {
  onAuthSuccess: (data: any) => void;
}

export default function AuthButton({ onAuthSuccess }: AuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedAuth = localStorage.getItem('farcaster_auth');
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        console.log('Found stored auth:', authData);
        if (authData.signer_uuid && authData.fid) {
          onAuthSuccess(authData);
          return;
        }
      } catch (error) {
        console.error('Failed to parse stored auth:', error);
        localStorage.removeItem('farcaster_auth');
      }
    }

    const checkUrlParams = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const signerUuid = urlParams.get('signer_uuid');
      const fid = urlParams.get('fid');
      
      console.log('URL params check:', { signerUuid, fid });
      
      if (signerUuid && fid) {
        const authData = {
          signer_uuid: signerUuid,
          fid: parseInt(fid),
          username: urlParams.get('username') || 'user',
          display_name: urlParams.get('display_name') || 'User',
          pfp_url: urlParams.get('pfp_url') || 'https://via.placeholder.com/40',
        };
        
        console.log('Auth successful from callback:', authData);
        localStorage.setItem('farcaster_auth', JSON.stringify(authData));
        onAuthSuccess(authData);
        
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    checkUrlParams();
  }, [onAuthSuccess]);

  const handleSignIn = () => {
    setIsLoading(true);
    const clientId = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID;
    
    if (!clientId) {
      alert('Neynar Client ID not configured');
      setIsLoading(false);
      return;
    }

    const redirectUrl = window.location.origin;
    const authUrl = `https://app.neynar.com/login?client_id=${clientId}&redirect_url=${encodeURIComponent(redirectUrl)}`;
    
    console.log('Redirecting to:', authUrl);
    window.location.href = authUrl;
  };

  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      className="bg-farcaster-purple hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200"
    >
      {isLoading ? 'Redirecting to Neynar...' : 'Sign in with Farcaster'}
    </button>
  );
}
