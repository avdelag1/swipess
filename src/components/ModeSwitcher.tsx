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
      ? 'rgba(255, 255, 255, 0.86)'
      : 'rgba(255, 255, 255, 0.045)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    borderRadius: '1rem',
    border: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.06)',
    boxShadow: isLight
      ? '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)'
      : '0 1px 0 rgba(255,255,255,0.04) inset, 0 4px 18px rgba(0,0,0,0.35)',
    height: '36px',
    position: 'relative',
    overflow: 'hidden',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    minWidth: '68px',
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
          x: isClient ? 0 : 30,
          width: 28,
          height: 28,
          background: isClient
            ? 'linear-gradient(135deg, #EB4898, #8B5CF6)'
            : 'linear-gradient(135deg, #8B5CF6, #6366F1)',
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        style={{
          borderRadius: '0.85rem',
          boxShadow: isClient
            ? '0 4px 14px rgba(235,72,152,0.4)'
            : '0 4px 14px rgba(139,92,246,0.4)',
        }}
      />

      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => handleModeSwitch('client')}
        disabled={!canSwitchMode || isSwitching}
        className="h-7 w-7 flex items-center justify-center relative z-10"
        title="Client Mode"
        aria-pressed={isClient}
      >
        <User
          className={cn('h-4 w-4 transition-colors duration-300', isClient ? 'text-white' : (isLight ? 'text-slate-500' : 'text-slate-400'))}
          strokeWidth={isClient ? 2.6 : 2.1}
        />
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => handleModeSwitch('owner')}
        disabled={!canSwitchMode || isSwitching}
        className="h-7 w-7 flex items-center justify-center relative z-10"
        title="Owner Mode"
        aria-pressed={!isClient}
      >
        <UserCheck
          className={cn('h-4 w-4 transition-colors duration-300', !isClient ? 'text-white' : (isLight ? 'text-slate-500' : 'text-slate-400'))}
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


