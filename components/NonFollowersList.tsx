'use client';

import { useState, useEffect } from 'react';
import { NonFollower } from '@/lib/types';

interface NonFollowersListProps {
  userFid: number;
  signerUuid: string;
}

export default function NonFollowersList({ userFid, signerUuid }: NonFollowersListProps) {
  const [nonFollowers, setNonFollowers] = useState<NonFollower[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnfollowing, setIsUnfollowing] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [unfollowProgress, setUnfollowProgress] = useState<string>('');

  useEffect(() => {
    fetchNonFollowers();
  }, [userFid]);

  const fetchNonFollowers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/get-non-followers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid: userFid }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setNonFollowers(data.nonFollowers);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to fetch non-followers:', error);
      alert('Failed to load non-followers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = (fid: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(fid)) {
      newSelected.delete(fid);
    } else {
      newSelected.add(fid);
    }
    setSelectedUsers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === nonFollowers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(nonFollowers.map(u => u.fid)));
    }
  };

  const handleUnfollow = async (fids: number[]) => {
    if (fids.length === 0) return;

    if (!confirm(`Are you sure you want to unfollow ${fids.length} user(s)?`)) {
      return;
    }

    // Limit to 50 users per batch
    if (fids.length > 50) {
      alert('You can only unfollow up to 50 users at once. Please select fewer users.');
      return;
    }

    setIsUnfollowing(true);
    setUnfollowProgress(`Unfollowing ${fids.length} user(s)...`);

    try {
      const response = await fetch('/api/unfollow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signerUuid, targetFids: fids }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        
        // Remove unfollowed users from the list
        setNonFollowers(prev => prev.filter(u => !fids.includes(u.fid) || data.failed.includes(u.fid)));
        setSelectedUsers(new Set());
        setUnfollowProgress('');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to unfollow:', error);
      alert('Failed to unfollow users. Please try again.');
    } finally {
      setIsUnfollowing(false);
      setUnfollowProgress('');
    }
  };

  const handleBulkUnfollow = () => {
    handleUnfollow(Array.from(selectedUsers));
  };

  const shareOnFarcaster = () => {
    const text = encodeURIComponent(
      `I just cleaned up my Farcaster following list with Unfollow Cleaner! 🧹\n\nRemoved ${selectedUsers.size} non-followers.\n\nTry it: https://unfollow-cleaner.vercel.app`
    );
    window.open(`https://warpcast.com/~/compose?text=${text}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-farcaster-purple mx-auto mb-4"></div>
          <p className="text-gray-400">Loading non-followers...</p>
        </div>
      </div>
    );
  }

  if (nonFollowers.length === 0) {
    return (
      <div className="text-center py-20">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-xl font-bold mb-2">All Clean! 🎉</h3>
        <p className="text-gray-400">Everyone you follow also follows you back.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with bulk actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-farcaster-dark border border-gray-700 rounded-lg p-4">
        <div>
          <h2 className="text-xl font-bold mb-1">
            Non-Followers ({nonFollowers.length})
          </h2>
          <p className="text-sm text-gray-400">
            Users you follow who don't follow you back
          </p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleSelectAll}
            className="flex-1 sm:flex-none bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            {selectedUsers.size === nonFollowers.length ? 'Deselect All' : 'Select All'}
          </button>
          
          {selectedUsers.size > 0 && (
            <button
              onClick={handleBulkUnfollow}
              disabled={isUnfollowing}
              className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              {isUnfollowing ? 'Unfollowing...' : `Unfollow (${selectedUsers.size})`}
            </button>
          )}
        </div>
      </div>

      {/* Progress indicator */}
      {unfollowProgress && (
        <div className="bg-farcaster-purple bg-opacity-20 border border-farcaster-purple rounded-lg p-4 text-center">
          <p className="text-farcaster-purple font-medium">{unfollowProgress}</p>
        </div>
      )}

      {/* User list */}
      <div className="space-y-3">
        {nonFollowers.map((user) => (
          <div
            key={user.fid}
            className="bg-farcaster-dark border border-gray-700 rounded-lg p-4 hover:border-farcaster-purple transition-colors duration-200"
          >
            <div className="flex items-start gap-4">
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={selectedUsers.has(user.fid)}
                onChange={() => handleSelectUser(user.fid)}
                className="mt-1 w-5 h-5 rounded border-gray-600 text-farcaster-purple focus:ring-farcaster-purple focus:ring-offset-0"
              />

              {/* Avatar */}
              <img
                src={user.pfp_url}
                alt={user.username}
                className="w-12 h-12 rounded-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48';
                }}
              />

              {/* User info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold truncate">{user.display_name}</h3>
                  <span className="text-gray-400 text-sm">@{user.username}</span>
                </div>
                
                {user.profile.bio.text && (
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {user.profile.bio.text}
                  </p>
                )}
                
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>{user.follower_count} followers</span>
                  <span>{user.following_count} following</span>
                </div>
              </div>

              {/* Unfollow button */}
              <button
                onClick={() => handleUnfollow([user.fid])}
                disabled={isUnfollowing}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 whitespace-nowrap"
              >
                Unfollow
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Share button */}
      <div className="text-center pt-6">
        <button
          onClick={shareOnFarcaster}
          className="bg-farcaster-purple hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
        >
          Share on Farcaster
        </button>
      </div>
    </div>
  );
}
