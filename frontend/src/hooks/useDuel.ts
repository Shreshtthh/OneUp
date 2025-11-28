import { useQuery } from '@tanstack/react-query';
import { useSuiClient } from '@mysten/dapp-kit';

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
      
      const result = {
        id: duelId,
        creator: fields.creator as string,
        opponent: (fields.opponent as { vec?: string[] })?.vec?.[0] || (fields.opponent as string) || null,
        startTime: (fields.start_time as { vec?: number[] })?.vec?.[0] || (fields.start_time as number) || null,
        duration: Number(fields.duration),
        status: Number(fields.status),
        wager: wagerValue, // ✅ Try both field names
        winner: (fields.winner as { vec?: string[] })?.vec?.[0] || null,
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
