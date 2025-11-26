import { useCurrentAccount, useConnectWallet, useDisconnectWallet } from '@mysten/dapp-kit';
import { NeonButton } from '../ui/NeonButton';
import { formatAddress } from '../../lib/utils';

export function WalletButton() {
  const currentAccount = useCurrentAccount();
  const { mutate: connect } = useConnectWallet();
  const { mutate: disconnect } = useDisconnectWallet();

  if (currentAccount) {
    return (
      <div className="flex items-center gap-3">
        <div className="px-4 py-2 rounded-lg backdrop-blur-md border" style={{
          background: 'rgba(13, 13, 13, 0.7)',
          borderColor: 'rgba(0, 240, 255, 0.3)',
        }}>
          <span className="text-neon-blue font-mono text-sm">
            {formatAddress(currentAccount.address)}
          </span>
        </div>
        <button
          onClick={() => disconnect()}
          className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <NeonButton onClick={() => connect({ wallet: { name: 'Sui Wallet' } })}>
      Connect Wallet
    </NeonButton>
  );
}
