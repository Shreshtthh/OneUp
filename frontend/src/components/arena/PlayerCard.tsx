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
  // Map color to glow prop that GlassCard accepts
  const getGlow = (colorHex: string): 'cyan' | 'purple' | 'rose' | 'none' => {
    if (colorHex.includes('00f0ff') || colorHex.includes('cyan') || colorHex.includes('blue')) return 'cyan';
    if (colorHex.includes('ff00ff') || colorHex.includes('pink') || colorHex.includes('magenta')) return 'purple';
    if (colorHex.includes('ff0080') || colorHex.includes('rose')) return 'rose';
    return 'none';
  };

  return (
    <GlassCard
      className="p-6"
      glow={getGlow(color)}
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
