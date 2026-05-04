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

  const BUTTON_SIZE = 36;

  const containerStyle: React.CSSProperties = {
    background: 'transparent',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none',
    borderRadius: 9999,
    border: 'none',
    boxShadow: 'none',
    height: BUTTON_SIZE,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    boxSizing: 'border-box',
    opacity: !canSwitchMode || isSwitching ? 0.55 : 1,
    transition: 'opacity 0.2s ease',
  };

  return (
    <div
      className={cn('pointer-events-auto', className)}
      style={containerStyle}
    >
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => handleModeSwitch('client')}
        disabled={!canSwitchMode || isSwitching}
        className="flex items-center justify-center relative z-10 rounded-full"
        style={{ width: BUTTON_SIZE, height: BUTTON_SIZE, background: 'transparent', border: 'none', boxShadow: 'none' }}
        title="Client Mode"
        aria-pressed={isClient}
      >
        <UserRound
          className={cn(
            'h-[17px] w-[17px] transition-colors duration-300',
            isClient ? 'text-primary' : 'text-foreground/60',
          )}
          strokeWidth={isClient ? 2.4 : 2}
        />
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => handleModeSwitch('owner')}
        disabled={!canSwitchMode || isSwitching}
        className="flex items-center justify-center relative z-10 rounded-full"
        style={{ width: BUTTON_SIZE, height: BUTTON_SIZE, background: 'transparent', border: 'none', boxShadow: 'none' }}
        title="Owner Mode"
        aria-pressed={!isClient}
      >
        <BriefcaseBusiness
          className={cn(
            'h-[17px] w-[17px] transition-colors duration-300',
            !isClient ? 'text-primary' : 'text-foreground/60',
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


