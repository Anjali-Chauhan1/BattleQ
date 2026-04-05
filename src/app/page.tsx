"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Shield, Target, Zap, Swords, ChevronRight, Globe, TrendingUp } from "lucide-react";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { useState, useEffect } from "react";

export default function Onboarding() {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const handleJoin = () => {
    if (typeof window !== "undefined") {
        if (!localStorage.getItem("battleq_user")) {
          const guestId = `guest_${Math.random().toString(36).substring(2, 8)}`;
          localStorage.setItem("battleq_user", guestId);
        }
    }
    router.push("/lobby");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as any } }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#020203] text-white">
      {/* Cinematic Background Mesh */}
      <div className="absolute inset-0 bg-mesh-gradient opacity-30 animate-aurora pointer-events-none" />
      
      {/* Dynamic Grid Overlay */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 contrast-[120%] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />

      {/* Aurora Glow effects */}
      <div className="absolute top-1/4 -right-1/4 w-[800px] h-[800px] bg-primary/20 blur-[180px] rounded-full animate-aurora" />
      <div className="absolute bottom-1/4 -left-1/4 w-[800px] h-[800px] bg-secondary/15 blur-[180px] rounded-full animate-aurora [animation-delay:4s]" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-7xl mx-auto px-6 py-20 flex flex-col items-center gap-12"
      >
        {/* Subheader Badge */}
        <motion.div variants={itemVariants} className="flex items-center gap-3 glass-panel px-4 py-2 border-white/10 rounded-full bg-white/5">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">Tactical Arena Live</span>
            <div className="h-3 w-[1px] bg-white/20 mx-2" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-1">
                <Globe className="w-3 h-3 text-primary" /> 1,248 Online
            </span>
        </motion.div>

        {/* Main Logo & Headline */}
        <div className="flex flex-col items-center gap-4 text-center">
            <motion.div
                variants={itemVariants}
                animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0, -5, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="w-24 h-24 glass-panel flex items-center justify-center p-6 neon-border-blue mb-2 shadow-[0_0_80px_rgba(0,242,255,0.2)]"
            >
                <Swords className="w-full h-full text-primary" />
            </motion.div>

            <motion.h1 
                variants={itemVariants}
                className="text-7xl md:text-9xl font-black tracking-tighter uppercase italic leading-none"
            >
                BATTLE<span className="neon-text-blue drop-shadow-[0_0_15px_rgba(0,242,255,0.5)]">Q</span>
            </motion.h1>

            <motion.p 
                variants={itemVariants}
                className="text-lg md:text-2xl text-gray-400 max-w-2xl font-medium tracking-tight leading-relaxed italic"
            >
                The behavior-driven <span className="text-white border-b-2 border-primary/40">strategic arena</span>. 
                Adapt. Alliance. Betray. Earn.
            </motion.p>
        </div>

        {/* Action Controls */}
        <motion.div variants={itemVariants} className="flex flex-col items-center gap-6 w-full">
            <motion.button
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleJoin}
                className="group relative px-16 py-6 bg-primary text-black font-black uppercase text-xl italic tracking-[.25em] transition-all overflow-hidden"
            >
                {/* Button inner glow and animations */}
                <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                <span className="relative z-10 flex items-center gap-3">
                    Deploy Operative
                    <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </span>
                
                {/* Cinematic border details */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-black" />
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-black" />
            </motion.button>
            
            <motion.div className="flex gap-12 text-center opacity-40">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Security</span>
                    <span className="text-xs font-bold font-sans">Level-A7 Encrypt</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-secondary">Trust Engine</span>
                    <span className="text-xs font-bold font-sans">Pact-Sync Active</span>
                </div>
            </motion.div>
        </motion.div>

        {/* Grid Features */}
        <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mt-8"
        >
          <FeatureCard 
            icon={<Target className="w-8 h-8 text-primary" />}
            title="Sovereign AI"
            desc="Opponents adapt to your gameplay style in real-time, forcing constant evolution."
          />
          <FeatureCard 
            icon={<TrendingUp className="w-8 h-8 text-secondary" />}
            title="Yield Stakes"
            desc="Earn INIT points by capturing strategic zones and maintaining tactical dominance."
          />
          <FeatureCard 
            icon={<Shield className="w-8 h-8 text-accent" />}
            title="Honor Bound"
            desc="Your Trust score determines your matchmaking rank. Loyalty pays in BATTLEQ."
          />
        </motion.div>

        {/* Footer Credit */}
        <motion.div variants={itemVariants} className="mt-6 flex flex-col items-center gap-2 opacity-30">
            <span className="text-[8px] font-black uppercase tracking-[0.5em]">System Core v2.4.9</span>
            <div className="flex items-center gap-4">
                <div className="w-12 h-[1px] bg-white/20" />
                <div className="w-2 h-2 rotate-45 border border-white" />
                <div className="w-12 h-[1px] bg-white/20" />
            </div>
        </motion.div>
      </motion.div>

      {/* Cinematic Overlays */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
      <div className="scanline" />
    </main>
  );
}
