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
  withdrawalUnlocked: boolean;
  stake: number;
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
  setStake: (amount: number) => void;
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
    withdrawalUnlocked: false,
    stake: 50,
  },

  setMatch: (id) => set({ matchId: id }),
  updatePlayers: (players) => set({ players }),
  setStatus: (status) => set({ status }),
  setTutorial: (show) => set({ showTutorial: show }),

  setStake: (amount) => set((state) => ({
    solo: { ...state.solo, stake: amount }
  })),

  setSoloStatus: (status) => set((state) => ({ 
    solo: { ...state.solo, gameStatus: status } 
  })),

  startLevel: (level) => {
    const { solo } = get();
    // Guard against playing levels not yet unlocked
    if (level > solo.unlockedLevel) return;

    // Show staking screen first
    set((state) => ({ 
      solo: { ...state.solo, level, gameStatus: 'staking' } 
    }));

    const isFixedGrid = level > 3;
    const gridSize = isFixedGrid ? 6 : Math.min(3 + Math.floor(level / 2), 10);
    
    // Randomize probabilities: After level 3, we have more fakes and traps
    const numFakes = isFixedGrid
      ? Math.floor(Math.random() * 4) + 12 // Reduced density: 12-15 fakes for 6x6
      : Math.min(Math.floor(Math.random() * 2) + 1 + Math.floor(level / 2), 12);
    
    const numTraps = isFixedGrid
      ? Math.floor(Math.random() * 3) + 7 // Increased danger: 7-9 traps for 6x6
      : (level >= 2 ? Math.min(Math.floor(Math.random() * 2) + level - 1, 8) : 0);
    
    const totalItems = numFakes + 1; // Fakes + 1 Real Treasure
    
    // Moves available: Proportional scaling (Ratio ~0.625 based on 10/16)
    // Providing ~10 chances for 15-16 boxes, scaling dynamically for other totals.
    const targetRatio = 10 / 16;
    let moves = isFixedGrid 
      ? Math.ceil(totalItems * targetRatio)
      : Math.ceil(totalItems * 0.35) + 1;
    
    // Add small random variance (+/- 1) to make games feel unique
    const randomVariance = isFixedGrid ? (Math.floor(Math.random() * 3) - 1) : (Math.floor(Math.random() * 3) - 1); 
    moves = Math.max(isFixedGrid ? 6 : 2, moves + randomVariance);

    // Final Guard: Chances must be less than or equal to the number of scan targets (totalItems)
    moves = Math.min(moves, totalItems);

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

    if (x === solo.treasurePos?.x && y === solo.treasurePos?.y) {
      const isFixedGrid = solo.level > 3;
      const stakeAmount = isFixedGrid ? solo.stake : (solo.level * 10);
      
      // Dynamic scaling: Reward = Stake * Multiplier
      const multiplier = isFixedGrid ? (1.5 + (newRevealed.size * 0.1)) : (1.5 + (solo.level * 0.2));
      const winAmount = Math.floor(stakeAmount * multiplier);
      
      set((state) => {
        const nextUnlockedLevel = Math.max(state.solo.unlockedLevel, solo.level + 1);
        const withdrawalUnlocked = state.solo.withdrawalUnlocked || nextUnlockedLevel > 3;
        
        return {
          solo: {
            ...state.solo,
            revealedTiles: newRevealed,
            gameStatus: 'won',
            score: state.solo.score + winAmount,
            unlockedLevel: nextUnlockedLevel,
            withdrawalUnlocked: withdrawalUnlocked,
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
        };
      });
    } else if (nextMoves <= 0) {
      const stakeAmount = solo.level > 3 ? solo.stake : (solo.level * 10);
      set((state) => ({
        solo: {
          ...state.solo,
          revealedTiles: newRevealed,
          movesLeft: 0,
          gameStatus: 'lost',
          score: Math.max(0, state.solo.score - stakeAmount),
          history: [
            {
              result: 'FAILED' as const,
              reward: `-${stakeAmount}`,
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
      gameStatus: 'selecting',
      withdrawalUnlocked: false,
      stake: 50,
    }
  })),

  nextLevel: () => {
    const { solo } = get();
    const nextLevel = solo.level >= 3 ? 4 : solo.level + 1;
    get().startLevel(nextLevel);
  }
}));
