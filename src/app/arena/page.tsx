"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef, useCallback } from "react";
import { useSocket } from "@/hooks/useSocket";
import { useGameStore } from "@/store/useGameStore";
import { getGuestUser } from "@/lib/user";
import { 
    Shield, Swords, Move, Zap, 
    MessageSquare, Users, UserMinus, 
    Coins, ChevronRight, X,
    Target, Activity, Radio, Cpu, TrendingUp
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ActionButton } from "@/components/game/ActionButton";
import { StatItem } from "@/components/ui/StatItem";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { TutorialTour } from "@/components/game/TutorialTour";
import { useInterwovenKit } from "@initia/interwovenkit-react";
import { useBattleQContracts } from "@/lib/contracts";


const GRID_SIZE = 15;
const VIEW_RADIUS = 8; // Re-calibrated for 15x15 grid

export default function Arena() {
    const { socket, isConnected } = useSocket();
    const { players, updatePlayers, matchId, setMatch, status, setStatus } = useGameStore();
    const guestUser = getGuestUser();
    const [selectedCell, setSelectedCell] = useState<{ x: number, y: number } | null>(null);
    const [messages, setMessages] = useState<string[]>([]);
    const [feedback, setFeedback] = useState<{ id: number, text: string }[]>([]);
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams.get("mode") || "solo";
    const [alliances, setAlliances] = useState<Array<{ p1: string; p2: string }>>([]);
    const [incomingAlliance, setIncomingAlliance] = useState<{ from: string; fromName: string } | null>(null);
    const [showTour, setShowTour] = useState(false);
    const [dealerHint, setDealerHint] = useState<{ x: number; y: number } | null>(null);
    const { address } = useInterwovenKit();
    const { startSoloSession, claimRewards } = useBattleQContracts();
    const [soloSessionActive, setSoloSessionActive] = useState(false);
    const [betAmount, setBetAmount] = useState(10);
    
    // Auto-start tutorial on first load
    useEffect(() => {
        const hasSeenTour = localStorage.getItem('battleq_tour_v2');
        if (!hasSeenTour) {
            setShowTour(true);
        }
    }, []);

    const completeTour = () => {
        setShowTour(false);
        localStorage.setItem('battleq_tour_v2', 'true');
    };



    useEffect(() => {
        if (!socket) return;

        socket.emit('join_match', { name: guestUser, role: 'attacker', mode: mode });


        socket.on('player_joined', (data) => {
            updatePlayers(data.players);
            setMatch(data.roomId);
            setStatus('waiting');
            addFeedback("Match Found! Connecting...");
        });

        socket.on('match_started', () => {
            setStatus('playing');
            addFeedback("Battle Start!");
        });

        socket.on('state_update', (data) => {
            updatePlayers(data.players);
            if (data.alliances) setAlliances(data.alliances);
        });

        socket.on('alliance_request', (data) => {
            setIncomingAlliance(data);
            addFeedback(`Alliance Proposed by ${data.fromName}`);
        });

        socket.on('game_event', (data) => {
            console.log('game_event', data);
            if (data.type === 'attack') {
                addFeedback("Attack Successful! +25");
            } else if (data.type === 'betrayal') {
                addFeedback("BETRAYAL DETECTED!");
            } else if (data.type === 'alliance_formed') {
                addFeedback("Alliance Formed! 🤝");
            } else if (data.type === 'alliance_rejected') {
                addFeedback("Alliance Declined ❌");
            } else if (data.type === 'split') {
                addFeedback("Points Shared +25");
            } else if (data.type === 'defend') {
                addFeedback("DEFENSIVE STANCE");
            } else if (data.type === 'dealer_result') {
                if (data.outcome === 'move_win') {
                    addFeedback("ROUND WON - You hit the winning tile");
                } else if (data.outcome === 'move_loss') {
                    addFeedback("ROUND LOST - Wrong tile");
                } else if (data.outcome === 'ignore_true_loss') {
                    addFeedback("ROUND LOST - You ignored a true hint");
                } else if (data.outcome === 'ignore_false_safe') {
                    addFeedback("SAFE - You ignored a false hint");
                }
            }
        });

        socket.on('match_ended', (data) => {
            setStatus('ended');
            // Redirect to result screen after a short delay
            setTimeout(() => {
                router.push('/result');
            }, 3000);
        });

        socket.on('dealer_round', (payload: { hint: { x: number; y: number } }) => {
            console.log('dealer_round', payload);
            setDealerHint(payload.hint);
        });

        return () => {
            socket.off('player_joined');
            socket.off('match_started');
            socket.off('state_update');
            socket.off('match_ended');
            socket.off('game_event');
            socket.off('alliance_request');
            socket.off('dealer_round');
        };
    }, [socket, guestUser, mode]);

    const handleAction = (type: string, payload?: any) => {
        if (!socket || !matchId) return;
        socket.emit('player_action', { roomId: matchId, action: type, ...payload });
        
        if (type === 'move') {
            // Server now validates movement strategic value
        }
    };

    const addFeedback = (text: string) => {
        const id = Date.now();
        setFeedback(prev => [...prev, { id, text }]);
        setTimeout(() => {
            setFeedback(prev => prev.filter(f => f.id !== id));
        }, 5000);
    };

    const me = players[socket?.id || ""];

    return (
      <AuthGuard>
        <main className="h-screen bg-[#020203] flex flex-col overflow-hidden relative font-sans text-white">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
            <div className="absolute inset-x-0 top-0 h-[10vh] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

            {/* Tactical HUD Header */}
            {/* Tactical HUD Header */}
            <header className="h-24 glass-panel border-x-0 border-t-0 z-50 w-full rounded-none bg-black/80 backdrop-blur-3xl sticky top-0">
                <div className="max-w-7xl mx-auto h-full px-8 flex items-center justify-between">
                    <div className="flex items-center gap-12" id="match-id-info">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <Radio className="w-3 h-3 text-primary animate-pulse" />
                                <span className="text-[10px] text-gray-500 uppercase font-black tracking-[0.4em]">Sector ID</span>
                            </div>
                            <span className="text-2xl font-black italic tracking-tighter text-white uppercase">{matchId?.slice(0, 12) || "Initializing..."}</span>
                        </div>
                        
                        <div className="h-12 w-[1px] bg-white/10 hidden md:block" />

                        <div className="flex flex-col gap-1 text-center hidden md:flex">
                            <div className="flex items-center gap-3">
                                <Activity className="w-3 h-3 text-secondary animate-pulse" />
                                <span className="text-[10px] text-gray-500 uppercase font-black tracking-[0.4em]">Tactical Status</span>
                            </div>
                            <span className={`text-2xl font-black italic tracking-tighter uppercase ${status === 'playing' ? 'neon-text-blue' : 'text-yellow-500'}`}>
                                {status === 'playing' ? "Engaged" : "Syncing"}
                            </span>
                        </div>

                        <div className="h-12 w-[1px] bg-white/10 hidden lg:block" />

                        <div className="flex flex-col gap-1 hidden lg:flex">
                            <div className="flex items-center gap-3">
                                <Target className="w-3 h-3 text-accent" />
                                <span className="text-[10px] text-gray-500 uppercase font-black tracking-[0.4em]">Threat Mode</span>
                            </div>
                            <span className={`text-2xl font-black italic tracking-tighter uppercase ${mode === 'stakes' ? 'neon-text-pink' : 'text-primary'}`}>{mode}</span>
                        </div>
                        {address && (
                            <div className="h-12 w-[1px] bg-white/10 hidden lg:block" />
                        )}

                        {address && (
                            <div className="flex flex-col gap-1 hidden lg:flex">
                                <div className="flex items-center gap-3">
                                    <Cpu className="w-3 h-3 text-primary" />
                                    <span className="text-[10px] text-gray-500 uppercase font-black tracking-[0.4em]">Initia ID</span>
                                </div>
                                <span className="text-xs font-black italic tracking-tight text-white">
                                    {`${address.slice(0, 6)}…${address.slice(-4)}.init`}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-10" id="stats-info">
                        <button 
                            onClick={() => setShowTour(true)}
                            className="flex items-center gap-3 px-6 py-4 border border-primary/30 bg-primary/5 hover:bg-primary/20 hover:neon-border-blue transition-all rounded-2xl group shrink-0"
                        >
                            <Zap className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-black text-white group-hover:text-primary uppercase tracking-[0.2em] italic">Guide</span>
                        </button>

                        <div className="h-12 w-[1px] bg-white/10 hidden sm:block" />

                        <div className="flex items-center gap-8 translate-y-1">
                            <StatItem icon={<Shield className="w-6 h-6 text-primary"/>} value={`${me?.hp || 100}`} label="Armor" />
                            {mode !== 'solo' && (
                                <StatItem icon={<Coins className="w-6 h-6 text-secondary"/>} value={me?.reputation || 0} label="Trust" />
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Arena Grid Container */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center p-6 bg-[#010101]">
                {/* Immersive HUD Overlays */}
                <div className="absolute inset-0 pointer-events-none">
                    {/* Corner accents */}
                    <div className="absolute top-8 left-8 w-24 h-24 border-t-2 border-l-2 border-white/5" />
                    <div className="absolute top-8 right-8 w-24 h-24 border-t-2 border-r-2 border-white/5" />
                    <div className="absolute bottom-8 left-8 w-24 h-24 border-b-2 border-l-2 border-white/5" />
                    <div className="absolute bottom-8 right-8 w-24 h-24 border-b-2 border-r-2 border-white/5" />
                    
                    {/* Center Crosshair */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-white/5 rounded-full pointer-events-none opacity-20" />
                </div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    id="arena-grid"
                    className="grid gap-1 bg-[#0a0a0a] p-3 border border-white/10 glass-panel shadow-[0_0_100px_rgba(0,0,0,0.8)] relative"
                    style={{ 
                        gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                        width: 'min(75vh, 85vw)',
                        height: 'min(75vh, 85vw)'
                    }}
                >
                    <div className="scanline" />
                    {/* Render Grid Cells */}
                    {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
                        const x = i % GRID_SIZE;
                        const y = Math.floor(i / GRID_SIZE);
                        const allPlayersHere = Object.values(players).filter(p => p.x === x && p.y === y);
                        const isPlayerHere = allPlayersHere[0];
                        const isMe = allPlayersHere.find(p => p.id === socket?.id);
                        const hasZoneHere = false;

                        const distance = me ? Math.max(Math.abs(x - me.x), Math.abs(y - me.y)) : 0;
                        // In solo mode we expose the full grid so every tile is clickable.
                        const isVisible = mode === 'solo' ? true : (me ? distance <= VIEW_RADIUS : true);
                        
                        // Check if player here is an ally
                        const isAlly = isPlayerHere && socket?.id && alliances.some(a => 
                            (a.p1 === socket.id && a.p2 === isPlayerHere.id) || 
                            (a.p2 === socket.id && a.p1 === isPlayerHere.id)
                        );
                        
                        const movePayload = mode === 'solo' ? { x, y, bet: betAmount } : { x, y };

                        return (
                            <div 
                                key={i}
                                onClick={() => handleAction('move', movePayload)}
                                className={`
                                    relative border border-white/[0.03] rounded-[1px] transition-all cursor-pointer hover:bg-primary/10 overflow-hidden
                                    ${isPlayerHere && isVisible ? 'bg-white/[0.02]' : ''}
                                    ${hasZoneHere && isVisible ? 'bg-yellow-500/[0.03]' : ''}
                                    ${mode === 'solo' && dealerHint && dealerHint.x === x && dealerHint.y === y ? 'border-primary/80 bg-primary/10' : ''}
                                    ${!isVisible ? 'bg-[#030303] opacity-20' : ''}
                                `}
                            >
                                {/* Coordinate label for easier navigation */}
                                <div className="absolute top-[1px] left-[2px] text-[6px] text-gray-600 opacity-50 pointer-events-none font-mono">
                                    {x},{y}
                                </div>
                                <AnimatePresence>
                                    {isPlayerHere && isVisible && (
                                        <motion.div
                                            initial={{ scale: 0, rotate: -45 }}
                                            animate={{ scale: 1, rotate: 0 }}
                                            exit={{ scale: 0 }}
                                            className={`
                                                absolute inset-1/4 rounded-[2px] flex items-center justify-center z-10
                                                ${isMe ? 'bg-primary shadow-[0_0_15px_rgba(0,242,255,0.8)]' : 
                                                  isAlly ? 'bg-secondary' : 
                                                  isPlayerHere.isBot ? 'bg-accent/80' : 'bg-red-500'}
                                            `}
                                        >
                                            <div className="absolute -inset-2 bg-inherit opacity-20 blur-sm rounded-full animate-pulse" />
                                            {isMe ? <Swords className="w-2.5 h-2.5 text-black font-black" /> : 
                                             isAlly ? <Users className="w-2.5 h-2.5 text-white" /> : 
                                             isPlayerHere.isBot ? <Target className="w-2.5 h-2.5 text-white animate-pulse" /> : <UserMinus className="w-2.5 h-2.5 text-white" />}
                                            
                                            {allPlayersHere.length > 1 && (
                                                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white text-[6px] text-black font-black flex items-center justify-center border border-black p-1">
                                                    {allPlayersHere.length}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                
                                {isPlayerHere && isVisible && (
                                    <div className="absolute inset-0 border border-inherit pointer-events-none">
                                        <motion.div 
                                            className={`absolute inset-0 border-[0.5px] opacity-40 shadow-[inset_0_0_8px_rgba(255,255,255,0.05)]
                                                ${isMe ? 'border-primary' : isAlly ? 'border-secondary' : 'border-red-500'}
                                            `} 
                                        />
                                    </div>
                                )}

                                <div className="absolute -bottom-[2px] left-0 right-0 text-[5px] text-center text-gray-500 truncate pointer-events-none uppercase font-black tracking-tighter opacity-70">
                                    {isPlayerHere && isVisible && (isMe ? "DEPLOYED" : isPlayerHere.name)}
                                </div>
                            </div>
                        )
                    })}
                </motion.div>

                {/* Tactical Feedback Overlay */}
                <div className="absolute bottom-10 left-10 flex flex-col gap-3 pointer-events-none z-[100] max-w-sm">
                    <AnimatePresence>
                        {feedback.map(f => (
                            <motion.div
                                key={f.id}
                                initial={{ opacity: 0, x: -30, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.1, x: 20 }}
                                className="px-5 py-3 glass-panel border-primary/20 bg-primary/5 text-primary font-black text-[10px] uppercase tracking-[0.3em] flex items-center gap-3 backdrop-blur-3xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
                            >
                                <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                                <span>{f.text}</span>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {/* Alliance Modal */}
                <AnimatePresence>
                    {incomingAlliance && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-[2px]"
                        >
                            <div className="glass-panel p-10 max-w-md w-full text-center border-secondary/20 shadow-[0_0_100px_rgba(189,0,255,0.15)] relative overflow-hidden">
                                <div className="absolute inset-0 bg-mesh-gradient opacity-10" />
                                <div className="relative z-10">
                                    <div className="w-20 h-20 bg-secondary/10 border border-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Users className="w-8 h-8 text-secondary" />
                                    </div>
                                    <h4 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Tactical Pact Offer</h4>
                                    <p className="text-gray-400 mb-8 font-medium italic leading-relaxed text-sm">
                                        <span className="text-white font-black uppercase text-base">{incomingAlliance.fromName}</span> is requesting a strategic vision link. 
                                        Shared vision and common resource yields will be activated upon acceptance.
                                    </p>
                                    <div className="flex gap-4">
                                        <button 
                                            onClick={() => {
                                                handleAction('alliance_accept', { targetId: incomingAlliance.from });
                                                setIncomingAlliance(null);
                                            }}
                                            className="flex-1 py-4 bg-secondary text-white font-black uppercase text-xs tracking-widest rounded-xl hover:neon-border-purple transition-all shadow-xl"
                                        >
                                            Confirm Pact
                                        </button>
                                        <button 
                                            onClick={() => setIncomingAlliance(null)}
                                            className="flex-1 py-4 bg-white/5 text-white font-black uppercase text-xs tracking-widest rounded-xl hover:bg-white/10 transition-all"
                                        >
                                            Decline
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {showTour && (
                    <TutorialTour 
                        onComplete={completeTour} 
                    />
                )}

                {/* Dealer Hint Panel (Solo mode) */}
                {mode === 'solo' && dealerHint && (
                    <div className="absolute bottom-40 right-10 z-[120] max-w-xs w-full">
                        <div className="glass-panel p-5 border-primary/30 bg-primary/5 shadow-[0_0_40px_rgba(0,242,255,0.3)]">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] uppercase font-black tracking-[0.3em] text-primary">Dealer Hint</span>
                                <Radio className="w-3 h-3 text-primary animate-pulse" />
                            </div>
                            <p className="text-xs text-gray-300 mb-3 font-medium">
                                {`Dealer says the winning tile is at (${dealerHint.x}, ${dealerHint.y}). You can click that tile or any other.`}
                            </p>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mt-1">
                                Match the true winning tile to win, otherwise you lose.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Tactical Interaction Panel */}
                        <div className="h-32 bg-black/90 backdrop-blur-3xl border-t border-white/5 z-50 overflow-hidden">
                                <div className="max-w-7xl mx-auto h-full px-8 flex items-center justify-between">
                                        {mode === 'solo' ? (
                                            <div className="flex items-center justify-between w-full gap-8">
                                                <div className="flex flex-col justify-center gap-2 max-w-xl">
                                                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.35em]">Solo Prediction Mode</span>
                                                    <p className="text-xs text-gray-300">
                                                        Dealer highlights one tile as the winning block. Click any visible tile to take the bet: right tile = win, wrong tile = loss. Or press Ignore to skip this hint.
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 mt-1">
                                                        Ignore a true hint: loss. Ignore a false hint: safe, no win/no loss, next hint.
                                                    </p>
                                                    {address && (
                                                        <p className="text-[10px] text-primary mt-1 font-black uppercase tracking-[0.25em]">
                                                            {soloSessionActive
                                                                ? "Initia Stakes Session Active via InterwovenKit"
                                                                : "Start an Initia stakes session to anchor your rounds on-chain."
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex gap-4 items-center">
                                                    <button
                                                        onClick={() => {
                                                            if (!dealerHint || !matchId || !socket) return;
                                                            handleAction('move', { x: dealerHint.x, y: dealerHint.y, bet: betAmount });
                                                        }}
                                                        className="px-6 py-3 bg-primary text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-white transition-all"
                                                    >
                                                        Trust Hint
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (!matchId || !socket) return;
                                                            handleAction('ignore_hint', { bet: betAmount });
                                                        }}
                                                        className="px-6 py-3 bg-white/5 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-white/10 border border-white/10 transition-all"
                                                    >
                                                        Ignore
                                                    </button>
                                                    {address && (
                                                        <button
                                                            onClick={async () => {
                                                                if (!startSoloSession) return;
                                                                try {
                                                                    // Example fixed stake amount; replace with UI-configurable if needed
                                                                    await startSoloSession("1000000");
                                                                    setSoloSessionActive(true);
                                                                } catch (e) {
                                                                    console.error(e);
                                                                }
                                                            }}
                                                            className="px-6 py-3 bg-secondary text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-secondary/80 transition-all hidden md:inline-flex"
                                                        >
                                                            {soloSessionActive ? "Session Funded" : "Start Stakes Session"}
                                                        </button>
                                                    )}
                                                    {address && soloSessionActive && (
                                                        <button
                                                            onClick={async () => {
                                                                if (!claimRewards) return;
                                                                try {
                                                                    await claimRewards();
                                                                    setSoloSessionActive(false);
                                                                } catch (e) {
                                                                    console.error(e);
                                                                }
                                                            }}
                                                            className="px-6 py-3 bg-primary text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-white transition-all hidden md:inline-flex"
                                                        >
                                                            Withdraw / Settle
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                        <div className="flex gap-4 md:gap-6">
                                        <ActionButton 
                        id="btn-strike"
                        icon={<Swords className="w-5 h-5" />} 
                        label="Engage Strike" 
                        active 
                        color="blue" 
                        onClick={() => {
                            const targetId = Object.keys(players).find(id => {
                                const p = players[id];
                                if (id === socket?.id) return false;
                                const isAlly = alliances.some(a => (a.p1 === socket?.id && a.p2 === id) || (a.p1 === id && a.p2 === socket?.id));
                                if (isAlly) return false;
                                const dist = me ? Math.abs(p.x - me.x) + Math.abs(p.y - me.y) : 100;
                                return dist <= 3;
                            });
                            
                            if (targetId) {
                                handleAction('attack', { targetId });
                            } else {
                                addFeedback("TARGET OUT OF RANGE [3.0]");
                            }
                        }} 
                    />
                    <ActionButton 
                        id="btn-defend"
                        icon={<Shield className="w-5 h-5" />} 
                        label="Deploy Shield" 
                        color="purple" 
                        onClick={() => {
                            handleAction('defend');
                            addFeedback("SHIELD SYSTEMS ACTIVE");
                        }} 
                    />
                    <ActionButton 
                        id="btn-alliance"
                        icon={<Users className="w-5 h-5" />} 
                        label="Pact Link" 
                        color="pink" 
                        onClick={() => {
                            const targets = Object.keys(players).filter(id => id !== socket?.id);
                            const closest = targets.sort((a,b) => {
                                const da = Math.abs(players[a].x - (me?.x||0)) + Math.abs(players[a].y - (me?.y||0));
                                const db = Math.abs(players[b].x - (me?.x||0)) + Math.abs(players[b].y - (me?.y||0));
                                return da - db;
                            })[0];

                            if (closest) {
                                handleAction('alliance_propose', { targetId: closest });
                                addFeedback(`INITIATING LINK WITH ${players[closest].name}...`);
                            } else {
                                addFeedback("NO OPERATIVES DETECTED");
                            }
                        }} 
                    />
                    </div>
                    )}

                    {mode !== 'solo' && (
                    <div className="flex items-center gap-10 glass-panel p-4 px-10 border-white/5 bg-white/[0.02]">
                        <div className="flex flex-col gap-1 hidden sm:flex">
                            <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Strategy Impact</span>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-secondary" />
                                <span className="text-xl font-black italic tracking-tighter uppercase text-white">Alpha-7 Level</span>
                            </div>
                        </div>
                        <div className="h-10 w-[1px] bg-white/10 hidden sm:block" />
                        
                        <div className="flex gap-4">
                            <button 
                                id="btn-pact"
                                onClick={() => {
                                    const targets = Object.keys(players).filter(id => {
                                        if (id === socket?.id) return false;
                                        return !alliances.some(a => (a.p1 === socket?.id && a.p2 === id) || (a.p1 === id && a.p2 === socket?.id));
                                    });
                                    const closest = targets.sort((a,b) => {
                                        const da = Math.abs(players[a].x - (me?.x||0)) + Math.abs(players[a].y - (me?.y||0));
                                        const db = Math.abs(players[b].x - (me?.x||0)) + Math.abs(players[b].y - (me?.y||0));
                                        return da - db;
                                    })[0];

                                    if (closest) {
                                        handleAction('alliance_propose', { targetId: closest });
                                        addFeedback(`NEGOTIATING WITH ${players[closest].name}...`);
                                    } else {
                                        addFeedback("NO VIABLE TARGETS");
                                    }
                                }}
                                className="px-8 py-3 bg-secondary text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:neon-border-purple transition-all italic"
                            >
                                Propose Pact
                            </button>
                            <button 
                                id="btn-snatch"
                                onClick={() => handleAction('snatch')}
                                className="px-8 py-3 bg-accent text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:neon-border-pink transition-all italic shadow-[0_0_20px_rgba(255,0,122,0.2)]"
                            >
                                Snatch Tokens
                            </button>
                            {mode !== 'solo' && (
                                <button 
                                    id="btn-split"
                                    onClick={() => handleAction('split')}
                                    className="px-8 py-3 bg-white/5 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-white/10 border border-white/5 transition-all italic hidden md:block"
                                >
                                    Split Yield
                                </button>
                            )}
                        </div>
                    </div>
                    )}
                </div>
            </div>
        </main>
      </AuthGuard>
    )
}
