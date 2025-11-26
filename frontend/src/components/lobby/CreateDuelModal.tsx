import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { NeonButton } from '../ui/NeonButton';
import { GlassCard } from '../ui/GlassCard';
import { CoinSelector } from '../wallet/CoinSelector';
import { useDuelContract } from '../../hooks/useDuelContract';
import { DURATION_OPTIONS } from '../../lib/constants';

interface CreateDuelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateDuelModal({ isOpen, onClose, onSuccess }: CreateDuelModalProps) {
  const account = useCurrentAccount();
  const { createDuel } = useDuelContract();
  const [wagerAmount, setWagerAmount] = useState('0.1');
  const [duration, setDuration] = useState(300000); // 5 minutes default
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!account) return;

    setIsCreating(true);
    try {
      await createDuel(wagerAmount, duration);
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <GlassCard className="max-w-md w-full p-8">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-neon-blue mb-2">
              Create Duel
            </h2>
            <p className="text-gray-400 text-sm">
              Challenge traders to a battle
            </p>
          </div>

          {/* Wager Amount */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Wager Amount (OCT)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={wagerAmount}
              onChange={(e) => setWagerAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-black/50 border border-gray-700 text-white focus:border-neon-blue focus:outline-none"
              placeholder="0.1"
            />
            <CoinSelector selectedAmount={wagerAmount} onSelect={() => {}} />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-lg bg-black/50 border border-gray-700 text-white focus:border-neon-blue focus:outline-none"
            >
              {DURATION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isCreating}
              className="flex-1 py-3 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
            >
              Cancel
            </button>
            <NeonButton
              onClick={handleCreate}
              isLoading={isCreating}
              disabled={isCreating || !account}
              className="flex-1"
            >
              {isCreating ? 'Creating...' : 'Create Duel'}
            </NeonButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
