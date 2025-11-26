import type { Duel } from '../../types';
import { GlassCard } from '../ui/GlassCard';
import { formatAddress, formatOCT, formatTimeRemaining } from '../../lib/utils';
import { DUEL_STATUS } from '../../lib/constants';

interface DuelCardProps {
  duel: Duel;
  onJoin: (duel: Duel) => void;
  onView: (duel: Duel) => void;
  currentAddress?: string;
}

export function DuelCard({ duel, onJoin, onView, currentAddress }: DuelCardProps) {
  const isCreator = currentAddress === duel.creator;
  const isOpponent = currentAddress === duel.opponent;
  const canJoin = duel.status === DUEL_STATUS.OPEN && !isCreator;
  const isActive = duel.status === DUEL_STATUS.ACTIVE;
  
  const endTime = duel.startTime ? duel.startTime + duel.duration : null;
  const timeRemaining = endTime ? formatTimeRemaining(endTime) : null;

  return (
    <GlassCard
      className="p-6 hover:border-neon-blue"
      glowColor={isActive ? '#00f0ff' : undefined}
      onClick={() => isActive ? onView(duel) : undefined}
    >
      <div className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span
            className="px-3 py-1 rounded-full text-xs font-bold"
            style={{
              background: duel.status === DUEL_STATUS.OPEN
                ? 'rgba(0, 255, 0, 0.2)'
                : duel.status === DUEL_STATUS.ACTIVE
                ? 'rgba(0, 240, 255, 0.2)'
                : 'rgba(255, 255, 255, 0.2)',
              color: duel.status === DUEL_STATUS.OPEN
                ? '#00ff00'
                : duel.status === DUEL_STATUS.ACTIVE
                ? '#00f0ff'
                : '#ffffff',
            }}
          >
            {duel.status === DUEL_STATUS.OPEN && 'OPEN'}
            {duel.status === DUEL_STATUS.ACTIVE && 'ACTIVE'}
            {duel.status === DUEL_STATUS.RESOLVED && 'ENDED'}
          </span>

          {isActive && timeRemaining && (
            <span className="text-neon-blue font-mono text-sm">
              {timeRemaining}
            </span>
          )}
        </div>

        {/* Wager Amount */}
        <div className="text-center">
          <div className="text-4xl font-bold text-neon-blue">
            {formatOCT(duel.wagerAmount)} OCT
          </div>
          <div className="text-sm text-gray-400 mt-1">Wager Amount</div>
        </div>

        {/* Players */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 text-sm">Creator:</span>
            <span className="text-white font-mono text-sm">
              {formatAddress(duel.creator)}
            </span>
          </div>
          
          {duel.opponent && (
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Opponent:</span>
              <span className="text-white font-mono text-sm">
                {formatAddress(duel.opponent)}
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        {canJoin && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onJoin(duel);
            }}
            className="w-full py-3 rounded-lg font-bold transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #00f0ff 0%, #0099cc 100%)',
              color: '#000',
            }}
          >
            Accept Challenge
          </button>
        )}

        {isActive && (isCreator || isOpponent) && (
          <button
            onClick={() => onView(duel)}
            className="w-full py-3 rounded-lg font-bold border-2 border-neon-blue text-neon-blue hover:bg-neon-blue hover:text-black transition-all duration-300"
          >
            View Battle
          </button>
        )}
      </div>
    </GlassCard>
  );
}
