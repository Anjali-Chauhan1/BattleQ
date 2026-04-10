"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { User, Shield, TrendingUp, History, Star, ArrowLeft, Coins, Rocket, Target, Activity, Cpu } from "lucide-react";
import { getGuestUser } from "@/lib/user";
import { Badge } from "@/components/ui/Badge";
import { DashboardStat, HistoryRow } from "@/components/profile/ProfileComponents";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { useGameStore } from "@/store/useGameStore";

export default function Profile() {
  const router = useRouter();
  const guestUser = getGuestUser();
  const { solo } = useGameStore();

  const winRatio = solo.history.length > 0 
    ? ((solo.history.filter(h => h.result === 'SUCCESS').length / solo.history.length) * 100).toFixed(1)
    : "0.0";

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
      <main className="min-h-screen bg-[#020203] relative overflow-hidden flex flex-col items-center">
        {/* Cinematic Backdrop */}
        <div className="absolute inset-0 bg-mesh-gradient opacity-20 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[800px] h-full bg-secondary/5 blur-[150px] -skew-x-12 translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 w-full max-w-7xl px-8 py-10 flex flex-col gap-12">
            
            {/* Header / Nav */}
            <header className="flex justify-between items-center glass-panel p-6 border-white/5 bg-white/[0.02] rounded-3xl">
                <motion.button 
                    whileHover={{ x: -4 }}
                    onClick={() => router.push("/lobby")}
                    className="flex items-center gap-3 text-gray-500 hover:text-white transition-all uppercase font-black text-[10px] tracking-[0.3em] group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> COMMAND LOBBY
                </motion.button>
                <div className="flex flex-col items-end">
                    <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none">OPERATIVE <span className="neon-text-blue">PROFILE</span></h2>
                    <span className="text-[8px] text-gray-600 font-black tracking-[0.5em] uppercase">Security Level 7A</span>
                </div>
            </header>

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-20"
            >
                {/* Left Side: Operative Intelligence */}
                <div className="md:col-span-4 space-y-10">
                    <motion.div variants={itemVariants} className="glass-panel p-10 border-white/10 bg-mesh-gradient opacity-90 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        
                        <div className="relative z-10 flex flex-col items-center text-center gap-6">
                            <motion.div 
                                whileHover={{ scale: 1.05, rotate: 5 }}
                                className="w-40 h-40 glass-panel neon-border-blue rounded-full flex items-center justify-center bg-primary/5 shadow-[0_0_80px_rgba(0,242,255,0.2)] p-2"
                            >
                                <div className="w-full h-full rounded-full border border-primary/20 flex items-center justify-center p-6 bg-white/[0.02]">
                                    <User className="w-full h-full text-white" />
                                </div>
                            </motion.div>
                            
                            <div className="space-y-1">
                                <h3 className="text-4xl font-black italic tracking-tighter uppercase text-white leading-none">{guestUser}</h3>
                                <p className="text-[10px] text-primary font-black uppercase tracking-[0.4em] pt-1">Active Operative</p>
                            </div>
                            
                            <div className="flex flex-col gap-5 w-full mt-4">
                                <div className="flex justify-center gap-3">
                                    <Badge icon={<Shield className="w-4 h-4" />} label="Veteran" color="blue" />
                                    <Badge icon={<Star className="w-4 h-4" />} label="Loyal-Spec" color="purple" />
                                </div>
                                <div className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 italic shadow-inner">
                                    Guest Protocol Enabled
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="glass-panel p-10 border-white/5 bg-white/[0.01]">
                        <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.4em] mb-10 flex items-center gap-4">
                            <Activity className="w-5 h-5 text-primary" /> Intelligence Index
                        </h4>
                        <div className="space-y-8">
                            <div className="flex flex-col gap-2 group cursor-default">
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-primary opacity-50" />
                                        <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest group-hover:text-white transition-colors">Tactical Win Ratio</span>
                                    </div>
                                    <span className="text-2xl font-black italic tracking-tighter text-white">{winRatio}%</span>
                                </div>
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                     <motion.div initial={{ width: 0 }} animate={{ width: `${winRatio}%` }} transition={{ duration: 1, delay: 0.8 }} className="h-full bg-primary" />
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-2 group cursor-default">
                                <div className="flex justify-between items-end">
                                    <div className="flex items-center gap-2">
                                        <Target className="w-4 h-4 text-secondary opacity-50" />
                                        <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest group-hover:text-white transition-colors">Max Level Cleared</span>
                                    </div>
                                    <span className="text-2xl font-black italic tracking-tighter text-white">LVL {solo.unlockedLevel - 1}</span>
                                </div>
                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                     <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((solo.unlockedLevel - 1) * 10, 100)}%` }} transition={{ duration: 1, delay: 1 }} className="h-full bg-secondary" />
                                </div>
                            </div>

                            <div className="flex justify-between items-center py-6 border-t border-white/5 mt-4">
                                <span className="text-[10px] text-primary font-black uppercase tracking-[.25em]">Strategic Rating</span>
                                <span className="px-4 py-1 bg-primary/10 border border-primary/20 rounded-md text-[10px] font-black text-primary uppercase italic">
                                    {Number(winRatio) > 70 ? 'Exceptional-S' : Number(winRatio) > 40 ? 'Operative-B' : 'Recruit-C'}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Right Side: Command Dashboard */}
                <div className="md:col-span-8 space-y-10">
                    
                    <motion.div variants={itemVariants} className="glass-panel p-10 border-white/10 bg-white/[0.02] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                             <Cpu className="w-48 h-48 text-primary" />
                        </div>
                        <h4 className="text-sm font-black text-primary uppercase tracking-[0.3em] mb-10 flex items-center gap-3 relative z-10">
                            <Rocket className="w-5 h-5 animate-pulse" /> Core Integration Status
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
                          <DashboardStat label="Total Credits" value={`${solo.score} BQT`} />
                          <DashboardStat label="Current Tier" value={solo.level > 3 ? "Elite Operative" : "Sector Scout"} />
                          <DashboardStat 
                            label="Withdrawal" 
                            value={solo.withdrawalUnlocked ? "UNLOCKED" : "LOCKED"} 
                            subValue={solo.withdrawalUnlocked ? "PERMANENT ACCESS" : "REQUIRED: PASS LVL 3"}
                          />
                          <DashboardStat label="Status" value="SYNCED" />
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="glass-panel p-12 border-white/5 bg-white/[0.01]">
                        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10">
                          <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <span className="text-6xl md:text-7xl font-black italic uppercase tracking-tighter text-white">LVL <span className="neon-text-purple">{solo.unlockedLevel - 1}</span></span>
                                <div className="h-12 w-[1px] bg-white/10" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.4em]">Rank Class</span>
                                    <span className="text-lg font-black italic tracking-tighter text-secondary uppercase italic">
                                        {solo.unlockedLevel > 10 ? 'Centurion Prime' : solo.unlockedLevel > 5 ? 'Elite Guard' : 'Sector Scout'}
                                    </span>
                                </div>
                            </div>
                            <p className="text-[9px] text-secondary font-black uppercase tracking-[0.5em] animate-pulse">Progressing to Level {solo.unlockedLevel}</p>
                          </div>
                          <span className="text-lg font-black text-gray-400 italic font-sans tracking-tighter">
                            {solo.score} / { (solo.unlockedLevel) * 200 } <span className="text-[10px] text-gray-600 font-black uppercase ml-1">Credits</span>
                          </span>
                        </div>
                        
                        <div className="h-6 w-full bg-white/5 rounded-3xl overflow-hidden mb-4 border border-white/10 p-1 shadow-inner relative">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((solo.score / ((solo.unlockedLevel) * 200)) * 100, 100)}%` }}
                                transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
                                className="h-full bg-gradient-to-r from-primary via-secondary to-accent rounded-2xl relative"
                            >
                                <div className="absolute inset-0 bg-white/20 blur-sm glow-bg-purple opacity-40" />
                                <motion.div animate={{ opacity: [0.3, 0.7, 0.3] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-white/10" />
                            </motion.div>
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="glass-panel p-12 border-white/5">
                        <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.4em] mb-12 flex items-center justify-between">
                          <div className="flex items-center gap-3"><History className="w-5 h-5 text-primary" /> Strategic Mission Log</div>
                          <div className="px-4 py-1 bg-white/5 rounded-md text-[8px] font-black tracking-widest text-gray-600">FILTER: RECENT_OPS</div>
                        </h4>
                        
                        <div className="space-y-6">
                          {solo.history.length > 0 ? (
                            solo.history.map((op, i) => (
                                <HistoryRow 
                                    key={i}
                                    result={op.result === 'SUCCESS' ? 'VICTORY' : 'STAKE_LOSS'}
                                    reward={`${op.reward} BQT`}
                                    mode={`Sector ${op.level}`}
                                    date={op.date}
                                    color={op.result === 'SUCCESS' ? 'green' : 'red'}
                                />
                            ))
                          ) : (
                            <div className="py-10 text-center text-[10px] text-gray-600 font-black uppercase tracking-[0.4em] italic">No mission data found</div>
                          )}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
      </main>
    </AuthGuard>
  );
}
