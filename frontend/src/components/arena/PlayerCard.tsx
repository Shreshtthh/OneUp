import { formatAddress, formatOCT } from '../../lib/utils';
import { GlassCard } from '../ui/GlassCard';

interface PlayerCardProps {
  address: string;
  label: string;
  balance?: bigint;
  isCurrentUser: boolean;
  color: string;
}

export function PlayerCard({ address, label, balance, isCurrentUser, color }: PlayerCardProps) {
  return (
    <GlassCard
      className="p-6"
      glowColor={color}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">{label}</span>
          {isCurrentUser && (
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{
                background: `${color}40`,
                color,
              }}
            >
              YOU
            </span>
          )}
        </div>

        <div className="text-2xl font-mono" style={{ color }}>
          {formatAddress(address)}
        </div>

        {balance !== undefined && (
          <div>
            <div className="text-sm text-gray-400 mb-1">Current Balance</div>
            <div className="text-3xl font-bold" style={{ color }}>
              {formatOCT(balance)} OCT
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
