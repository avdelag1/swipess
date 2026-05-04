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
      ? 'rgba(255, 255, 255, 0.94)'
      : 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(20px) saturate(160%)',
    WebkitBackdropFilter: 'blur(20px) saturate(160%)',
    borderRadius: '0.85rem',
    border: isLight ? '1px solid rgba(0,0,0,0.03)' : '1px solid rgba(255,255,255,0.03)',
    boxShadow: isLight 
      ? '0 1px 4px rgba(0,0,0,0.02)' 
      : '0 4px 16px rgba(0,0,0,0.1)',
    height: '30px',
    position: 'relative',
    overflow: 'hidden',
    padding: '3px',
    display: 'flex',
    alignItems: 'center',
    minWidth: '58px'
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
          x: isClient ? 0 : 28,
          width: 24,
          height: 24,
          background: isClient 
            ? 'linear-gradient(135deg, #FF4D00, #FF8C00)' 
            : 'linear-gradient(135deg, #EB4898, #FF4D00)',
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 35
        }}
        style={{
          borderRadius: '0.75rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      />

      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => handleModeSwitch('client')}
        disabled={!canSwitchMode || isSwitching}
        className="w-6.5 h-6.5 flex-1 flex items-center justify-center relative z-10"
        title="Client Mode"
        aria-pressed={isClient}
      >
        <User
          className={cn('h-3.5 w-3.5 transition-colors duration-300', isClient ? 'text-white' : 'text-slate-400')}
          strokeWidth={isClient ? 2.5 : 2}
        />
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => handleModeSwitch('owner')}
        disabled={!canSwitchMode || isSwitching}
        className="w-6.5 h-6.5 flex-1 flex items-center justify-center relative z-10"
        title="Owner Mode"
        aria-pressed={!isClient}
      >
        <UserCheck
          className={cn('h-3.5 w-3.5 transition-colors duration-300', !isClient ? 'text-white' : 'text-slate-400')}
          strokeWidth={!isClient ? 2.5 : 2}
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


