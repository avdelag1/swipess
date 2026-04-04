import { useRef, useEffect, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { SlidersHorizontal, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/utils/microPolish';
import { useScrollBounce } from '@/hooks/useScrollBounce';

interface TinderTopNavTab {
  id: string;
  label: string;
}

interface TinderTopNavProps {
  tabs: TinderTopNavTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  /** Slot for the filter trigger — renders instead of the default sliders button.
   *  Pass a QuickFilterDropdown component here to preserve its own open state. */
  filterSlot?: React.ReactNode;
  onFilterClick?: () => void;
  onBoostClick: () => void;
  className?: string;
}

function TinderTopNavComponent({
  tabs,
  activeTab,
  onTabChange,
  filterSlot,
  onFilterClick,
  onBoostClick,
  className,
}: TinderTopNavProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // ── LIQUID MOMENTUM: Bounce physics on pill scroll ──────────────
  const bounceRef = useScrollBounce({
    maxTilt: 4,
    maxBounce: 2,
    damping: 0.2,
    edgeScale: 0.97,
    childSelector: '> button',
  });

  // Merge refs so both auto-scroll and bounce physics work together
  const mergedRef = useCallback((node: HTMLDivElement | null) => {
    (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    (bounceRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  }, [bounceRef]);

  // Scroll active pill into view when it changes
  useEffect(() => {
    if (activeTabRef.current && scrollRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [activeTab]);

  return (
    <div
      className={cn(
        'flex items-center w-full px-2 py-2 gap-2 tinder-top-nav-container',
        className
      )}
    >
      {/* Filter / Sliders — use provided slot if available, else default icon button */}
      {filterSlot ? (
        <div className="flex-shrink-0">{filterSlot}</div>
      ) : (
        <motion.button
          whileTap={{ scale: 0.88 }}
          onPointerDown={(e) => {
            e.preventDefault();
            haptics.tap();
            onFilterClick?.();
          }}
          className={cn(
            'flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition-colors',
            isLight
              ? 'text-foreground/80 hover:bg-foreground/8'
              : 'text-white/80 hover:bg-white/10'
          )}
          aria-label="Filters"
        >
          <SlidersHorizontal className="w-5 h-5" strokeWidth={2} />
        </motion.button>
      )}

      {/* Scrollable pill buttons */}
      <div
        ref={mergedRef}
        className="tinder-nav-scroll flex-1 overflow-x-auto flex items-center gap-2 py-0.5"
      >

        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <motion.button
              key={tab.id}
              ref={isActive ? activeTabRef : undefined}
              whileTap={{ scale: 0.94 }}
              onPointerDown={(e) => {
                e.preventDefault();
                if (!isActive) {
                  haptics.tap();
                  onTabChange(tab.id);
                }
              }}
              className={cn(
                'flex-shrink-0 px-4 py-[7px] rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 touch-manipulation',
                isActive
                  ? isLight
                    ? 'bg-foreground text-background shadow-sm'
                    : 'bg-white text-black shadow-sm'
                  : isLight
                    ? 'bg-transparent border border-foreground/20 text-foreground/70 hover:border-foreground/40'
                    : 'bg-transparent border border-white/20 text-white/70 hover:border-white/40'
              )}
              aria-pressed={isActive}
            >
              {tab.label}
            </motion.button>
          );
        })}
      </div>

      {/* Boost / Lightning icon */}
      <motion.button
        whileTap={{ scale: 0.88 }}
        onPointerDown={(e) => {
          e.preventDefault();
          haptics.tap();
          onBoostClick();
        }}
        className={cn(
          'flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition-colors',
          isLight
            ? 'text-amber-500 hover:bg-amber-500/10'
            : 'text-amber-300 hover:bg-amber-300/10'
        )}
        aria-label="Boost"
      >
        <Zap className="w-5 h-5" strokeWidth={2.5} fill="currentColor" />
      </motion.button>
    </div>
  );
}

export const TinderTopNav = memo(TinderTopNavComponent);
