import { useSignAndExecuteTransaction, useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { PACKAGE_ID, OCT_TYPE, CLOCK_OBJECT } from '../lib/constants';
import toast from 'react-hot-toast';

export function useDuelContract() {
  const client = useSuiClient();
  const account = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const createDuel = async (wagerAmount: string, duration: number) => {
    try {
      if (!account) throw new Error("Wallet not connected");

      const tx = new Transaction();
      
      // ✅ KEEP: Manual Gas Budget (Fixes Dry Run on Testnet)
      tx.setGasBudget(100_000_000);

      // ❌ REMOVE: tx.setSender(...) -> Let the wallet handle this!
      // ❌ REMOVE: tx.setGasPrice(...) -> Let the wallet handle this!

      const amountInMist = BigInt(Math.floor(Number(wagerAmount) * 1_000_000_000));

      // 1. Split Wager from Gas (Native Token Pattern)
      const [wagerCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist)]);

      // 2. Call Contract
      tx.moveCall({
        target: `${PACKAGE_ID}::duel::create`,
        arguments: [
          wagerCoin,
          tx.pure.u64(duration),
        ],
        typeArguments: [OCT_TYPE],
      });

      const result = await signAndExecute({
        transaction: tx,
      });
      
      await client.waitForTransaction({ digest: result.digest });
      toast.success('Duel created successfully!');
      return result;

    } catch (error: unknown) {
      console.error('Create Duel Failed:', error);
      toast.error(error instanceof Error ? error.message : 'Transaction failed');
      throw error;
    }
  };

  const joinDuel = async (duelId: string, wagerAmount: string) => {
    try {
      if (!account) throw new Error("Wallet not connected");

      const tx = new Transaction();
      
      // ✅ KEEP: Manual Gas Budget
      tx.setGasBudget(100_000_000);

      // ✅ Fix for "Insufficient Coin Balance" in join:
      // Ensure we treat wagerAmount as MIST if it comes raw from chain, 
      // OR convert if it comes as user input.
      // Based on your previous errors, Lobby.tsx likely passes the RAW MIST string.
      // Let's handle both safely:
      
      let amountInMist: bigint;
      // If wager looks small (e.g. "0.1"), convert it. If huge (e.g. "100000"), assume MIST.
      if (Number(wagerAmount) < 1000) { 
         amountInMist = BigInt(Math.floor(Number(wagerAmount) * 1_000_000_000));
      } else {
         amountInMist = BigInt(wagerAmount);
      }

      const [wagerCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist)]);

      tx.moveCall({
        target: `${PACKAGE_ID}::duel::join`,
        arguments: [
          tx.object(duelId),
          wagerCoin,
          tx.object(CLOCK_OBJECT),
        ],
        typeArguments: [OCT_TYPE],
      });

      const result = await signAndExecute({
        transaction: tx,
      });

      await client.waitForTransaction({ digest: result.digest });
      toast.success('Joined duel successfully!');
      return result;

    } catch (error: unknown) {
      console.error('Join Duel Failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to join duel');
      throw error;
    }
  };

  const cancelDuel = async (duelId: string) => {
    try {
      const tx = new Transaction();
      tx.setGasBudget(50_000_000); 

      tx.moveCall({
        target: `${PACKAGE_ID}::duel::cancel`,
        arguments: [tx.object(duelId)],
        typeArguments: [OCT_TYPE],
      });

      const result = await signAndExecute({
        transaction: tx,
      });
      
      await client.waitForTransaction({ digest: result.digest });
      toast.success('Duel cancelled');
      return result;
    } catch (error: unknown) {
      console.error('Cancel Duel Failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel');
      throw error;
    }
  }

  return { createDuel, joinDuel, cancelDuel };
}
