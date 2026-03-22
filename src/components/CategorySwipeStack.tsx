import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useDragControls, PanInfo } from 'framer-motion';
import { Home, Bike, Briefcase, Search, Check } from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/microPolish';
import { QuickFilterCategory } from '@/types/filters';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import { useTheme } from '@/hooks/useTheme';

const CATEGORIES: { id: QuickFilterCategory | null; label: string; icon: any; color: string; description: string }[] = [
    { id: 'property', label: 'Property', icon: Home, color: 'from-rose-500 to-rose-400', description: 'Find your next home' },
    { id: 'motorcycle', label: 'Moto', icon: MotorcycleIcon, color: 'from-orange-500 to-orange-400', description: 'Ride in style' },
    { id: 'bicycle', label: 'Bicycle', icon: Bike, color: 'from-violet-500 to-violet-400', description: 'Eco-friendly travel' },
    { id: 'services', label: 'Services', icon: Briefcase, color: 'from-amber-500 to-amber-400', description: 'Hire professionals' },
    { id: null, label: 'All', icon: Search, color: 'from-slate-500 to-slate-400', description: 'Explore everything' },
];

export function CategorySwipeStack() {
    const [stack, setStack] = useState(CATEGORIES);
    const activeCategory = useFilterStore(s => s.activeCategory);
    const { setActiveCategory } = useFilterActions();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const handleSwipeRight = (id: QuickFilterCategory | null) => {
        haptics.success();
        setActiveCategory(id);
        // Move swiped card to the back of the stack
        setStack(prev => {
            const index = prev.findIndex(c => c.id === id);
            const newStack = [...prev];
            const [removed] = newStack.splice(index, 1);
            return [...newStack, removed];
        });
    };

    const handleSwipeLeft = (id: QuickFilterCategory | null) => {
        haptics.tap();
        // Just move to the back without activating
        setStack(prev => {
            const index = prev.findIndex(c => c.id === id);
            const newStack = [...prev];
            const [removed] = newStack.splice(index, 1);
            return [...newStack, removed];
        });
    };

    return (
        <div className="relative w-full aspect-[4/3] max-w-sm mx-auto mb-12 flex items-center justify-center">
            {/* Background stack visualization */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-4 left-4 right-4 bottom-[-10px] rounded-[32px] bg-muted/20 border border-border/50 scale-[0.9] -z-10" />
                <div className="absolute top-2 left-2 right-2 bottom-[-5px] rounded-[32px] bg-muted/30 border border-border/80 scale-[0.95] -z-10" />
            </div>

            <AnimatePresence mode="popLayout">
                {stack.map((cat, index) => {
                    // Only render top 3 for performance
                    if (index > 2) return null;
                    const isTop = index === 0;
                    const isActive = activeCategory === cat.id;

                    return (
                        <CategoryCard
                            key={cat.id || 'all'}
                            category={cat}
                            isTop={isTop}
                            index={index}
                            isActive={isActive}
                            isDark={isDark}
                            onSwipeRight={() => handleSwipeRight(cat.id)}
                            onSwipeLeft={() => handleSwipeLeft(cat.id)}
                        />
                    );
                }).reverse()}
            </AnimatePresence>

            {/* Hint icons */}
            <div className="absolute -bottom-10 left-0 right-0 flex justify-between px-8 pointer-events-none">
                <div className="flex flex-col items-center opacity-40">
                    <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center mb-1">
                        <Search className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest italic">Skip</span>
                </div>
                <div className="flex flex-col items-center opacity-80 text-brand-accent-2">
                    <div className="w-8 h-8 rounded-full border-2 border-brand-accent-2 flex items-center justify-center mb-1 shadow-glow-sm">
                        <Check className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest italic">Filter</span>
                </div>
            </div>
        </div>
    );
}

function CategoryCard({ category, isTop, index, isActive, isDark, onSwipeRight, onSwipeLeft }: any) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
    const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0.5, 1, 1, 1, 0.5]);
    const scale = isTop ? 1 : 1 - (index * 0.05);
    const yOffset = index * 12;

    const handleDragEnd = (_: any, info: PanInfo) => {
        if (info.offset.x > 100) {
            onSwipeRight();
        } else if (info.offset.x < -100) {
            onSwipeLeft();
        }
    };

    return (
        <motion.div
            drag={isTop ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ 
                scale, 
                opacity: 1, 
                y: yOffset,
                zIndex: 10 - index,
            }}
            exit={{ x: x.get() > 0 ? 600 : -600, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }}
            style={{ x, rotate, opacity }}
            className={cn(
                "absolute inset-0 flex flex-col items-center justify-center rounded-[32px] p-8 select-none transition-shadow duration-300",
                isTop ? "cursor-grab active:cursor-grabbing shadow-2xl" : "shadow-md pointer-events-none",
                isActive 
                    ? "border-2 border-brand-accent-2 ring-4 ring-brand-accent-2/10" 
                    : isDark ? "border border-white/10 bg-[#121212]" : "border border-black/5 bg-white"
            )}
        >
            {/* Visual background pattern with breathing zoom */}
            <motion.div
                className={cn(
                    "absolute inset-0 rounded-[32px] opacity-[0.03] pointer-events-none",
                    `bg-gradient-to-br ${category.color}`
                )}
                animate={isTop ? { scale: [1, 1.04, 1] } : { scale: 1 }}
                transition={isTop ? { duration: 4, ease: 'easeInOut', repeat: Infinity } : {}}
            />

            <motion.div
                className={cn(
                    "w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl relative",
                    `bg-gradient-to-br ${category.color} text-white`
                )}
                animate={isTop ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                transition={isTop ? { duration: 4, ease: 'easeInOut', repeat: Infinity } : {}}
            >
                <category.icon className="w-10 h-10" strokeWidth={2.5} />
                {isActive && (
                    <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-lg">
                        <Check className="w-4 h-4 text-brand-accent-2" strokeWidth={4} />
                    </div>
                )}
            </motion.div>

            <h3 className={cn(
                "text-2xl font-black uppercase tracking-tighter mb-2",
                isDark ? "text-white" : "text-slate-900"
            )}>
                {category.label}
            </h3>
            <p className="text-muted-foreground text-sm font-medium text-center max-w-[160px]">
                {category.description}
            </p>

            {/* Like/Nope visual feedback labels */}
            <motion.div
                style={{ opacity: useTransform(x, [20, 80], [0, 1]) }}
                className="absolute top-6 left-6 border-4 border-emerald-500 text-emerald-500 font-black px-3 py-1 rounded-xl rotate-[-12deg] uppercase text-xl pointer-events-none"
            >
                Filter!
            </motion.div>
            <motion.div
                style={{ opacity: useTransform(x, [-20, -80], [0, 1]) }}
                className="absolute top-6 right-6 border-4 border-rose-500 text-rose-500 font-black px-3 py-1 rounded-xl rotate-[12deg] uppercase text-xl pointer-events-none"
            >
                Skip
            </motion.div>
        </motion.div>
    );
}
