import React, { useState, useRef, useEffect, useMemo } from 'react';
import { QuickFilterImage } from '@/components/ui/QuickFilterImage';
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring, PanInfo } from 'framer-motion';
import { Home, Bike, Briefcase, Search, Check, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { VespaIcon } from '@/components/icons/VespaIcon';
import { BeachBicycleIcon } from '@/components/icons/BeachBicycleIcon';
import { WorkersIcon } from '@/components/icons/WorkersIcon';
import { RealEstateIcon } from '@/components/icons/RealEstateIcon';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/microPolish';
import { QuickFilterCategory } from '@/types/filters';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { predictivePrefetchCategory } from '@/utils/performance';

import { POKER_CARDS, OWNER_INTENT_CARDS, POKER_CARD_PHOTOS } from './swipe/SwipeConstants';
import { useActiveMode } from '@/hooks/useActiveMode';

interface CategoryCardData {
    id: string;
    label: string;
    icon: any;
    color: string;
    description: string;
    image: string;
    categoryId?: QuickFilterCategory | null;
    ownerData?: {
        clientType?: string;
    };
}

export function CategorySwipeStack() {
    const { activeMode: userRole } = useActiveMode();
    const activeCategory = useFilterStore(s => s.activeCategory);
    const { 
        setActiveCategory, 
        setClientType, 
        setListingType,
        setClientGender
    } = useFilterActions();
    

    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // 🚀 SPEED OF LIGHT: Standardize category shape for both roles
    const getInitialStack = (): CategoryCardData[] => {
        if (userRole === 'owner') {
            return OWNER_INTENT_CARDS.map(card => ({
                id: card.id,
                label: card.label,
                icon: card.icon,
                color: card.accent, // Raw hex color — rendered via inline style, not Tailwind
                description: card.description,
                image: POKER_CARD_PHOTOS[card.id] || POKER_CARD_PHOTOS.all,
                ownerData: {
                    clientType: card.clientType,
                }
            }));
        }

        return POKER_CARDS.map(card => ({
            id: card.id,
            label: card.label,
            icon: card.icon,
            color: card.accent, // Raw hex color — rendered via inline style, not Tailwind
            description: card.description,
            image: POKER_CARD_PHOTOS[card.id] || POKER_CARD_PHOTOS.all,
            categoryId: card.id as QuickFilterCategory
        }));
    };

    // 🚀 SPEED OF LIGHT: Memoized stack derivation to prevent "cranky" switching flickers
    const currentStackBase = useMemo(getInitialStack, [userRole]);
    const [stack, setStack] = useState<CategoryCardData[]>(currentStackBase);

    // Sync stack ONLY when base definition changes (role switch)
    useEffect(() => {
        setStack(currentStackBase);
    }, [currentStackBase]);

    // PERF: Preloading moved to SpeedOfLightPreloader + QuickFilterImage decode-first pattern

    const applyFilter = (card: CategoryCardData) => {
        if (userRole === 'owner' && card.ownerData) {
            // Owner Side: Filter by Client Intent
            if (card.ownerData.clientType === 'all') {
                setClientType('all');
                setClientGender('any');
            } else {
                setClientType(card.ownerData.clientType as any);
            }
            setActiveCategory(null);
        } else if (card.categoryId !== undefined) {
            // Client Side: Filter by Property/Service Category
            setActiveCategory(card.categoryId);
        }
    };

    const handleSwipeRight = (_card: CategoryCardData) => {
        haptics.tap();
        
        // Move swiped card to the back of the stack
        setStack(prev => {
            const index = prev.findIndex(c => c.id === _card.id);
            const newStack = [...prev];
            const [removed] = newStack.splice(index, 1);
            return [...newStack, removed];
        });
    };

    const handleSwipeLeft = (card: CategoryCardData) => {
        haptics.tap();
        // Just move to the back without activating
        setStack(prev => {
            const index = prev.findIndex(c => c.id === card.id);
            const newStack = [...prev];
            const [removed] = newStack.splice(index, 1);
            return [...newStack, removed];
        });
    };

    const handleSelect = (card: CategoryCardData) => {
        haptics.select();
        // If it's already at the front, APPLY it
        if (stack[0].id === card.id) {
            applyFilter(card);
            return;
        }

        setStack(prev => {
            const index = prev.findIndex(c => c.id === card.id);
            const newStack = [...prev];
            const [removed] = newStack.splice(index, 1);
            return [removed, ...newStack];
        });
    };

    return (
        <div className="relative w-full h-[calc(100svh-80px)] max-w-2xl mx-auto flex items-center justify-center perspective-[1000px] overflow-visible">

            <AnimatePresence mode="sync" initial={false}>
                {stack.map((cat, index) => {
                    const isTop = index === 0;
                    const isActive = userRole === 'owner' 
                        ? false 
                        : activeCategory === cat.categoryId;

                    return (
                        <CategoryCard
                            key={`${cat.id}-${userRole}`} // Force clean remount when role changes
                            category={cat}
                            isTop={isTop}
                            index={index}
                            itemCount={stack.length}
                            isActive={isActive}
                            isDark={isDark}
                            onSwipeRight={() => handleSwipeRight(cat)}
                            onSwipeLeft={() => handleSwipeLeft(cat)}
                            onSelect={() => handleSelect(cat)}
                            onSwipeUp={() => {
                                haptics.success();
                                navigate('/explore/eventos');
                            }}
                            queryClient={queryClient}
                            userId={user?.id}
                        />
                    );
                }).reverse()}
            </AnimatePresence>
            
            {/* Instruction text */}
            <motion.div 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -bottom-10 left-0 right-0 text-center"
            >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-[10px] font-bold text-muted-foreground tracking-[0.1em] uppercase">
                    <Sparkles className="w-3 h-3 text-brand-accent-2" />
                    Swipe to Cycle • Tap to Select
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
    category, isTop, index, itemCount: _itemCount, isActive, isDark: _isDark, onSwipeRight, onSwipeLeft, onSwipeUp, onSelect, queryClient, userId
}: CategoryCardProps & { userId?: string }) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    
    // Physics-based spring for smooth movement
    const springX = useSpring(x, { stiffness: 450, damping: 32 }); // snappier
    const springY = useSpring(y, { stiffness: 450, damping: 32 });

    // VERTICAL STACK — Modern premium feel, larger and vertical
    // No "Poker Hand" fan to avoid the "mess"
    const fanRotation = 0; // Vertical stack, no rotation
    const fanX = 0; 
    const fanY = index * -8; // Tighter vertical stack to save space
    
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

    // 🚀 BEYOND ZENITH: Threshold Haptic Tracking
    // We only want to pulse ONCE per threshold crossing
    const hasPulsedRef = useRef<{ left: boolean, right: boolean, up: boolean }>({ left: false, right: false, up: false });

    useEffect(() => {
        const unsubscribeX = x.on('change', (val) => {
            if (val > 80 && !hasPulsedRef.current.right) {
                haptics.tap();
                hasPulsedRef.current.right = true;
            } else if (val < 80) {
                hasPulsedRef.current.right = false;
            }
            
            if (val < -80 && !hasPulsedRef.current.left) {
                haptics.tap();
                hasPulsedRef.current.left = true;
            } else if (val > -80) {
                hasPulsedRef.current.left = false;
            }
        });

        const unsubscribeY = y.on('change', (val) => {
            if (val < -80 && !hasPulsedRef.current.up) {
                haptics.tap();
                hasPulsedRef.current.up = true;
            } else if (val > -80) {
                hasPulsedRef.current.up = false;
            }
        });

        return () => {
            unsubscribeX();
            unsubscribeY();
        };
    }, [x, y]);

    const handleDragEnd = (_: any, info: PanInfo) => {
        setIsDragging(false);
        hasPulsedRef.current = { left: false, right: false, up: false };
        const absX = Math.abs(info.offset.x);
        const absY = Math.abs(info.offset.y);

        // Vertical Swipe Up detection
        if (info.offset.y < -80 && absY > absX * 1.5) {
            onSwipeUp();
            return;
        }

        if (info.offset.x > 50) {
            onSwipeRight();
        } else if (info.offset.x < -50) {
            onSwipeLeft();
        }
    };

    return (
        <motion.div
            drag={isTop ? true : false}
            dragConstraints={{ left: -200, right: 200, top: -250, bottom: 0 }} 
            dragElastic={0.55}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={() => onSelect()}
            initial={false}
            animate={{ 
                scale, 
                opacity: 1, 
                x: isDragging ? x.get() : fanX,
                y: isDragging ? y.get() : fanY,
                rotate: isDragging ? tilt.get() : (isActive ? 0 : fanRotation),
                zIndex: isTop ? zIndex.get() : zIndexBase,
            }}
            transition={{ 
                type: 'spring', 
                stiffness: isDragging ? 400 : 180, 
                damping: isDragging ? 24 : 26, 
                mass: isDragging ? 0.3 : 1.2
            }}
            whileHover={!isTop ? { 
                y: fanY - 20, 
                scale: scale * 1.05,
                transition: { duration: 0.2, ease: "easeOut" } 
            } : {}}
            onMouseEnter={() => !isTop && category.id && queryClient && predictivePrefetchCategory(queryClient, userId, category.id)}
            onPointerDown={() => !isTop && category.id && queryClient && predictivePrefetchCategory(queryClient, userId, category.id)}
            exit={{ 
                scale: 0.82,
                opacity: 0,
                x: x.get() * 0.1,
                y: -40,
                rotate: x.get() > 0 ? 2 : -2,
                zIndex: -10,
                transition: { 
                    duration: 0.35, // Accelerated for "Speed of Light" feel
                    ease: "anticipate",
                    opacity: { duration: 0.2 }
                } 
            }}
            className={cn(
                "absolute flex flex-col items-center justify-center rounded-[32px] p-6 select-none overflow-hidden",
                "transition-[filter,transform] duration-300 gpu-ultra isolation-isolate",
                isTop ? "cursor-grab active:cursor-grabbing shadow-2xl" : "cursor-pointer",
                !isTop && "blur-[1px] brightness-75", // Depth effect for back cards
                theme === 'ivanna-style' ? "bg-card border-[2.5px] border-[#111111] rounded-[32px]" : "bg-black border border-white/10 rounded-[32px]",
                "transform-gpu",
                isActive && "ring-4 ring-brand-accent-2/50 ring-offset-4 ring-offset-background",
                "swipe-card-size",
                ""
            )}

            style={{ 
                transformOrigin: 'center center',
                '--card-image-url': `url(${category.image})`,
                ...({ x: springX, y: springY, zIndex } as any)
            } as React.CSSProperties}
        >
            {/* 🚀 SPEED OF LIGHT: Optimized high-priority image pipeline */}
            <div 
                className="absolute inset-0 opacity-40 transition-opacity duration-700"
                style={{ background: `linear-gradient(to bottom right, ${category.color}, ${category.color}66)` }}
            />
            <QuickFilterImage 
                src={category.image} 
                alt={category.label}
                className={cn(
                    isDragging ? "scale-105" : "scale-100"
                )}
            />
            {/* Dark overlay REMOVED per user request */}

            {/* Icon Container - static for performance */}
            <motion.div
                className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-2xl relative z-10 text-white"
                style={{ background: `linear-gradient(to bottom right, ${category.color}, ${category.color}aa)` }}
                whileHover={{ scale: 1.1, rotate: 5 }}
            >
                <category.icon className="w-10 h-10" strokeWidth={1.5} />
                {isActive && (
                    <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-3 -right-3 bg-brand-accent-2 rounded-full p-1.5 shadow-lg border-2 border-white dark:border-black"
                    >
                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
                    </motion.div>
                )}
            </motion.div>

            {/* Labels */}
            <div className="mt-6 text-center z-10 relative">
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
                            Next
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

        </motion.div>
    );
}
