'use client';

import { useMemo, useState } from 'react';
import sdk from '@farcaster/frame-sdk';
import { encodeFunctionData, parseEther, parseUnits } from 'viem';

/**
 * Unfollow Cleaner - Tip Section
 * Send ETH, DEGEN, or USDC on Base network
 */

const RECIPIENT_ADDRESS = '0xaDBd1712D5c6e2A4D7e08F50a9586d3C054E30c8';
const BASE_CHAIN_ID_HEX = '0x2105'; // 8453

const TOKENS = {
  DEGEN: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed',
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
} as const;

type Currency = 'ETH' | 'DEGEN' | 'USDC';

export default function TipSection() {
  const [currency, setCurrency] = useState<Currency>('ETH');
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const presets = useMemo(
    () => ({
      ETH: [
        { label: '☕️', amount: '0.0003', sub: '~$1' },
        { label: '🍔', amount: '0.001', sub: '~$3' },
        { label: '🚀', amount: '0.0015', sub: '~$5' },
      ],
      DEGEN: [
        { label: '🎩', amount: '200', sub: 'DEGEN' },
        { label: '🎩', amount: '500', sub: 'DEGEN' },
        { label: '🎩', amount: '1000', sub: 'DEGEN' },
      ],
      USDC: [
        { label: '💵', amount: '1', sub: '$1' },
        { label: '💵', amount: '3', sub: '$3' },
        { label: '💵', amount: '5', sub: '$5' },
      ],
    }),
    []
  );

  const sendTip = async (amountStr: string) => {
    setError(null);
    setStatus('pending');

    try {
      const provider = sdk.wallet.ethProvider;
      if (!provider) throw new Error('Wallet provider not found 👻');

      // 1. Switch to Base network
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: BASE_CHAIN_ID_HEX }],
        });
      } catch (switchError) {
        console.warn("Network switch rejected or unsupported");
      }

      // 2. Connect account
      const accounts = (await provider.request({ method: 'eth_requestAccounts', params: [] })) as string[];
      const from = accounts?.[0];
      if (!from) throw new Error('Wallet connection failed 🔌');

      // 3. Send transaction
      if (currency === 'ETH') {
        const value = parseEther(amountStr);
        const tx = {
          from,
          to: RECIPIENT_ADDRESS,
          value: `0x${value.toString(16)}`,
        };

        await provider.request({ method: 'eth_sendTransaction', params: [tx] });
      } else {
        const decimals = currency === 'USDC' ? 6 : 18;
        const amount = parseUnits(amountStr, decimals);

        const data = encodeFunctionData({
          abi: [
            {
              type: 'function',
              name: 'transfer',
              stateMutability: 'nonpayable',
              inputs: [
                { name: 'to', type: 'address' },
                { name: 'amount', type: 'uint256' },
              ],
              outputs: [{ type: 'bool' }],
            },
          ],
          functionName: 'transfer',
          args: [RECIPIENT_ADDRESS, amount],
        });

        const tx = {
          from,
          to: TOKENS[currency],
          data,
          value: '0x0',
        };

        await provider.request({ method: 'eth_sendTransaction', params: [tx] });
      }

      setStatus('success');
      setTimeout(() => setStatus('idle'), 5000);
    } catch (e: any) {
      console.error("Transaction error:", e);
      setStatus('error');
      setError(e?.message || 'Oops! Something spooked the server 👻');
      setTimeout(() => {
        setStatus('idle');
        setError(null);
      }, 4000);
    }
  };

  return (
    <div data-testid="tip-section" className="border border-white/5 bg-black/40 backdrop-blur-md p-6 mt-12 rounded-2xl">
      <div className="max-w-md mx-auto text-center space-y-5">
        <div>
          <h2 className="text-xl font-bold text-white">Tip the Developer</h2>
          <p className="text-gray-500 text-xs mt-1">
            Send a tip by approving in your Warpcast wallet.
          </p>
        </div>

        <div className="bg-[#151722] border border-white/5 rounded-2xl p-3 shadow-2xl">
          <div className="grid grid-cols-3 gap-1 mb-3 bg-black/40 rounded-xl p-1 border border-white/5">
            {(['ETH', 'DEGEN', 'USDC'] as Currency[]).map((curr) => (
              <button
                data-testid={`tip-currency-${curr.toLowerCase()}-button`}
                key={curr}
                onClick={() => setCurrency(curr)}
                className={`py-2 text-xs font-bold font-mono rounded-lg transition-colors ${
                  currency === curr ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-200'
                }`}
              >
                {curr}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {presets[currency].map((p, idx) => (
              <button
                data-testid={`tip-preset-${currency.toLowerCase()}-${idx}-button`}
                key={idx}
                onClick={() => sendTip(p.amount)}
                disabled={status === 'pending'}
                className="bg-black/40 border border-white/5 hover:border-purple-500/40 hover:bg-white/5 rounded-xl p-3 transition-colors flex flex-col items-center justify-center h-16 disabled:opacity-60"
              >
                <span className="text-white font-bold font-mono">{p.amount}</span>
                <span className="text-[10px] text-gray-500">{p.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {status === 'pending' && <p className="text-yellow-300 text-xs animate-pulse">Awaiting wallet approval...</p>}
        {status === 'success' && <p className="text-green-300 text-xs">Thank you! Transaction sent 🎉</p>}
        {status === 'error' && <p className="text-red-300 text-xs">{error || 'Oops! The transaction escaped 👻'}</p>}
      </div>
    </div>
  );
}
