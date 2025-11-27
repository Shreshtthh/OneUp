import { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { NeonButton } from '../ui/NeonButton';
import { usePriceOracle } from '../../hooks/usePriceOracle';
import { useMockDex } from '../../hooks/useMockDex';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { OCT_TYPE, MOCK_USD_TYPE } from '../../lib/constants';

export function TradingPanel() {
  const [amount, setAmount] = useState('0.1');
  const [direction, setDirection] = useState<'oct-to-usd' | 'usd-to-oct'>('oct-to-usd');
  const [isSwapping, setIsSwapping] = useState(false);
  
  const account = useCurrentAccount();
  const client = useSuiClient();
    
  const { octPrice, octPriceInCents } = usePriceOracle();
  const { swapOctToUsd, swapUsdToOct } = useMockDex();

  // Fetch balances for the UI
  const { data: balances, refetch } = useQuery({
    queryKey: ['trading-balances', account?.address],
    queryFn: async () => {
      if (!account) return { oct: 0n, musd: 0n };
      
      const [octCoins, musdCoins] = await Promise.all([
        client.getCoins({ owner: account.address, coinType: OCT_TYPE }),
        client.getCoins({ owner: account.address, coinType: MOCK_USD_TYPE }),
      ]);
      
      const oct = octCoins.data.reduce((sum, c) => sum + BigInt(c.balance), 0n);
      const musd = musdCoins.data.reduce((sum, c) => sum + BigInt(c.balance), 0n);
      
      return { oct, musd };
    },
    refetchInterval: 3000,
    enabled: !!account,
  });

  const handleSwap = async () => {
    setIsSwapping(true);
    try {
      if (direction === 'oct-to-usd') {
        await swapOctToUsd(Number(amount), octPriceInCents);
      } else {
        await swapUsdToOct(octPriceInCents);
      }
      setAmount('0.1');
      refetch(); // Update balances immediately
    } finally {
      setIsSwapping(false);
    }
  };

  const octBalance = balances ? Number(balances.oct) / 1_000_000_000 : 0;
  const musdBalance = balances ? Number(balances.musd) / 1_000_000 : 0;
  const usdAmount = (Number(amount) * octPrice).toFixed(2);

  return (
    <GlassCard className="p-6" glow="purple">
      <h3 className="text-xl font-bold text-gradient mb-6 flex items-center gap-2">
        <span>🔄</span>
        Trade
      </h3>

      {/* Live Price */}
      <div className="mb-6 p-4 rounded-xl bg-black/30 border border-ethereal-cyan/20">
        <div className="text-xs text-gray-400 mb-1">Live OCT Price</div>
        <div className="text-3xl font-bold text-ethereal-cyan animate-pulse">
          ${octPrice.toFixed(4)}
        </div>
      </div>

      {/* Direction Selector */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setDirection('oct-to-usd')}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
            direction === 'oct-to-usd'
              ? 'bg-gradient-to-r from-ethereal-cyan to-ethereal-purple text-white shadow-glow-cyan'
              : 'bg-black/30 text-gray-400 hover:bg-black/50'
          }`}
        >
          OCT → USD
        </button>
        <button
          onClick={() => setDirection('usd-to-oct')}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
            direction === 'usd-to-oct'
              ? 'bg-gradient-to-r from-ethereal-purple to-ethereal-rose text-white shadow-glow-purple'
              : 'bg-black/30 text-gray-400 hover:bg-black/50'
          }`}
        >
          USD → OCT
        </button>
      </div>

      {/* Swap Interface */}
      <div className="space-y-4 mb-6">
        {direction === 'oct-to-usd' ? (
          <>
            {/* From: OCT */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">You Send</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={octBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-black/50 border border-gray-700 text-white focus:border-ethereal-cyan focus:outline-none transition-colors"
                placeholder="0.00"
              />
              <div className="text-xs text-gray-500 mt-1">
                Available: {octBalance.toFixed(4)} OCT
              </div>
            </div>

            <div className="text-center text-2xl text-ethereal-cyan">↓</div>

            {/* To: USD */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">You Receive</label>
              <div className="w-full px-4 py-3 rounded-lg bg-black/50 border border-gray-700 text-ethereal-purple text-lg font-bold">
                ${usdAmount}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* From: USD */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">You Send</label>
              <div className="w-full px-4 py-3 rounded-lg bg-black/50 border border-gray-700 text-ethereal-purple text-lg font-bold">
                All USD (${musdBalance.toFixed(2)})
              </div>
            </div>

            <div className="text-center text-2xl text-ethereal-purple">↓</div>

            {/* To: OCT */}
            <div>
              <label className="text-sm text-gray-400 block mb-2">You Receive</label>
              <div className="w-full px-4 py-3 rounded-lg bg-black/50 border border-gray-700 text-ethereal-cyan text-lg font-bold">
                ~{(musdBalance / octPrice).toFixed(4)} OCT
              </div>
            </div>
          </>
        )}
      </div>

      {/* Swap Button */}
      <NeonButton
        onClick={handleSwap}
        isLoading={isSwapping}
        disabled={
          isSwapping ||
          (direction === 'oct-to-usd'
            ? Number(amount) <= 0 || Number(amount) > octBalance
            : musdBalance <= 0)
        }
        className="w-full"
        variant="primary"
      >
        {direction === 'oct-to-usd' ? '🔄 Swap OCT → USD' : '🔄 Swap USD → OCT'}
      </NeonButton>

      {/* Portfolio Summary */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <div className="text-xs text-gray-400 mb-3">Your Portfolio</div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">OCT:</span>
            <span className="text-ethereal-cyan font-bold">{octBalance.toFixed(4)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">USD:</span>
            <span className="text-ethereal-purple font-bold">${musdBalance.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-700">
            <span className="text-gray-300 font-medium">Total Value:</span>
            <span className="text-white font-bold">${(octBalance * octPrice + musdBalance).toFixed(2)}</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}