'use client';

import { useEffect } from 'react';

interface AuthButtonProps {
  onAuthSuccess: (data: any) => void;
}

export default function AuthButton({ onAuthSuccess }: AuthButtonProps) {
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

    const urlParams = new URLSearchParams(window.location.search);
    const signerUuid = urlParams.get('signer_uuid');
    const fid = urlParams.get('fid');
    
    if (signerUuid && fid) {
      const authData = {
        signer_uuid: signerUuid,
        fid: parseInt(fid),
        username: urlParams.get('username') || 'user',
        display_name: urlParams.get('display_name') || 'User',
        pfp_url: urlParams.get('pfp_url') || '',
      };
      
      localStorage.setItem('farcaster_auth', JSON.stringify(authData));
      onAuthSuccess(authData);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [onAuthSuccess]);

  const handleSignIn = () => {
    const clientId = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID;
    const redirectUrl = window.location.origin;
    const authUrl = `https://app.neynar.com/login?client_id=${clientId}&redirect_url=${encodeURIComponent(redirectUrl)}`;
    window.location.href = authUrl;
  };

  return (
    <button
      onClick={handleSignIn}
      className="bg-farcaster-purple hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200"
    >
      Sign in with Farcaster
    </button>
  );
}
