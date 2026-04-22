"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Users, User, Rocket, Shield, TrendingUp, Wallet, ChevronRight, LayoutGrid, Zap } from "lucide-react";
import { getGuestUser } from "@/lib/user";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { RoomCard } from "@/components/lobby/RoomCard";
import { useState, useEffect } from "react";

export default function Lobby() {
    const router = useRouter();
    const guestUser = getGuestUser();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as any } }
    };

    return (
        <AuthGuard>
            <main className="min-h-screen bg-[#020203] relative overflow-hidden flex flex-col items-center font-mono cyber-grid">
                {/* Scanline Effect */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[100] bg-[length:100%_2px,3px_100%]" />
                
                <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />

                <div className="relative z-10 w-full max-w-7xl px-8 py-10 flex flex-col gap-12">

                    {/* Premium Navigation Header */}
                    <header className="flex justify-between items-center bg-background/80 p-6 border-2 border-primary/20 backdrop-blur-xl group transition-all duration-500 hover:border-primary/40"
                            style={{ clipPath: 'polygon(0 0, 98% 0, 100% 15%, 100% 100%, 2% 100%, 0 85%)' }}>
                        <div className="flex items-center gap-8">
                            <motion.div
                                whileHover={{ rotate: 90, scale: 1.1 }}
                                className="w-14 h-14 bg-background border-2 border-primary flex items-center justify-center cursor-pointer shadow-[0_0_15px_rgba(0,242,255,0.2)]"
                                style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0 100%, 0 20%)' }}
                            >
                                <LayoutGrid className="text-primary w-6 h-6" />
                            </motion.div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white neon-text">BATTLE<span className="text-primary">Q</span></h2>
                                    <span className="px-3 py-1 bg-primary/20 border border-primary/40 text-[10px] font-black uppercase text-primary tracking-widest animate-pulse">SYSTEM_ACTIVE</span>
                                </div>
                                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-[0.5em] mt-1 ml-1 font-mono">&gt; MAIN_TERMINAL_INPUT</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-10">
                            <div className="hidden md:flex flex-col items-end gap-1">
                                <span className="text-base font-black italic uppercase tracking-[0.2em] text-white/90 font-mono">
                                    {guestUser}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-primary uppercase font-black tracking-widest opacity-70 font-mono">GUEST_AUTH_OK</span>
                                    <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                                </div>
                            </div>

                            <div className="h-10 w-[1px] bg-primary/20" />

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => router.push("/profile")}
                                className="relative w-14 h-14 bg-background border-2 border-secondary flex items-center justify-center group overflow-hidden shadow-[0_0_15px_rgba(188,19,254,0.2)]"
                                style={{ clipPath: 'polygon(0 0, 100% 0, 100% 80%, 80% 100%, 0 100%)' }}
                            >
                                <div className="absolute inset-0 bg-secondary/10 group-hover:bg-secondary/20 transition-colors" />
                                <User className="w-6 h-6 text-secondary group-hover:scale-110 transition-transform" />
                            </motion.button>
                        </div>
                    </header>

                    {/* Strategic Banner */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-5 border-l-4 border-primary/50 pl-8 bg-gradient-to-r from-primary/5 to-transparent"
                    >
                        <div className="space-y-4 max-w-2xl">
                            <div className="flex items-center gap-3">
                                <span className="text-[11px] font-black text-primary uppercase tracking-[.4em] font-mono animate-pulse">SCANNING_AVAILABLE_SECTORS...</span>
                                <div className="h-[1px] w-24 bg-primary/30" />
                            </div>
                            <h3 className="text-6xl md:text-7xl font-black italic tracking-tighter uppercase leading-[0.95]">
                                Engage Your Next <br />
                                <span className="neon-text-blue drop-shadow-[0_0_20px_rgba(0,242,255,0.4)]">Tactical Phase</span>
                            </h3>
                            <p className="text-gray-400 text-lg md:text-xl font-medium max-w-xl italic leading-relaxed">
                                Stake your reputation, form alliances, and out-maneuver your opponents.
                                The behavior-engine adapts with every decision you make.
                            </p>
                        </div>

                        <div className="hidden lg:flex items-center gap-12 glass-panel p-8 pr-12 border-white/5 bg-white/1 min-w-[300px]">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 flex items-center justify-center bg-primary/10 border border-primary/20 rounded-2xl">
                                    <Zap className="w-7 h-7 text-primary" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-2xl font-black italic tracking-tight uppercase leading-none">1.4k</span>
                                    <span className="text-[10px] text-gray-500 font-black tracking-widest uppercase">Global Activity</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Arena Grid */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
                    >
                        <motion.div variants={itemVariants}>
                            <RoomCard
                                title="Solo"
                                icon={<User className="w-10 h-10" />}
                                entryFee={5}
                                avgReward={12}
                                stats="Prediction arena against the Initia dealer."
                                variant="blue"
                                onClick={() => router.push("/arena?mode=solo")}
                            />
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <RoomCard
                                title="Duel"
                                icon={<Users className="w-10 h-10" />}
                                entryFee={10}
                                avgReward={20}
                                stats="2 players, same chest grid, turn-based real-time combat."
                                variant="pink"
                                onClick={() => router.push("/arena?mode=duel")}
                            />
                        </motion.div>
                    </motion.div>

                    {/* Immersive Stats Bar */}
                    <motion.footer
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 glass-panel p-10 flex flex-col md:flex-row items-center justify-between gap-10 border-white/5 bg-mesh-gradient opacity-80 overflow-hidden relative"
                    >
                        {/* Decorative mesh back in footer */}
                        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full translate-y-1/2" />

                        <div className="flex items-center gap-8 relative z-10">
                            <div className="w-20 h-20 rounded-3xl bg-secondary/10 border border-secondary/20 flex items-center justify-center shadow-[0_0_40px_rgba(189,0,255,0.1)]">
                                <Shield className="w-10 h-10 text-secondary" />
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-[10px] text-secondary font-black uppercase tracking-[0.4em]">Combat Profile</h4>
                                <p className="text-3xl font-black italic uppercase tracking-tighter text-white">Strategist Grade-A</p>
                                <div className="flex items-center gap-3">
                                    <div className="h-1 w-32 bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: "75%" }}
                                            transition={{ duration: 1.5, delay: 0.5 }}
                                            className="h-full bg-secondary shadow-[0_0_10px_rgba(189,0,255,0.7)]"
                                        />
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">75% to Grade-S</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-16 relative z-10 pr-6">
                            <div className="text-center md:text-right">
                                <span className="text-4xl font-black italic tracking-tighter text-white block">92.4 <span className="text-sm font-medium opacity-40 uppercase">PTS</span></span>
                                <span className="text-[10px] text-gray-500 font-black uppercase tracking-[.25em] flex items-center justify-end gap-2 mt-1">
                                    <TrendingUp className="w-3 h-3 text-secondary" /> Earn Rate +12%
                                </span>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="px-8 py-3 bg-white text-black font-black uppercase text-xs italic tracking-widest rounded-lg"
                                >
                                    History Logs
                                </motion.button>
                                <span className="text-[8px] text-gray-600 font-black uppercase tracking-widest mr-1 mt-1">Updated 2m ago</span>
                            </div>
                        </div>
                    </motion.footer>
                </div>

                {/* Subtle decorative grid floor */}
                <div className="fixed bottom-0 left-0 w-full h-[30vh] bg-gradient-to-t from-primary/5 via-transparent to-transparent pointer-events-none opacity-40" />
            </main>
        </AuthGuard>
    );
}
