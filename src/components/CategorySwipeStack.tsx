import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, PanInfo } from 'framer-motion';
import { Home, Bike, Briefcase, Search, Check, Sparkles } from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/microPolish';
import { QuickFilterCategory } from '@/types/filters';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import { useTheme } from '@/hooks/useTheme';

const CATEGORIES: { id: QuickFilterCategory | null; label: string; icon: any; color: string; description: string; image: string }[] = [
    { id: 'property', label: 'Property', icon: Home, color: 'from-rose-500 to-rose-400', description: 'Find your next home', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=400' },
    { id: 'motorcycle', label: 'Moto', icon: MotorcycleIcon, color: 'from-orange-500 to-orange-400', description: 'Ride in style', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&q=80&w=400' },
    { id: 'bicycle', label: 'Bicycle', icon: Bike, color: 'from-violet-500 to-violet-400', description: 'Eco-friendly travel', image: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&q=80&w=400' },
    { id: 'services', label: 'Services', icon: Briefcase, color: 'from-amber-500 to-amber-400', description: 'Hire professionals', image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&q=80&w=400' },
    { id: null, label: 'All', icon: Search, color: 'from-slate-500 to-slate-400', description: 'Explore everything', image: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&q=80&w=400' },
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

    const handleSelect = (id: QuickFilterCategory | null) => {
        haptics.select();
        setStack(prev => {
            const index = prev.findIndex(c => c.id === id);
            if (index === 0) return prev;
            const newStack = [...prev];
            const [removed] = newStack.splice(index, 1);
            return [removed, ...newStack];
        });
    };

    return (
        <div className="relative w-full aspect-[4/3] max-w-sm mx-auto mb-16 flex items-center justify-center perspective-[1000px]">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-brand-accent-1/5 to-brand-accent-2/10 blur-3xl" 
                />
            </div>

            <AnimatePresence mode="popLayout">
                {stack.map((cat, index) => {
                    const isTop = index === 0;
                    const isActive = activeCategory === cat.id;

                    return (
                        <CategoryCard
                            key={cat.id || 'all'}
                            category={cat}
                            isTop={isTop}
                            index={index}
                            itemCount={stack.length}
                            isActive={isActive}
                            isDark={isDark}
                            onSwipeRight={() => handleSwipeRight(cat.id)}
                            onSwipeLeft={() => handleSwipeLeft(cat.id)}
                            onSelect={() => handleSelect(cat.id)}
                        />
                    );
                }).reverse()}
            </AnimatePresence>
            
            {/* Instruction text with better styling */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -bottom-12 left-0 right-0 text-center"
            >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-[10px] font-bold text-muted-foreground tracking-[0.1em] uppercase">
                    <Sparkles className="w-3 h-3 text-brand-accent-2" />
                    Swipe to Filter • Tap to Stack
                </div>
            </motion.div>
        </div>
    );
}

interface CategoryCardProps {
    category: any;
    isTop: boolean;
    index: number;
    itemCount: number;
    isActive: boolean;
    isDark: boolean;
    onSwipeRight: () => void;
    onSwipeLeft: () => void;
    onSelect: () => void;
}

function CategoryCard({
    category, isTop, index, itemCount: _itemCount, isActive, isDark: _isDark, onSwipeRight, onSwipeLeft, onSelect
}: CategoryCardProps) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    
    // Physics-based spring for smooth fan movement
    const springX = useSpring(x, { stiffness: 300, damping: 30 });
    const springY = useSpring(y, { stiffness: 300, damping: 30 });

    // Pivot Calculation for "Poker Hand"
    // User wants "left corners applied together" -> transform-origin: "bottom left" 
    const fanRotation = index * 12; // Increases for cards buried deeper
    const fanX = index * 18; // Horizontal spread
    const fanY = index * 6; // Slight downward slide
    
    // Drag transformations
    // "if I move it left or right it is going to show the effect of being hide behind the other one"
    // We drop z-index as it moves away from center.
    // The base z-indices are: Card 0: 10, Card 1: 9, Card 2: 8...
    // So dropping to < 9 makes it hide behind Card 1.
    const tilt = useTransform(x, [-150, 0, 150], [-15, 0, 15]);
    const zIndex = useTransform(x,
        [-120, -40, 0, 40, 120],
        [1, 15, 20, 15, 1] // Start high, drop low at edges
    );
    // Drag feedback opacities — computed unconditionally to avoid conditional hook calls
    const selectOpacity = useTransform(x, [20, 60], [0, 1]);
    const skipOpacity = useTransform(x, [-20, -60], [0, 1]);

    const zIndexBase = 10 - index;
    const scale = isTop ? 1 : 1 - (index * 0.04);

    const [isDragging, setIsDragging] = useState(false);

    // selectOpacity/skipOpacity already declared above — reuse them

    const handleDragStart = () => {
        setIsDragging(true);
        haptics.tap();
    };

    const handleDragEnd = (_: any, info: PanInfo) => {
        setIsDragging(false);
        if (info.offset.x > 80) {
            onSwipeRight();
        } else if (info.offset.x < -80) {
            onSwipeLeft();
        }
    };

    return (
        <motion.div
            drag={isTop ? "x" : false}
            dragConstraints={{ left: -150, right: 150 }} 
            dragElastic={0.1}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={() => !isTop && onSelect()}
            layoutId={category.id || 'all'}
            initial={{ scale: 0.8, opacity: 0, rotate: 45, x: 100 }}
            animate={{ 
                scale, 
                opacity: 1, 
                x: isDragging ? x.get() : fanX,
                y: isDragging ? y.get() : fanY,
                rotate: isDragging ? tilt.get() : fanRotation,
                // If it's the top card, use the dynamic z-index to allow "hiding"
                // If not, use the base stack order
                zIndex: isTop ? zIndex.get() : zIndexBase,
            }}
            whileHover={!isTop ? { 
                y: fanY - 30, 
                scale: scale * 1.08,
                rotate: fanRotation - 4,
                transition: { duration: 0.2, ease: "easeOut" } 
            } : {}}
            exit={{ 
                x: x.get() > 0 ? 500 : -500, 
                rotate: x.get() > 0 ? 45 : -45, 
                opacity: 0, 
                transition: { duration: 0.3 } 
            }}
            className={cn(
                "absolute flex flex-col items-center justify-center rounded-[28px] p-6 select-none overflow-hidden",
                "transition-shadow duration-300",
                isTop ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
                "bg-black border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
                isActive && "ring-2 ring-brand-accent-2 ring-offset-4 ring-offset-background"
            )}
            style={{
                width: '180px',
                height: '240px',
                left: 'calc(50% - 130px)', // Offset to the left slightly to center the fan
                top: 'calc(50% - 120px)',
                transformOrigin: 'bottom left',
                ...({ x: springX, y: springY, zIndex } as any)
            }}
        >
            {/* Background Photo */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${category.image})` }}
            />
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />

            {/* Icon Container — Ken Burns breathing zoom on top card */}
            <motion.div
                className={cn(
                    "w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl relative z-10",
                    `bg-gradient-to-br ${category.color} text-white`
                )}
                whileHover={{ scale: 1.1, rotate: 5 }}
                animate={isTop ? { y: [0, -5, 0], scale: [1, 1.04, 1] } : { scale: 1 }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
                <category.icon className="w-10 h-10" strokeWidth={2.5} />
                {isActive && (
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-3 -right-3 bg-brand-accent-2 rounded-full p-1.5 shadow-lg border-2 border-white dark:border-black"
                    >
                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />
                    </motion.div>
                )}
            </motion.div>

            {/* Labels */}
            <div className="mt-6 text-center z-10">
                <h3 className="text-lg font-black tracking-tight leading-none text-white drop-shadow-lg">
                    {category.label}
                </h3>
                <p className="mt-2 text-[10px] font-medium text-white/70 uppercase tracking-widest">
                    {category.description}
                </p>
            </div>

            {/* Drag Feedback */}
            <AnimatePresence>
                {isDragging && (
                    <>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            style={{ opacity: selectOpacity }}
                            className="absolute top-4 left-4 border-2 border-emerald-500 text-emerald-500 font-black px-2 py-0.5 rounded-lg -rotate-12 uppercase text-[10px]"
                        >
                            Select!
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            style={{ opacity: skipOpacity }}
                            className="absolute top-4 right-4 border-2 border-rose-500 text-rose-500 font-black px-2 py-0.5 rounded-lg rotate-12 uppercase text-[10px]"
                        >
                            Skip
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Bottom Glass Indicator (for that premium feel) */}
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
        </motion.div>
    );
}
