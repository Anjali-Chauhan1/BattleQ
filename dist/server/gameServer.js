"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
function parseAllowedOrigins(raw) {
    if (!raw)
        return '*';
    const trimmed = raw.trim();
    if (!trimmed)
        return '*';
    if (trimmed === '*')
        return '*';
    const parts = trimmed
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
    return parts.length <= 1 ? (parts[0] || '*') : parts;
}
const app = (0, express_1.default)();
const PORT = Number((_b = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : process.env.SOCKET_PORT) !== null && _b !== void 0 ? _b : 3001);
const ALLOWED_ORIGINS = parseAllowedOrigins((_c = process.env.SOCKET_CORS_ORIGIN) !== null && _c !== void 0 ? _c : process.env.CORS_ORIGIN);
app.use((0, cors_1.default)({
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
}));
app.get('/healthz', (_req, res) => {
    res.status(200).json({ ok: true });
});
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: ALLOWED_ORIGINS,
        methods: ['GET', 'POST'],
    },
});
io.engine.on('connection_error', (err) => {
    console.warn('Socket.IO connection error', {
        code: err.code,
        message: err.message,
    });
});
const DUEL_GRID_SIZE = 6;
const DUEL_BET_AMOUNT = 50;
const DUEL_MAX_LIVES = 5;
const DUEL_ROOM_CODE_LENGTH = 6;
const DUEL_BET_MIN = 50;
const DUEL_BET_MAX = 200;
const rooms = {};
const duelRoomCodeToRoomId = {};
function normalizeRoomCode(code) {
    return (code || '').trim().toUpperCase();
}
function generateDuelRoomCode() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let attempt = 0; attempt < 25; attempt++) {
        let code = '';
        for (let i = 0; i < DUEL_ROOM_CODE_LENGTH; i++) {
            code += alphabet[Math.floor(Math.random() * alphabet.length)];
        }
        if (!duelRoomCodeToRoomId[code])
            return code;
    }
    return normalizeRoomCode(Math.random().toString(36).slice(2, 2 + DUEL_ROOM_CODE_LENGTH));
}
function normalizeDuelBetAmount(input) {
    const parsed = typeof input === 'number' ? input : Number(input);
    const asInt = Number.isFinite(parsed) ? Math.floor(parsed) : DUEL_BET_MIN;
    return Math.min(DUEL_BET_MAX, Math.max(DUEL_BET_MIN, asInt));
}
function createPlayer(socket, data) {
    const player = {
        id: socket.id,
        name: data.name || `Hero_${socket.id.slice(0, 4)}`,
        x: Math.floor(Math.random() * 15),
        y: Math.floor(Math.random() * 15),
        hp: 100,
        maxHp: 100,
        role: data.role || 'attacker',
        isBot: false,
        score: 0,
        reputation: 100,
        lastAction: 'joined',
        level: data.level || 1,
        wins: 0
    };
    return player;
}
function emitPlayerJoined(roomId) {
    const room = rooms[roomId];
    if (!room)
        return;
    io.to(roomId).emit('player_joined', {
        players: room.players,
        roomId,
        roomCode: room.roomCode,
    });
}
function getDuelPlayers(roomId) {
    const room = rooms[roomId];
    if (!room)
        return [];
    return Object.values(room.players).filter((p) => !p.isBot).slice(0, 2);
}
function emitDuelState(roomId) {
    const room = rooms[roomId];
    if (!room || !room.duelRound)
        return;
    const duelRound = room.duelRound;
    const tiles = [];
    for (let y = 0; y < duelRound.gridSize; y++) {
        for (let x = 0; x < duelRound.gridSize; x++) {
            const key = `${x},${y}`;
            const revealed = Boolean(duelRound.revealed[key]);
            tiles.push({
                x,
                y,
                revealed,
                item: revealed ? duelRound.board[key] : undefined,
            });
        }
    }
    io.to(roomId).emit('duel_state', {
        roomId,
        status: room.status,
        gridSize: duelRound.gridSize,
        tiles,
        turnPlayerId: duelRound.turnPlayerId,
        lives: duelRound.lives,
        maxLives: duelRound.maxLives,
        peekCharges: duelRound.peekCharges,
        winnerId: duelRound.winnerId,
        betAmount: duelRound.betAmount,
        totalPot: duelRound.totalPot,
        players: getDuelPlayers(roomId).map((p) => ({ id: p.id, name: p.name })),
    });
}
function initializeDuelRound(roomId) {
    var _a, _b;
    const room = rooms[roomId];
    if (!room)
        return;
    const duelPlayers = getDuelPlayers(roomId);
    if (duelPlayers.length < 2)
        return;
    const totalTiles = DUEL_GRID_SIZE * DUEL_GRID_SIZE;
    const chestPool = [
        ...Array(8).fill('gun'),
        ...Array(6).fill('health'),
        ...Array(6).fill('skip'),
        ...Array(4).fill('double_kill'),
        ...Array(4).fill('magnifier'),
        ...Array(totalTiles - 28).fill('empty'),
    ];
    for (let i = chestPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [chestPool[i], chestPool[j]] = [chestPool[j], chestPool[i]];
    }
    const board = {};
    const revealed = {};
    let index = 0;
    for (let y = 0; y < DUEL_GRID_SIZE; y++) {
        for (let x = 0; x < DUEL_GRID_SIZE; x++) {
            const key = `${x},${y}`;
            board[key] = chestPool[index] || 'empty';
            revealed[key] = false;
            index += 1;
        }
    }
    const firstTurnPlayer = duelPlayers[Math.floor(Math.random() * duelPlayers.length)].id;
    room.duelRound = {
        gridSize: DUEL_GRID_SIZE,
        board,
        revealed,
        turnPlayerId: firstTurnPlayer,
        lives: {
            [duelPlayers[0].id]: DUEL_MAX_LIVES,
            [duelPlayers[1].id]: DUEL_MAX_LIVES,
        },
        maxLives: DUEL_MAX_LIVES,
        peekCharges: {
            [duelPlayers[0].id]: 0,
            [duelPlayers[1].id]: 0,
        },
        skipNextFor: null,
        winnerId: null,
        betAmount: (_a = room.duelBetAmount) !== null && _a !== void 0 ? _a : DUEL_BET_AMOUNT,
        totalPot: ((_b = room.duelBetAmount) !== null && _b !== void 0 ? _b : DUEL_BET_AMOUNT) * duelPlayers.length,
    };
    io.to(roomId).emit('game_event', {
        type: 'duel_bet_locked',
        betAmount: room.duelRound.betAmount,
        totalPot: room.duelRound.totalPot,
    });
    emitDuelState(roomId);
}
// --- AI ENGINE ---
const AI_NAMES = [
    'NovaTactix', 'ShadowCore_9', 'NeonReaver', 'CyberStryker',
    'VoidSeer', 'AlphaProtocol', 'GhostOperative', 'Zenith_X',
    'RogueSentinel', 'NexusViper', 'AeroFighter', 'TitanOne'
];
function processAITurn(roomId) {
    const room = rooms[roomId];
    if (!room)
        return;
    Object.values(room.players).forEach(p => {
        if (!p.isBot)
            return;
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
            }
            else {
                // Move towards
                if (p.x < closest.x)
                    p.x++;
                else if (p.x > closest.x)
                    p.x--;
                else if (p.y < closest.y)
                    p.y++;
                else if (p.y > closest.y)
                    p.y--;
                p.lastAction = 'move';
            }
        }
    });
}
// --- BEHAVIOR ENGINE (Retention Logic) ---
function applyBehavioralShaping(roomId) {
    const room = rooms[roomId];
    if (!room)
        return;
    // "Near-Win" Placement: If a player is losing, give them a small boost
    Object.values(room.players).forEach(p => {
        if (!p.isBot && p.hp < 20 && Math.random() > 0.7) {
            p.hp += 5; // Survival nudge
            p.score += 5;
            p.reputation += 1;
        }
    });
}
// --- Solo Round Logic (dealer chooses winning tile and hint) ---
function startSoloRound(roomId) {
    const room = rooms[roomId];
    if (!room)
        return;
    const gridLimit = 15;
    const winX = Math.floor(Math.random() * gridLimit);
    const winY = Math.floor(Math.random() * gridLimit);
    const hintTruth = Math.random() > 0.5;
    let hintX = winX;
    let hintY = winY;
    if (!hintTruth) {
        // pick a different random tile
        do {
            hintX = Math.floor(Math.random() * gridLimit);
            hintY = Math.floor(Math.random() * gridLimit);
        } while (hintX === winX && hintY === winY);
    }
    room.soloRound = { winX, winY, hintX, hintY, hintTruth };
    io.to(roomId).emit('dealer_round', {
        hint: { x: hintX, y: hintY },
    });
}
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('check_random_available', (_data, ack) => {
        const roomId = Object.keys(rooms).find(r => Object.keys(rooms[r].players).length < 2 &&
            rooms[r].status === 'waiting' &&
            rooms[r].mode === 'duel' &&
            !rooms[r].isPrivate);
        if (roomId)
            ack === null || ack === void 0 ? void 0 : ack({ available: true, betAmount: rooms[roomId].duelBetAmount });
        else
            ack === null || ack === void 0 ? void 0 : ack({ available: false });
    });
    socket.on('duel_join_random', (data, ack) => {
        const gameMode = 'duel';
        const desiredBet = normalizeDuelBetAmount(data.betAmount);
        let roomId = Object.keys(rooms).find(r => Object.keys(rooms[r].players).length < 2 &&
            rooms[r].status === 'waiting' &&
            rooms[r].mode === gameMode &&
            !rooms[r].isPrivate);
        if (!roomId) {
            roomId = `room_${gameMode}_${Date.now()}`;
            rooms[roomId] = {
                players: {},
                status: 'waiting',
                time: 300,
                difficulty: (data.level || 1) > 10 ? 2 : 1,
                mode: gameMode,
                isPrivate: false,
                duelBetAmount: desiredBet,
            };
        }
        if (!rooms[roomId].duelBetAmount) {
            rooms[roomId].duelBetAmount = desiredBet;
        }
        const player = createPlayer(socket, data);
        rooms[roomId].players[socket.id] = player;
        socket.join(roomId);
        emitPlayerJoined(roomId);
        ack === null || ack === void 0 ? void 0 : ack({ ok: true, roomId });
        const playersCount = Object.keys(rooms[roomId].players).length;
        if (playersCount === 2) {
            // Request stake confirmation from the newly joined player before starting
            rooms[roomId].status = 'awaiting_confirmation';
            // store which player needs to confirm
            rooms[roomId].awaitingConfirmation = socket.id;
            socket.emit('request_stake_confirmation', { roomId, betAmount: rooms[roomId].duelBetAmount });
            // start a timeout to remove the joining player if they don't confirm
            const t = setTimeout(() => {
                const room = rooms[roomId];
                if (!room)
                    return;
                if (room.awaitingConfirmation === socket.id) {
                    // remove player
                    delete room.players[socket.id];
                    delete room.awaitingConfirmation;
                    io.to(roomId).emit('player_left', { players: room.players, roomId, roomCode: room.roomCode });
                }
            }, 20000);
            rooms[roomId].confirmTimer = t;
        }
    });
    socket.on('duel_create_room', (data, ack) => {
        const roomCode = generateDuelRoomCode();
        const roomId = `duel_${roomCode}`;
        const desiredBet = normalizeDuelBetAmount(data.betAmount);
        rooms[roomId] = {
            players: {},
            status: 'waiting',
            time: 300,
            difficulty: (data.level || 1) > 10 ? 2 : 1,
            mode: 'duel',
            isPrivate: true,
            roomCode,
            duelBetAmount: desiredBet,
        };
        duelRoomCodeToRoomId[roomCode] = roomId;
        const player = createPlayer(socket, data);
        rooms[roomId].players[socket.id] = player;
        socket.join(roomId);
        socket.emit('duel_room_created', { roomId, roomCode });
        emitPlayerJoined(roomId);
        ack === null || ack === void 0 ? void 0 : ack({ ok: true, roomId, roomCode });
    });
    socket.on('duel_join_room', (data, ack) => {
        const code = normalizeRoomCode(data.roomCode);
        const roomId = duelRoomCodeToRoomId[code] || `duel_${code}`;
        const room = rooms[roomId];
        const desiredBet = normalizeDuelBetAmount(data.betAmount);
        if (!room || room.mode !== 'duel') {
            socket.emit('duel_join_error', { message: 'Invalid room code' });
            ack === null || ack === void 0 ? void 0 : ack({ ok: false, message: 'Invalid room code' });
            return;
        }
        if (room.status !== 'waiting') {
            socket.emit('duel_join_error', { message: 'Match already started' });
            ack === null || ack === void 0 ? void 0 : ack({ ok: false, message: 'Match already started' });
            return;
        }
        if (Object.keys(room.players).length >= 2) {
            socket.emit('duel_join_error', { message: 'Room is full' });
            ack === null || ack === void 0 ? void 0 : ack({ ok: false, message: 'Room is full' });
            return;
        }
        // We let the player join regardless of the betAmount they passed, because they will be asked to confirm the room's actual betAmount before the match starts.
        if (!room.duelBetAmount) {
            room.duelBetAmount = desiredBet;
        }
        const player = createPlayer(socket, data);
        room.players[socket.id] = player;
        socket.join(roomId);
        emitPlayerJoined(roomId);
        ack === null || ack === void 0 ? void 0 : ack({ ok: true, roomId, roomCode: room.roomCode });
        const playersCount = Object.keys(room.players).length;
        if (playersCount === 2) {
            room.status = 'awaiting_confirmation';
            room.awaitingConfirmation = socket.id;
            socket.emit('request_stake_confirmation', { roomId, betAmount: room.duelBetAmount });
            const t = setTimeout(() => {
                const r = rooms[roomId];
                if (!r)
                    return;
                if (r.awaitingConfirmation === socket.id) {
                    delete r.players[socket.id];
                    delete r.awaitingConfirmation;
                    io.to(roomId).emit('player_left', { players: r.players, roomId, roomCode: r.roomCode });
                }
            }, 20000);
            room.confirmTimer = t;
        }
    });
    socket.on('join_match', (data) => {
        const gameMode = data.mode || 'solo';
        let roomId = Object.keys(rooms).find(r => Object.keys(rooms[r].players).length < (gameMode === 'duel' ? 2 : 6) &&
            rooms[r].status === 'waiting' &&
            rooms[r].mode === gameMode &&
            (gameMode !== 'duel' || !rooms[r].isPrivate));
        if (!roomId) {
            roomId = `room_${gameMode}_${Date.now()}`;
            rooms[roomId] = {
                players: {},
                status: 'waiting',
                time: 300,
                difficulty: (data.level || 1) > 10 ? 2 : 1,
                mode: gameMode
            };
        }
        const player = createPlayer(socket, data);
        rooms[roomId].players[socket.id] = player;
        socket.join(roomId);
        emitPlayerJoined(roomId);
        if (rooms[roomId].mode === 'solo') {
            startMatch(roomId);
        }
        else if (rooms[roomId].mode === 'duel' && Object.keys(rooms[roomId].players).length === 2) {
            startMatch(roomId);
        }
        else if (Object.keys(rooms[roomId].players).length >= 2) {
            startMatch(roomId);
        }
    });
    // Explicit hint request from client to guarantee a dealer response in solo mode
    socket.on('request_dealer_hint', (data) => {
        const { roomId } = data;
        const room = rooms[roomId];
        if (!room)
            return;
        if (room.mode !== 'solo')
            return;
        // Always (re)start a solo round for this request
        startSoloRound(roomId);
    });
    socket.on('request_duel_state', (data) => {
        const room = rooms[data.roomId];
        if (!room || room.mode !== 'duel')
            return;
        emitDuelState(data.roomId);
    });
    socket.on('player_action', (data) => {
        var _a, _b, _c, _d, _e, _f, _g;
        const { roomId, action, x, y, targetId, bet } = data;
        const room = rooms[roomId];
        if (!room || !room.players[socket.id])
            return;
        const player = room.players[socket.id];
        if (room.mode === 'duel' && action === 'peek_tile') {
            const duelRound = room.duelRound;
            if (!duelRound || room.status !== 'playing' || duelRound.winnerId)
                return;
            if (duelRound.turnPlayerId !== player.id)
                return;
            if (((_a = duelRound.peekCharges[player.id]) !== null && _a !== void 0 ? _a : 0) <= 0)
                return;
            if (x === undefined || y === undefined)
                return;
            if (x < 0 || x >= duelRound.gridSize || y < 0 || y >= duelRound.gridSize)
                return;
            const key = `${x},${y}`;
            if (duelRound.revealed[key])
                return;
            duelRound.peekCharges[player.id] = Math.max(0, ((_b = duelRound.peekCharges[player.id]) !== null && _b !== void 0 ? _b : 0) - 1);
            socket.emit('duel_peek_result', {
                x,
                y,
                item: duelRound.board[key],
            });
            io.to(roomId).emit('game_event', { type: 'duel_item', item: 'magnifier_peek', from: player.id });
            emitDuelState(roomId);
            return;
        }
        if (room.mode === 'duel' && action === 'open_chest') {
            const duelRound = room.duelRound;
            const duelPlayers = getDuelPlayers(roomId);
            if (!duelRound || duelPlayers.length < 2)
                return;
            if (duelRound.winnerId || room.status !== 'playing')
                return;
            if (duelRound.turnPlayerId !== player.id)
                return;
            if (x === undefined || y === undefined)
                return;
            if (x < 0 || x >= duelRound.gridSize || y < 0 || y >= duelRound.gridSize)
                return;
            const key = `${x},${y}`;
            if (duelRound.revealed[key])
                return;
            duelRound.revealed[key] = true;
            const item = duelRound.board[key];
            const opponent = duelPlayers.find((p) => p.id !== player.id);
            if (!opponent)
                return;
            if (item === 'gun') {
                duelRound.lives[opponent.id] = Math.max(0, ((_c = duelRound.lives[opponent.id]) !== null && _c !== void 0 ? _c : DUEL_MAX_LIVES) - 1);
                player.lastAction = 'chest_gun';
                io.to(roomId).emit('game_event', { type: 'duel_item', item: 'gun', from: player.id, to: opponent.id });
            }
            else if (item === 'health') {
                duelRound.lives[player.id] = Math.min(duelRound.maxLives, ((_d = duelRound.lives[player.id]) !== null && _d !== void 0 ? _d : DUEL_MAX_LIVES) + 1);
                player.lastAction = 'chest_health';
                io.to(roomId).emit('game_event', { type: 'duel_item', item: 'health', from: player.id });
            }
            else if (item === 'skip') {
                duelRound.skipNextFor = opponent.id;
                player.lastAction = 'chest_skip';
                io.to(roomId).emit('game_event', { type: 'duel_item', item: 'skip', from: player.id, to: opponent.id });
            }
            else if (item === 'double_kill') {
                duelRound.lives[opponent.id] = Math.max(0, ((_e = duelRound.lives[opponent.id]) !== null && _e !== void 0 ? _e : DUEL_MAX_LIVES) - 2);
                player.lastAction = 'chest_double_kill';
                io.to(roomId).emit('game_event', { type: 'duel_item', item: 'double_kill', from: player.id, to: opponent.id });
            }
            else if (item === 'magnifier') {
                duelRound.peekCharges[player.id] = ((_f = duelRound.peekCharges[player.id]) !== null && _f !== void 0 ? _f : 0) + 1;
                player.lastAction = 'chest_magnifier';
                io.to(roomId).emit('game_event', { type: 'duel_item', item: 'magnifier', from: player.id });
            }
            else {
                player.lastAction = 'chest_empty';
                io.to(roomId).emit('game_event', { type: 'duel_item', item: 'empty', from: player.id });
            }
            if (((_g = duelRound.lives[opponent.id]) !== null && _g !== void 0 ? _g : 0) <= 0) {
                duelRound.winnerId = player.id;
                room.status = 'ended';
                player.wins += 1;
                io.to(roomId).emit('match_ended', {
                    leaderboard: duelPlayers
                        .map((p) => { var _a; return ({ ...p, score: (_a = duelRound.lives[p.id]) !== null && _a !== void 0 ? _a : 0 }); })
                        .sort((a, b) => { var _a, _b; return ((_a = duelRound.lives[b.id]) !== null && _a !== void 0 ? _a : 0) - ((_b = duelRound.lives[a.id]) !== null && _b !== void 0 ? _b : 0); }),
                    winnerId: duelRound.winnerId,
                    betAmount: duelRound.betAmount,
                    totalPot: duelRound.totalPot,
                    payout: duelRound.totalPot,
                });
            }
            else {
                let nextTurn = opponent.id;
                if (duelRound.skipNextFor === nextTurn) {
                    duelRound.skipNextFor = null;
                    nextTurn = player.id;
                    io.to(roomId).emit('game_event', { type: 'duel_turn_skipped', skippedPlayerId: opponent.id, by: player.id });
                }
                duelRound.turnPlayerId = nextTurn;
            }
            emitDuelState(roomId);
            return;
        }
        // Solo game rules
        if (room.mode === 'solo' && room.soloRound) {
            const round = room.soloRound;
            const wager = bet !== null && bet !== void 0 ? bet : 10;
            if (action === 'move' && x !== undefined && y !== undefined) {
                const isWinTile = x === round.winX && y === round.winY;
                const clickedHint = x === round.hintX && y === round.hintY;
                let outcome;
                if (isWinTile) {
                    outcome = 'move_win';
                    player.score += wager;
                }
                else {
                    outcome = 'move_loss';
                    player.score -= wager;
                }
                io.to(roomId).emit('game_event', {
                    type: 'dealer_result',
                    outcome,
                    playerId: player.id,
                    clickedHint
                });
                // Start next hint round
                startSoloRound(roomId);
            }
            else if (action === 'ignore_hint') {
                if (round.hintTruth) {
                    // Ignored a true hint -> loss at current wager
                    player.score -= wager;
                    io.to(roomId).emit('game_event', { type: 'dealer_result', outcome: 'ignore_true_loss', playerId: player.id });
                }
                else {
                    // Ignored a false hint -> neutral safe outcome
                    io.to(roomId).emit('game_event', { type: 'dealer_result', outcome: 'ignore_false_safe', playerId: player.id });
                }
                startSoloRound(roomId);
            }
        }
        if (action === 'move' && x !== undefined && y !== undefined) {
            player.x = x;
            player.y = y;
            player.lastAction = 'move';
        }
        else if (action === 'attack' && targetId) {
            const target = room.players[targetId];
            if (target) {
                const damage = player.role === 'attacker' ? 15 : 10;
                target.hp = Math.max(0, target.hp - damage);
                player.score += 25;
                player.lastAction = 'attack';
                io.to(roomId).emit('game_event', { type: 'attack', from: player.id, to: target.id, damage });
            }
        }
        else if (action === 'snatch') {
            player.reputation -= 20;
            player.score += 50;
            player.lastAction = 'snatch';
            io.to(roomId).emit('game_event', { type: 'snatch', from: player.id });
        }
        else if (action === 'defend') {
            player.lastAction = 'defend';
            player.reputation += 2;
            io.to(roomId).emit('game_event', { type: 'defend', from: player.id });
        }
        io.to(roomId).emit('state_update', { players: room.players });
    });
    // Joining player confirms they accept the room stake; only then start the match.
    socket.on('confirm_stake', (data) => {
        const { roomId } = data;
        const room = rooms[roomId];
        if (!room)
            return;
        const waitingFor = room.awaitingConfirmation;
        if (!waitingFor)
            return;
        if (waitingFor !== socket.id)
            return; // only the awaiting player may confirm
        // clear timeout
        if (room.confirmTimer) {
            clearTimeout(room.confirmTimer);
            delete room.confirmTimer;
        }
        delete room.awaitingConfirmation;
        // start the match now
        startMatch(roomId);
    });
    socket.on('disconnect', () => {
        for (const roomId in rooms) {
            if (rooms[roomId].players[socket.id]) {
                delete rooms[roomId].players[socket.id];
                if (rooms[roomId].mode === 'duel' && Object.keys(rooms[roomId].players).length === 0) {
                    const code = rooms[roomId].roomCode;
                    if (code && duelRoomCodeToRoomId[code] === roomId) {
                        delete duelRoomCodeToRoomId[code];
                    }
                    delete rooms[roomId];
                    continue;
                }
                if (rooms[roomId].mode === 'duel' && rooms[roomId].duelRound && rooms[roomId].status === 'playing') {
                    const remaining = getDuelPlayers(roomId);
                    if (remaining.length === 1) {
                        rooms[roomId].duelRound.winnerId = remaining[0].id;
                        rooms[roomId].status = 'ended';
                        io.to(roomId).emit('match_ended', {
                            winnerId: remaining[0].id,
                            leaderboard: remaining,
                            betAmount: rooms[roomId].duelRound.betAmount,
                            totalPot: rooms[roomId].duelRound.totalPot,
                            payout: rooms[roomId].duelRound.totalPot,
                        });
                    }
                    emitDuelState(roomId);
                }
                // If a player who was awaiting confirmation disconnected, clear the timer
                const roomObj = rooms[roomId];
                if (roomObj && roomObj.awaitingConfirmation === socket.id) {
                    if (roomObj.confirmTimer) {
                        clearTimeout(roomObj.confirmTimer);
                        delete roomObj.confirmTimer;
                    }
                    delete roomObj.awaitingConfirmation;
                }
                io.to(roomId).emit('player_left', { players: rooms[roomId].players, roomId, roomCode: rooms[roomId].roomCode });
            }
        }
    });
});
function startMatch(roomId) {
    const room = rooms[roomId];
    if (room.status === 'playing')
        return;
    room.status = 'playing';
    io.to(roomId).emit('match_started', { startTime: Date.now() });
    // Solo mode: simple dealer/round system, no bots or timers
    if (room.mode === 'solo') {
        startSoloRound(roomId);
        return;
    }
    // Duel mode: two-player shared chest grid with turn-based effects
    if (room.mode === 'duel') {
        initializeDuelRound(roomId);
        return;
    }
    // Other modes: original bot-based arena with ticking timer
    const playerCount = Object.keys(room.players).length;
    let targetBots = room.difficulty === 1 ? 4 : 6;
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
        io.to(roomId).emit('tick', { time: room.time, players: room.players });
        if (room.time <= 0) {
            clearInterval(interval);
            room.status = 'ended';
            io.to(roomId).emit('match_ended', {
                leaderboard: Object.values(room.players).sort((a, b) => b.score - a.score)
            });
            // Cleanup room after 1 minute
            setTimeout(() => delete rooms[roomId], 60000);
        }
    }, 1000);
}
httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`BattleQ Game Engine Running on Port ${PORT}`);
    console.log(`- AI Engine: ONLINE`);
    console.log(`- Behavior Engine: ONLINE`);
    console.log(`- Scoring Engine: ONLINE`);
});
//# sourceMappingURL=gameServer.js.map