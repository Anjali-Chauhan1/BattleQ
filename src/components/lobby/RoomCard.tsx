"use client";

import { motion } from "framer-motion";
import { TrendingUp, ArrowRight, Zap, Target, Users } from "lucide-react";

interface RoomCardProps {
  title: string;
  icon: React.ReactNode;
  entryFee: number;
  avgReward: number;
  stats: string;
  variant: 'blue' | 'purple' | 'pink';
  onClick: () => void;
}

export function RoomCard({ title, icon, entryFee, avgReward, stats, variant, onClick }: RoomCardProps) {
  const neonClass = variant === "blue" ? "neon-border-blue" : variant === "purple" ? "neon-border-purple" : "neon-border-pink";
  const glowColor = variant === "blue" ? "bg-primary/10" : variant === "purple" ? "bg-secondary/10" : "bg-accent/10";
  const textColor = variant === "blue" ? "neon-text-blue" : variant === "purple" ? "neon-text-purple" : "neon-text-pink";

  return (
    <motion.div
      whileHover={{ y: -12, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`glass-panel p-8 relative overflow-hidden group cursor-pointer border-white/5 hover:border-white/20 transition-all duration-500`}
    >
      {/* Dynamic Background Glow */}
      <div className={`absolute -top-12 -right-12 w-48 h-48 blur-[80px] rounded-full transition-all group-hover:opacity-60 duration-700 opacity-20 ${glowColor}`} />

      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-3xl bg-white/5 border border-white/10 group-hover:${neonClass} transition-all duration-500 shadow-inner`}>
          <div className="group-hover:scale-110 transition-transform duration-500 text-white">
            {icon}
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="flex items-center gap-3 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
            <span className="text-[9px] text-gray-500 uppercase font-black tracking-[0.3em]">Entry Stake</span>
          </div>
          <span className="text-3xl font-black italic tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">{entryFee} <span className="text-[10px] font-medium opacity-40 uppercase tracking-[0.3em] ml-1">BQT</span></span>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className={`text-2xl font-black italic uppercase tracking-tighter ${textColor}`}>{title}</h4>

        <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white/5 border border-white/5 w-fit">
          <TrendingUp className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">
            Avg Yield: <span className="text-white">+{avgReward} pts</span>
          </span>
        </div>

        <div className="pt-6 mt-4 border-t border-white/5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-gray-500 font-black uppercase tracking-[0.3em]">Operational Insight</span>
            <ArrowRight className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-500" />
          </div>
          <p className="text-gray-400 text-xs font-medium leading-relaxed italic pr-4">
            &quot;{stats}&quot;
          </p>
        </div>
      </div>

      {/* Decorative corner accent */}
      <div className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none">
        <div className="absolute bottom-4 right-4 w-12 h-[1px] bg-white/10 group-hover:bg-primary/50 transition-colors" />
        <div className="absolute bottom-4 right-4 w-[1px] h-12 bg-white/10 group-hover:bg-primary/50 transition-colors" />
      </div>
    </motion.div>
  );
}
