import { WalletButton } from '../wallet/WalletButton';
import { Link } from 'react-router-dom';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b" style={{
      background: 'rgba(10, 10, 15, 0.8)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
    }}>
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="text-3xl">⚔️</div>
          <div>
            <h1 className="text-2xl font-bold text-neon-blue">OneChain Colosseum</h1>
            <p className="text-xs text-gray-400">Trading Arena</p>
          </div>
        </Link>

        <WalletButton />
      </div>
    </header>
  );
}
