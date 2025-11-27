import { useQuery } from '@tanstack/react-query';

export function usePriceOracle() {
  const { data: octPrice } = useQuery({
    queryKey: ['oct-price'],
    queryFn: async () => {
      try {
        // Use CORS proxy for CoinGecko
        const res = await fetch(
          'https://api.allorigins.win/get?url=' + 
          encodeURIComponent('https://api.coingecko.com/api/v3/simple/price?ids=sui&vs_currencies=usd')
        );
        
        if (!res.ok) throw new Error('API failed');
        
        const data = await res.json();
        const parsed = JSON.parse(data.contents);
        
        return parsed.sui?.usd || 1.50;
      } catch (error) {
        console.error('Price fetch error:', error);
        // Fallback to simulated price on error
        return 1.50 + (Math.random() - 0.5) * 0.2;
      }
    },
    refetchInterval: 10000, // Every 10 seconds (avoid rate limits)
    staleTime: 8000,
  });

  return {
    octPrice: octPrice || 1.50,
    octPriceInCents: Math.floor((octPrice || 1.50) * 100),
  };
}
