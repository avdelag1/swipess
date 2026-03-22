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

    const handleSelect = (id: QuickFilterCategory | null) => {
        haptics.tap();
        setStack(prev => {
            const index = prev.findIndex(c => c.id === id);
            if (index === 0) return prev;
            const newStack = [...prev];
            const [removed] = newStack.splice(index, 1);
            return [removed, ...newStack];
        });
    };

    return (
        <div className="relative w-full aspect-video max-w-sm mx-auto mb-16 flex items-center justify-center">
            {/* Background stack visualization - subtler for fanned look */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-primary/5 blur-3xl animate-pulse" />
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
    category, isTop, index, itemCount, isActive, isDark, onSwipeRight, onSwipeLeft, onSelect 
}: CategoryCardProps) {
    const x = useMotionValue(0);
    
    // Spread cards like a poker hand (fanned)
    // index is current position in the stack (0 is top/front)
    // To maintain fanned look, we use a fixed offset based on category identity, 
    // BUT we want the top card to always be "active" or "front".
    // Alternatively, we use the visual index for the fan position.
    
    // Calculate fan position (from -2 to 2 for 5 cards)
    const midPoint = (itemCount - 1) / 2;
    const fanIndex = index - midPoint;
    
    // We want the cards to look like a hand. 
    // Front card (index 0) is central? No, it's usually fanned from center.
    // Let's use the constant list order for the fan position so it doesn't jump around?
    // User: "I can tap the other one". 
    // So the fan should be stable.
    
    const fanRotation = fanIndex * 8; 
    const fanX = fanIndex * 30; // Spacing between cards
    const fanY = Math.abs(fanIndex) * 8; // Subtle arc

    const dragRotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);
    const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0.5, 1, 1, 1, 0.5]);
    
    const scale = isTop ? 1 : 0.95 - (index * 0.02);

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
            onClick={() => !isTop && onSelect()}
            initial={{ scale: 0.8, opacity: 0, y: 50, rotate: 0 }}
            animate={{ 
                scale, 
                opacity: 1, 
                x: x.get() === 0 ? fanX : x.get(), // If not dragging, stay fanned
                y: fanY + (index * 4), // Stack them slightly downwards too
                rotate: fanRotation,
                zIndex: 10 - index,
            }}
            whileHover={!isTop ? { y: fanY - 20, transition: { duration: 0.2 } } : {}}
            exit={{ x: x.get() > 0 ? 600 : -600, opacity: 0, transition: { duration: 0.2, ease: "easeIn" } }}
            className={cn(
                "absolute inset-0 flex flex-col items-center justify-center rounded-[32px] p-8 select-none transition-shadow duration-300",
                isTop ? "cursor-grab active:cursor-grabbing shadow-2xl" : "shadow-md cursor-pointer",
                isActive 
                    ? "border-2 border-brand-accent-2 ring-4 ring-brand-accent-2/10" 
                    : isDark ? "border border-white/10 bg-[#121212]" : "border border-black/5 bg-white"
            )}
            style={{
                width: '160px',
                height: '220px',
                left: 'calc(50% - 80px)', // Centers them first
                top: 'calc(50% - 110px)',
                ...({ x, rotate: isTop ? dragRotate : fanRotation, opacity } as any)
            }}
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
                    "w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl relative",
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

            {/* Like/Nope visual feedback labels */}
            <motion.div
                style={{ opacity: useTransform(x, [20, 80], [0, 1]) }}
                className="absolute top-2 left-2 border-2 border-emerald-500 text-emerald-500 font-black px-2 py-0.5 rounded-lg rotate-[-12deg] uppercase text-[10px] pointer-events-none"
            >
                Filter!
            </motion.div>
            <motion.div
                style={{ opacity: useTransform(x, [-20, -80], [0, 1]) }}
                className="absolute top-2 right-2 border-2 border-rose-500 text-rose-500 font-black px-2 py-0.5 rounded-lg rotate-[12deg] uppercase text-[10px] pointer-events-none"
            >
                Skip
            </motion.div>
        </motion.div>
    );
}
