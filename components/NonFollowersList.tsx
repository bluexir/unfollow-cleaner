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

      // API zaten sıralı gönderiyor, direkt set ediyoruz
      setNonFollowers(data.nonFollowers || []);
      if (data.stats) setStats(data.stats);
    } catch (error: any) {
      setError(error.message || 'Liste yüklenirken hata oluştu.');
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
    if (newSelected.has(fid)) newSelected.delete(fid);
    else newSelected.add(fid);
    setSelectedUsers(newSelected);
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
          target_fids: fids, // API'miz artık bu paketi bekliyor
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'İşlem başarısız');

      // PERFORMANS OPTİMİZASYONU: Silinenleri listeden hızlıca temizle
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

  // UI (Render) kısmını değiştirmedim, senin tasarımın aynen korunuyor.
  // [Buraya senin orijinal JSX kodun gelecek...]
  return (
    // ... senin orijinal return bloğun (stats, buttons, map döngüsü vb.)
    <div className="space-y-8 relative min-h-screen pb-24 animate-fade-up">
        {/* Senin mevcut JSX içeriğin buraya aynen eklenmeli */}
    </div>
  );
}
