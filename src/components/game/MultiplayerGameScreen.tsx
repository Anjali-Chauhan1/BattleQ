"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, Crosshair, ShieldPlus, SkipForward, Users, Bomb, Search } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { getGuestUser } from "@/lib/user";

type ChestItem = "gun" | "health" | "skip" | "double_kill" | "magnifier" | "empty";

interface DuelTile {
  x: number;
  y: number;
  revealed: boolean;
  item?: ChestItem;
}

interface DuelPlayer {
  id: string;
  name: string;
}

interface DuelState {
  roomId: string;
  status: "waiting" | "playing" | "ended";
  gridSize: number;
  tiles: DuelTile[];
  turnPlayerId: string | null;
  lives: Record<string, number>;
  maxLives: number;
  peekCharges: Record<string, number>;
  winnerId: string | null;
  betAmount: number;
  totalPot: number;
  players: DuelPlayer[];
}

const itemToIcon: Record<ChestItem, React.ReactNode> = {
  gun: <Crosshair className="w-6 h-6 text-red-400" />,
  health: <ShieldPlus className="w-6 h-6 text-emerald-400" />,
  skip: <SkipForward className="w-6 h-6 text-amber-300" />,
  double_kill: <Bomb className="w-6 h-6 text-fuchsia-400" />,
  magnifier: <Search className="w-6 h-6 text-cyan-300" />,
  empty: <span className="text-xs text-white/30">EMPTY</span>,
};

const itemToLabel: Record<ChestItem, string> = {
  gun: "Gun: -1 life to opponent",
  health: "Health: +1 life (max 5)",
  skip: "Skip: opponent loses next turn",
  double_kill: "Double Kill: -2 lives to opponent",
  magnifier: "Magnifier: inspect one tile without opening",
  empty: "Empty chest",
};

