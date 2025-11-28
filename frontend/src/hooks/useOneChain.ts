import { useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { PACKAGE_ID } from '../lib/constants';
import type { Duel } from '../types';

interface DuelCreatedEvent {
  duel_id: string;
  creator: string;
  wager_amount: string;
  duration: number;
}

interface DuelJoinedEvent {
  duel_id: string;
  creator: string;
  opponent: string;
  start_time: number;
  duration: number;
}

interface DuelResolvedEvent {
  duel_id: string;
  winner: string;
  creator_score: number;
  opponent_score: number;
  creator_start: number;
  creator_end: number;
  opponent_start: number;
  opponent_end: number;
}

export function useOneChain() {
  const client = useSuiClient();

  // Fetch all duel events
  const { data: events, refetch: refetchEvents } = useQuery({
    queryKey: ['duel-events'],
    queryFn: async () => {
      const [created, joined, resolved] = await Promise.all([
        client.queryEvents({
          query: { MoveEventType: `${PACKAGE_ID}::duel::DuelCreated` },
          limit: 50,
          order: 'descending',
        }),
        client.queryEvents({
          query: { MoveEventType: `${PACKAGE_ID}::duel::DuelJoined` },
          limit: 50,
          order: 'descending',
        }),
        client.queryEvents({
          query: { MoveEventType: `${PACKAGE_ID}::duel::DuelResolved` },
          limit: 50,
          order: 'descending',
        }),
      ]);

      return {
        created: created.data,
        joined: joined.data,
        resolved: resolved.data,
      };
    },
    refetchInterval: 5000, // Poll every 5 seconds
  });

  // Get active duels
  const { data: activeDuels } = useQuery({
    queryKey: ['active-duels', events],
    queryFn: async () => {
      if (!events) return [];

      const duelsMap = new Map<string, Duel>();

      // Process created events
      events.created.forEach((event) => {
        const data = event.parsedJson as DuelCreatedEvent;
        duelsMap.set(data.duel_id, {
          id: data.duel_id,
          creator: data.creator,
          opponent: null,
          wagerAmount: data.wager_amount,
          duration: data.duration,
          startTime: null,
          status: 0,
        });
      });

      // Process joined events
      events.joined.forEach((event) => {
        const data = event.parsedJson as DuelJoinedEvent;
        const duel = duelsMap.get(data.duel_id);
        if (duel) {
          duel.opponent = data.opponent;
          duel.startTime = data.start_time;
          duel.status = 1;
        }
      });

      // Process resolved events
      events.resolved.forEach((event) => {
        const data = event.parsedJson as DuelResolvedEvent;
        const duel = duelsMap.get(data.duel_id);
        if (duel) {
          duel.status = 2;
          duel.creatorScore = data.creator_score;
          duel.opponentScore = data.opponent_score;
          duel.winner = data.winner;
          duel.creatorEndValue = data.creator_end.toString();
          duel.opponentEndValue = data.opponent_end.toString();
        }
      });

      return Array.from(duelsMap.values());
    },
    enabled: !!events,
  });

  return {
    activeDuels: activeDuels || [],
    refetchEvents,
  };
}
