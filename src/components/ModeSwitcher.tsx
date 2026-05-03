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
      : 'rgba(10, 15, 35, 0.45)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    borderRadius: '1.25rem',
    border: isLight ? '1px solid rgba(0,0,0,0.10)' : '1px solid rgba(255,255,255,0.06)',
    boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)' : '0 4px 16px rgba(0,0,0,0.2)',
    height: '32px',
  };

  const halfBase = "w-7 h-7 flex items-center justify-center transition-all duration-200 relative rounded-[0.85rem]";

  return (
    <div
      className={cn('flex items-center gap-0.5 p-1 pointer-events-auto', className)}
      style={containerStyle}
    >
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => handleModeSwitch('client')}
        disabled={!canSwitchMode || isSwitching}
        className={cn(halfBase)}
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
        className={cn(halfBase)}
        style={{
          background: !isClient
            ? (isLight ? 'rgba(139, 92, 246, 0.14)' : 'rgba(139, 92, 246, 0.24)')
            : 'transparent',
        }}
        title="Owner Mode"
        aria-pressed={!isClient}
      >
        <UserCheck
          className={cn('h-[18px] w-[18px]', !isClient ? 'text-[#8b5cf6]' : 'text-[var(--hud-text)] opacity-60')}
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


