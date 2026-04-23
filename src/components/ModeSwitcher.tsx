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

  const glassButtonStyle = (isActive: boolean, color: string) => ({
    background: isActive ? `${color}20` : 'var(--hud-bg)',
    backdropFilter: 'blur(32px) saturate(210%)',
    WebkitBackdropFilter: 'blur(32px) saturate(210%)',
    borderRadius: '1rem',
    border: isActive ? `1.5px solid ${color}` : '1px solid var(--hud-border)',
    boxShadow: isActive ? `0 0 20px ${color}30` : '0 4px 12px rgba(0,0,0,0.05)',
    pointerEvents: 'auto' as const,
  });

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleModeSwitch('client');
        }}
        disabled={!canSwitchMode || isSwitching}
        className={cn(
          "w-11 h-11 flex items-center justify-center transition-all duration-300 relative rounded-2xl",
          isClient 
            ? "opacity-100" 
            : (isLight ? "opacity-70 hover:opacity-100" : "opacity-40 hover:opacity-100")
        )}

        style={glassButtonStyle(isClient, '#f43f5e')}
        title="Client Mode"
      >
        <User className={cn("h-5 w-5", isClient ? "text-[#f43f5e]" : "text-[var(--hud-text)]")} strokeWidth={isClient ? 2.5 : 1.5} />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleModeSwitch('owner');
        }}
        disabled={!canSwitchMode || isSwitching}
        className={cn(
          "w-11 h-11 flex items-center justify-center transition-all duration-300 relative rounded-2xl",
          !isClient 
            ? "opacity-100" 
            : (isLight ? "opacity-70 hover:opacity-100" : "opacity-40 hover:opacity-100")
        )}

        style={glassButtonStyle(!isClient, '#f97316')}
        title="Owner Mode"
      >
        <UserCheck className={cn("h-5 w-5", !isClient ? "text-[#f97316]" : "text-[var(--hud-text)]")} strokeWidth={!isClient ? 2.5 : 1.5} />
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


