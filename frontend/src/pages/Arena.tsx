import { useParams, useNavigate } from 'react-router-dom';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { GlassCard } from '../components/ui/GlassCard';
import { NeonButton } from '../components/ui/NeonButton';
import { TradingPanel } from '../components/arena/TradingPanel';
import { DuelChart } from '../components/arena/DuelChart';
import { PriceChart } from '../components/arena/PriceChart';
import { formatTimeRemaining, formatAddress, formatOCT } from '../lib/utils';
import { OCT_TYPE, MOCK_USD_TYPE } from '../lib/constants';
import { usePriceOracle } from '../hooks/usePriceOracle';
import { useDuel } from '../hooks/useDuel';


export function Arena() {
  const { duelId } = useParams<{ duelId: string }>();
  const navigate = useNavigate();
  const account = useCurrentAccount();
  const client = useSuiClient();
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [startingPrice, setStartingPrice] = useState<number>(() => {
    // Try to load from localStorage
    const stored = localStorage.getItem(`duel-${duelId}-price`);
    return stored ? Number(stored) : 0;
  });
  const [initialBalances, setInitialBalances] = useState<{
    creator: bigint;
    opponent: bigint;
  }>(() => {
    const stored = localStorage.getItem(`duel-${duelId}-initial`);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { creator: BigInt(parsed.creator), opponent: BigInt(parsed.opponent) };
    }
    return { creator: 0n, opponent: 0n };
  });
  const { octPrice, octPriceInCents } = usePriceOracle();

  // ✅ Use the useDuel hook instead of duplicate query
  const { data: duel, isLoading } = useDuel(duelId || '');

  // ✅ Extract fields directly from useDuel data
  const creator = duel?.creator;
  const opponent = duel?.opponent;
  const startTime = duel?.startTime;
  const duration = duel?.duration;
  const status = duel?.status ?? 0;
  const wagerAmount = duel?.wager;
  const wagerInOct = wagerAmount ? BigInt(wagerAmount) : 0n;

  console.log('Duel state:', { 
    creator, 
    opponent, 
    startTime: startTime ? new Date(Number(startTime)).toLocaleString() : null,
    duration,
    status,
    statusText: ['OPEN', 'ACTIVE', 'RESOLVED', 'CANCELLED'][status]
  });

  // Helper to fetch total portfolio value (OCT + USD)
  const fetchPortfolio = async (address: string | undefined) => {
    if (!address) return { oct: 0n, musd: 0n, total: 0n };
    
    const [octCoins, musdCoins] = await Promise.all([
      client.getCoins({ owner: address, coinType: OCT_TYPE }),
      client.getCoins({ owner: address, coinType: MOCK_USD_TYPE }),
    ]);

    const oct = octCoins.data.reduce((sum, coin) => sum + BigInt(coin.balance), 0n);
    const musd = musdCoins.data.reduce((sum, coin) => sum + BigInt(coin.balance), 0n);
    
    // ✅ Convert USD to OCT using FIXED starting price (not live price)
    // This ensures portfolio value only changes from trades, not market volatility
    const priceToUse = startingPrice > 0 ? startingPrice : octPriceInCents;
    const musdInOct = priceToUse > 0 
      ? (musd * BigInt(Math.floor(priceToUse))) / 100n 
      : 0n;
    
    console.log('📊 Portfolio calc:', { 
      address: address?.slice(0, 8), 
      oct: Number(oct), 
      musd: Number(musd), 
      priceUsed: priceToUse,
      startingPrice,
      musdInOct: Number(musdInOct)
    });
    
    return { oct, musd, total: oct + musdInOct };
  };

  const { data: creatorPortfolio } = useQuery({
    queryKey: ['portfolio', creator, startingPrice],
    queryFn: () => fetchPortfolio(creator),
    refetchInterval: 2000,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always fetch fresh data
    enabled: !!creator && (status !== 1 || startingPrice > 0), // Wait for price lock if duel is active
  });

  const { data: opponentPortfolio } = useQuery({
    queryKey: ['portfolio', opponent, startingPrice],
    queryFn: () => fetchPortfolio(opponent || undefined),
    refetchInterval: 2000,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always fetch fresh data
    enabled: !!opponent && (status !== 1 || startingPrice > 0), // Wait for price lock if duel is active
  });

  // Capture starting price and initial balances when duel starts
  useEffect(() => {
    if (status === 1 && octPriceInCents > 0 && startingPrice === 0) {
      console.log('🔒 Locking starting price:', octPriceInCents);
      setStartingPrice(octPriceInCents);
      localStorage.setItem(`duel-${duelId}-price`, String(octPriceInCents));
    }
  }, [status, octPriceInCents, startingPrice, duelId]);

  // Set initial balances to wager amount (both players start equal)
  useEffect(() => {
    if (status === 1 && wagerInOct > 0n && initialBalances.creator === 0n) {
      console.log('📊 Setting initial balances to wager amount:', wagerInOct);
      const initial = {
        creator: wagerInOct,
        opponent: wagerInOct
      };
      setInitialBalances(initial);
      localStorage.setItem(`duel-${duelId}-initial`, JSON.stringify({
        creator: initial.creator.toString(),
        opponent: initial.opponent.toString()
      }));
    }
  }, [status, wagerInOct, initialBalances.creator, duelId]);

  // Update countdown timer
  useEffect(() => {
    if (!startTime || !duration) return;
    const interval = setInterval(() => {
      const endTime = Number(startTime) + Number(duration);
      setTimeRemaining(formatTimeRemaining(endTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, duration]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-game flex items-center justify-center">
        <div className="text-2xl text-gradient glow-text">Loading Arena...</div>
      </div>
    );
  }

  if (!duel) {
    return (
      <div className="min-h-screen bg-gradient-game flex items-center justify-center">
        <GlassCard className="p-12 text-center">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-2xl text-gray-400 mb-6">Duel Not Found</div>
          <NeonButton onClick={() => navigate('/')}>Back to Lobby</NeonButton>
        </GlassCard>
      </div>
    );
  }

  const isCreator = account?.address === creator;
  const isOpponent = account?.address === opponent;
  const isParticipant = isCreator || isOpponent;

  return (
    <div className="min-h-screen bg-gradient-game">
      <Header />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 text-gray-400 hover:text-ethereal-cyan transition-colors flex items-center gap-2 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          Back to Lobby
        </button>

        {/* VS Header */}
        <GlassCard className="mb-8 p-8" glow="cyan">
          <div className="flex items-center justify-between">
            {/* Creator */}
            <div className="flex flex-col items-center flex-1">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-ethereal-cyan to-ethereal-purple mb-4 flex items-center justify-center shadow-glow-cyan">
                <span className="text-4xl">⚔️</span>
              </div>
              <div className="text-sm text-gray-400">Creator</div>
              <div className="text-ethereal-cyan font-mono text-lg">{formatAddress(creator || '')}</div>
              {creatorPortfolio && initialBalances.creator > 0n && (
                <div className="mt-2 text-center">
                  {/* Current Value */}
                  <div className="text-2xl font-bold text-white">{formatOCT(creatorPortfolio.total)} OCT</div>
                  <div className="text-xs text-gray-400">
                    {formatOCT(creatorPortfolio.oct)} OCT + {(Number(creatorPortfolio.musd) / 1_000_000_000).toFixed(4)} USD
                  </div>
                  
                  {/* Starting Balance */}
                  <div className="text-xs text-gray-500 mt-2 border-t border-gray-700 pt-2">
                    Started with: {formatOCT(initialBalances.creator)} OCT
                  </div>
                  
                  {/* Profit/Loss */}
                  <div className={`text-sm font-bold mt-1 ${
                    creatorPortfolio.total > initialBalances.creator ? 'text-green-400' : 
                    creatorPortfolio.total < initialBalances.creator ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {creatorPortfolio.total > initialBalances.creator ? '↑' : 
                     creatorPortfolio.total < initialBalances.creator ? '↓' : '='} 
                    {formatOCT(creatorPortfolio.total > initialBalances.creator 
                      ? creatorPortfolio.total - initialBalances.creator 
                      : initialBalances.creator - creatorPortfolio.total)} OCT
                  </div>
                  
                  {/* ROI */}
                  <div className="text-xs text-ethereal-cyan mt-1">
                    ROI: {((Number(creatorPortfolio.total - initialBalances.creator) / Number(initialBalances.creator)) * 100).toFixed(2)}%
                  </div>
                </div>
              )}
            </div>

            {/* VS */}
            <div className="flex flex-col items-center px-8">
              <div className="text-6xl font-bold text-gradient mb-4">VS</div>
              {status === 1 && timeRemaining && (
                <div className="text-center">
                  <div className="text-sm text-gray-400">Time Remaining</div>
                  <div className="text-2xl font-bold text-ethereal-rose">{timeRemaining}</div>
                </div>
              )}
              {/* ✅ Show starting wager */}
              <div className="text-center mt-4">
                <div className="text-xs text-gray-400">Wager</div>
                <div className="text-lg font-bold text-ethereal-gold">
                  {formatOCT(wagerInOct)} OCT
                </div>
              </div>
              
              {/* Show locked valuation price for active duels */}
              {status === 1 && startingPrice > 0 && (
                <div className="text-center mt-4 p-2 bg-black/30 rounded border border-gray-700">
                  <div className="text-xs text-gray-400">Valuation Rate</div>
                  <div className="text-sm font-mono text-ethereal-cyan">
                    1 OCT = ${(startingPrice / 100).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    (Portfolio scoring only)
                  </div>
                </div>
              )}
            </div>

            {/* Opponent */}
            <div className="flex flex-col items-center flex-1">
              {opponent ? (
                <>
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-ethereal-purple to-ethereal-rose mb-4 flex items-center justify-center shadow-glow-purple">
                    <span className="text-4xl">🛡️</span>
                  </div>
                  <div className="text-sm text-gray-400">Challenger</div>
                  <div className="text-ethereal-purple font-mono text-lg">{formatAddress(opponent)}</div>
                  {opponentPortfolio && initialBalances.opponent > 0n && (
                    <div className="mt-2 text-center">
                      {/* Current Value */}
                      <div className="text-2xl font-bold text-white">{formatOCT(opponentPortfolio.total)} OCT</div>
                      <div className="text-xs text-gray-400">
                        {formatOCT(opponentPortfolio.oct)} OCT + {(Number(opponentPortfolio.musd) / 1_000_000_000).toFixed(4)} USD
                      </div>
                      
                      {/* Starting Balance */}
                      <div className="text-xs text-gray-500 mt-2 border-t border-gray-700 pt-2">
                        Started with: {formatOCT(initialBalances.opponent)} OCT
                      </div>
                      
                      {/* Profit/Loss */}
                      <div className={`text-sm font-bold mt-1 ${
                        opponentPortfolio.total > initialBalances.opponent ? 'text-green-400' : 
                        opponentPortfolio.total < initialBalances.opponent ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {opponentPortfolio.total > initialBalances.opponent ? '↑' : 
                         opponentPortfolio.total < initialBalances.opponent ? '↓' : '='} 
                        {formatOCT(opponentPortfolio.total > initialBalances.opponent 
                          ? opponentPortfolio.total - initialBalances.opponent 
                          : initialBalances.opponent - opponentPortfolio.total)} OCT
                      </div>
                      
                      {/* ROI */}
                      <div className="text-xs text-ethereal-purple mt-1">
                        ROI: {((Number(opponentPortfolio.total - initialBalances.opponent) / Number(initialBalances.opponent)) * 100).toFixed(2)}%
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="w-24 h-24 rounded-full bg-gray-800 mb-4 flex items-center justify-center border-2 border-dashed border-gray-600">
                    <span className="text-4xl">❓</span>
                  </div>
                  <div className="text-sm text-gray-400">Waiting...</div>
                  <div className="text-gray-500 font-mono">???</div>
                </>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Trading Interface - Only show if duel is active and user is participant */}
        {status === 1 && isParticipant && (
          <div className="space-y-6 mb-8">
            {/* Price Feed + Trading Panel Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <PriceChart octPrice={octPrice} />
              </div>
              <div>
                <TradingPanel 
                  duelId={duelId!}
                  octPrice={octPrice} 
                  octPriceInCents={octPriceInCents} 
                />
              </div>
            </div>

            {/* Portfolio Performance Chart */}
            <DuelChart
              duelId={duelId!}
              creatorBalance={creatorPortfolio?.total || 0n}
              opponentBalance={opponentPortfolio?.total || 0n}
              creatorInitial={initialBalances.creator}
              opponentInitial={initialBalances.opponent}
            />
          </div>
        )}

        {/* Chart only (no trading) - For spectators */}
        {status === 1 && !isParticipant && creatorPortfolio && opponentPortfolio && (
          <DuelChart
            duelId={duelId!}
            creatorBalance={creatorPortfolio.total}
            opponentBalance={opponentPortfolio.total}
            creatorInitial={initialBalances.creator}
            opponentInitial={initialBalances.opponent}
          />
        )}

        {/* Waiting State */}
        {status === 0 && !opponent && (
          <GlassCard className="p-16 text-center" glow="purple">
            <div className="text-8xl mb-6 animate-pulse">⏳</div>
            <h3 className="text-3xl font-bold text-gradient mb-4">
              Waiting for Opponent...
            </h3>
            <p className="text-gray-400 text-lg">
              Wager: <span className="text-ethereal-cyan font-bold">{formatOCT(wagerInOct)} OCT</span>
            </p>
          </GlassCard>
        )}

        {/* Resolved State */}
        {status === 2 && (
          <GlassCard className="p-16 text-center" glow="rose">
            <div className="text-8xl mb-6">🏆</div>
            <h3 className="text-3xl font-bold text-gradient mb-4">
              Duel Resolved!
            </h3>
            <div className="space-y-4 text-lg">
              <p className="text-gray-400">
                This duel has ended and prizes have been distributed.
              </p>
              {creatorPortfolio && opponentPortfolio && (
                <div className="flex justify-center gap-8 mt-6">
                  <div className="text-center">
                    <div className="text-sm text-gray-400">Creator</div>
                    <div className={`text-2xl font-bold ${
                      creatorPortfolio.total > opponentPortfolio.total 
                        ? 'text-ethereal-gold' 
                        : 'text-gray-500'
                    }`}>
                      {creatorPortfolio.total > opponentPortfolio.total ? '👑 Winner' : 'Lost'}
                    </div>
                    <div className="text-ethereal-cyan mt-2">
                      {formatAddress(creator || '')}
                    </div>
                    {/* ✅ Show final ROI */}
                    <div className="text-sm text-gray-400 mt-2">
                      ROI: {initialBalances.creator > 0n 
                        ? ((Number(creatorPortfolio.total - initialBalances.creator) / Number(initialBalances.creator)) * 100).toFixed(2)
                        : '0.00'}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-400">Opponent</div>
                    <div className={`text-2xl font-bold ${
                      opponentPortfolio.total > creatorPortfolio.total 
                        ? 'text-ethereal-gold' 
                        : 'text-gray-500'
                    }`}>
                      {opponentPortfolio.total > creatorPortfolio.total ? '👑 Winner' : 'Lost'}
                    </div>
                    <div className="text-ethereal-purple mt-2">
                      {formatAddress(opponent || '')}
                    </div>
                    {/* ✅ Show final ROI */}
                    <div className="text-sm text-gray-400 mt-2">
                      ROI: {initialBalances.opponent > 0n 
                        ? ((Number(opponentPortfolio.total - initialBalances.opponent) / Number(initialBalances.opponent)) * 100).toFixed(2)
                        : '0.00'}%
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-8">
              <NeonButton onClick={() => navigate('/')}>
                Back to Lobby
              </NeonButton>
            </div>
          </GlassCard>
        )}

        {/* Demo Instructions */}
        {status === 1 && isParticipant && (
          <GlassCard className="mt-8 p-6 border-ethereal-purple/30">
            <h4 className="text-lg font-bold text-ethereal-purple mb-3">📊 How to Play (Demo Mode)</h4>
            <div className="text-sm text-gray-300 space-y-2">
              <p>• Both players start with <strong>{formatOCT(wagerInOct)} OCT</strong> (the wagered amount).</p>
              <p>• You can only trade <strong>up to the wagered amount</strong> for fairness.</p>
              <p>• Use the trading panel to swap <strong>OCT ↔ MOCK USD</strong>.</p>
              <p>• Prices are fetched live from the real market (SUI/USD proxy).</p>
              <p>• Your ROI is calculated as: <strong>(Current Value - Wager) / Wager × 100%</strong></p>
              <p>• <strong>Strategy:</strong> Swap to USD if you think price will drop. Swap back to OCT if you think price will rise.</p>
              <p>• <strong>Winner:</strong> Player with highest portfolio value at the end wins the entire pot!</p>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}