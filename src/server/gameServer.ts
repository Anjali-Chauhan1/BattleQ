import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = 3001;

interface PlayerState {
  id: string;
  name: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  role: 'attacker' | 'defender' | 'supporter';
  isBot: boolean;
  score: number;
  reputation: number;
  lastAction: string;
  level: number;
  wins: number;
}

const rooms: Record<string, {
  players: Record<string, PlayerState>;
  status: 'waiting' | 'playing' | 'ended';
  time: number;
  difficulty: number;
  mode: string;
  alliances: Array<{ p1: string; p2: string }>;
  zones: Array<{ x: number; y: number; yield: number }>;
}> = {};

// --- AI ENGINE ---
const AI_BEHAVIORS = {
    BEGINNER: 'beginner',
    AGGRESSIVE: 'aggressive',
    DECEPTIVE: 'deceptive'
};

const AI_NAMES = [
    'NovaTactix', 'ShadowCore_9', 'NeonReaver', 'CyberStryker', 
    'VoidSeer', 'AlphaProtocol', 'GhostOperative', 'Zenith_X',
    'RogueSentinel', 'NexusViper', 'AeroFighter', 'TitanOne'
];

function processAITurn(roomId: string) {
    const room = rooms[roomId];
    if (!room) return;

    Object.values(room.players).forEach(p => {
        if (!p.isBot) return;

        // Simple state machine for AI
        const targets = Object.values(room.players).filter(other => other.id !== p.id);
        const closest = targets.reduce((prev, curr) => {
            const d1 = Math.abs(prev.x - p.x) + Math.abs(prev.y - p.y);
            const d2 = Math.abs(curr.x - p.x) + Math.abs(curr.y - p.y);
            return d1 < d2 ? prev : curr;
        }, targets[0]);

        if (closest) {
            const dist = Math.abs(closest.x - p.x) + Math.abs(closest.y - p.y);
            if (dist <= 1 && Math.random() > 0.3) {
                // Attack
                closest.hp = Math.max(0, closest.hp - 10);
                p.score += 20;
                p.lastAction = 'attack';
                io.to(roomId).emit('game_event', { type: 'attack', from: p.id, to: closest.id });
            } else {
                // Move towards
                if (p.x < closest.x) p.x++;
                else if (p.x > closest.x) p.x--;
                else if (p.y < closest.y) p.y++;
                else if (p.y > closest.y) p.y--;
                p.lastAction = 'move';
            }
        }
    });
}

// --- BEHAVIOR ENGINE (Retention Logic) ---
function applyBehavioralShaping(roomId: string) {
    const room = rooms[roomId];
    if (!room) return;

    // "Near-Win" Placement: If a player is losing, give them a small boost
    Object.values(room.players).forEach(p => {
        if (!p.isBot && p.hp < 20 && Math.random() > 0.7) {
            p.hp += 5; // Survival nudge
            p.score += 5;
            p.reputation += 1;
        }
    });
}

io.on('connection', (socket: Socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_match', (data: { name: string; role: string; level?: number; mode?: string }) => {
    const gameMode = data.mode || 'solo';
    let roomId = Object.keys(rooms).find(r => 
        Object.keys(rooms[r].players).length < 6 && 
        rooms[r].status === 'waiting' &&
        rooms[r].mode === gameMode
    );
    
    if (!roomId) {
      roomId = `room_${gameMode}_${Date.now()}`;
      rooms[roomId] = {
        players: {},
        status: 'waiting',
        time: 300,
        difficulty: (data.level || 1) > 10 ? 2 : 1,
        mode: gameMode,
        alliances: [],
        zones: Array.from({ length: 5 }).map(() => ({ x: Math.floor(Math.random() * 15), y: Math.floor(Math.random() * 15), yield: 50 }))
      };
    }

    const player: PlayerState = {
      id: socket.id,
      name: data.name || `Hero_${socket.id.slice(0, 4)}`,
      x: Math.floor(Math.random() * 15),
      y: Math.floor(Math.random() * 15),
      hp: 100,
      maxHp: 100,
      role: (data.role as any) || 'attacker',
      isBot: false,
      score: 0,
      reputation: 100,
      lastAction: 'joined',
      level: data.level || 1,
      wins: 0
    };

    rooms[roomId].players[socket.id] = player;
    socket.join(roomId);
    
    io.to(roomId).emit('player_joined', { players: rooms[roomId].players, roomId });

    if (Object.keys(rooms[roomId].players).length >= 2) {
      startMatch(roomId);
    }
  });

  socket.on('player_action', (data: { roomId: string; action: string; targetId?: string; x?: number; y?: number }) => {
    const { roomId, action, x, y, targetId } = data;
    const room = rooms[roomId];
    if (!room || !room.players[socket.id]) return;

    const player = room.players[socket.id];
    
    if (action === 'move' && x !== undefined && y !== undefined) {
      player.x = x;
      player.y = y;
      player.lastAction = 'move';
    } 
    else if (action === 'attack' && targetId) {
      const target = room.players[targetId];
      if (target) {
        // Check if allied
        const isAllied = room.alliances.some(a => (a.p1 === socket.id && a.p2 === targetId) || (a.p2 === socket.id && a.p1 === targetId));
        if (isAllied) {
            // Betrayal logic
            room.alliances = room.alliances.filter(a => !((a.p1 === socket.id && a.p2 === targetId) || (a.p2 === socket.id && a.p1 === targetId)));
            player.reputation -= 30;
            io.to(roomId).emit('game_event', { type: 'betrayal', from: player.id, to: target.id });
        }

        const damage = player.role === 'attacker' ? 15 : 10;
        target.hp = Math.max(0, target.hp - damage);
        player.score += 25;
        player.lastAction = 'attack';
        io.to(roomId).emit('game_event', { type: 'attack', from: player.id, to: target.id, damage });
      }
    }
    else if (action === 'alliance_propose' && targetId) {
        const target = room.players[targetId];
        if (target?.isBot) {
            // AI Response logic
            if (Math.random() > 0.6) {
                setTimeout(() => {
                    room.alliances.push({ p1: socket.id, p2: targetId });
                    io.to(roomId).emit('game_event', { type: 'alliance_formed', p1: socket.id, p2: targetId });
                    io.to(roomId).emit('state_update', { players: room.players, alliances: room.alliances, zones: room.zones });
                }, 1000);
            } else {
                io.to(socket.id).emit('game_event', { type: 'alliance_rejected', from: targetId });
            }
        } else {
            io.to(targetId).emit('alliance_request', { from: socket.id, fromName: player.name });
        }
    }
    else if (action === 'alliance_accept' && targetId) {
        room.alliances.push({ p1: socket.id, p2: targetId });
        io.to(roomId).emit('game_event', { type: 'alliance_formed', p1: socket.id, p2: targetId });
    }
    else if (action === 'snatch') {
        const mul = room.mode === 'stakes' ? 2 : 1;
        player.reputation -= (20 * mul);
        player.score += (50 * mul);
        player.lastAction = 'snatch';
        io.to(roomId).emit('game_event', { type: 'betrayal', from: player.id });
    }
    else if (action === 'split') {
        player.reputation += 10;
        player.score += 25; 
        player.lastAction = 'split';
        io.to(roomId).emit('game_event', { type: 'split', from: player.id });
    }
    else if (action === 'defend') {
        player.lastAction = 'defend';
        player.reputation += 2;
        io.to(roomId).emit('game_event', { type: 'defend', from: player.id });
    }

    io.to(roomId).emit('state_update', { players: room.players, alliances: room.alliances, zones: room.zones });
  });

  socket.on('disconnect', () => {
    for (const roomId in rooms) {
      if (rooms[roomId].players[socket.id]) {
        delete rooms[roomId].players[socket.id];
        io.to(roomId).emit('player_left', { players: rooms[roomId].players });
      }
    }
  });
});