export function MultiplayerGameScreen() {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const [duelState, setDuelState] = useState<DuelState | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("Connecting...");
  const [isPeekMode, setIsPeekMode] = useState(false);
  const [peekedTiles, setPeekedTiles] = useState<Record<string, ChestItem>>({});

  const myId = socket?.id;
  const me = duelState?.players.find((p) => p.id === myId);
  const opponent = duelState?.players.find((p) => p.id !== myId);
  const isMyTurn = Boolean(duelState && myId && duelState.turnPlayerId === myId);
  const winner = duelState?.players.find((p) => p.id === duelState?.winnerId);
  const myPeekCharges = myId ? (duelState?.peekCharges?.[myId] ?? 0) : 0;

  useEffect(() => {
    if (!socket || !isConnected) return;

    const onPlayerJoined = (payload: { roomId: string }) => {
      setRoomId(payload.roomId);
      setStatusText("Waiting for second player...");
      socket.emit("request_duel_state", { roomId: payload.roomId });
    };

    const onMatchStarted = () => {
      setStatusText("Match started");
    };

    const onDuelState = (payload: DuelState) => {
      setDuelState(payload);
      setRoomId(payload.roomId);
      if (payload.status === "waiting") {
        setStatusText("Waiting for second player...");
      } else if (payload.status === "playing") {
        setStatusText(payload.turnPlayerId === socket.id ? "Your turn" : "Opponent turn");
      } else {
        setStatusText("Match ended");
      }
    };

    const onPeekResult = (payload: { x: number; y: number; item: ChestItem }) => {
      const key = `${payload.x}-${payload.y}`;
      setPeekedTiles((prev) => ({ ...prev, [key]: payload.item }));
    };

    const onPlayerLeft = () => {
      setStatusText("Opponent disconnected");
    };

    socket.on("player_joined", onPlayerJoined);
    socket.on("match_started", onMatchStarted);
    socket.on("duel_state", onDuelState);
    socket.on("duel_peek_result", onPeekResult);
    socket.on("player_left", onPlayerLeft);

    const guestUser = getGuestUser();
    socket.emit("join_match", {
      name: guestUser,
      role: "attacker",
      mode: "duel",
    });

    return () => {
      socket.off("player_joined", onPlayerJoined);
      socket.off("match_started", onMatchStarted);
      socket.off("duel_state", onDuelState);
      socket.off("duel_peek_result", onPeekResult);
      socket.off("player_left", onPlayerLeft);
    };
  }, [socket, isConnected]);

  useEffect(() => {
    if (!isMyTurn) {
      setIsPeekMode(false);
    }
  }, [isMyTurn]);

  useEffect(() => {
    setPeekedTiles({});
    setIsPeekMode(false);
  }, [roomId]);

  const sortedTiles = useMemo(() => {
    if (!duelState) return [];
    return [...duelState.tiles].sort((a, b) => a.y - b.y || a.x - b.x);
  }, [duelState]);

  const onTileClick = (x: number, y: number, revealed: boolean) => {
    if (!socket || !roomId || !isMyTurn || revealed || duelState?.status !== "playing") return;

    if (isPeekMode && myPeekCharges > 0) {
      socket.emit("player_action", {
        roomId,
        action: "peek_tile",
        x,
        y,
      });
      setIsPeekMode(false);
      return;
    }

    socket.emit("player_action", {
      roomId,
      action: "open_chest",
      x,
      y,
    });
  };

  return (
    <main className="min-h-screen bg-[#020203] text-white font-mono cyber-grid relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[100] bg-[length:100%_2px,3px_100%]" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 py-6 md:py-10 flex flex-col gap-6 md:gap-10">
        <header className="border border-primary/30 bg-black/60 backdrop-blur-md p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.3em] text-primary font-black uppercase">REALTIME DUEL MODE</p>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight">Shared Chest Grid</h1>
            <p className="text-sm text-white/60 mt-1">Open chests turn-by-turn. First player to reduce opponent to 0 lives wins.</p>
          </div>

          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-white/40">Status</p>
            <p className="text-lg font-black text-primary">{statusText}</p>
            <p className="text-xs uppercase tracking-widest text-white/50 mt-1">
              Fixed Bet: {duelState?.betAmount ?? 10} BQT each
            </p>
            <p className="text-xs uppercase tracking-widest text-emerald-300 mt-1">
              Pot: {duelState?.totalPot ?? 20} BQT
            </p>
            <p className="text-xs uppercase tracking-widest text-cyan-300 mt-1">
              Magnifier Charges: {myPeekCharges}
            </p>
          </div>
        </header>

        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-xs text-white/60 uppercase tracking-widest">
            Lives increased to {duelState?.maxLives ?? 5}. Find Double Kill and Magnifier chests.
          </p>
          <button
            onClick={() => setIsPeekMode((prev) => !prev)}
            disabled={!isMyTurn || myPeekCharges <= 0 || duelState?.status !== "playing"}
            className={`px-4 py-2 text-xs font-black uppercase tracking-widest border transition-all ${
              isPeekMode
                ? "border-cyan-300 text-cyan-300 bg-cyan-300/10"
                : "border-white/25 text-white/80"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            {isPeekMode ? "Peek Mode: ON" : "Use Magnifier"}
          </button>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {[me, opponent].map((player, idx) => {
            const maxLives = duelState?.maxLives ?? 5;
            const lives = player ? (duelState?.lives[player.id] ?? maxLives) : maxLives;
            return (
              <div key={player?.id || idx} className="border border-white/15 bg-black/50 p-4 md:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] tracking-[0.25em] text-white/40 uppercase">{idx === 0 ? "You" : "Opponent"}</p>
                    <p className="text-xl md:text-2xl font-black uppercase tracking-tight">{player?.name || "Waiting..."}</p>
                  </div>
                  <Users className="w-6 h-6 text-primary/80" />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {Array.from({ length: maxLives }).map((_, i) => (
                    <Heart
                      key={i}
                      className={`w-6 h-6 ${i < lives ? "text-red-500 fill-red-500/80" : "text-white/20"}`}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        <section className="border border-primary/25 bg-black/55 p-3 md:p-5">
          <div className="grid gap-2 md:gap-3" style={{ gridTemplateColumns: `repeat(${duelState?.gridSize || 6}, minmax(0, 1fr))` }}>
            {(sortedTiles.length > 0 ? sortedTiles : Array.from({ length: 36 }).map((_, i) => ({
              x: i % 6,
              y: Math.floor(i / 6),
              revealed: false,
              item: undefined,
            }))).map((tile) => (
              <motion.button
                key={`${tile.x}-${tile.y}`}
                whileHover={!tile.revealed && isMyTurn ? { scale: 1.04 } : {}}
                whileTap={!tile.revealed && isMyTurn ? { scale: 0.95 } : {}}
                onClick={() => onTileClick(tile.x, tile.y, tile.revealed)}
                disabled={!isMyTurn || tile.revealed || duelState?.status !== "playing"}
                className={`aspect-square border text-xs font-bold tracking-wide transition-all ${
                  tile.revealed
                    ? "border-primary/50 bg-primary/10"
                    : peekedTiles[`${tile.x}-${tile.y}`]
                      ? "border-cyan-300/70 bg-cyan-300/10"
                    : isMyTurn
                      ? "border-white/20 bg-white/5 hover:border-primary/60"
                      : "border-white/10 bg-white/[0.03]"
                }`}
              >
                {tile.revealed && tile.item
                  ? itemToIcon[tile.item]
                  : peekedTiles[`${tile.x}-${tile.y}`]
                    ? (
                      <div className="flex flex-col items-center gap-1">
                        {itemToIcon[peekedTiles[`${tile.x}-${tile.y}`]]}
                        <span className="text-[9px] text-cyan-300 uppercase">Scanned</span>
                      </div>
                    )
                    : <span className="text-white/50">CHEST</span>}
              </motion.button>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4 text-sm">
          {(["gun", "health", "skip", "double_kill", "magnifier"] as ChestItem[]).map((item) => (
            <div key={item} className="border border-white/15 bg-black/45 p-4 flex items-center gap-3">
              {itemToIcon[item]}
              <p className="text-white/80">{itemToLabel[item]}</p>
            </div>
          ))}
        </section>

        {duelState?.status === "ended" && (
          <section className="border-2 border-primary bg-primary/10 p-6 text-center">
            <p className="text-xs uppercase tracking-[0.25em] text-primary mb-2">Match Ended</p>
            <h2 className="text-3xl font-black uppercase">Winner: {winner?.name || "Unknown"}</h2>
            <p className="mt-2 text-sm uppercase tracking-widest text-emerald-300">
              Winner receives {duelState.totalPot} BQT pot
            </p>
            <button
              onClick={() => router.push("/lobby")}
              className="mt-5 px-6 py-3 bg-primary text-black font-black uppercase tracking-widest"
            >
              Back To Lobby
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
