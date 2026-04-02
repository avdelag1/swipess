import React, { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, PanInfo } from 'framer-motion';
import { Home, Bike, Briefcase, Search, Check, Sparkles } from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/microPolish';
import { QuickFilterCategory } from '@/types/filters';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import { useTheme } from '@/hooks/useTheme';
import { useQueryClient } from '@tanstack/react-query';
import { predictivePrefetchCategory } from '@/utils/performance';

const CATEGORIES: { id: QuickFilterCategory | null; label: string; icon: any; color: string; description: string; image: string }[] = [
    { id: 'property', label: 'Property', icon: Home, color: 'from-rose-500 to-rose-400', description: 'Find your next home', image: '/images/filters/property.png' },
    { id: 'motorcycle', label: 'Moto', icon: MotorcycleIcon, color: 'from-orange-500 to-orange-400', description: 'Ride in style', image: '/images/filters/scooter.png' },
    { id: 'bicycle', label: 'Bicycle', icon: Bike, color: 'from-violet-500 to-violet-400', description: 'Eco-friendly travel', image: '/images/filters/bicycle.png' },
    { id: 'services', label: 'Services', icon: Briefcase, color: 'from-amber-500 to-amber-400', description: 'Hire professionals', image: '/images/filters/workers.png' },
    { id: null, label: 'All', icon: Search, color: 'from-slate-500 to-slate-400', description: 'Explore everything', image: '/images/promo/promo_1.png' },
];

export function CategorySwipeStack() {
    const [stack, setStack] = useState(CATEGORIES);
    const activeCategory = useFilterStore(s => s.activeCategory);
    const { setActiveCategory } = useFilterActions();
    const queryClient = useQueryClient();
    const navigate = React.useMemo(() => {
        // Need to import or pass navigate? No, use the function from rrd if needed
        return (path: string) => window.history.pushState(null, '', path);
    }, []);
    // Wait, let's use the actual useNavigate from react-router-dom
    // I'll add it in the imports below. For now, I'll pass it if needed.
    // Actually I will import it in CategorySwipeStack

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
            {/* Background Atmosphere - moved outside but kept inside div for relative positioning */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden contain-strict">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-brand-accent-1/10 to-brand-accent-2/20 blur-3xl opacity-30" 
                />
            </div>

            <AnimatePresence mode="popLayout" initial={false}>
                {stack.map((cat, index) => {
                    const isTop = index === 0;
                    const isActive = activeCategory === (cat.id as any);

                    return (
                        <CategoryCard
                            key={cat.id || 'all'}
                            category={cat}
                            isTop={isTop}
                            index={index}
                            itemCount={stack.length}
                            isActive={isActive}
                            isDark={isDark}
                            onSwipeRight={() => handleSwipeRight(cat.id as any)}
                            onSwipeLeft={() => handleSwipeLeft(cat.id as any)}
                            onSelect={() => handleSelect(cat.id as any)}
                            onSwipeUp={() => {
                                haptics.success();
                                window.location.href = '/explore/eventos'; // Fast and reliable
                            }}
                            queryClient={queryClient}
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
    onSwipeUp: () => void;
    onSelect: () => void;
    queryClient?: any;
}

function CategoryCard({
    category, isTop, index, itemCount: _itemCount, isActive, isDark: _isDark, onSwipeRight, onSwipeLeft, onSwipeUp, onSelect, queryClient
}: CategoryCardProps) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    
    // Physics-based spring for smooth movement
    const springX = useSpring(x, { stiffness: 450, damping: 32 }); // snappier
    const springY = useSpring(y, { stiffness: 450, damping: 32 });

    // VERTICAL STACK — Modern premium feel, larger and vertical
    // No "Poker Hand" fan to avoid the "mess"
    const fanRotation = 0; // Vertical stack, no rotation
    const fanX = 0; 
    const fanY = index * -10; // Stack vertically upwards
    
    // Drag transformations
    const tilt = useTransform(x, [-150, 0, 150], [-10, 0, 10]);
    const zIndex = useTransform(x,
        [-120, -40, 0, 40, 120],
        [1, 15, 20, 15, 1] // Dynamic z-index for swipe feeling
    );

    const selectOpacity = useTransform(x, [20, 60], [0, 1]);
    const skipOpacity = useTransform(x, [-20, -60], [0, 1]);

    const zIndexBase = 20 - index;
    const scale = isTop ? 1 : 1 - (index * 0.05);

    const [isDragging, setIsDragging] = useState(false);

    const handleDragStart = () => {
        setIsDragging(true);
        haptics.tap();
    };

    const handleDragEnd = (_: any, info: PanInfo) => {
        setIsDragging(false);
        const absX = Math.abs(info.offset.x);
        const absY = Math.abs(info.offset.y);

        // Vertical Swipe Up detection
        if (info.offset.y < -80 && absY > absX * 1.5) {
            onSwipeUp();
            return;
        }

        if (info.offset.x > 80) {
            onSwipeRight();
        } else if (info.offset.x < -80) {
            onSwipeLeft();
        }
    };

    return (
        <motion.div
            drag={isTop ? true : false}
            dragConstraints={{ left: -150, right: 150, top: -250, bottom: 0 }} 
            dragElastic={0.12}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={() => !isTop && onSelect()}
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ 
                scale, 
                opacity: 1, 
                x: isDragging ? x.get() : fanX,
                y: isDragging ? y.get() : fanY,
                rotate: isDragging ? tilt.get() : (isActive ? 0 : fanRotation),
                zIndex: isTop ? zIndex.get() : zIndexBase,
            }}
            whileHover={!isTop ? { 
                y: fanY - 15, 
                scale: scale * 1.03,
                transition: { duration: 0.15, ease: "easeOut" } 
            } : {}}
            onMouseEnter={() => !isTop && category.id && queryClient && predictivePrefetchCategory(queryClient, category.id)}
            onPointerDown={() => !isTop && category.id && queryClient && predictivePrefetchCategory(queryClient, category.id)}
            exit={{ 
                x: x.get() > 0 ? 400 : -400, 
                rotate: x.get() > 0 ? 10 : -10, 
                opacity: 0, 
                transition: { duration: 0.2 } 
            }}
            className={cn(
                "absolute flex flex-col items-center justify-center rounded-[32px] p-6 select-none overflow-hidden",
                "transition-all duration-200 gpu-accelerate",
                isTop ? "cursor-grab active:cursor-grabbing shadow-[0_20px_50px_rgba(0,0,0,0.5)]" : "cursor-pointer",
                "bg-black border border-white/10",
                isActive && "ring-4 ring-brand-accent-2/50 ring-offset-4 ring-offset-background shadow-[0_0_40px_rgba(255,107,53,0.3)]",
                "swipe-card-size"
            )}
            style={{ 
                transformOrigin: 'center center',
                '--card-image-url': `url(${category.image})`,
                ...({ x: springX, y: springY, zIndex } as any)
            } as React.CSSProperties}
        >
            {/* Background Photo - static for performance */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-[image:var(--card-image-url)]"
            />
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />

            {/* Icon Container - static for performance */}
            <motion.div
                className={cn(
                    "w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl relative z-10",
                    `bg-gradient-to-br ${category.color} text-white`
                )}
                whileHover={{ scale: 1.1, rotate: 5 }}
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
