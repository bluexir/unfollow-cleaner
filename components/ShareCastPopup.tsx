'use client';

import { useState } from 'react';
import sdk from '@farcaster/frame-sdk';

interface ShareCastPopupProps {
  unfollowCount?: number; // Unfollow sonrası için
  ghostCount?: number; // Ghost bulunca için
  onClose: () => void;
}

export default function ShareCastPopup({ unfollowCount, ghostCount, onClose }: ShareCastPopupProps) {
  const [isSharing, setIsSharing] = useState(false);

  // Share type: ghost bulma veya unfollow
  const isGhostShare = ghostCount !== undefined && ghostCount > 0;
  const count = isGhostShare ? ghostCount : (unfollowCount || 0);

  const handleShare = async () => {
    setIsSharing(true);
    
    // Paylaşım mesajı
    const text = isGhostShare
      ? `I found ${count} ghost${count === 1 ? '' : 's'} on Farcaster! 👻 Who doesn't follow me back? Clean yours with Unfollow Cleaner 🧹`
      : `I just unfollowed ${count} ghost${count === 1 ? '' : 's'} who don't follow me back! 🧹 Clean up your Farcaster with Unfollow Cleaner`;
    
    try {
      // Farcaster Mini App içinde composer aç (yeni sekme YOK!)
      if (typeof sdk !== 'undefined' && sdk.actions?.composeCast) {
        await sdk.actions.composeCast({
          text: text,
          embeds: [window.location.origin]
        });
      } else {
        // Fallback: Web browser için
        const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${window.location.origin}`;
        window.open(shareUrl, '_blank');
      }
    } catch (error) {
      console.error('[SHARE] Error:', error);
      // Fallback
      const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${window.location.origin}`;
      window.open(shareUrl, '_blank');
    }
    
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div data-testid="sharecast-modal" className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-[#1c1f2e] to-[#151823] border border-purple-500/20 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-purple-900/20">
        <div className="text-center mb-6">
          <div className={`w-20 h-20 ${isGhostShare ? 'bg-purple-500/20' : 'bg-green-500/20'} rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg`}>
            {isGhostShare ? (
              <span className="text-5xl">👻</span>
            ) : (
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          
          <h3 className="text-2xl font-bold text-white mb-2">
            {isGhostShare ? 'Ghosts Detected!' : 'Successfully Unfollowed!'}
          </h3>
          
          <p className="text-gray-400">
            {isGhostShare 
              ? `You have ${count} ghost${count === 1 ? '' : 's'} who don't follow you back`
              : `You've unfollowed ${count} ghost${count === 1 ? '' : 's'}`
            }
          </p>
        </div>

        <div className="bg-black/40 border border-purple-500/20 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-300 leading-relaxed">
            {isGhostShare
              ? `"I found ${count} ghost${count === 1 ? '' : 's'} on Farcaster! 👻 Clean yours with Unfollow Cleaner 🧹"`
              : `"I just unfollowed ${count} ghost${count === 1 ? '' : 's'} who don't follow me back! 🧹"`
            }
          </p>
        </div>

        <div className="flex gap-3">
          <button
            data-testid="sharecast-share-button"
            onClick={handleShare}
            disabled={isSharing}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-gray-800 disabled:to-gray-800 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-purple-500/30 active:scale-95"
          >
            {isSharing ? 'Opening...' : 'Share Cast'}
          </button>
          <button
            data-testid="sharecast-skip-button"
            onClick={onClose}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-95"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
