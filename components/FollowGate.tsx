'use client';

import { useState, useEffect } from 'react';

interface FollowGateProps {
  userFid: number;
  onFollowVerified: () => void;
}

export default function FollowGate({ userFid, onFollowVerified }: FollowGateProps) {
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkFollow = async () => {
      if (userFid === 429973) {
        onFollowVerified();
        return;
      }

      try {
        const response = await fetch(`/api/check-follow?fid=${userFid}`);
        const data = await response.json();
        
        if (data.isFollowing) {
          onFollowVerified();
        } else {
          setIsFollowing(false);
        }
      } catch (error) {
        console.error('Follow check error:', error);
        setIsFollowing(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkFollow();
  }, [userFid, onFollowVerified]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-farcaster-purple"></div>
      </div>
    );
  }

  if (isFollowing === false) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Follow Required</h2>
        <p className="text-gray-400 mb-6">To use this app please follow bluexir on Farcaster</p>
        <a href="https://warpcast.com/bluexir" target="_blank" rel="noopener noreferrer" className="inline-block bg-farcaster-purple hover:bg-purple-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200">
          Follow bluexir
        </a>
      </div>
    );
  }

  return null;
}
