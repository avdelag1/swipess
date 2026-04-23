import { memo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveMode, ActiveMode } from '@/hooks/useActiveMode';
import { triggerHaptic } from '@/utils/haptics';
import { uiSounds } from '@/utils/uiSounds';
import { prefetchRoute } from '@/utils/routePrefetcher';
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

  const glassButtonStyle = {
    background: 'var(--hud-bg)',
    backdropFilter: 'blur(32px) saturate(210%)',
    WebkitBackdropFilter: 'blur(32px) saturate(210%)',
    borderRadius: '1rem',
    border: '1px solid var(--hud-border)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        onClick={() => handleModeSwitch('client')}
        disabled={!canSwitchMode || isSwitching}
        className={cn(
          "w-11 h-11 flex items-center justify-center transition-all duration-300 relative rounded-2xl active:scale-90",
          isClient ? "opacity-100 ring-1 ring-[#f43f5e]/30" : "opacity-40 hover:opacity-100"
        )}
        style={glassButtonStyle}
        title="Client Mode"
      >
        <User className={cn("h-4.5 w-4.5", isClient ? "text-[#f43f5e]" : "text-[var(--hud-text)]")} strokeWidth={isClient ? 3 : 2} />
      </button>

      <button
        onClick={() => handleModeSwitch('owner')}
        disabled={!canSwitchMode || isSwitching}
        className={cn(
          "w-11 h-11 flex items-center justify-center transition-all duration-300 relative rounded-2xl active:scale-90",
          !isClient ? "opacity-100 ring-1 ring-[#f97316]/30" : "opacity-40 hover:opacity-100"
        )}
        style={glassButtonStyle}
        title="Owner Mode"
      >
        <UserCheck className={cn("h-4.5 w-4.5", !isClient ? "text-[#f97316]" : "text-[var(--hud-text)]")} strokeWidth={!isClient ? 3 : 2} />
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


