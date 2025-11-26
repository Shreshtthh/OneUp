import type { Duel } from '../../types';
import { DuelCard } from './DuelCard';
import { useCurrentAccount } from '@mysten/dapp-kit';

interface DuelGridProps {
  duels: Duel[];
  onJoin: (duel: Duel) => void;
  onView: (duel: Duel) => void;
}

export function DuelGrid({ duels, onJoin, onView }: DuelGridProps) {
  const account = useCurrentAccount();

  if (duels.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">⚔️</div>
        <h3 className="text-2xl font-bold text-gray-400 mb-2">No Active Duels</h3>
        <p className="text-gray-500">Be the first to create a challenge!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {duels.map((duel) => (
        <DuelCard
          key={duel.id}
          duel={duel}
          onJoin={onJoin}
          onView={onView}
          currentAddress={account?.address}
        />
      ))}
    </div>
  );
}