function startMatch(roomId: string) {
  const room = rooms[roomId];
  if (room.status === 'playing') return;

  room.status = 'playing';
  io.to(roomId).emit('match_started', { startTime: Date.now() });

  // Matchmaking: Configure Bots based on Room Mode
  const playerCount = Object.keys(room.players).length;
  let targetBots = room.difficulty === 1 ? 4 : 6;
  
  if (room.mode === 'stakes') targetBots = 6;
  if (room.mode === 'alliance') targetBots = 2; // Real players must cooperate to beat less bots
  
  for (let i = 0; i < targetBots - playerCount; i++) {
    const botId = `bot_${Math.random().toString(36).substr(2, 5)}`;
    const randomName = AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)] + `_${Math.floor(Math.random() * 99)}`;
    room.players[botId] = {
        id: botId,
        name: randomName,
        x: Math.floor(Math.random() * 15),
        y: Math.floor(Math.random() * 15),
        hp: 100,
        maxHp: 100,
        role: 'attacker',
        isBot: true,
        score: 0,
        reputation: 100,
        lastAction: 'patrol',
        level: 5,
        wins: 0
    };
  }

  const interval = setInterval(() => {
    if (!rooms[roomId]) {
      clearInterval(interval);
      return;
    }

    room.time -= 1;
    
    // Engine ticks
    processAITurn(roomId);
    applyBehavioralShaping(roomId);

    // Dynamic Zone Migration (Relocate zones every 30s)
    if (room.time % 30 === 0) {
        room.zones = Array.from({ length: 5 }).map(() => ({ 
            x: Math.floor(Math.random() * 20), 
            y: Math.floor(Math.random() * 20), 
            yield: 50 
        }));
        io.to(roomId).emit('game_event', { type: 'zones_shifted' });
    }

    // Resource accumulation logic
    room.zones.forEach(z => {
        const occupiers = Object.values(room.players).filter(p => p.x === z.x && p.y === z.y);
        occupiers.forEach(p => {
            p.score += 5; // Passive yield
            const allianceOccupiers = occupiers.filter(other => 
                other.id !== p.id && room.alliances.some(a => (a.p1 === p.id && a.p2 === other.id) || (a.p1 === other.id && a.p2 === p.id))
            );
            if (allianceOccupiers.length > 0) {
                p.score += 10; // Alliance bonus
                p.reputation += 0.5;
            }
        });
    });

    io.to(roomId).emit('tick', { time: room.time, players: room.players, zones: room.zones, alliances: room.alliances });

    if (room.time <= 0) {
      clearInterval(interval);
      room.status = 'ended';
      io.to(roomId).emit('match_ended', { 
        leaderboard: Object.values(room.players).sort((a,b) => b.score - a.score) 
      });
      // Cleanup room after 1 minute
      setTimeout(() => delete rooms[roomId], 60000);
    }
  }, 1000);
}

httpServer.listen(PORT, () => {
  console.log(`BattleQ Game Engine Running on Port ${PORT}`);
  console.log(`- AI Engine: ONLINE`);
  console.log(`- Behavior Engine: ONLINE`);
  console.log(`- Scoring Engine: ONLINE`);
});
