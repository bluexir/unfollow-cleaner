'use client';

import { useEffect, useState } from 'react';

interface AuthButtonProps {
  onAuthSuccess: (data: any) => void;
}

export default function AuthButton({ onAuthSuccess }: AuthButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if we have stored auth data
    const storedAuth = localStorage.getItem('farcaster_auth');
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        onAuthSuccess(authData);
      } catch (error) {
        console.error('Failed to parse stored auth:', error);
        localStorage.removeItem('farcaster_auth');
      }
    }
  }, [onAuthSuccess]);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const clientId = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID;
      if (!clientId) {
        throw new Error('Neynar Client ID not configured');
      }

      // Open Neynar sign-in in a new window
      const width = 400;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const authWindow = window.open(
        `https://app.neynar.com/login?client_id=${clientId}`,
        'Farcaster Sign In',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Listen for messages from the auth window
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== 'https://app.neynar.com') return;

        if (event.data.type === 'neynar:auth:success') {
          const authData = event.data.data;
          localStorage.setItem('farcaster_auth', JSON.stringify(authData));
          onAuthSuccess(authData);
          authWindow?.close();
          setIsLoading(false);
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);

      // Check if window was closed without auth
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          setIsLoading(false);
          window.removeEventListener('message', handleMessage);
        }
      }, 1000);
    } catch (error) {
      console.error('Sign in error:', error);
      setIsLoading(false);
      alert('Failed to sign in. Please try again.');
    }
  };

  return (
    <button
      onClick={handleSignIn}
      disabled={isLoading}
      className="bg-farcaster-purple hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-200"
    >
      {isLoading ? 'Opening Sign In...' : 'Sign in with Farcaster'}
    </button>
  );
}
