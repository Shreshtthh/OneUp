import { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { useMockDex } from '../../hooks/useMockDex';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { OCT_TYPE, MOCK_USD_TYPE } from '../../lib/constants';
import toast from 'react-hot-toast';
import { useDuel } from '../../hooks/useDuel';

interface TradingPanelProps {
  duelId: string;  // ✅ Pass duel ID
  octPrice: number;
  octPriceInCents: number;
}

export function TradingPanel({ duelId, octPrice, octPriceInCents }: TradingPanelProps) {
  const [direction, setDirection] = useState<'oct-to-usd' | 'usd-to-oct'>('oct-to-usd');
  const [amount, setAmount] = useState('0.01');
  const [isSwapping, setIsSwapping] = useState(false);
  
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { data: duel } = useDuel(duelId); // ✅ Fetch duel data
  const { swapOctToUsd, swapUsdToOct } = useMockDex();

  // ✅ Get wager in OCT (convert from MIST)
  const wagerInOct = duel ? Number(duel.wager) / 1_000_000_000 : 0;

  // Fetch balances for the UI
  const { data: balances } = useQuery({
    queryKey: ['player-balances', account?.address],
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
    refetchInterval: 2000,
    enabled: !!account,
  });

  const octBalance = balances ? Number(balances.oct) / 1_000_000_000 : 0;
  const musdBalance = balances ? Number(balances.musd) / 1_000_000_000 : 0;

  const handleSwap = async () => {
    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }

    // ✅ Validate against wager amount
    if (direction === 'oct-to-usd') {
      const tradeAmount = Number(amount);
      
      if (tradeAmount > wagerInOct) {
        toast.error(
          `⚠️ Cannot trade more than wagered amount!\n` +
          `Wagered: ${wagerInOct} OCT\n` +
          `Attempting: ${tradeAmount} OCT\n\n` +
          `You can only trade an amount less than or equal to the wagered amount for fairness.`
        );
        return;
      }

      if (tradeAmount > octBalance) {
        toast.error('Insufficient OCT balance');
        return;
      }
    }

    setIsSwapping(true);
    try {
      if (direction === 'oct-to-usd') {
        await swapOctToUsd(Number(amount), octPriceInCents);
        toast.success(`✅ Swapped ${amount} OCT → USD`);
      } else {
        await swapUsdToOct(octPriceInCents);
        toast.success('✅ Swapped USD → OCT');
      }
      setAmount('0.01');
    } catch (error: unknown) {
      console.error('Swap failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Swap failed';
      toast.error(errorMessage);
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <GlassCard className="p-6" glow="purple">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🔄</span>
        <h3 className="text-xl font-bold text-white">Trade</h3>
      </div>

      {/* ✅ Show wager info */}
      <div className="bg-black/30 rounded-lg p-3 mb-4 border border-ethereal-cyan/20">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Wagered Amount:</span>
          <span className="text-ethereal-cyan font-bold">{wagerInOct.toFixed(4)} OCT</span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          ℹ️ You can only trade up to the wagered amount for fairness
        </p>
      </div>

      <div className="space-y-4">
        {/* Direction Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setDirection('oct-to-usd')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              direction === 'oct-to-usd'
                ? 'bg-ethereal-cyan text-black'
                : 'bg-black/30 text-gray-400 hover:text-white'
            }`}
          >
            OCT → USD
          </button>
          <button
            onClick={() => setDirection('usd-to-oct')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
              direction === 'usd-to-oct'
                ? 'bg-ethereal-purple text-black'
                : 'bg-black/30 text-gray-400 hover:text-white'
            }`}
          >
            USD → OCT
          </button>
        </div>

        {/* Live OCT Price */}
        <div className="bg-black/30 rounded-lg p-4">
          <div className="text-sm text-gray-400 mb-1">Live OCT Price</div>
          <div className="text-3xl font-bold text-ethereal-cyan">
            ${octPrice.toFixed(4)}
          </div>
        </div>

        {/* Amount Input (OCT → USD only) */}
        {direction === 'oct-to-usd' && (
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Amount (OCT)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              max={wagerInOct}  // ✅ Set max to wager
              step="0.001"
              className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-ethereal-cyan focus:outline-none"
              placeholder="0.01"
            />
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Balance: {octBalance.toFixed(4)} OCT</span>
              <span>Max: {wagerInOct.toFixed(4)} OCT</span>
            </div>
          </div>
        )}

        {/* Balances */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black/30 rounded-lg p-3">
            <div className="text-xs text-gray-400">OCT Balance</div>
            <div className="text-lg font-bold text-white">
              {octBalance.toFixed(4)}
            </div>
          </div>
          <div className="bg-black/30 rounded-lg p-3">
            <div className="text-xs text-gray-400">USD Balance</div>
            <div className="text-lg font-bold text-white">
              {musdBalance.toFixed(4)}
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={isSwapping || !account}
          className={`w-full py-3 rounded-lg font-bold transition ${
            direction === 'oct-to-usd'
              ? 'bg-gradient-to-r from-ethereal-cyan to-ethereal-purple hover:shadow-glow-cyan'
              : 'bg-gradient-to-r from-ethereal-purple to-ethereal-rose hover:shadow-glow-purple'
          } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isSwapping ? '⏳ Swapping...' : `Swap ${direction === 'oct-to-usd' ? 'OCT → USD' : 'USD → OCT'}`}
        </button>
      </div>
    </GlassCard>
  );
}