"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronRight, ChevronLeft, Target, Shield, Swords, Users, Zap, Coins } from "lucide-react";

interface TourStep {
    targetId?: string;
    title: string;
    content: string;
    icon: React.ReactNode;
    position: "top" | "bottom" | "left" | "right" | "center";
}

const TOUR_STEPS: TourStep[] = [
    {
        title: "Welcome to the Arena",
        content: "You've been deployed to the tactical grid. Your mission: Dominate the sectors and outsmart your opponents.",
        icon: <Target className="w-6 h-6 text-primary" />,
        position: "center"
    },
    {
        targetId: "match-id-info",
        title: "Mission Coordinates",
        content: "This is your unique Match ID. All actions on this grid are synchronized in real-time across the Initia network.",
        icon: <Zap className="w-6 h-6 text-primary" />,
        position: "bottom"
    },
    {
        targetId: "stats-info",
        title: "Vital Signs",
        content: "Monitor your Armor (HP) and Trust (Reputation). Trust is crucial for alliances and affects how AI bots perceive you.",
        icon: <Shield className="w-6 h-6 text-secondary" />,
        position: "bottom"
    },
    {
        targetId: "arena-grid",
        title: "The Battle Grid",
        content: "Click any visible tile to move. You have a vision radius of 12 cells. Capture YELLOW zones for passive XP.",
        icon: <Target className="w-6 h-6 text-accent" />,
        position: "right"
    },
    {
        targetId: "btn-strike",
        title: "Strike Protocol",
        content: "Use STRIKE to engage enemies within 3 cells. Successful attacks grant points but risk retaliation.",
        icon: <Swords className="w-6 h-6 text-primary" />,
        position: "top"
    },
    {
        targetId: "btn-defend",
        title: "Shield Up",
        content: "DEFEND to reduce incoming damage for the next few seconds. Timing is everything in the arena.",
        icon: <Shield className="w-6 h-6 text-secondary" />,
        position: "top"
    },
    {
        targetId: "btn-alliance",
        title: "Strategic Pacts",
        content: "Propose an ALLIANCE to nearby players. Allies share vision and resource yields, doubling your efficiency.",
        icon: <Users className="w-6 h-6 text-pink-500" />,
        position: "top"
    },
    {
        targetId: "btn-snatch",
        title: "The Betrayal",
        content: "Feeling greedy? SNATCH tokens to steal rewards from your ally. It boosts points but destroys your Trust score.",
        icon: <Coins className="w-6 h-6 text-yellow-500" />,
        position: "top"
    },
    {
        targetId: "btn-pact",
        title: "Diplomatic Pacts",
        content: "Draft a formal agreement with another operative. Pact members share vision and can perform high-yield split actions.",
        icon: <Users className="w-6 h-6 text-secondary" />,
        position: "top"
    },
    {
        targetId: "btn-split",
        title: "Fair Share",
        content: "Choose to SPLIT rewards with your ally for a steady, low-risk growth strategy. It builds maximum Trust.",
        icon: <Zap className="w-6 h-6 text-primary" />,
        position: "top"
    },
    {
        title: "Begin Mission",
        content: "The fog of war is lifting. Choose your strategy wisely. Good luck, Operative.",
        icon: <Zap className="w-6 h-6 text-primary" />,
        position: "center"
    }
];

interface TutorialTourProps {
    onComplete: () => void;
}

