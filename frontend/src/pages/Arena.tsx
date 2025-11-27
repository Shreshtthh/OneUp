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


export function Arena() {
  const { duelId } = useParams<{ duelId: string }>();
  const navigate = useNavigate();
  const account = useCurrentAccount();
  const client = useSuiClient();
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Fetch duel object
  const { data: duel, isLoading } = useQuery({
    queryKey: ['duel', duelId],
    queryFn: async () => {
      if (!duelId) return null;
      const result = await client.getObject({
        id: duelId,
        options: { showContent: true },
      });
      
      console.log('Duel data:', result); // ✅ Keep this for debugging
      return result;
    },
    refetchInterval: 2000,
    enabled: !!duelId,
  });

  const fields = (duel?.data?.content as any)?.fields;

  // ✅ Works whether wrapped in Option or not
  const creator = fields?.creator;
  const opponent = fields?.opponent?.vec?.[0] || fields?.opponent || null;
  const startTime = fields?.start_time?.vec?.[0] || fields?.start_time || null;
  const duration = fields?.duration;
  const status = fields?.status ?? 0;
  const wagerAmount = fields?.wager_amount;

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
    
    // For the Chart & Header:
    // We assume a rough price of $1.50 per OCT to unify the value for display
    // (In a production app, we would pass the Oracle Price here)
    const musdInOct = (musd * 1000n) / 1500n; 
    
    return { oct, musd, total: oct + musdInOct };
  };

  const { data: creatorPortfolio } = useQuery({
    queryKey: ['portfolio', creator],
    queryFn: () => fetchPortfolio(creator),
    refetchInterval: 3000,
    enabled: !!creator,
  });

  const { data: opponentPortfolio } = useQuery({
    queryKey: ['portfolio', opponent],
    queryFn: () => fetchPortfolio(opponent),
    refetchInterval: 3000,
    enabled: !!opponent,
  });

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

  if (!duel || !duel.data) {
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
              {creatorPortfolio && (
                <div className="mt-2 text-center">
                  <div className="text-2xl font-bold text-white">{formatOCT(creatorPortfolio.total)} OCT</div>
                  <div className="text-xs text-gray-400">
                    {formatOCT(creatorPortfolio.oct)} OCT + {(Number(creatorPortfolio.musd) / 1_000_000).toFixed(2)} USD
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
                  {opponentPortfolio && (
                    <div className="mt-2 text-center">
                      <div className="text-2xl font-bold text-white">{formatOCT(opponentPortfolio.total)} OCT</div>
                      <div className="text-xs text-gray-400">
                        {formatOCT(opponentPortfolio.oct)} OCT + {(Number(opponentPortfolio.musd) / 1_000_000).toFixed(2)} USD
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
                <PriceChart />
              </div>
              <div>
                <TradingPanel />
              </div>
            </div>

            {/* Portfolio Performance Chart */}
            <DuelChart
              creatorBalance={creatorPortfolio?.total || 0n}
              opponentBalance={opponentPortfolio?.total || 0n}
              creatorStartBalance={wagerAmount ? BigInt(wagerAmount) : 0n}
              opponentStartBalance={wagerAmount ? BigInt(wagerAmount) : 0n}
            />
          </div>
        )}

        {/* Chart only (no trading) - For spectators */}
        {status === 1 && !isParticipant && creatorPortfolio && opponentPortfolio && (
          <DuelChart
            creatorBalance={creatorPortfolio.total}
            opponentBalance={opponentPortfolio.total}
            creatorStartBalance={wagerAmount ? BigInt(wagerAmount) : 0n}
            opponentStartBalance={wagerAmount ? BigInt(wagerAmount) : 0n}
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
              Wager: <span className="text-ethereal-cyan font-bold">{Number(wagerAmount) / 1_000_000_000} OCT</span>
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
              <p>• Use the trading panel to swap <strong>OCT ↔ MOCK USD</strong>.</p>
              <p>• Prices are fetched live from the real market (SUI/USD proxy).</p>
              <p>• Your portfolio value = OCT balance + USD value (converted to OCT).</p>
              <p>• <strong>Strategy:</strong> Swap to USD if you think price will drop. Swap back to OCT if you think price will rise.</p>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}