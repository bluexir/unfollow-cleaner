'use client';

import { useEffect, useState } from 'react';
import ShareCastPopup from './ShareCastPopup';
import TipSection from './TipSection';
import PermissionModal from './PermissionModal';
import sdk from '@farcaster/frame-sdk';

interface NonFollower {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  follower_count: number;
  power_badge: boolean;
  neynar_score: number | null;
}

interface NonFollowersListProps {
  userFid: number;
  signerUuid: string | null;
  onSignerGranted: (uuid: string) => void;
}

export default function NonFollowersList({ userFid, signerUuid, onSignerGranted }: NonFollowersListProps) {
  const [nonFollowers, setNonFollowers] = useState<NonFollower[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isUnfollowing, setIsUnfollowing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [stats, setStats] = useState<{
    following: number;
    followers: number;
    nonFollowersCount: number;
  } | null>(null);

  const [sessionCount, setSessionCount] = useState(0);
  const [showSharePopup, setShowSharePopup] = useState(false);

  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'unfollow' | 'bulk', fids?: number[] } | null>(null);
  
  const [dismissedBanner, setDismissedBanner] = useState(false);

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-gray-500";
    if (score >= 0.8) return "text-green-400";
    if (score >= 0.55) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBadge = (score: number | null) => {
    if (score === null) return "N/A";
    if (score >= 0.8) return "⭐";
    if (score >= 0.55) return "✓";
    return "⚠️";
  };

  useEffect(() => {
    fetchNonFollowers();
  }, [userFid]);

  const fetchNonFollowers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/get-non-followers?fid=${userFid}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Liste yüklenemedi');
      }

      setNonFollowers(data.nonFollowers || []);
      if (data.stats) setStats(data.stats);
      
    } catch (error: any) {
      setError(error.message || 'Liste yüklenirken hata oluştu');
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

  const handleViewProfile = (username: string, fid: number) => {
    try {
      if (typeof sdk !== 'undefined' && sdk.actions?.viewProfile) {
        sdk.actions.viewProfile({ fid });
      } else {
        window.open(`https://warpcast.com/${username}`, '_blank');
      }
    } catch {
      window.open(`https://warpcast.com/${username}`, '_blank');
    }
  };

  const doUnfollow = async (fids: number[]) => {
    if (fids.length === 0) return;
    setIsUnfollowing(true);
    setError(null);

    try {
      const response = await fetch('/api/unfollow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signer_uuid: signerUuid,
          target_fids: fids,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'İşlem başarısız');

      const deletedFids = new Set(fids);
      const remaining = nonFollowers.filter(u => !deletedFids.has(u.fid));
      
      setNonFollowers(remaining);
      if (stats) {
        setStats({
          ...stats,
          following: stats.following - data.unfollowed,
          nonFollowersCount: remaining.length
        });
      }

      setSelectedUsers(new Set());
      setSessionCount(prev => prev + data.unfollowed);
      
    } catch (error: any) {
      setError(error.message || 'Unfollow işlemi başarısız');
    } finally {
      setIsUnfollowing(false);
    }
  };

  const handleUnfollowClick = (fid: number) => {
    if (!signerUuid) {
      setPendingAction({ type: 'unfollow', fids: [fid] });
      setShowPermissionModal(true);
    } else {
      doUnfollow([fid]);
    }
  };

  const handleBulkUnfollowClick = () => {
    if (selectedUsers.size === 0) return;
    const fids = Array.from(selectedUsers);
    if (!signerUuid) {
      setPendingAction({ type: 'bulk', fids });
      setShowPermissionModal(true);
    } else {
      doUnfollow(fids);
    }
  };

  const handlePermissionGranted = (uuid: string) => {
    setShowPermissionModal(false);
    onSignerGranted(uuid);
    if (pendingAction?.fids) {
      doUnfollow(pendingAction.fids);
    }
    setPendingAction(null);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
        <p className="text-sm font-mono text-gray-400 tracking-wider animate-pulse">ANALYZING DATA...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-red-500/10 to-red-900/10 border border-red-500/30 p-8 rounded-2xl text-center backdrop-blur-sm shadow-xl">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <p className="text-red-400 font-bold mb-2">ERROR</p>
        <p className="text-white mb-4">{error}</p>
        <button 
          onClick={fetchNonFollowers} 
          className="px-6 py-3 bg-red-600/30 hover:bg-red-600/50 text-red-200 rounded-xl border border-red-500/30 transition-all active:scale-95 font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative min-h-screen pb-32">
      
      {!signerUuid && !dismissedBanner && nonFollowers.length > 0 && (
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-6 flex items-center justify-between backdrop-blur-sm shadow-lg shadow-purple-500/10">
          <div className="flex items-center gap-4">
            <span className="text-3xl">⚡</span>
            <div>
              <p className="text-white font-bold text-lg">Grant Permission for One-Tap Clean</p>
              <p className="text-gray-400 text-sm">Or manually unfollow by clicking each person</p>
            </div>
          </div>
          <button 
            onClick={() => setDismissedBanner(true)} 
            className="text-gray-400 hover:text-white text-3xl leading-none px-3 transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-3 gap-px bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/20 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl shadow-purple-900/20">
          <div className="bg-black/60 p-8 flex flex-col items-center justify-center hover:bg-black/80 transition-colors">
            <span className="text-xs font-mono text-purple-400 uppercase tracking-widest mb-2">FOLLOWING</span>
            <span className="text-3xl font-bold text-white font-mono">{stats.following}</span>
          </div>
          <div className="bg-black/60 p-8 flex flex-col items-center justify-center hover:bg-black/80 transition-colors">
            <span className="text-xs font-mono text-green-400 uppercase tracking-widest mb-2">FOLLOWERS</span>
            <span className="text-3xl font-bold text-green-400 font-mono">{stats.followers}</span>
          </div>
          <div className="bg-black/60 p-8 flex flex-col items-center justify-center relative overflow-hidden group hover:bg-black/80 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-br from-red-900/30 to-pink-900/30 group-hover:from-red-900/40 group-hover:to-pink-900/40 transition-colors"></div>
            <span className="text-xs font-mono text-red-400 uppercase tracking-widest mb-2 z-10">NON-FOLLOWERS</span>
            <span className="text-4xl font-bold text-red-500 font-mono z-10">{stats.nonFollowersCount}</span>
          </div>
        </div>
      )}

      {nonFollowers.length > 0 ? (
        <>
          <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-purple-500/20 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Detected Accounts</h2>
              <p className="text-sm text-gray-500 mt-1">These people don't follow you back.</p>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className={`w-6 h-6 border-2 rounded-md flex items-center justify-center transition-all ${selectedUsers.size === nonFollowers.length ? 'bg-purple-500 border-purple-500' : 'border-gray-600 group-hover:border-purple-400'}`}>
                  {selectedUsers.size === nonFollowers.length && (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    </svg>
                  )}
                </div>
                <input 
                  type="checkbox" 
                  className="hidden" 
                  onChange={toggleSelectAll} 
                  checked={selectedUsers.size === nonFollowers.length} 
                />
                <span className="text-sm font-semibold text-gray-400 group-hover:text-white transition-colors">Select All</span>
              </label>
              {selectedUsers.size > 0 && (
                <button 
                  onClick={handleBulkUnfollowClick} 
                  disabled={isUnfollowing} 
                  className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-red-500/30 transition-all active:scale-95 flex items-center gap-3"
                >
                  {isUnfollowing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span className="animate-pulse">CLEANING...</span>
                    </>
                  ) : (
                    <>
                      <span className="font-mono text-lg">CLEAN</span>
                      <span className="bg-black/30 px-2 py-1 rounded-lg text-sm font-bold">{selectedUsers.size}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nonFollowers.map((user) => (
              <div 
                key={user.fid} 
                className={`group relative p-5 rounded-2xl border transition-all duration-200 flex items-center gap-4 ${
                  selectedUsers.has(user.fid) 
                    ? 'bg-gradient-to-br from-red-900/20 to-pink-900/20 border-red-500/50 shadow-lg shadow-red-500/10' 
                    : 'bg-black/40 border-purple-500/10 hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/10'
                }`}
              >
                <div 
                  onClick={() => toggleUser(user.fid)} 
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-all ${
                    selectedUsers.has(user.fid) 
                      ? 'bg-red-500 border-red-500' 
                      : 'border-gray-600 hover:border-purple-400'
                  }`}
                >
                  {selectedUsers.has(user.fid) && (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                    </svg>
                  )}
                </div>
                
                <img 
                  src={user.pfp_url || 'https://warpcast.com/avatar.png'} 
                  alt={user.username} 
                  className="w-14 h-14 rounded-xl object-cover bg-gray-800 border border-purple-500/20" 
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-white truncate text-lg">{user.display_name}</span>
                    {user.power_badge && (
                      <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-lg border border-purple-500/30 font-bold">⚡️</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 truncate font-mono mb-3">@{user.username}</div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleViewProfile(user.username, user.fid)} 
                      className="text-xs bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 px-3 py-1.5 rounded-lg border border-purple-500/30 transition-all active:scale-95 font-semibold"
                    >
                      👁️ View
                    </button>
                    <button 
                      onClick={() => handleUnfollowClick(user.fid)} 
                      disabled={isUnfollowing} 
                      className="text-xs bg-red-600/20 hover:bg-red-600/30 disabled:bg-gray-800 text-red-400 disabled:text-gray-500 px-3 py-1.5 rounded-lg border border-red-500/30 disabled:border-gray-700 transition-all active:scale-95 font-semibold"
                    >
                      🗑️ Unfollow
                    </button>
                  </div>
                </div>
                
                <div className="text-right space-y-2">
                  {user.neynar_score !== null && (
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-sm">{getScoreBadge(user.neynar_score)}</span>
                      <span className={`text-sm font-bold ${getScoreColor(user.neynar_score)}`}>
                        {user.neynar_score.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Followers</div>
                    <div className="text-base font-mono text-gray-300 font-bold">{user.follower_count.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-32 bg-gradient-to-br from-green-900/10 to-green-500/10 rounded-3xl border-2 border-green-500/20 border-dashed">
          <div className="w-24 h-24 bg-gradient-to-br from-green-500/20 to-green-400/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
            <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-3xl font-bold text-white mb-3">All Clean!</h3>
          <p className="text-gray-400 text-lg">Everyone you follow follows you back.</p>
        </div>
      )}

      <TipSection />

      {sessionCount > 0 && (
        <div className="fixed bottom-8 right-8 z-50 animate-bounce-in">
          <div className="bg-gradient-to-r from-black to-gray-900 border-2 border-purple-500/50 shadow-2xl rounded-2xl pl-8 pr-3 py-3 flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-purple-400 font-bold tracking-widest">This Session</span>
              <span className="text-base text-white font-mono">
                <span className="text-red-500 font-bold text-2xl">{sessionCount}</span> CLEANED
              </span>
            </div>
            <button 
              onClick={() => setShowSharePopup(true)} 
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 px-8 rounded-xl text-base flex items-center gap-2 shadow-lg shadow-purple-500/30 transition-all active:scale-95"
            >
              <span>SHARE</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {showSharePopup && <ShareCastPopup unfollowCount={sessionCount} onClose={() => setShowSharePopup(false)} />}
      {showPermissionModal && (
        <PermissionModal 
          userFid={userFid} 
          onPermissionGranted={handlePermissionGranted} 
          onClose={() => { 
            setShowPermissionModal(false); 
            setPendingAction(null); 
          }} 
        />
      )}
    </div>
  );
}
