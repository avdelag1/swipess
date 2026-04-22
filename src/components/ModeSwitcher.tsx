import { memo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveMode, ActiveMode } from '@/hooks/useActiveMode';
import { triggerHaptic } from '@/utils/haptics';
import { uiSounds } from '@/utils/uiSounds';
import { prefetchRoute } from '@/utils/routePrefetcher';
import useAppTheme from '@/hooks/useAppTheme';
import { useFilterStore } from '@/state/filterStore';

interface ModeSwitcherProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'toggle' | 'pill' | 'icon';
}

function ModeSwitcherComponent({ className, size = 'sm' }: ModeSwitcherProps) {
  const { activeMode, isSwitching, switchMode, canSwitchMode } = useActiveMode();
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

  return (
    <div 
      className={cn('flex items-center gap-4', className)}
    >
      <button
        onClick={() => handleModeSwitch('client')}
        disabled={!canSwitchMode || isSwitching}
        className={cn(
          "transition-all duration-300 relative rounded-full active:bg-[var(--hud-active-bg)] p-1",
          isClient ? "opacity-100 scale-110" : "opacity-30 hover:opacity-100"
        )}
      >
        <User className={cn("h-4 w-4", isClient ? "text-[#f43f5e]" : "text-[var(--hud-text)]")} strokeWidth={isClient ? 3 : 2} />
      </button>

      <div className="w-[1px] h-3 bg-[var(--hud-text)]/10" />

      <button
        onClick={() => handleModeSwitch('owner')}
        disabled={!canSwitchMode || isSwitching}
        className={cn(
          "transition-all duration-300 relative rounded-full active:bg-[var(--hud-active-bg)] p-1",
          !isClient ? "opacity-100 scale-110" : "opacity-30 hover:opacity-100"
        )}
      >
        <UserCheck className={cn("h-4 w-4", !isClient ? "text-[#f97316]" : "text-[var(--hud-text)]")} strokeWidth={!isClient ? 3 : 2} />
      </button>
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


