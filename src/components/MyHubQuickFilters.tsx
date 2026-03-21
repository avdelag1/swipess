import React from 'react';
import { motion } from 'framer-motion';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import {
    Home,
    Bike,
    Briefcase,
    Search,
    Check,
} from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/microPolish';
import { QuickFilterCategory } from '@/types/filters';
import { ExploreFeatureLinks } from '@/components/ExploreFeatureLinks';

const categories: { id: QuickFilterCategory; label: string; icon: any; color: string }[] = [
    { id: 'property', label: 'Property', icon: Home, color: 'from-rose-500 to-rose-400' },
    { id: 'motorcycle', label: 'Moto', icon: MotorcycleIcon, color: 'from-orange-500 to-orange-400' },
    { id: 'bicycle', label: 'Bicycle', icon: Bike, color: 'from-violet-500 to-violet-400' },
    { id: 'services', label: 'Services', icon: Briefcase, color: 'from-amber-500 to-amber-400' },
];

export function MyHubQuickFilters() {
    const activeCategory = useFilterStore(s => s.activeCategory);
    const { setActiveCategory } = useFilterActions();

    return (
        <div className="relative mb-8">
            {/* Label */}
            <div className="flex items-center mb-3 px-1">
                <h3 className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground">
                    Discover Categories
                </h3>
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
                                    ? "bg-brand-accent-2/10 border-brand-accent-2 shadow-[0_0_20px_rgba(228,0,124,0.2)]"
                                    : "bg-muted/30 border-border hover:bg-muted/60"
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
                                    : "bg-muted text-muted-foreground"
                            )}>
                                <cat.icon className="w-5 h-5" strokeWidth={2.5} />
                            </div>

                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-tight",
                                isActive ? "text-foreground" : "text-muted-foreground"
                            )}>
                                {cat.label}
                            </span>
                        </motion.button>
                    );
                })}

                {/* All - clears active category filter */}
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { haptics.select(); setActiveCategory(null); }}
                    className={cn(
                        "relative flex-shrink-0 flex flex-col items-center justify-center w-24 h-24 rounded-3xl transition-all duration-300",
                        "border-[1.5px]",
                        activeCategory === null
                            ? "bg-brand-accent-2/10 border-brand-accent-2 shadow-[0_0_20px_rgba(228,0,124,0.2)]"
                            : "bg-muted/30 border-border hover:bg-muted/60"
                    )}
                >
                    {activeCategory === null && (
                        <motion.div
                            layoutId="active-indicator"
                            className="absolute top-2 right-2 bg-brand-accent-2 rounded-full p-0.5"
                        >
                            <Check className="w-2.5 h-2.5 text-white" strokeWidth={4} />
                        </motion.div>
                    )}
                    <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center mb-2 shadow-inner",
                        activeCategory === null
                            ? "bg-gradient-to-br from-brand-accent-2 to-pink-400 text-white"
                            : "bg-muted text-muted-foreground"
                    )}>
                        <Search className="w-5 h-5" strokeWidth={2.5} />
                    </div>
                    <span className={cn(
                        "text-[10px] font-black uppercase tracking-tight",
                        activeCategory === null ? "text-foreground" : "text-muted-foreground"
                    )}>
                        All
                    </span>
                </motion.button>
            </div>

            {/* Explore Feature Links */}
            <ExploreFeatureLinks />
        </div>
    );
}
