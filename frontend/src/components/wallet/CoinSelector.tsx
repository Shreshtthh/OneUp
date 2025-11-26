import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { OCT_TYPE } from '../../lib/constants';
import { formatOCT } from '../../lib/utils';

interface CoinSelectorProps {
  selectedAmount: string;
  onSelect: (coinId: string) => void;
}

export function CoinSelector({ selectedAmount }: CoinSelectorProps) {
  const account = useCurrentAccount();
  const client = useSuiClient();

  const { data: coins, isLoading } = useQuery({
    queryKey: ['coins', account?.address],
    queryFn: async () => {
      if (!account) return [];
      const result = await client.getCoins({
        owner: account.address,
        coinType: OCT_TYPE,
      });
      return result.data;
    },
    enabled: !!account,
  });

  const totalBalance = coins?.reduce((sum, coin) => sum + BigInt(coin.balance), 0n) || 0n;

  if (isLoading) {
    return <div className="text-gray-400 text-sm">Loading coins...</div>;
  }

  if (!coins || coins.length === 0) {
    return (
      <div className="text-red-400 text-sm">
        No OCT coins found. Please get testnet tokens first.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-400">
        Available: <span className="text-neon-blue font-bold">{formatOCT(totalBalance)} OCT</span>
      </div>
      
      {Number(selectedAmount) > Number(formatOCT(totalBalance)) && (
        <div className="text-red-400 text-sm">Insufficient balance</div>
      )}
    </div>
  );
}
