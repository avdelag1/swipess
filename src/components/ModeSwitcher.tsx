import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { User, UserCheck } from 'lucide-react';
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
    background: isLight
      ? 'rgba(255, 255, 255, 0.92)'
      : 'rgba(15, 25, 55, 0.55)',
    backdropFilter: 'blur(22px) saturate(220%)',
    WebkitBackdropFilter: 'blur(22px) saturate(220%)',
    borderRadius: '1.5rem',
    boxShadow: isLight
      ? '0 12px 40px rgba(0,0,0,0.12), inset 0 0 0 1px rgba(0,0,0,0.08)'
      : '0 25px 70px -10px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255,255,255,0.12)',
  };

  const halfBase = "w-8 h-8 flex items-center justify-center transition-all duration-200 relative rounded-xl";

  return (
    <div
      className={cn('flex items-center gap-0.5 p-1 pointer-events-auto', className)}
      style={containerStyle}
    >
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => handleModeSwitch('client')}
        disabled={!canSwitchMode || isSwitching}
        className={cn(halfBase, isClient && 'shadow-sm')}
        style={{
          background: isClient
            ? (isLight ? 'rgba(244, 63, 94, 0.12)' : 'rgba(244, 63, 94, 0.22)')
            : 'transparent',
        }}
        title="Client Mode"
        aria-pressed={isClient}
      >
        <User
          className={cn('h-[18px] w-[18px]', isClient ? 'text-[#f43f5e]' : 'text-[var(--hud-text)] opacity-60')}
          strokeWidth={isClient ? 2.5 : 1.8}
        />
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => handleModeSwitch('owner')}
        disabled={!canSwitchMode || isSwitching}
        className={cn(halfBase, !isClient && 'shadow-sm')}
        style={{
          background: !isClient
            ? (isLight ? 'rgba(249, 115, 22, 0.14)' : 'rgba(249, 115, 22, 0.24)')
            : 'transparent',
        }}
        title="Owner Mode"
        aria-pressed={!isClient}
      >
        <UserCheck
          className={cn('h-[18px] w-[18px]', !isClient ? 'text-[#f97316]' : 'text-[var(--hud-text)] opacity-60')}
          strokeWidth={!isClient ? 2.5 : 1.8}
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


