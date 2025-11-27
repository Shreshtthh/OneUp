import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { DEX_PACKAGE_ID, DEX_STORAGE_ID, OCT_TYPE, MOCK_USD_TYPE } from '../lib/constants';
import toast from 'react-hot-toast';

export function useMockDex() {
  const account = useCurrentAccount();
  const client = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  const swapOctToUsd = async (octAmount: number, priceInCents: number) => {
    if (!account) {
      toast.error('Please connect wallet');
      return;
    }
    
    try {
      console.log('🔄 Starting swap:', { octAmount, priceInCents, account: account.address });
      
      const tx = new Transaction();
      tx.setGasBudget(100000000);
      
      const amountInMist = BigInt(Math.floor(octAmount * 1_000_000_000));
      console.log('💰 Amount in MIST:', amountInMist.toString());

      // Fetch OCT coins
      const { data: coins } = await client.getCoins({
        owner: account.address,
        coinType: OCT_TYPE,
      });

      console.log('🪙 OCT coins found:', coins.length, 'Total:', coins.reduce((s, c) => s + BigInt(c.balance), 0n).toString());

      if (coins.length === 0) {
        toast.error('No OCT found. Please request from faucet.');
        throw new Error('No OCT found in wallet');
      }

      const primaryCoinInput = tx.object(coins[0].coinObjectId);
      
      if (coins.length > 1) {
        tx.mergeCoins(primaryCoinInput, coins.slice(1).map(c => tx.object(c.coinObjectId)));
      }

      const [coinToSwap] = tx.splitCoins(primaryCoinInput, [amountInMist]);

      console.log('📝 Calling contract:', {
        target: `${DEX_PACKAGE_ID}::mock_dex::swap_token_for_usd`,
        storage: DEX_STORAGE_ID,
        price: priceInCents
      });

      tx.moveCall({
        target: `${DEX_PACKAGE_ID}::mock_dex::swap_token_for_usd`,
        arguments: [
          tx.object(DEX_STORAGE_ID),
          coinToSwap,
          tx.pure.u64(priceInCents),
        ],
        typeArguments: [OCT_TYPE],
      });

      toast.success('Signing transaction...');
      const result = await signAndExecute({ transaction: tx });
      
      console.log('✅ Swap tx:', result.digest);
      
      toast.success('Waiting for confirmation...');
      await client.waitForTransaction({ digest: result.digest });

      toast.success(`✅ Swapped ${octAmount} OCT → USD`);
      return result;

    } catch (error: unknown) {
      console.error('❌ Swap Error:', error);
      const errorObj = error as { message?: string; cause?: unknown; stack?: string };
      console.error('Error details:', {
        message: errorObj.message,
        cause: errorObj.cause,
        stack: errorObj.stack
      });
      toast.error(errorObj.message || 'Swap failed');
      throw error;
    }
  };

  const swapUsdToOct = async (priceInCents: number) => {
    if (!account) return;
    try {
      const tx = new Transaction();
      
      const { data: coins } = await client.getCoins({
        owner: account.address,
        coinType: MOCK_USD_TYPE,
      });

      if (coins.length === 0) throw new Error("No MUSD found.");

      const primaryCoin = tx.object(coins[0].coinObjectId);
      if (coins.length > 1) {
        tx.mergeCoins(primaryCoin, coins.slice(1).map(c => tx.object(c.coinObjectId)));
      }

      tx.moveCall({
        target: `${DEX_PACKAGE_ID}::mock_dex::swap_usd_for_token`,
        arguments: [
          tx.object(DEX_STORAGE_ID),
          primaryCoin,
          tx.pure.u64(priceInCents),
        ],
        typeArguments: [OCT_TYPE],
      });

      const result = await signAndExecute({ transaction: tx });
      await client.waitForTransaction({ digest: result.digest });
      toast.success('Swapped USD → OCT');
      return result;

    } catch (error: unknown) {
      console.error('Swap Error:', error);
      toast.error(error instanceof Error ? error.message : 'Swap failed');
    }
  };
  
  return { swapOctToUsd, swapUsdToOct };
}
