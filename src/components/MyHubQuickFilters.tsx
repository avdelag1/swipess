import React from 'react';
import { motion } from 'framer-motion';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import {
    Home,
    Bike,
    Briefcase,
    Search,
    Check,
    Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/microPolish';
import { QuickFilterCategory } from '@/types/filters';

const categories: { id: QuickFilterCategory; label: string; icon: any; color: string }[] = [
    { id: 'property', label: 'Property', icon: Home, color: 'from-blue-500 to-cyan-400' },
    { id: 'motorcycle', label: 'Moto', icon: Zap, color: 'from-amber-500 to-orange-400' },
    { id: 'bicycle', label: 'Bicycle', icon: Bike, color: 'from-emerald-500 to-teal-400' },
    { id: 'services', label: 'Services', icon: Briefcase, color: 'from-purple-500 to-pink-400' },
];



export function MyHubQuickFilters() {
    const activeCategory = useFilterStore(s => s.activeCategory);
    const { setActiveCategory } = useFilterActions();

    return (
        <div className="relative mb-8">
            {/* Label */}
            <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground/80">
                    Discover Categories
                </h3>
                <button
                    onClick={() => { haptics.tap(); setActiveCategory(null); }}
                    className="text-[10px] font-black uppercase text-brand-accent-2/80 hover:text-brand-accent-2 transition-colors"
                >
                    Clear All
                </button>
            </div>

            {/* Horizontal Scroll Area */}
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 mask-fade-edges">
                {categories.map((cat) => {
                    const isActive = activeCategory === cat.id;

                    return (
                        <motion.button
                            key={cat.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                haptics.select();
                                setActiveCategory(isActive ? null : cat.id);
                            }}
                            className={cn(
                                "relative flex-shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-3xl transition-all duration-300",
                                "border-[1.5px]",
                                isActive
                                    ? "bg-white/10 border-brand-accent-2 shadow-[0_0_20px_rgba(228,0,124,0.2)]"
                                    : "bg-white/[0.03] border-white/5 hover:bg-white/5"
                            )}
                        >
                            {/* Active Indicator */}
                            {isActive && (
                                <motion.div
                                    layoutId="active-indicator"
                                    className="absolute top-2 right-2 bg-brand-accent-2 rounded-full p-0.5"
                                >
                                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />
                                </motion.div>
                            )}

                            {/* Icon Container */}
                            <div className={cn(
                                "w-10 h-10 rounded-2xl flex items-center justify-center mb-2 shadow-inner",
                                isActive
                                    ? `bg-gradient-to-br ${cat.color} text-white`
                                    : "bg-white/5 text-muted-foreground/60"
                            )}>
                                <cat.icon className="w-5 h-5" strokeWidth={2.5} />
                            </div>

                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-tight",
                                isActive ? "text-white" : "text-muted-foreground/60"
                            )}>
                                {cat.label}
                            </span>
                        </motion.button>
                    );
                })}

                {/* All / Search Placeholder */}
                <button className="flex-shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-3xl bg-white/[0.02] border-[1.5px] border-dashed border-white/10 text-muted-foreground/40 hover:bg-white/[0.04] transition-all">
                    <Search className="w-6 h-6 mb-2 opacity-30" />
                    <span className="text-[10px] font-black uppercase opacity-40">More</span>
                </button>
            </div>
        </div>
    );
}
