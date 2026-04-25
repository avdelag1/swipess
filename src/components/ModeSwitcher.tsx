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

  const glassButtonStyle = (isActive: boolean, color: string) => ({
    background: isActive 
      ? (isLight ? `${color}15` : `${color}25`) 
      : (isLight ? 'rgba(255, 255, 255, 0.75)' : 'rgba(15, 25, 55, 0.45)'),
    backdropFilter: 'blur(36px) saturate(280%)',
    WebkitBackdropFilter: 'blur(36px) saturate(280%)',
    borderRadius: '1.2rem',
    border: 'none',
    boxShadow: isActive 
      ? (isLight ? `0 12px 30px ${color}20` : `0 0 40px ${color}50`) 
      : (isLight ? '0 6px 20px rgba(0,0,0,0.04)' : '0 15px 40px rgba(0,0,0,0.3)'),
    pointerEvents: 'auto' as const,
  });

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          handleModeSwitch('client');
        }}
        disabled={!canSwitchMode || isSwitching}
        className={cn(
          "w-11 h-11 flex items-center justify-center transition-all duration-300 relative rounded-2xl",
          isClient 
            ? "opacity-100" 
            : (isLight ? "opacity-70 hover:opacity-100" : "opacity-70 hover:opacity-100")
        )}

        style={glassButtonStyle(isClient, '#f43f5e')}
        title="Client Mode"
      >
        <User className={cn("h-5 w-5", isClient ? "text-[#f43f5e]" : "text-[var(--hud-text)]")} strokeWidth={isClient ? 2.5 : 1.5} />
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => {
          handleModeSwitch('owner');
        }}
        disabled={!canSwitchMode || isSwitching}
        className={cn(
          "w-11 h-11 flex items-center justify-center transition-all duration-300 relative rounded-2xl",
          !isClient 
            ? "opacity-100" 
            : (isLight ? "opacity-70 hover:opacity-100" : "opacity-70 hover:opacity-100")
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


