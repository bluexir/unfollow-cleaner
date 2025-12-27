'use client';

import { useState } from 'react';
import { parseEther, parseUnits } from 'viem';
import { useSendTransaction, useWriteContract, useAccount, useConnect } from 'wagmi';
import { injected } from 'wagmi/connectors';

// 🚨 SENİN CÜZDAN ADRESİN (Otomatik Eklendi)
const RECIPIENT_ADDRESS = "0xaDBd1712D5c6e2A4D7e08F50a9586d3C054E30c8"; 

// Base Mainnet Token Adresleri
const TOKENS = {
  DEGEN: "0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed", 
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
};

// Basit Transfer Kontratı (ABI)
const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ type: 'bool' }]
  }
];

type Currency = 'ETH' | 'DEGEN' | 'USDC';

export default function TipSection() {
  const { isConnected } = useAccount();
  const { connect } = useConnect();
  const { sendTransaction } = useSendTransaction();
  const { writeContract } = useWriteContract();

  const [currency, setCurrency] = useState<Currency>('ETH');
  const [customAmount, setCustomAmount] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  // Hazır Buton Ayarları
  const presets = {
    ETH: [
      { label: '☕️', amount: '0.001', value: '~$3' },
      { label: '🍔', amount: '0.003', value: '~$10' },
      { label: '🚀', amount: '0.005', value: '~$18' },
    ],
    DEGEN: [
      { label: '🎩', amount: '200', value: 'DEGEN' },
      { label: '🎩', amount: '500', value: 'DEGEN' },
      { label: '🎩', amount: '1000', value: 'DEGEN' },
    ],
    USDC: [
      { label: '💵', amount: '1', value: 'USDC' },
      { label: '💵', amount: '5', value: 'USDC' },
      { label: '💵', amount: '10', value: 'USDC' },
    ]
  };

  const handleTip = (amountStr: string) => {
    if (!isConnected) {
      connect({ connector: injected() });
      return;
    }

    setStatus('pending');

    try {
      if (currency === 'ETH') {
        sendTransaction({
          to: RECIPIENT_ADDRESS,
          value: parseEther(amountStr)
        }, {
          onSuccess: () => { setStatus('success'); setTimeout(() => setStatus('idle'), 5000); },
          onError: () => { setStatus('error'); setTimeout(() => setStatus('idle'), 3000); }
        });
      } else {
        const decimals = currency === 'USDC' ? 6 : 18;
        writeContract({
          address: TOKENS[currency] as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [RECIPIENT_ADDRESS, parseUnits(amountStr, decimals)],
        }, {
          onSuccess: () => { setStatus('success'); setTimeout(() => setStatus('idle'), 5000); },
          onError: () => { setStatus('error'); setTimeout(() => setStatus('idle'), 3000); }
        });
      }
    } catch (e) {
      console.error(e);
      setStatus('error');
    }
  };

  return (
    <div className="border-t border-gray-800 bg-black/40 backdrop-blur-md p-6 mt-12 rounded-xl">
      <div className="max-w-md mx-auto text-center space-y-6">
        
        <div>
          <h2 className="text-xl font-bold text-white">Geliştiriciye Destek Ol</h2>
          <p className="text-gray-500 text-xs mt-1">Bu araç ücretsizdir. Katkıda bulunmak istersen:</p>
        </div>

        {/* --- MEKANİK KONTROL PANELİ --- */}
        <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-3 shadow-2xl">
          
          {/* 1. Birim Seçici */}
          <div className="grid grid-cols-3 gap-1 mb-3 bg-black rounded-lg p-1 border border-gray-800">
            {(['ETH', 'DEGEN', 'USDC'] as Currency[]).map((curr) => (
              <button
                key={curr}
                onClick={() => { setCurrency(curr); setCustomAmount(''); }}
                className={`py-1.5 text-xs font-bold font-mono rounded transition-all ${
                  currency === curr ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {curr}
              </button>
            ))}
          </div>

          {/* 2. Hazır Butonlar */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            {presets[currency].map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleTip(preset.amount)}
                className="bg-black border border-gray-700 hover:border-purple-500 hover:bg-gray-800 active:scale-95 rounded-lg p-2 transition-all flex flex-col items-center justify-center h-16 group"
              >
                <span className="text-white font-bold">{preset.amount}</span>
                <span className="text-[10px] text-gray-500 group-hover:text-purple-400">{preset.value}</span>
              </button>
            ))}
          </div>

          {/* 3. Manuel Giriş */}
          <div className="relative">
            <input
              type="number"
              placeholder="Farklı Tutar..."
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              className="w-full bg-black border border-gray-700 rounded-lg py-2 px-3 text-white text-sm focus:border-purple-500 focus:outline-none font-mono"
            />
            {customAmount && (
              <button
                onClick={() => handleTip(customAmount)}
                className="absolute right-1 top-1 bottom-1 bg-purple-600 hover:bg-purple-500 text-white px-3 rounded text-xs font-bold"
              >
                GÖNDER
              </button>
            )}
          </div>
        </div>

        {/* Durum Mesajları */}
        {status === 'pending' && <p className="text-yellow-400 text-xs animate-pulse">⚡️ Cüzdan onayı bekleniyor...</p>}
        {status === 'success' && <p className="text-green-400 text-xs">✅ Teşekkürler! İşlem gönderildi.</p>}
        {status === 'error' && <p className="text-red-400 text-xs">❌ Hata oluştu veya iptal edildi.</p>}

      </div>
    </div>
  );
}
