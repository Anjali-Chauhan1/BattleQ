import { create } from 'zustand';

export interface Player {
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
  score?: number;
  level?: number;
  wins?: number;
}

export interface SoloHistory {
  result: 'SUCCESS' | 'FAILED';
  reward: string;
  level: number;
  date: string;
}

export interface SoloGameState {
  level: number;
  unlockedLevel: number;
  movesLeft: number;
  totalMoves: number;
  gridSize: number;
  treasurePos: { x: number; y: number } | null;
  fakeTreasures: Set<string>;
  trapTiles: Set<string>;
  revealedTiles: Set<string>;
  gameStatus: 'selecting' | 'rules' | 'staking' | 'playing' | 'won' | 'lost';
  score: number;
  history: SoloHistory[];
}

interface GameState {
  players: Record<string, Player>;
  matchId: string | null;
  status: 'waiting' | 'starting' | 'playing' | 'ended';
  timeRemaining: number;
  showTutorial: boolean;
  solo: SoloGameState;
  setMatch: (id: string) => void;
  updatePlayers: (players: Record<string, Player>) => void;
  setStatus: (status: GameState['status']) => void;
  setTutorial: (show: boolean) => void;
  startLevel: (level: number) => void;
  setSoloStatus: (status: SoloGameState['gameStatus']) => void;
  clickTile: (x: number, y: number) => void;
  resetSolo: () => void;
  nextLevel: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  players: {},
  matchId: null,
  status: 'waiting',
  timeRemaining: 300,
  showTutorial: false,

  solo: {
    level: 1,
    unlockedLevel: 1,
    movesLeft: 3,
    totalMoves: 3,
    gridSize: 3,
    treasurePos: null,
    fakeTreasures: new Set(),
    trapTiles: new Set(),
    revealedTiles: new Set(),
    gameStatus: 'selecting',
    score: 0,
    history: [],
  },

  setMatch: (id) => set({ matchId: id }),
  updatePlayers: (players) => set({ players }),
  setStatus: (status) => set({ status }),
  setTutorial: (show) => set({ showTutorial: show }),

  setSoloStatus: (status) => set((state) => ({ 
    solo: { ...state.solo, gameStatus: status } 
  })),

  startLevel: (level) => {
    // Show staking screen first
    set((state) => ({ 
      solo: { ...state.solo, level, gameStatus: 'staking' } 
    }));

    // Difficulty Factors:
    // Scale Grid Size: Start at 3x3 for level 1, grow steadily.
    const gridSize = Math.min(3 + Math.floor(level / 2), 10);
    
    // Scale Fakes: Start with few at level 1, increase as level goes up.
    // Level 1: ~1-2, Level 5: ~4-5, Level 10: ~8-9.
    const numFakes = Math.min(Math.floor(Math.random() * 2) + 1 + Math.floor(level / 2), 12);
    
    // Scale Traps: Now start at Level 2 as requested.
    // Level 1: 0, Level 2: 1-2, Level 5: 3-4, Level 10: 6-7.
    const numTraps = level >= 2 ? Math.min(Math.floor(Math.random() * 2) + level - 1, 8) : 0;
    
    // Calculate Moves (The "Chance"):
    // Higher "Chance" (ratio) for lower levels, tighter for higher levels.
    // Level 1: Ratio 0.75 (3 moves for 4 potential spots).
    // Level 5: Ratio 0.40 (Tighter).
    // Level 10: Ratio 0.25 (Very tight).
    const totalPotential = numFakes + 1;
    
    // Add randomness to the move ratio so it's not a direct linear scale
    const baseRatio = Math.max(0.15, 0.85 - (level * 0.07));
    const randomVariance = (Math.random() * 0.2) - 0.1; // +/- 10% randomness
    const moveRatio = baseRatio + randomVariance;
    
    const moves = Math.max(1, Math.min(Math.ceil(totalPotential * moveRatio) + (level < 2 ? 1 : 0), 8));

    const tx = Math.floor(Math.random() * gridSize);
    const ty = Math.floor(Math.random() * gridSize);
    
    const fakes = new Set<string>();
    while (fakes.size < numFakes) {
      const fx = Math.floor(Math.random() * gridSize);
      const fy = Math.floor(Math.random() * gridSize);
      const key = `${fx},${fy}`;
      if ((fx !== tx || fy !== ty) && !fakes.has(key)) {
        fakes.add(key);
      }
    }

    const traps = new Set<string>();
    while (traps.size < numTraps) {
      const rx = Math.floor(Math.random() * gridSize);
      const ry = Math.floor(Math.random() * gridSize);
      const key = `${rx},${ry}`;
      if (key !== `${tx},${ty}` && !fakes.has(key) && !traps.has(key)) {
        traps.add(key);
      }
    }

    set((state) => ({
      solo: {
        ...state.solo,
        gridSize,
        treasurePos: { x: tx, y: ty },
        fakeTreasures: fakes,
        trapTiles: traps,
        revealedTiles: new Set(),
        movesLeft: moves,
        totalMoves: moves,
      }
    }));
  },

  clickTile: (x, y) => {
    const { solo } = get();
    if (solo.gameStatus !== 'playing') return;
    const key = `${x},${y}`;
    if (solo.revealedTiles.has(key)) return;

    const newRevealed = new Set(solo.revealedTiles);
    newRevealed.add(key);
    const isTreasure = solo.treasurePos?.x === x && solo.treasurePos?.y === y;
    const isTrap = solo.trapTiles.has(key);
    let movesUsed = 1;
    if (isTrap) movesUsed = 2;

    const nextMoves = Math.max(0, solo.movesLeft - movesUsed);

    if (isTreasure) {
    
      const stakeAmount = solo.level * 10;
      const winAmount = stakeAmount + (solo.level * 5) - 3;
      
      set((state) => ({
        solo: {
          ...state.solo,
          revealedTiles: newRevealed,
          gameStatus: 'won',
          score: state.solo.score + winAmount,
          unlockedLevel: Math.max(state.solo.unlockedLevel, solo.level + 1),
          history: [
            {
              result: 'SUCCESS' as const,
              reward: `+${winAmount}`,
              level: solo.level,
              date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            },
            ...state.solo.history
          ].slice(0, 5)
        }
      }));
    } else if (nextMoves <= 0) {
      const lossAmount = solo.level * 10;
      set((state) => ({
        solo: {
          ...state.solo,
          revealedTiles: newRevealed,
          movesLeft: 0,
          gameStatus: 'lost',
          // Deduct the stake (10 per level) on loss
          score: Math.max(0, state.solo.score - lossAmount),
          history: [
            {
              result: 'FAILED' as const,
              reward: `-${lossAmount}`,
              level: solo.level,
              date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            },
            ...state.solo.history
          ].slice(0, 5)
        }
      }));
    } else {
      set((state) => ({
        solo: {
          ...state.solo,
          revealedTiles: newRevealed,
          movesLeft: nextMoves
        }
      }));
    }
  },

  resetSolo: () => set((state) => ({
    solo: {
      ...state.solo,
      level: 1,
      unlockedLevel: 1,
      score: 0,
      gameStatus: 'selecting'
    }
  })),

  nextLevel: () => {
    const { solo } = get();
    get().startLevel(solo.level + 1);
  }
}));
