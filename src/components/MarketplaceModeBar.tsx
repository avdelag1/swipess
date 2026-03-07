import { memo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Home, Bike, LayoutGrid, Wrench, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFilterStore } from '@/state/filterStore';
import { useTheme } from '@/hooks/useTheme';

type MarketplaceIntent = 'all' | 'property' | 'motorcycle' | 'bicycle' | 'worker' | 'leads';

const IntentIcon = ({ intent, active }: { intent: MarketplaceIntent; active: boolean }) => {
    const size = "w-4 h-4 sm:w-5 sm:h-5";
    const strokeWidth = active ? 3.5 : 2.5;

    if (intent === 'all') return <LayoutGrid className={size} strokeWidth={strokeWidth} />;
    if (intent === 'property') return <Home className={size} strokeWidth={strokeWidth} />;
    if (intent === 'motorcycle') {
        return (
            <svg className={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="5" cy="17" r="3" />
                <circle cx="19" cy="17" r="3" />
                <path d="M9 17h6" />
                <path d="M19 17l-2-5h-4l-3-4H6l1 4" />
                <path d="M14 7h3l2 5" />
            </svg>
        );
    }
    if (intent === 'bicycle') return <Bike className={size} strokeWidth={strokeWidth} />;
    if (intent === 'worker') return <Wrench className={size} strokeWidth={strokeWidth} />;
    if (intent === 'leads') return <Zap className={size} strokeWidth={strokeWidth} />;
    return <LayoutGrid className={size} strokeWidth={strokeWidth} />;
};

export const MarketplaceModeBar = memo(() => {
    const { activeIntent, setActiveIntent } = useFilterStore((s) => ({
        activeIntent: s.activeIntent,
        setActiveIntent: s.setActiveIntent,
    }));
    const { theme } = useTheme();
    const isDark = theme !== 'white-matte';
    const scrollRef = useRef<HTMLDivElement>(null);

    const intents: { id: MarketplaceIntent; label: string; color: string }[] = [
        { id: 'all', label: 'All', color: 'from-blue-500 to-indigo-600' },
        { id: 'property', label: 'Properties', color: 'from-emerald-500 to-teal-600' },
        { id: 'motorcycle', label: 'Motos', color: 'from-orange-500 to-rose-600' },
        { id: 'bicycle', label: 'Bikes', color: 'from-lime-500 to-green-600' },
        { id: 'worker', label: 'Workers', color: 'from-purple-500 to-violet-600' },
        { id: 'leads', label: 'Incoming', color: 'from-pink-500 to-fuchsia-600' },
    ];

    return (
        <div className="relative w-full z-40 bg-transparent pb-2 pt-1 px-4">
            <div
                ref={scrollRef}
                className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 -mx-4 px-4 mask-fade-edges"
            >
                {intents.map((intent) => {
                    const isActive = activeIntent === intent.id;

                    return (
                        <motion.button
                            key={intent.id}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => setActiveIntent(intent.id)}
                            className={cn(
                                "flex items-center gap-2 px-4 h-10 rounded-full flex-shrink-0 transition-all duration-300 border backdrop-blur-md",
                                isActive
                                    ? cn("bg-gradient-to-r shadow-lg border-white/20 text-white", intent.color)
                                    : isDark
                                        ? "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                                        : "bg-black/5 border-black/5 text-black/60 hover:bg-black/10"
                            )}
                        >
                            <IntentIcon intent={intent.id} active={isActive} />
                            <span className={cn(
                                "text-sm font-black uppercase tracking-tight",
                                isActive ? "opacity-100" : "opacity-80"
                            )}>
                                {intent.label}
                            </span>

                            {isActive && (
                                <motion.div
                                    layoutId="activeIntentMarker"
                                    className="w-1 h-1 rounded-full bg-white ml-0.5"
                                />
                            )}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
});