export function TutorialTour({ onComplete }: TutorialTourProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
    const step = TOUR_STEPS[currentStep];
    const [viewSize, setViewSize] = useState({ w: 0, h: 0 });

    useEffect(() => {
        const update = () => setViewSize({ w: window.innerWidth, h: window.innerHeight });
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    const handleNext = useCallback(() => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(s => s + 1);
        } else {
            onComplete();
        }
    }, [currentStep, onComplete]);

    const handlePrev = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(s => s - 1);
        }
    }, [currentStep]);

    useEffect(() => {
        if (step.targetId) {
            const el = document.getElementById(step.targetId);
            if (el) {
                const rect = el.getBoundingClientRect();
                setCoords({
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                });
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                // Special case: wait a bit for DOM to settle if this is the first step
                const timer = setTimeout(() => {
                    const retryEl = document.getElementById(step.targetId!);
                    if (!retryEl) {
                         handleNext();
                    } else {
                        const rect = retryEl.getBoundingClientRect();
                        setCoords({
                            top: rect.top,
                            left: rect.left,
                            width: rect.width,
                            height: rect.height
                        });
                    }
                }, 100);
                return () => clearTimeout(timer);
            }
        } else {
            // Full screen overlay with no hole (for welcome/farewell steps)
            setCoords({ top: viewSize.h / 2, left: viewSize.w / 2, width: 0, height: 0 });
        }
    }, [currentStep, step.targetId, viewSize, handleNext]);

    const tooltipRef = useRef<HTMLDivElement>(null);
    const [tooltipHeight, setTooltipHeight] = useState(0);

    useEffect(() => {
        if (tooltipRef.current) {
            setTooltipHeight(tooltipRef.current.offsetHeight);
        }
    }, [currentStep, viewSize]);

    const tooltipPos = () => {
        if (!step.targetId) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
        
        const margin = 20;
        const width = 320;
        const hMargin = 20;
        const vMargin = 60; // Extra safety for bottom taskbar
        
        let targetX = coords.left + coords.width / 2;
        let targetY = coords.top + coords.height / 2;
        
        let finalTop = 0;
        let finalLeft = targetX - width / 2;

        // Vertical calculation
        if (step.position === 'top') {
            finalTop = coords.top - tooltipHeight - margin;
            // If it hits top, try bottom
            if (finalTop < hMargin) {
                finalTop = coords.top + coords.height + margin;
            }
        } else if (step.position === 'bottom') {
            finalTop = coords.top + coords.height + margin;
            // If it hits bottom, try top
            if (finalTop + tooltipHeight > viewSize.h - vMargin) {
                finalTop = coords.top - tooltipHeight - margin;
            }
        } else {
            // left, right, center
            finalTop = targetY - tooltipHeight / 2;
        }

        // Final Vertical Bounds Check & Clamping
        if (finalTop + tooltipHeight > viewSize.h - vMargin) {
            finalTop = viewSize.h - vMargin - tooltipHeight;
        }
        if (finalTop < hMargin) {
            finalTop = hMargin;
        }

        // Horizontal sizing
        if (step.position === 'left') {
            finalLeft = coords.left - width - margin;
        } else if (step.position === 'right') {
            finalLeft = coords.left + coords.width + margin;
        }

        if (finalLeft + width > viewSize.w - hMargin) {
            finalLeft = viewSize.w - hMargin - width;
        }
        if (finalLeft < hMargin) {
            finalLeft = hMargin;
        }

        return { top: finalTop, left: finalLeft, width };
    };

    return (
        <div className="fixed inset-0 z-[200] pointer-events-none">
            {/* Backdrop with 4 motion panels (Spotlight effect) */}
            <AnimatePresence mode="popLayout">
                <motion.div 
                    initial={false}
                    animate={{ 
                        height: coords.top 
                    }}
                    className="absolute top-0 left-0 right-0 bg-black/60 backdrop-blur-[2px]"
                />
                <motion.div 
                    initial={false}
                    animate={{ 
                        top: coords.top + coords.height,
                        height: Math.max(0, viewSize.h - (coords.top + coords.height))
                    }}
                    className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-[2px]"
                />
                <motion.div 
                    initial={false}
                    animate={{ 
                        top: coords.top,
                        height: coords.height,
                        width: coords.left
                    }}
                    className="absolute left-0 bg-black/60 backdrop-blur-[2px]"
                />
                <motion.div 
                    initial={false}
                    animate={{ 
                        top: coords.top,
                        left: coords.left + coords.width,
                        height: coords.height,
                        width: Math.max(0, viewSize.w - (coords.left + coords.width))
                    }}
                    className="absolute right-0 bg-black/60 backdrop-blur-[2px]"
                />
            </AnimatePresence>

            {/* Target Highlight Ring */}
            {step.targetId && (
                <motion.div
                    initial={false}
                    animate={{
                        top: coords.top - 8,
                        left: coords.left - 8,
                        width: coords.width + 16,
                        height: coords.height + 16,
                        opacity: 1
                    }}
                    className="absolute border-2 border-primary neon-border-blue rounded-xl z-10"
                />
            )}

            {/* Interactive Tooltip */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    ref={tooltipRef}
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -15 }}
                    className="absolute pointer-events-auto bg-[#0a0a0a]/95 border border-white/10 glass-panel p-6 w-[320px] shadow-[0_0_80px_rgba(0,0,0,0.8)] z-20 max-h-[85vh] overflow-y-auto overflow-x-hidden scrollbar-hide"
                    style={tooltipPos()}
                >
                    {/* Inner Glow */}
                    <div className="absolute -inset-[1px] bg-gradient-to-br from-primary/30 via-transparent to-secondary/30 rounded-2xl -z-10 blur-[1px]" />
                    
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-primary shadow-inner">
                            {step.icon}
                        </div>
                        <h4 className="text-lg font-black tracking-tighter text-white uppercase italic leading-none">{step.title}</h4>
                    </div>

                    <p className="text-gray-300 text-xs leading-relaxed mb-6 font-medium tracking-wide">
                        {step.content}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center gap-3">
                             {currentStep > 0 && (
                                <button 
                                    onClick={handlePrev}
                                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-all hover:bg-white/10"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                             )}
                             <button
                                onClick={onComplete}
                                className="px-3 py-2 text-[10px] font-black text-gray-400 hover:text-primary uppercase tracking-[0.2em] transition-all italic"
                             >
                                Skip
                             </button>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <span className="text-[9px] font-black text-gray-600 tracking-[0.3em] uppercase">
                                {currentStep + 1} / {TOUR_STEPS.length}
                            </span>
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-5 py-2 bg-primary text-black font-black uppercase text-[10px] tracking-[0.1em] rounded group hover:scale-105 transition-all shadow-lg italic"
                            >
                                {currentStep === TOUR_STEPS.length - 1 ? "Begin" : "Next"}
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                    {/* Arrow (only if pointing to something) */}
                    {step.targetId && (
                        <div 
                            className={`absolute w-3 h-3 bg-black border-white/10 rotate-45 z-[-1] pointer-events-none ${
                                step.position === 'top' ? 'bottom-[-7px] left-1/2 -translate-x-1/2 border-b border-r' :
                                step.position === 'bottom' ? 'top-[-7px] left-1/2 -translate-x-1/2 border-t border-l' :
                                step.position === 'left' ? 'right-[-7px] top-1/2 -translate-y-1/2 border-t border-r' :
                                'left-[-7px] top-1/2 -translate-y-1/2 border-b border-l'
                            }`}
                        />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
