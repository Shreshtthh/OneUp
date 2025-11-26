import { formatAddress } from '../../lib/utils';

interface VSHeaderProps {
  creator: string;
  opponent?: string;
  timeRemaining: string;
  status: number;
}

export function VSHeader({ creator, opponent, timeRemaining, status }: VSHeaderProps) {
  return (
    <div className="relative mb-12">
      <div className="flex items-center justify-between">
        {/* Creator */}
        <div
          className="flex-1 p-8 rounded-xl backdrop-blur-md border-4 transition-all duration-500 transform hover:scale-105"
          style={{
            background: 'rgba(0, 240, 255, 0.1)',
            borderColor: '#00f0ff',
            boxShadow: '0 0 30px rgba(0, 240, 255, 0.3)',
          }}
        >
          <div className="text-center">
            <div className="text-6xl mb-4">⚔️</div>
            <div className="text-sm text-gray-400 mb-2">CREATOR</div>
            <div className="text-xl font-mono text-neon-blue font-bold">
              {formatAddress(creator)}
            </div>
          </div>
        </div>

        {/* VS Logo */}
        <div className="px-8 relative">
          <div
            className="text-6xl font-bold animate-glow-pulse"
            style={{
              color: '#ff00ff',
              textShadow: '0 0 30px rgba(255, 0, 255, 0.8)',
            }}
          >
            VS
          </div>
          {status === 1 && timeRemaining && (
            <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
              <div className="text-2xl font-mono text-neon-green font-bold">
                {timeRemaining}
              </div>
            </div>
          )}
        </div>

        {/* Opponent */}
        <div
          className="flex-1 p-8 rounded-xl backdrop-blur-md border-4 transition-all duration-500 transform hover:scale-105"
          style={{
            background: opponent ? 'rgba(255, 0, 255, 0.1)' : 'rgba(128, 128, 128, 0.1)',
            borderColor: opponent ? '#ff00ff' : '#666',
            boxShadow: opponent ? '0 0 30px rgba(255, 0, 255, 0.3)' : 'none',
          }}
        >
          <div className="text-center">
            <div className="text-6xl mb-4">{opponent ? '⚔️' : '❓'}</div>
            <div className="text-sm text-gray-400 mb-2">
              {opponent ? 'CHALLENGER' : 'WAITING...'}
            </div>
            <div className="text-xl font-mono font-bold" style={{
              color: opponent ? '#ff00ff' : '#666',
            }}>
              {opponent ? formatAddress(opponent) : '???'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
