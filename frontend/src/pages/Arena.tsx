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
  
  // 1. Price Locking Logic
  const [startingPrice, setStartingPrice] = useState<number>(() => {
    const stored = localStorage.getItem(`duel-${duelId}-price`);
    return stored ? Number(stored) : 0;
  });

  // 2. Initial Balance Snapshot Logic (Restored)
  // We need this to calculate the "Profit" (Current - Start)
  const [initialBalances, setInitialBalances] = useState<{ creator: bigint; opponent: bigint } | null>(() => {
    const stored = localStorage.getItem(`duel-${duelId}-initial`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return { creator: BigInt(parsed.creator), opponent: BigInt(parsed.opponent) };
      } catch (e) { return null; }
    }
    return null;
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
  
  // ✅ FIX: The wager amount is the ONLY starting balance we care about
  const wagerInOct = wagerAmount ? BigInt(wagerAmount) : 0n;

  // 3. Portfolio Helper
  const fetchPortfolio = async (address: string | undefined) => {
    if (!address) return { oct: 0n, musd: 0n, total: 0n };
    
    const [octCoins, musdCoins] = await Promise.all([
      client.getCoins({ owner: address, coinType: OCT_TYPE }),
      client.getCoins({ owner: address, coinType: MOCK_USD_TYPE }),
    ]);

    const oct = octCoins.data.reduce((sum, coin) => sum + BigInt(coin.balance), 0n);
    const musd = musdCoins.data.reduce((sum, coin) => sum + BigInt(coin.balance), 0n);
    
    const priceToUse = startingPrice > 0 ? startingPrice : octPriceInCents;
    
    // ✅ FIX 1: Normalize MUSD (6 decimals) to OCT (9 decimals)
    // We multiply MUSD by 1000 (adds 3 zeros) to match the scale
    const musdNormalized = musd * 1000n; 

    // ✅ FIX 2: Correct Conversion Logic (USD Value / Price = OCT Amount)
    // Formula: (USD_Balance * 100) / Price_In_Cents
    // Example: ($1.90 * 100) / 150 cents = 1.26 OCT
    const musdInOct = priceToUse > 0 
      ? (musdNormalized * 100n) / BigInt(Math.floor(priceToUse))
      : 0n;
    
    return { oct, musd, total: oct + musdInOct };
  };

  // 4. Queries - Only run when active
  const { data: creatorPortfolio } = useQuery({
    queryKey: ['portfolio', creator, startingPrice],
    queryFn: () => fetchPortfolio(creator),
    refetchInterval: 2000,
    enabled: !!creator && status === 1,
  });

  const { data: opponentPortfolio } = useQuery({
    queryKey: ['portfolio', opponent, startingPrice],
    queryFn: () => fetchPortfolio(opponent || undefined),
    refetchInterval: 2000,
    enabled: !!opponent && status === 1,
  });

  // Capture starting price when duel starts
  useEffect(() => {
    if (status === 1 && octPriceInCents > 0 && startingPrice === 0) {
      setStartingPrice(octPriceInCents);
      localStorage.setItem(`duel-${duelId}-price`, String(octPriceInCents));
    }
  }, [status, octPriceInCents, startingPrice, duelId]);

  // Capture Initial Balances (Once per duel)
  useEffect(() => {
    if (status === 1 && creatorPortfolio && opponentPortfolio && !initialBalances) {
      const initial = {
        creator: creatorPortfolio.total,
        opponent: opponentPortfolio.total
      };
      
      if (initial.creator > 0n || initial.opponent > 0n) {
        setInitialBalances(initial);
        localStorage.setItem(`duel-${duelId}-initial`, JSON.stringify({
          creator: initial.creator.toString(),
          opponent: initial.opponent.toString()
        }));
      }
    }
  }, [status, creatorPortfolio, opponentPortfolio, initialBalances, duelId]);

  // Update countdown
  useEffect(() => {
    if (!startTime || !duration) return;
    const interval = setInterval(() => {
      const endTime = Number(startTime) + Number(duration);
      setTimeRemaining(formatTimeRemaining(endTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, duration]);

  if (isLoading) {
    return <div className="min-h-screen bg-gradient-game flex items-center justify-center text-white">Loading...</div>;
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

  // Calculate Values
  let creatorCurrent = 0n;
  let opponentCurrent = 0n;
  
  // Start Balance comes from snapshot (actual wallet at duel start)
  const creatorStartSnapshot = initialBalances?.creator || wagerInOct; 
  const opponentStartSnapshot = initialBalances?.opponent || wagerInOct;

  if (status === 1) {
    creatorCurrent = creatorPortfolio?.total || 0n;
    opponentCurrent = opponentPortfolio?.total || 0n;
  } else if (status === 2 && duel?.finalResults) {
    creatorCurrent = duel.finalResults.creatorEnd;
    opponentCurrent = duel.finalResults.opponentEnd;
  } else {
    // Default / Loading
    creatorCurrent = creatorStartSnapshot;
    opponentCurrent = opponentStartSnapshot;
  }

  // ✅ THE FIXED ROI FORMULA: (Current - StartSnapshot) / Wager
  const calculateROI = (current: bigint, startSnapshot: bigint, wager: bigint) => {
    if (wager === 0n) return '0.00';
    
    // Profit = Current Wallet Balance - Starting Wallet Balance
    const profit = Number(current) - Number(startSnapshot);
    
    // ROI = Profit / Wager * 100
    return ((profit / Number(wager)) * 100).toFixed(2);
  };

  return (
    <div className="min-h-screen bg-gradient-game">
      <Header />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        <button onClick={() => navigate('/')} className="mb-6 text-gray-400 hover:text-ethereal-cyan transition-colors">
          ← Back to Lobby
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
              
              <div className="mt-2 text-center">
                <div className="text-2xl font-bold text-white">{formatOCT(creatorCurrent)} OCT</div>
                
                {/* Show the SNAPSHOT balance as "Started with" */}
                <div className="text-xs text-gray-500 mt-2 border-t border-gray-700 pt-2">
                  Started with: {formatOCT(creatorStartSnapshot)} OCT
                </div>
                
                <div className={`text-sm font-bold mt-1 ${
                  creatorCurrent > creatorStartSnapshot ? 'text-green-400' : 
                  creatorCurrent < creatorStartSnapshot ? 'text-red-400' : 'text-gray-400'
                }`}>
                  {creatorCurrent > creatorStartSnapshot ? '↑' : creatorCurrent < creatorStartSnapshot ? '↓' : '='} 
                  {formatOCT(creatorCurrent > creatorStartSnapshot 
                    ? creatorCurrent - creatorStartSnapshot 
                    : creatorStartSnapshot - creatorCurrent)} OCT
                </div>
                
                <div className="text-xs text-ethereal-cyan mt-1">
                  ROI: {calculateROI(creatorCurrent, creatorStartSnapshot, wagerInOct)}%
                </div>
              </div>
            </div>

            {/* VS & Wager Info */}
            <div className="flex flex-col items-center px-8">
              <div className="text-6xl font-bold text-gradient mb-4">VS</div>
              {status === 1 && <div className="text-2xl font-bold text-ethereal-rose">{timeRemaining}</div>}
              <div className="text-center mt-4">
                <div className="text-xs text-gray-400">Wager</div>
                <div className="text-lg font-bold text-ethereal-gold">{formatOCT(wagerInOct)} OCT</div>
              </div>
              
              {status === 1 && startingPrice > 0 && (
                <div className="text-center mt-4 p-2 bg-black/30 rounded border border-gray-700">
                  <div className="text-xs text-gray-400">Valuation Rate</div>
                  <div className="text-sm font-mono text-ethereal-cyan">
                    1 OCT = ${(startingPrice / 100).toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            {/* Opponent Stats */}
            <div className="flex flex-col items-center flex-1">
              <div className="text-4xl mb-2">🛡️</div>
              <div className="text-sm text-gray-400">Challenger</div>
              <div className="text-ethereal-purple font-mono text-lg">{opponent ? formatAddress(opponent) : '???'}</div>
              
              {opponent ? (
                <div className="mt-2 text-center">
                  <div className="text-2xl font-bold text-white">{formatOCT(opponentCurrent)} OCT</div>
                  
                  <div className="text-xs text-gray-500 mt-2 border-t border-gray-700 pt-2">
                    Started with: {formatOCT(opponentStartSnapshot)} OCT
                  </div>
                  
                  <div className={`text-sm font-bold mt-1 ${
                    opponentCurrent > opponentStartSnapshot ? 'text-green-400' : 
                    opponentCurrent < opponentStartSnapshot ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {opponentCurrent > opponentStartSnapshot ? '↑' : opponentCurrent < opponentStartSnapshot ? '↓' : '='} 
                    {formatOCT(opponentCurrent > opponentStartSnapshot 
                      ? opponentCurrent - opponentStartSnapshot 
                      : opponentStartSnapshot - opponentCurrent)} OCT
                  </div>
                  
                  <div className="text-xs text-ethereal-purple mt-1">
                    ROI: {calculateROI(opponentCurrent, opponentStartSnapshot, wagerInOct)}%
                  </div>
                </div>
              ) : (
                <div className="mt-4 text-sm text-gray-500 italic">Waiting for opponent...</div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Charts & Panels */}
        {status === 1 && isParticipant && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <PriceChart octPrice={octPrice} />
            </div>
            <div>
              <TradingPanel duelId={duelId!} octPrice={octPrice} octPriceInCents={octPriceInCents} />
            </div>
          </div>
        )}

        {(status === 1 || status === 2) && (
          <DuelChart
            duelId={duelId!}
            creatorBalance={creatorCurrent}
            opponentBalance={opponentCurrent}
            creatorInitial={creatorStartSnapshot}
            opponentInitial={opponentStartSnapshot}
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


      </div>
    </div>
  );
}