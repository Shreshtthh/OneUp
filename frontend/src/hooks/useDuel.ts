import { useQuery } from '@tanstack/react-query';
import { useSuiClient } from '@mysten/dapp-kit';
import { PACKAGE_ID } from '../lib/constants';

export function useDuel(duelId: string) {
  const client = useSuiClient();
  
  return useQuery({
    queryKey: ['duel', duelId],
    queryFn: async () => {
      console.log('useDuel: Fetching duel data for ID:', duelId);
      
      const duel = await client.getObject({
        id: duelId,
        options: { showContent: true },
      });
      
      console.log('useDuel: Raw duel data:', duel);
      
      if (!duel.data?.content || duel.data.content.dataType !== 'moveObject') {
        console.error('useDuel: Invalid duel data structure:', duel);
        throw new Error('Duel not found');
      }
      
      const fields = (duel.data.content as { fields?: Record<string, unknown> })?.fields;
      
      if (!fields) {
        console.error('useDuel: No fields found in duel data:', duel.data.content);
        throw new Error('Duel fields not found');
      }
      
      console.log('useDuel: Duel fields:', fields);
      
      const wagerValue = (fields.wager_amount || fields.wager) as string || '0';
      console.log('useDuel: Extracted wager value:', wagerValue);
      
      const status = Number(fields.status);
      let finalResults = null;

      // ✅ FIX: If resolved (status === 2), fetch the resolution event
      // This prevents prize payout from polluting ROI calculations
      if (status === 2) {
        console.log('🏆 Duel is resolved, fetching DuelResolved event...');
        const events = await client.queryEvents({
          query: { 
            MoveEventType: `${PACKAGE_ID}::duel::DuelResolved` 
          },
          limit: 50,
          order: 'descending'
        });

        console.log('📡 Found', events.data.length, 'DuelResolved events');
        
        interface DuelResolvedEvent {
          duel_id: string;
          winner: string;
          creator_end: string;
          opponent_end: string;
          creator_score: number;
          opponent_score: number;
        }
        
        const resolutionEvent = events.data.find(
          (e) => (e.parsedJson as DuelResolvedEvent).duel_id === duelId
        );

        if (resolutionEvent) {
          const payload = resolutionEvent.parsedJson as DuelResolvedEvent;
          console.log('✅ Found resolution event:', payload);
          finalResults = {
            creatorEnd: BigInt(payload.creator_end),
            opponentEnd: BigInt(payload.opponent_end),
            winner: payload.winner,
            creatorScore: Number(payload.creator_score),
            opponentScore: Number(payload.opponent_score)
          };
        } else {
          console.warn('⚠️ No resolution event found for duel:', duelId);
        }
      }
      
      const result = {
        id: duelId,
        creator: fields.creator as string,
        opponent: (fields.opponent as { vec?: string[] })?.vec?.[0] || (fields.opponent as string) || null,
        startTime: (fields.start_time as { vec?: number[] })?.vec?.[0] || (fields.start_time as number) || null,
        duration: Number(fields.duration),
        status: status,
        wager: wagerValue,
        winner: (fields.winner as { vec?: string[] })?.vec?.[0] || null,
        finalResults // ✅ Return this new field with pre-payout balances
      };
      
      console.log('useDuel: Returning duel data:', result);
      return result;
    },
    refetchInterval: 3000,
    enabled: !!duelId,
    retry: 3,
    retryDelay: 1000,
  });
}
