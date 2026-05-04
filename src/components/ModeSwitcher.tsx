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
  const containerStyle: React.CSSProperties = {
    background: isLight ? 'hsl(var(--background) / 0.88)' : 'hsl(var(--card) / 0.52)',
    backdropFilter: 'blur(28px) saturate(180%)',
    WebkitBackdropFilter: 'blur(28px) saturate(180%)',
    borderRadius: '9999px',
    border: isLight ? '1px solid hsl(var(--border) / 0.7)' : '1px solid hsl(var(--foreground) / 0.1)',
    boxShadow: isLight
      ? '0 1px 1px hsl(var(--foreground) / 0.04), 0 10px 26px hsl(var(--foreground) / 0.08), inset 0 1px 0 hsl(var(--background) / 0.85)'
      : '0 1px 0 hsl(var(--foreground) / 0.09) inset, 0 12px 30px hsl(var(--background) / 0.45)',
    height: '36px',
    position: 'relative',
    overflow: 'hidden',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    minWidth: '76px',
    opacity: !canSwitchMode || isSwitching ? 0.55 : 1,
    transition: 'opacity 0.2s ease',
  };

  return (
    <div
      className={cn('pointer-events-auto', className)}
      style={containerStyle}
    >
      {/* Sliding indicator */}
      <motion.div
        className="absolute z-0"
        initial={false}
        animate={{
          x: isClient ? 0 : 34,
          width: 34,
          height: 28,
          background: isClient
            ? 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--primary)))'
            : 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))',
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        style={{
          borderRadius: '9999px',
          boxShadow: isClient
            ? '0 8px 18px hsl(var(--accent) / 0.34), inset 0 1px 0 hsl(var(--primary-foreground) / 0.28)'
            : '0 8px 18px hsl(var(--primary) / 0.34), inset 0 1px 0 hsl(var(--primary-foreground) / 0.28)',
        }}
      />

      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => handleModeSwitch('client')}
        disabled={!canSwitchMode || isSwitching}
        className="h-7 w-[34px] flex items-center justify-center relative z-10 rounded-full"
        title="Client Mode"
        aria-pressed={isClient}
      >
        <UserRound
          className={cn('h-4 w-4 transition-colors duration-300', isClient ? 'text-primary-foreground' : 'text-foreground/55')}
          strokeWidth={isClient ? 2.6 : 2.1}
        />
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => handleModeSwitch('owner')}
        disabled={!canSwitchMode || isSwitching}
        className="h-7 w-[34px] flex items-center justify-center relative z-10 rounded-full"
        title="Owner Mode"
        aria-pressed={!isClient}
      >
        <BriefcaseBusiness
          className={cn('h-4 w-4 transition-colors duration-300', !isClient ? 'text-primary-foreground' : 'text-foreground/55')}
          strokeWidth={!isClient ? 2.6 : 2.1}
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


