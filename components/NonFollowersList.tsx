'use client';

import { useEffect, useState } from 'react';
import ShareCastPopup from './ShareCastPopup.tsx';

interface NonFollower {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  follower_count: number;
}

interface NonFollowersListProps {
  userFid: number;
  signerUuid: string;
}

export default function NonFollowersList({ userFid, signerUuid }: NonFollowersListProps) {
  const [nonFollowers, setNonFollowers] = useState<NonFollower[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isUnfollowing, setIsUnfollowing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [unfollowCount, setUnfollowCount] = useState(0);

  useEffect(() => {
    fetchNonFollowers();
  }, [userFid]);

  const fetchNonFollowers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/get-non-followers?fid=${userFid}`);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const sorted = data.nonFollowers.sort((a: NonFollower, b: NonFollower) => 
        a.follower_count - b.follower_count
      );

      setNonFollowers(sorted);
    } catch (error: any) {
      setError(error.message || 'Failed to load non-followers');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === nonFollowers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(nonFollowers.map(u => u.fid)));
    }
  };

  const toggleUser = (fid: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(fid)) {
      newSelected.delete(fid);
    } else {
      newSelected.add(fid);
    }
    setSelectedUsers(newSelected);
  };

  const handleUnfollow = async () => {
    if (selectedUsers.size === 0) return;

    setIsUnfollowing(true);
    setError(null);

    try {
      const response = await fetch('/api/unfollow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signer_uuid: signerUuid,
          target_fids: Array.from(selectedUsers),
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setUnfollowCount(selectedUsers.size);
      
      const remaining = nonFollowers.filter(u => !selectedUsers.has(u.fid));
      setNonFollowers(remaining);
      setSelectedUsers(new Set());
      
      setShowSharePopup(true);
    } catch (error: any) {
      setError(error.message || 'Failed to unfollow users');
    } finally {
      setIsUnfollowing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-farcaster-purple mx-auto mb-4"></div>
        <p className="text-gray-400">Loading non-followers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/50 border border-red-700 text-red-200 px-6 py-4 rounded-lg">
        {error}
      </div>
    );
  }

  if (nonFollowers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold mb-2">All Clean!</h3>
        <p className="text-gray-400">
          Everyone you follow follows you back 🎉
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">
            Non-Followers ({nonFollowers.length})
          </h2>
          {selectedUsers.size > 0 && (
            <button
              onClick={handleUnfollow}
              disabled={isUnfollowing}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-all duration-200"
            >
              {isUnfollowing ? 'Unfollowing...' : `Unfollow Selected (${selectedUsers.size})`}
            </button>
          )}
        </div>

        <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-200">
            💡 To avoid spam restrictions, unfollow 5-10 users at a time
          </p>
        </div>

        <div className="bg-farcaster-dark border border-gray-700 rounded-lg p-4 mb-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedUsers.size === nonFollowers.length}
              onChange={toggleSelectAll}
              className="w-5 h-5 rounded border-gray-600 text-farcaster-purple focus:ring-farcaster-purple"
            />
            <span className="font-medium">Select All</span>
          </label>
        </div>

        <div className="space-y-3">
          {nonFollowers.map((user) => (
            <div
              key={user.fid}
              className="bg-farcaster-dark border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors duration-200"
            >
              <label className="flex items-center gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedUsers.has(user.fid)}
                  onChange={() => toggleUser(user.fid)}
                  className="w-5 h-5 rounded border-gray-600 text-farcaster-purple focus:ring-farcaster-purple"
                />
                <img
                  src={user.pfp_url || '/default-avatar.png'}
                  alt={user.username}
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1">
                  <div className="font-medium">{user.display_name}</div>
                  <div className="text-sm text-gray-400">@{user.username}</div>
                </div>
                <div className="text-sm text-gray-500">
                  {user.follower_count} followers
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>

      {showSharePopup && (
        <ShareCastPopup
          unfollowCount={unfollowCount}
          onClose={() => setShowSharePopup(false)}
        />
      )}
    </>
  );
}
