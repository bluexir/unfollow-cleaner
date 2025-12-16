'use client';

import { useEffect, useState } from 'react';

interface FollowGateProps {
  userFid: number;
  onFollowVerified: () => void;
}

export default function FollowGate({ userFid, onFollowVerified }: FollowGateProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  const checkFollowStatus = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/check-follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid: userFid }),
      });

      const data = await response.json();
      
      if (data.isFollowing) {
        setIsFollowing(true);
        onFollowVerified();
      } else {
        setIsFollowing(false);
      }
    } catch (error) {
      console.error('Failed to check follow status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkFollowStatus();
  }, [userFid]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-farcaster-purple mx-auto mb-4"></div>
          <p className="text-gray-400">Checking follow status...</p>
        </div>
      </div>
    );
  }

  if (isFollowing) {
    return null; // User is following, allow access
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-farcaster-dark border border-gray-700 rounded-lg p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-farcaster-purple"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <h2 className="text-2xl font-bold mb-2">Follow Required</h2>
          <p className="text-gray-400 mb-6">
            To use this tool, you must follow{' '}
            <span className="text-farcaster-purple font-semibold">@bluexir</span> on
            Farcaster. This ensures community support and helps maintain the service.
          </p>
        </div>

        <a
          href="https://warpcast.com/bluexir"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-farcaster-purple hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg inline-block mb-4 transition-colors duration-200"
        >
          Follow @bluexir
        </a>

        <button
          onClick={checkFollowStatus}
          className="block w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          I've Followed - Check Again
        </button>
      </div>
    </div>
  );
}
