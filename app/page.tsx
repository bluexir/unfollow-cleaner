'use client';

import { useState } from 'react';
import AuthButton from '@/components/AuthButton';
import FollowGate from '@/components/FollowGate';
import NonFollowersList from '@/components/NonFollowersList';
import TipSection from '@/components/TipSection';

interface FarcasterUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  signer_uuid: string;
}

export default function Home() {
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [followVerified, setFollowVerified] = useState(false);

  const handleAuthSuccess = (authData: any) => {
    setUser({
      fid: authData.fid,
      username: authData.username,
      display_name: authData.display_name,
      pfp_url: authData.pfp_url,
      signer_uuid: authData.signer_uuid,
    });
  };

  const handleSignOut = () => {
    localStorage.removeItem('farcaster_auth');
    setUser(null);
    setFollowVerified(false);
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-700 bg-farcaster-darker">
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

          {user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img
                  src={user.pfp_url}
                  alt={user.username}
                  className="w-8 h-8 rounded-full"
                />
                <span className="hidden sm:inline text-sm">@{user.username}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {!user ? (
          // Landing page
          <div className="text-center py-20">
            <svg
              className="w-20 h-20 mx-auto mb-6 text-farcaster-purple"
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
            
            <h2 className="text-4xl font-bold mb-4">Clean Up Your Following List</h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Discover who doesn't follow you back on Farcaster and clean up your following
              list with ease.
            </p>

            <div className="mb-8">
              <AuthButton onAuthSuccess={handleAuthSuccess} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left">
              <div className="bg-farcaster-dark border border-gray-700 rounded-lg p-6">
                <div className="text-farcaster-purple text-3xl mb-3">🔍</div>
                <h3 className="font-bold mb-2">Find Non-Followers</h3>
                <p className="text-sm text-gray-400">
                  Quickly identify users you follow who don't follow you back
                </p>
              </div>

              <div className="bg-farcaster-dark border border-gray-700 rounded-lg p-6">
                <div className="text-farcaster-purple text-3xl mb-3">🧹</div>
                <h3 className="font-bold mb-2">Bulk Unfollow</h3>
                <p className="text-sm text-gray-400">
                  Unfollow multiple users at once or one by one - your choice
                </p>
              </div>

              <div className="bg-farcaster-dark border border-gray-700 rounded-lg p-6">
                <div className="text-farcaster-purple text-3xl mb-3">⚡</div>
                <h3 className="font-bold mb-2">Fast & Simple</h3>
                <p className="text-sm text-gray-400">
                  Clean interface, no hassle - just sign in and start cleaning
                </p>
              </div>
            </div>
          </div>
        ) : !followVerified ? (
          // Follow gate
          <FollowGate userFid={user.fid} onFollowVerified={() => setFollowVerified(true)} />
        ) : (
          // Main app
          <>
            <NonFollowersList userFid={user.fid} signerUuid={user.signer_uuid} />
            <TipSection />
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-700 mt-20">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-gray-500">
          <p>
            Built with 💜 for the Farcaster community by{' '}
            <a
              href="https://warpcast.com/bluexir"
              target="_blank"
              rel="noopener noreferrer"
              className="text-farcaster-purple hover:text-purple-400"
            >
              @bluexir
            </a>
          </p>
          <p className="mt-2">
            Powered by{' '}
            <a
              href="https://neynar.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-farcaster-purple hover:text-purple-400"
            >
              Neynar
            </a>
          </p>
        </div>
      </footer>
    </main>
  );
}
