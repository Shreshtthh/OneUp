import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { Header } from '../components/layout/Header';
import { NeonButton } from '../components/ui/NeonButton';
import { DuelGrid } from '../components/lobby/DuelGrid';
import { CreateDuelModal } from '../components/lobby/CreateDuelModal';
import { useOneChain } from '../hooks/useOneChain';
import { useDuelContract } from '../hooks/useDuelContract';
import { Duel } from '../types';
import { DUEL_STATUS } from '../lib/constants';
import toast from 'react-hot-toast';

export function Lobby() {
  const navigate = useNavigate();
  const account = useCurrentAccount();
  const { activeDuels, refetchEvents } = useOneChain();
  const { joinDuel } = useDuelContract();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'active'>('all');

  const filteredDuels = activeDuels.filter((duel) => {
    if (filter === 'open') return duel.status === DUEL_STATUS.OPEN;
    if (filter === 'active') return duel.status === DUEL_STATUS.ACTIVE;
    return duel.status !== DUEL_STATUS.RESOLVED;
  });

  const stats = {
    totalDuels: activeDuels.length,
    activeBattles: activeDuels.filter(d => d.status === DUEL_STATUS.ACTIVE).length,
    openChallenges: activeDuels.filter(d => d.status === DUEL_STATUS.OPEN).length,
  };

  const handleJoin = async (duel: Duel) => {
    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      await joinDuel(duel.id, duel.wagerAmount);
      refetchEvents();
      navigate(`/arena/${duel.id}`);
    } catch (error) {
      console.error('Join error:', error);
    }
  };

  const handleView = (duel: Duel) => {
    navigate(`/arena/${duel.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyber-darker via-cyber-dark to-black">
      <Header />
      
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 
            className="text-6xl md:text-7xl font-bold mb-4 animate-glow-pulse"
            style={{
              color: '#00f0ff',
              textShadow: '0 0 20px rgba(0, 240, 255, 0.5)',
            }}
          >
            Gladiator Lobby
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            Challenge traders. Prove your strategy. Win the pot.
          </p>

          {account ? (
            <NeonButton onClick={() => setIsCreateModalOpen(true)}>
              🔥 Create Duel
            </NeonButton>
          ) : (
            <p className="text-gray-500">Connect wallet to create duels</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { label: 'Total Duels', value: stats.totalDuels, color: '#00f0ff' },
            { label: 'Active Battles', value: stats.activeBattles, color: '#00ff00' },
            { label: 'Open Challenges', value: stats.openChallenges, color: '#ff00ff' },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="p-6 rounded-xl backdrop-blur-md border transition-all duration-300 hover:scale-105"
              style={{
                background: 'rgba(13, 13, 13, 0.7)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              <div className="text-4xl font-bold mb-2" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-8 justify-center">
          {[
            { label: 'All', value: 'all' },
            { label: 'Open', value: 'open' },
            { label: 'Active', value: 'active' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value as any)}
              className="px-6 py-2 rounded-lg font-medium transition-all duration-300"
              style={{
                background: filter === tab.value
                  ? 'rgba(0, 240, 255, 0.2)'
                  : 'rgba(13, 13, 13, 0.7)',
                color: filter === tab.value ? '#00f0ff' : '#9ca3af',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: filter === tab.value ? '#00f0ff' : 'transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Duel Grid */}
        <DuelGrid duels={filteredDuels} onJoin={handleJoin} onView={handleView} />
      </div>

      <CreateDuelModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          refetchEvents();
          toast.success('Duel created successfully!');
        }}
      />
    </div>
  );
}
