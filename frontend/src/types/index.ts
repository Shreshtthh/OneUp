export interface Duel {
  id: string;
  creator: string;
  opponent: string | null;
  wagerAmount: string;
  duration: number;
  startTime: number | null;
  status: number;
  creatorScore?: number;
  opponentScore?: number;
}

export interface DuelEvent {
  type: 'DuelCreated' | 'DuelJoined' | 'DuelResolved' | 'DuelCancelled';
  duel_id: string;
  creator?: string;
  opponent?: string;
  wager_amount?: string;
  duration?: number;
  start_time?: number;
  winner?: string;
  creator_score?: number;
  opponent_score?: number;
}
