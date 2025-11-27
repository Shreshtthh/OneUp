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
      toast.error('Wallet not connected');
      return;
    }
    
    try {
      console.log('🔄 Starting swap');
      console.log('Amount:', octAmount, 'OCT');
      console.log('Price:', priceInCents, 'cents');
      
      const tx = new Transaction();
      tx.setGasBudget(100000000);
      
      const amountInMist = BigInt(Math.floor(octAmount * 1_000_000_000));
      console.log('Amount in MIST:', amountInMist.toString());

      const { data: coins } = await client.getCoins({
        owner: account.address,
        coinType: OCT_TYPE,
      });

      const totalBalance = coins.reduce((s, c) => s + BigInt(c.balance), 0n);
      console.log('OCT coins found:', coins.length);
      console.log('Total balance:', totalBalance.toString());
      
      if (coins.length === 0) {
        toast.error('No OCT found. Request from faucet.');
        return;
      }

      // ✅ FIX: Need to keep some OCT for gas (at least 0.01 OCT)
      const gasReserve = 10_000_000n; // 0.01 OCT for gas
      const availableForSwap = totalBalance - gasReserve;

      if (availableForSwap < amountInMist) {
        toast.error(
          `Insufficient OCT. Available: ${Number(availableForSwap) / 1_000_000_000}, ` +
          `Need: ${octAmount} (plus 0.01 for gas)`
        );
        return;
      }

      // ✅ Strategy: Use tx.gas for payment, split the swap amount from it
      const [coinToSwap] = tx.splitCoins(tx.gas, [amountInMist]);

      tx.moveCall({
        target: `${DEX_PACKAGE_ID}::mock_dex::swap_token_for_usd`,
        arguments: [
          tx.object(DEX_STORAGE_ID),
          coinToSwap,
          tx.pure.u64(priceInCents),
        ],
        typeArguments: [OCT_TYPE],
      });

      console.log('✍️ Signing transaction...');
      toast.success('Please sign the transaction...');
      
      const result = await signAndExecute({ 
        transaction: tx,
      });
      
      console.log('✅ Transaction submitted:', result.digest);
      
      toast.success('Confirming...');
      await client.waitForTransaction({ 
        digest: result.digest 
      });

      toast.success(`✅ Swapped ${octAmount} OCT → USD`);
      return result;

    } catch (error: unknown) {
      console.error('❌ Swap Error:', error);
      const errorObj = error as { message?: string };
      toast.error(errorObj.message || 'Swap failed');
      throw error;
    }
  };

  const swapUsdToOct = async (priceInCents: number) => {
    if (!account) {
      toast.error('Wallet not connected');
      return;
    }
    
    try {
      console.log('🔄 Starting USD → OCT swap');
      console.log('Price:', priceInCents, 'cents');
      
      const tx = new Transaction();
      tx.setGasBudget(100000000);
      
      const { data: coins } = await client.getCoins({
        owner: account.address,
        coinType: MOCK_USD_TYPE,
      });

      const totalBalance = coins.reduce((s, c) => s + BigInt(c.balance), 0n);
      console.log('MUSD coins found:', coins.length);
      console.log('Total MUSD balance:', totalBalance.toString());

      if (coins.length === 0) {
        toast.error('No MUSD found. Swap OCT to USD first.');
        return;
      }

      // Merge all MUSD coins
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

      console.log('✍️ Signing transaction...');
      toast.success('Please sign the transaction...');
      
      const result = await signAndExecute({ 
        transaction: tx,
      });
      
      console.log('✅ Transaction submitted:', result.digest);
      
      toast.success('Confirming...');
      await client.waitForTransaction({ 
        digest: result.digest 
      });
      
      toast.success('✅ Swapped USD → OCT');
      return result;

    } catch (error: unknown) {
      console.error('❌ Swap Error:', error);
      const errorObj = error as { message?: string };
      toast.error(errorObj.message || 'Swap failed');
      throw error;
    }
  };
  
  return { swapOctToUsd, swapUsdToOct };
}
