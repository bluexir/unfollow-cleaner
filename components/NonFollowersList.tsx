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
}

export default function NonFollowersList({ userFid, signerUuid }: NonFollowersListProps) {
  // --- STATE YÖNETİMİ ---
  const [nonFollowers, setNonFollowers] = useState<NonFollower[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isUnfollowing, setIsUnfollowing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // İstatistikler
  const [stats, setStats] = useState<{
    following: number;
    followers: number;
    nonFollowersCount: number;
  } | null>(null);

  // Canlı Sayaç
  const [sessionCount, setSessionCount] = useState(0);
  const [showSharePopup, setShowSharePopup] = useState(false);

  // Permission Modal
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'unfollow' | 'bulk', fids?: number[] } | null>(null);
  
  // Dismissable Banner
  const [dismissedBanner, setDismissedBanner] = useState(false);

  // SCORE RENK MANTIKLARI
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

  // --- VERİ ÇEKME (Mantık Güncellendi) ---
  useEffect(() => {
    fetchNonFollowers();
  }, [userFid]);

  const fetchNonFollowers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/get-non-followers?fid=${userFid}`);
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      // API zaten sıralı gönderiyor
      setNonFollowers(data.nonFollowers || []);
      if (data.stats) setStats(data.stats);
    } catch (error: any) {
      setError(error.message || 'Liste yüklenirken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- SEÇİM MANTIKLARI (Aynı) ---
  const toggleSelectAll = () => {
    if (selectedUsers.size === nonFollowers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(nonFollowers.map(u => u.fid)));
    }
  };

  const toggleUser = (fid: number) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(fid)) newSelected.delete(fid);
    else newSelected.add(fid);
    setSelectedUsers(newSelected);
  };

  // --- PROFİL GÖRÜNTÜLEME (Aynı) ---
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

  // --- UNFOLLOW İŞLEMİ (Mantık Güncellendi) ---
  const doUnfollow = async (fids: number[]) => {
    if (fids.length === 0) return;
    setIsUnfollowing(true);
    setError(null);

    try {
      // YENİ MANTIK: Tek seferde paket gönderim
      const response = await fetch('/api/unfollow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signer_uuid: signerUuid,
          target_fids: fids, // Dizi olarak gönderiyoruz
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'İşlem başarısız');

      // PERFORMANS: Hızlı liste güncelleme
      const deletedFids = new Set(fids);
      const remaining = nonFollowers.filter(u => !deletedFids.has(u.fid));
      
      setNonFollowers(remaining);
      if (stats) {
        setStats({
          ...stats,
          following: stats.following - fids.length,
          nonFollowersCount: remaining.length
        });
      }

      setSelectedUsers(new Set());
      setSessionCount(prev => prev + fids.length);
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
    if (pendingAction?.fids) {
      doUnfollow(pendingAction.fids);
    }
    setPendingAction(null);
  };

  // --- RENDER (SENİN ORİJİNAL TASARIMIN - DEĞİŞMEDİ) ---
  if (isLoading) {
    return (
      <div data-testid="nonfollowers-loading" className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
        <p className="text-sm font-mono text-gray-400 animate-pulse">VERİ ANALİZ EDİLİYOR...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="nonfollowers-error" className="bg-red-500/10 border border-red-500/50 p-6 rounded-lg text-center backdrop-blur-sm">
        <p className="text-red-400 font-mono mb-2">SYSTEM ERROR</p>
        <p className="text-white">{error}</p>
        <button 
          data-testid="nonfollowers-retry-button"
          onClick={fetchNonFollowers} 
          className="mt-4 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-200 rounded border border-red-500/30 transition-all"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div data-testid="nonfollowers-screen" className="space-y-8 relative min-h-screen pb-24 animate-fade-up">
      
      {/* PERMISSION BANNER */}
      {!signerUuid && !dismissedBanner && nonFollowers.length > 0 && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="text-white font-semibold">Tek tuşla temizlemek için izin ver</p>
              <p className="text-gray-400 text-sm">Veya her kişiye tıklayarak manuel unfollow yap</p>
            </div>
          </div>
          <button onClick={() => setDismissedBanner(true)} className="text-gray-400 hover:text-white text-2xl leading-none px-2">×</button>
        </div>
      )}

      {/* 1. İSTATİSTİKLER */}
      {stats && (
        <div className="grid grid-cols-3 gap-px bg-gray-800/50 border border-gray-800 rounded-xl overflow-hidden backdrop-blur-md">
          <div className="bg-black/80 p-6 flex flex-col items-center justify-center hover:bg-white/5 transition-colors">
            <span className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">FOLLOWING</span>
            <span className="text-2xl font-bold text-white font-mono">{stats.following}</span>
          </div>
          <div className="bg-black/80 p-6 flex flex-col items-center justify-center hover:bg-white/5 transition-colors">
            <span className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-1">FOLLOWERS</span>
            <span className="text-2xl font-bold text-green-400 font-mono">{stats.followers}</span>
          </div>
          <div className="bg-black/80 p-6 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-red-900/20 group-hover:bg-red-900/30 transition-colors"></div>
            <span className="text-xs font-mono text-red-400 uppercase tracking-widest mb-1 z-10">GHOSTS</span>
            <span className="text-3xl font-bold text-red-500 font-mono z-10">{stats.nonFollowersCount}</span>
          </div>
        </div>
      )}

      {/* 2. LİSTE BAŞLIĞI */}
      {nonFollowers.length > 0 ? (
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-gray-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Tespit Edilen Hesaplar</h2>
            <p className="text-sm text-gray-500 mt-1">Bu kişiler seni takip etmiyor.</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className={`w-5 h-5 border rounded flex items-center justify-center transition-colors ${selectedUsers.size === nonFollowers.length ? 'bg-white border-white' : 'border-gray-600 group-hover:border-gray-400'}`}>
                {selectedUsers.size === nonFollowers.length && <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}
              </div>
              <input 
                data-testid="nonfollowers-select-all-checkbox"
                type="checkbox" className="hidden" onChange={toggleSelectAll} checked={selectedUsers.size === nonFollowers.length} 
              />
              <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors">Tümünü Seç</span>
            </label>
            {selectedUsers.size > 0 && (
              <button 
                data-testid="nonfollowers-unfollow-button"
                onClick={handleBulkUnfollowClick} disabled={isUnfollowing} className="bg-red-600 hover:bg-red-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold py-2 px-6 rounded-lg shadow-[0_0_20px_rgba(220,38,38,0.3)] transition-all flex items-center gap-2"
              >
                {isUnfollowing ? <span className="animate-pulse">TEMİZLENİYOR...</span> : <><span className="font-mono">TEMİZLE</span><span className="bg-black/20 px-2 py-0.5 rounded text-sm">{selectedUsers.size}</span></>}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-24 bg-gray-900/30 rounded-2xl border border-gray-800 border-dashed">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Her Şey Tertemiz!</h3>
        </div>
      )}

      {/* 3. KULLANICI LİSTESİ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {nonFollowers.map((user) => (
          <div 
            data-testid={`nonfollowers-user-row-${user.fid}`}
            key={user.fid} className={`group relative p-4 rounded-xl border transition-all duration-200 flex items-center gap-4 ${selectedUsers.has(user.fid) ? 'bg-red-900/10 border-red-500/50' : 'bg-black/40 border-gray-800 hover:border-gray-600'}`}
          >
            <div onClick={() => toggleUser(user.fid)} className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 cursor-pointer ${selectedUsers.has(user.fid) ? 'bg-red-500 border-red-500' : 'border-gray-600 bg-transparent'}`}>
              {selectedUsers.has(user.fid) && <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>}
            </div>
            <img src={user.pfp_url || 'https://warpcast.com/avatar.png'} alt={user.username} className="w-12 h-12 rounded-lg object-cover bg-gray-800" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white truncate">{user.display_name}</span>
                {user.power_badge && <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded border border-purple-500/30">⚡️</span>}
              </div>
              <div className="text-sm text-gray-500 truncate font-mono">@{user.username}</div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => handleViewProfile(user.username, user.fid)} className="text-xs bg-gray-700/50 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded">👁️ Profil</button>
                <button onClick={() => handleUnfollowClick(user.fid)} disabled={isUnfollowing} className="text-xs bg-red-600/50 hover:bg-red-600 disabled:bg-gray-800 text-white px-3 py-1 rounded">🗑️ Unfollow</button>
              </div>
            </div>
            <div className="text-right space-y-1">
              {user.neynar_score !== null && (
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-xs">{getScoreBadge(user.neynar_score)}</span>
                  <span className={`text-xs font-bold ${getScoreColor(user.neynar_score)}`}>{user.neynar_score.toFixed(2)}</span>
                </div>
              )}
              <div>
                <div className="text-xs text-gray-500 uppercase">Takipçi</div>
                <div className="text-sm font-mono text-gray-300">{user.follower_count.toLocaleString()}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <TipSection />

      {/* 5. CANLI SAYAÇ */}
      {sessionCount > 0 && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-in">
          <div className="bg-black border border-gray-700 shadow-2xl rounded-full pl-6 pr-2 py-2 flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Bu Oturumda</span>
              <span className="text-sm text-white font-mono"><span className="text-red-500 font-bold text-lg">{sessionCount}</span> KİŞİ SİLİNDİ</span>
            </div>
            <button 
              data-testid="session-share-button"
              onClick={() => setShowSharePopup(true)} className="bg-white text-black hover:bg-gray-200 font-bold py-2 px-6 rounded-full text-sm flex items-center gap-2"
            >
              <span>PAYLAŞ</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
            </button>
          </div>
        </div>
      )}

      {showSharePopup && <ShareCastPopup unfollowCount={sessionCount} onClose={() => setShowSharePopup(false)} />}
      {showPermissionModal && <PermissionModal userFid={userFid} onPermissionGranted={handlePermissionGranted} onClose={() => { setShowPermissionModal(false); setPendingAction(null); }} />}
    </div>
  );
}
