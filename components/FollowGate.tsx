'use client';

import { useEffect, useState } from 'react';

interface FollowGateProps {
  userFid: number;
  onFollowVerified: () => void;
}

export default function FollowGate({ userFid, onFollowVerified }: FollowGateProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkFollow = async () => {
      try {
        const response = await fetch(`/api/check-follow?fid=${userFid}`);
        const data = await response.json();

        if (data.isFollowing) {
          onFollowVerified();
        }
      } catch (error) {
        console.error('Follow check error:', error);
      }
    };

    setIsChecking(true);
    checkFollow();

    const interval = setInterval(checkFollow, 3000);

    return () => clearInterval(interval);
  }, [userFid, onFollowVerified]);

  const handleFollowClick = () => {
    window.open('https://warpcast.com/bluexir', '_blank');
  };

  return (
    <div className="max-w-2xl mx-auto text-center py-12">
      <div className="bg-gradient-to-br from-farcaster-purple/20 to-purple-900/20 border border-farcaster-purple/30 rounded-2xl p-8 backdrop-blur-sm">
        <div className="mb-6">
          <div className="w-20 h-20 bg-farcaster-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-farcaster-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-3">Follow Required</h2>
          <p className="text-gray-400 text-lg">
            To use Unfollow Cleaner, please follow @bluexir
          </p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <button
          onClick={handleFollowClick}
          disabled={isChecking}
          className="bg-farcaster-purple hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-105"
        >
          Follow @bluexir
        </button>

        {isChecking && (
          <p className="text-sm text-gray-500 mt-4">
            Checking follow status...
          </p>
        )}
      </div>
    </div>
  );
}
