'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const initApp = async () => {
      try {
        const { sdk } = await import('@farcaster/miniapp-sdk');
        await sdk.actions.ready();
        
        const context = await sdk.context;
        if (context?.user?.fid) {
          router.push(`/app?fid=${context.user.fid}`);
          return;
        }
      } catch (e) {
        console.log('Not in mini app:', e);
      }
      
      const params = new URLSearchParams(window.location.search);
      const fid = params.get('fid');
      if (fid) {
        router.push(`/app?fid=${fid}`);
      }
    };

    initApp();
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-farcaster-darker via-gray-900 to-black">
      <div className="text-center px-4 max-w-2xl">
        <svg
          className="w-24 h-24 mx-auto mb-8 text-farcaster-purple"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
        
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-farcaster-purple to-purple-400 bg-clip-text text-transparent">
          Unfollow Cleaner
        </h1>
        
        <p className="text-xl text-gray-300 mb-8">
          Clean up your Farcaster following list
        </p>

        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <p className="text-gray-400 mb-4">
            This app works inside Warpcast.
          </p>
          <p className="text-sm text-gray-500">
            Please open this link from a Farcaster cast or use the Warpcast app.
          </p>
        </div>
      </div>
    </main>
  );
}
