import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, OCT_TYPE, CLOCK_OBJECT } from '../lib/constants';
import toast from 'react-hot-toast';

export function useDuelContract() {
  const client = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const createDuel = async (wagerAmount: string, duration: number) => {
    try {
      const tx = new Transaction();
      
      const amountInMist = Math.floor(Number(wagerAmount) * 1_000_000_000);
      const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist)]);
      
      tx.moveCall({
        target: `${PACKAGE_ID}::duel::create`,
        arguments: [coin, tx.pure.u64(duration)],
        typeArguments: [OCT_TYPE],
      });

      const result = await signAndExecute({
        transaction: tx,
      });

      await client.waitForTransaction({ digest: result.digest });
      toast.success('Duel created!');
      return result;
    } catch (error: unknown) {
      console.error('Create duel error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create duel');
      throw error;
    }
  };

  const joinDuel = async (duelId: string, wagerAmount: string) => {
    try {
      const tx = new Transaction();
      const amountInMist = Math.floor(Number(wagerAmount) * 1_000_000_000);
      const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist)]);
      
      tx.moveCall({
        target: `${PACKAGE_ID}::duel::join`,
        arguments: [tx.object(duelId), coin, tx.object(CLOCK_OBJECT)],
        typeArguments: [OCT_TYPE],
      });

      const result = await signAndExecute({
        transaction: tx,
      });

      await client.waitForTransaction({ digest: result.digest });
      toast.success('Joined duel!');
      return result;
    } catch (error: unknown) {
      console.error('Join duel error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to join duel');
      throw error;
    }
  };

  return { createDuel, joinDuel };
}
