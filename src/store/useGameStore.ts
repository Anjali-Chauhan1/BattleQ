import { create } from 'zustand';

interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  role: 'attacker' | 'defender' | 'supporter';
  isBot: boolean;
  teamId?: string;
  reputation: number;
}

interface GameState {
  players: Record<string, Player>;
  matchId: string | null;
  status: 'waiting' | 'starting' | 'playing' | 'ended';
  timeRemaining: number;
  showTutorial: boolean;
  setMatch: (id: string) => void;
  updatePlayers: (players: Record<string, Player>) => void;
  setStatus: (status: GameState['status']) => void;
  setTutorial: (show: boolean) => void;
}

export const useGameStore = create<GameState>((set) => ({
  players: {},
  matchId: null,
  status: 'waiting',
  timeRemaining: 300,
  showTutorial: false,
  setMatch: (id) => set({ matchId: id }),
  updatePlayers: (players) => set({ players }),
  setStatus: (status) => set({ status }),
  setTutorial: (show) => set({ showTutorial: show }),
}));
