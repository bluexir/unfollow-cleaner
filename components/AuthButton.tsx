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
        if (authData.fid) {
          onAuthSuccess(authData);
          return;
        }
      } catch (error) {
        localStorage.removeItem('farcaster_auth');
      }
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code && !isLoading) {
      setIsLoading(true);
      
      fetch(`/api/neynar-callback?code=${code}`)
        .then(res => res.json())
        .then(data => {
          if (data.fid) {
            localStorage.setItem('farcaster_auth', JSON.stringify(data));
            onAuthSuccess(data);
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [onAuthSuccess, isLoading]);

  const handleSignIn = () => {
    const clientId = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID;
    const redirectUrl = window.location.origin;
    const authUrl = `https://app.neynar.com/login?client_id=${clientId}&redirect_url=${encodeURIComponent(redirectUrl)}`;
    window.location.href = authUrl;
  };

  if (isLoading) {
    return (
      <div className="text-center">
        <div className="text-gray-400">Completing sign in...</div>
      </div>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      className="bg-farcaster-purple hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200"
    >
      Sign in with Farcaster
    </button>
  );
}
