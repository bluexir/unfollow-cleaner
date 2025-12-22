'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import FollowGate from '@/components/FollowGate';
import PermissionGate from '@/components/PermissionGate';
import NonFollowersList from '@/components/NonFollowersList';
import TipSection from '@/components/TipSection';

interface FarcasterUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  signer_uuid?: string;
}

function AppContent() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [followVerified, setFollowVerified] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initSDK = async () => {
      try {
        console.log('🚀 Starting SDK init...');
        const { sdk } = await import('@farcaster/miniapp-sdk');
        await sdk.actions.ready();
        console.log('✅ SDK ready() called successfully');
      } catch (e) {
        console.error('❌ SDK init error:', e);
      }
    };
    initSDK();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log('🔍 Starting user fetch...');
        const { sdk } = await import('@farcaster/miniapp-sdk');
        const context = await sdk.context;
        
        console.log('🔍 SDK Context:', context);
        console.log('🔍 Context User:', context?.user);
        console.log('🔍 FID from context:', context?.user?.fid);
        
        const urlFid = searchParams.get('fid');
        console.log('🔍 FID from URL:', urlFid);
        
        const fid = context?.user?.fid?.toString() || urlFid;
        console.log('🔍 Final FID:', fid);
        
        if (fid) {
          console.log('🔍 Fetching user data for FID:', fid);
          const response = await fetch(
            `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
            {
              headers: {
                'accept': 'application/json',
                'api_key': process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || '',
              },
            }
          );
          
          console.log('🔍 API Response status:', response.status);
          const data = await response.json();
          console.log('🔍 API Response data:', data);
          
          if (data.users && data.users[0]) {
            const userData = data.users[0];
            console.log('✅ User data found:', userData);
            setUser({
              fid: parseInt(fid),
              username: userData.username,
              display_name: userData.display_name || userData.username,
              pfp_url: userData.pfp_url || '',
            });
          } else {
            console.error('❌ No user data in response');
          }
        } else {
          console.error('❌ NO FID FOUND!');
        }
      } catch (err) {
        console.error('❌ User fetch error:', err);
      } finally {
        console.log('🏁 Setting loading to false');
        setLoading(false);
      }
    };

    fetchUser();
  }, [searchParams]);

  const handleSignOut = () => {
    setUser(null);
    setFollowVerified(false);
    setPermissionGranted(false);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-farcaster-darker">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-farcaster-purple mx-auto mb-4"></div>
          <p className="text-gray-400">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-farcaster-darker">
      <header className="border-b border-gray-700 bg-farcaster-darker sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <svg
              className="w-8 h-8 text-farcaster-purple"
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
            <h1 className="text-xl font-bold">Unfollow Cleaner</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {user.pfp_url && (
                <img
                  src={user.pfp_url}
                  alt={user.username}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="hidden sm:inline text-sm">@{user.username}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {!followVerified ? (
          <FollowGate userFid={user.fid} onFollowVerified={() => setFollowVerified(true)} />
        ) : !permissionGranted ? (
          <PermissionGate 
            userFid={user.fid} 
            onPermissionGranted={(signerUuid) => {
              setUser({ ...user, signer_uuid: signerUuid });
              setPermissionGranted(true);
            }} 
          />
        ) : (
          <>
            <NonFollowersList userFid={user.fid} signerUuid={user.signer_uuid!} />
            <TipSection />
          </>
        )}
      </div>
    </main>
  );
}

export default function AppPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-farcaster-darker">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-farcaster-purple"></div>
      </div>
    }>
      <AppContent />
    </Suspense>
  );
}
