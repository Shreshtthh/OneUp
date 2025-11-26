import { useParams, useNavigate } from 'react-router-dom';
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Header } from '../components/layout/Header';
import { VSHeader } from '../components/arena/VSHeader';
import { PlayerCard } from '../components/arena/PlayerCard';
import { DuelChart } from '../components/arena/DuelChart';
import { NeonButton } from '../components/ui/NeonButton';
import { formatTimeRemaining } from '../lib/utils';
import { OCT_TYPE } from '../lib/constants';

interface DuelFields {
  creator: string;
  opponent: { vec: string[] };
  wager_amount: string;
  duration: string;
  start_time: { vec: number[] };
  status: number;
}

interface DuelContent {
  dataType: 'moveObject';
  fields: DuelFields;
  type: string;
}

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
      return result;
    },
    refetchInterval: 2000,
    enabled: !!duelId,
  });

  // Fetch live balances
  const { data: creatorBalance } = useQuery({
    queryKey: ['balance', duel?.data?.content],
    queryFn: async () => {
      const content = duel?.data?.content as unknown as DuelContent | undefined;
      const creator = content?.dataType === 'moveObject' ? content.fields.creator : undefined;
      if (!creator) return 0n;
      const coins = await client.getCoins({ owner: creator, coinType: OCT_TYPE });
      return coins.data.reduce((sum, coin) => sum + BigInt(coin.balance), 0n);
    },
    refetchInterval: 3000,
    enabled: !!duel,
  });

  const { data: opponentBalance } = useQuery({
    queryKey: ['balance', duel?.data?.content, 'opponent'],
    queryFn: async () => {
      const content = duel?.data?.content as unknown as DuelContent | undefined;
      const opponent = content?.dataType === 'moveObject' ? content.fields.opponent : undefined;
      if (!opponent || !opponent.vec || opponent.vec.length === 0) return 0n;
      const opponentAddress = opponent.vec[0];
      const coins = await client.getCoins({ owner: opponentAddress, coinType: OCT_TYPE });
      return coins.data.reduce((sum, coin) => sum + BigInt(coin.balance), 0n);
    },
    refetchInterval: 3000,
    enabled: !!duel,
  });

  // Get start balances from duel object
  const creatorStartBalance = duel?.data?.content ? 
    BigInt((duel.data.content as unknown as DuelContent).fields.wager_amount) : 0n;
  const opponentStartBalance = duel?.data?.content ? 
    BigInt((duel.data.content as unknown as DuelContent).fields.wager_amount) : 0n;

  // Update countdown
  useEffect(() => {
    const content = duel?.data?.content as unknown as DuelContent | undefined;
    const fields = content?.dataType === 'moveObject' ? content.fields : undefined;
    if (!fields?.start_time || !fields?.duration) return;

    const interval = setInterval(() => {
      const endTime = Number(fields.start_time.vec[0]) + Number(fields.duration);
      setTimeRemaining(formatTimeRemaining(endTime));
    }, 1000);

    return () => clearInterval(interval);
  }, [duel]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cyber-dark flex items-center justify-center">
        <div className="text-2xl text-neon-blue">Loading Arena...</div>
      </div>
    );
  }

  if (!duel || !duel.data) {
    return (
      <div className="min-h-screen bg-cyber-dark flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <div className="text-2xl text-gray-400 mb-6">Duel Not Found</div>
          <NeonButton onClick={() => navigate('/')}>
            Back to Lobby
          </NeonButton>
        </div>
      </div>
    );
  }

  const content = duel.data.content as unknown as DuelContent;
  const fields = content.dataType === 'moveObject' ? content.fields : undefined;
  if (!fields) return null;

  const creator = fields.creator;
  const opponent = fields.opponent?.vec?.[0];
  const status = fields.status;
  const wagerAmount = fields.wager_amount;

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyber-darker via-cyber-dark to-black">
      <Header />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
          ← Back to Lobby
        </button>

        {/* VS Header */}
        <VSHeader
          creator={creator}
          opponent={opponent}
          timeRemaining={timeRemaining}
          status={status}
        />

        {/* Player Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <PlayerCard
            address={creator}
            label="Creator"
            balance={creatorBalance}
            isCurrentUser={account?.address === creator}
            color="#00f0ff"
          />
          {opponent && (
            <PlayerCard
              address={opponent}
              label="Challenger"
              balance={opponentBalance}
              isCurrentUser={account?.address === opponent}
              color="#ff00ff"
            />
          )}
        </div>

        {/* Chart */}
        {status === 1 && creatorBalance !== undefined && opponentBalance !== undefined && (
          <DuelChart
            creatorBalance={creatorBalance}
            opponentBalance={opponentBalance}
            creatorStartBalance={creatorStartBalance}
            opponentStartBalance={opponentStartBalance}
          />
        )}

        {/* Waiting State */}
        {status === 0 && !opponent && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4 animate-pulse">⏳</div>
            <h3 className="text-2xl font-bold text-gray-400 mb-2">
              Waiting for Opponent...
            </h3>
            <p className="text-gray-500">
              Wager: {Number(wagerAmount) / 1_000_000_000} OCT
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
