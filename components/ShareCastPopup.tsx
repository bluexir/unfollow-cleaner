```
'use client';

import { useState } from 'react';

interface ShareCastPopupProps {
  unfollowCount: number;
  onClose: () => void;
}

export default function ShareCastPopup({ unfollowCount, onClose }: ShareCastPopupProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = () => {
    setIsSharing(true);
    const text = `I just unfollowed ${unfollowCount} people who don't follow me back! Clean up your Farcaster with Unfollow Cleaner 🧹`;
    const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=https://unfollow-cleaner.vercel.app`;
    
    window.open(shareUrl, '_blank');
    
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-farcaster-dark border border-gray-700 rounded-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-2">Successfully Unfollowed!</h3>
          <p className="text-gray-400">
            You've unfollowed {unfollowCount} {unfollowCount === 1 ? 'user' : 'users'}
          </p>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-300">
            "I just unfollowed {unfollowCount} people who don't follow me back! Clean up your Farcaster with Unfollow Cleaner 🧹"
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="flex-1 bg-farcaster-purple hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
          >
            {isSharing ? 'Opening...' : 'Share Cast'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
} 
```
