'use client';

import { useState } from 'react';

const PRESET_AMOUNTS = [
  { label: '$1', eth: '0.0003' },
  { label: '$2', eth: '0.0006' },
  { label: '$3', eth: '0.001' },
];

export default function TipSection() {
  const [customAmount, setCustomAmount] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const handleTip = (ethAmount: string) => {
    // Open Warpcast wallet with deep link
    const warpcastUrl = `https://warpcast.com/~/wallet?amount=${ethAmount}&token=ETH&recipient=bluexir`;
    window.open(warpcastUrl, '_blank');
  };

  const handleCustomTip = () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    handleTip(customAmount);
  };

  return (
    <div className="mt-12 bg-farcaster-dark border border-gray-700 rounded-lg p-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold mb-2">Support the Developer</h3>
        <p className="text-gray-400 text-sm">
          If you find this tool helpful, consider sending a tip! ☕️
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3 mb-4">
        {PRESET_AMOUNTS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handleTip(preset.eth)}
            className="bg-farcaster-purple hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
          >
            {preset.label} ({preset.eth} ETH)
          </button>
        ))}
      </div>

      <div className="text-center">
        {!showCustom ? (
          <button
            onClick={() => setShowCustom(true)}
            className="text-farcaster-purple hover:text-purple-400 text-sm font-medium"
          >
            Send custom amount →
          </button>
        ) : (
          <div className="flex justify-center gap-2">
            <input
              type="number"
              step="0.0001"
              min="0"
              placeholder="Amount in ETH"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-farcaster-purple w-40"
            />
            <button
              onClick={handleCustomTip}
              className="bg-farcaster-purple hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Send
            </button>
            <button
              onClick={() => {
                setShowCustom(false);
                setCustomAmount('');
              }}
              className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 text-center mt-4">
        Tips are sent via Warpcast wallet on Base network
      </p>
    </div>
  );
}
