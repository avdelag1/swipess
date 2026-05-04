import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BriefcaseBusiness, UserRound } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveMode, ActiveMode } from '@/hooks/useActiveMode';
import { triggerHaptic } from '@/utils/haptics';
import { uiSounds } from '@/utils/uiSounds';
import { useFilterStore } from '@/state/filterStore';
import useAppTheme from '@/hooks/useAppTheme';

interface ModeSwitcherProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'toggle' | 'pill' | 'icon';
}

function ModeSwitcherComponent({ className }: ModeSwitcherProps) {
  const { activeMode, isSwitching, switchMode, canSwitchMode } = useActiveMode();
  const { isLight } = useAppTheme();
  const resetClientFilters = useFilterStore((state) => state.resetClientFilters);
  const resetOwnerFilters = useFilterStore((state) => state.resetOwnerFilters);

  const handleModeSwitch = useCallback(async (newMode: ActiveMode) => {
    if (isSwitching || newMode === activeMode || !canSwitchMode) return;
    
    triggerHaptic('medium');
    uiSounds.playSwitch();
    
    if (newMode === 'owner') resetClientFilters();
    else resetOwnerFilters();
    
    await switchMode(newMode);
  }, [isSwitching, activeMode, canSwitchMode, switchMode, resetClientFilters, resetOwnerFilters]);

  const isClient = activeMode === 'client';

  // Single segmented pill containing both halves — eliminates the "two random
  // glass squares floating" look and visually anchors the mode-switch as one
  // control. Only the active half shows colored fill.
  // Geometry for crisp alignment
  const PAD = 3;
  const THUMB_W = 36;
  const THUMB_H = 30;
  const HEIGHT = 36;
  const WIDTH = THUMB_W * 2 + PAD * 2;

  const containerStyle: React.CSSProperties = {
    background: isLight
      ? 'hsl(var(--muted) / 0.85)'
      : 'hsl(var(--card) / 0.55)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    borderRadius: 9999,
    border: isLight
      ? '1px solid hsl(var(--border) / 0.8)'
      : '1px solid hsl(var(--foreground) / 0.1)',
    boxShadow: isLight
      ? 'inset 0 1px 1px hsl(var(--foreground) / 0.05), 0 1px 2px hsl(var(--foreground) / 0.04)'
      : 'inset 0 1px 0 hsl(var(--foreground) / 0.06), 0 1px 2px hsl(var(--background) / 0.5)',
    height: HEIGHT,
    width: WIDTH,
    position: 'relative',
    padding: PAD,
    display: 'flex',
    alignItems: 'center',
    boxSizing: 'border-box',
    opacity: !canSwitchMode || isSwitching ? 0.55 : 1,
    transition: 'opacity 0.2s ease',
  };

  return (
    <div
      className={cn('pointer-events-auto', className)}
      style={containerStyle}
    >
      {/* Sliding thumb */}
      <motion.div
        className="absolute z-0 pointer-events-none"
        initial={false}
        animate={{ x: isClient ? 0 : THUMB_W }}
        transition={{ type: 'spring', stiffness: 500, damping: 38 }}
        style={{
          top: PAD,
          left: PAD,
          width: THUMB_W,
          height: THUMB_H,
          borderRadius: 9999,
          background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
          boxShadow:
            '0 4px 12px hsl(var(--primary) / 0.32), inset 0 1px 0 hsl(var(--primary-foreground) / 0.35)',
        }}
      />

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => handleModeSwitch('client')}
        disabled={!canSwitchMode || isSwitching}
        className="flex items-center justify-center relative z-10 rounded-full"
        style={{ width: THUMB_W, height: THUMB_H }}
        title="Client Mode"
        aria-pressed={isClient}
      >
        <UserRound
          className={cn(
            'h-[17px] w-[17px] transition-colors duration-300',
            isClient ? 'text-primary-foreground' : 'text-foreground/60',
          )}
          strokeWidth={isClient ? 2.4 : 2}
        />
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => handleModeSwitch('owner')}
        disabled={!canSwitchMode || isSwitching}
        className="flex items-center justify-center relative z-10 rounded-full"
        style={{ width: THUMB_W, height: THUMB_H }}
        title="Owner Mode"
        aria-pressed={!isClient}
      >
        <BriefcaseBusiness
          className={cn(
            'h-[17px] w-[17px] transition-colors duration-300',
            !isClient ? 'text-primary-foreground' : 'text-foreground/60',
          )}
          strokeWidth={!isClient ? 2.4 : 2}
        />
      </motion.button>
    </div>
  );
}

export const ModeSwitcher = memo(ModeSwitcherComponent);

export const ModeSwitcherCompact = memo(function ModeSwitcherCompact({ className }: { className?: string }) {
  return <ModeSwitcher size="sm" className={className} />;
});

export const ModeSwitcherToggle = memo(function ModeSwitcherToggle({ className }: { className?: string }) {
  return <ModeSwitcher size="md" className={className} />;
});


