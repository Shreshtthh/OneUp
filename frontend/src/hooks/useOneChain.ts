import { useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { PACKAGE_ID } from '../lib/constants';
import { Duel, DuelEvent } from '../types';

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
        const data = event.parsedJson as any;
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
        const data = event.parsedJson as any;
        const duel = duelsMap.get(data.duel_id);
        if (duel) {
          duel.opponent = data.opponent;
          duel.startTime = data.start_time;
          duel.status = 1;
        }
      });

      // Process resolved events
      events.resolved.forEach((event) => {
        const data = event.parsedJson as any;
        const duel = duelsMap.get(data.duel_id);
        if (duel) {
          duel.status = 2;
          duel.creatorScore = data.creator_score;
          duel.opponentScore = data.opponent_score;
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
