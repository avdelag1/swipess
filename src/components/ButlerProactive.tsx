import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ArrowRight, BrainCircuit } from 'lucide-react';
import { haptics } from '@/utils/microPolish';
import { cn } from '@/lib/utils';
import { useFilterStore } from '@/state/filterStore';

export function ButlerProactive() {
    const [isVisible, setIsVisible] = useState(false);
    const [message, setMessage] = useState('');
    const activeCategory = useFilterStore(s => s.activeCategory);

    // AI Intelligence: Proactive prompts based on context
    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeCategory === 'property') {
                setMessage("I've analyzed the latest property listings. 3 of them match your balcony preference perfectly. Want to see a summary?");
                setIsVisible(true);
            } else if (activeCategory === 'motorcycle') {
                setMessage("Market alert: Scooter prices are down 15% today in your area. I've highlighted the best deals for you.");
                setIsVisible(true);
            } else {
                // General greeting or insight
                const insights = [
                    "Your matching profile is 92% complete. Adding a video intro could boost your matches by 3x!",
                    "Hot Tip: Most 'Property' lockers are active between 6pm and 9pm. Come back then for live updates!",
                    "I noticed you like vintage styles. I've found a secret stash of listings you might love."
                ];
                setMessage(insights[Math.floor(Math.random() * insights.length)]);
                setIsVisible(true);
            }
        }, 15000); // Show after 15s of activity

        return () => clearTimeout(timer);
    }, [activeCategory]);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                    className="fixed bottom-24 left-4 right-4 z-[100] pointer-events-none"
                >
                    <div className="max-w-md mx-auto pointer-events-auto">
                        <div className={cn(
                            "relative overflow-hidden rounded-3xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-brand-accent-2/20",
                            "bg-black/80 backdrop-blur-2xl liquid-glass-card"
                        )}>
                            {/* Animated Background Glow */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-accent-2/20 blur-3xl rounded-full animate-pulse" />
                            
                            <div className="flex gap-4 items-start relative z-10">
                                <div className="w-10 h-10 rounded-2xl bg-brand-accent-2/20 flex items-center justify-center flex-shrink-0">
                                    <BrainCircuit className="w-6 h-6 text-brand-accent-2" />
                                </div>
                                
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent-2 flex items-center gap-1">
                                            <Sparkles className="w-3 h-3" />
                                            Concierge Insight
                                        </span>
                                        <button 
                                            onClick={() => { haptics.tap(); setIsVisible(false); }}
                                            className="p-1 hover:bg-white/10 rounded-full transition-colors"
                                        >
                                            <X className="w-4 h-4 text-muted-foreground" />
                                        </button>
                                    </div>
                                    
                                    <p className="text-sm font-bold leading-tight text-white/90 mb-3">
                                        {message}
                                    </p>
                                    
                                    <button 
                                        onClick={() => { haptics.success(); setIsVisible(false); }}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-accent-2 text-black text-xs font-black transition-transform active:scale-95"
                                    >
                                        Optimize My View
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
