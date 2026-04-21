import { memo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveMode, ActiveMode } from '@/hooks/useActiveMode';
import { triggerHaptic } from '@/utils/haptics';
import { uiSounds } from '@/utils/uiSounds';
import { prefetchRoute } from '@/utils/routePrefetcher';
import { useTheme } from '@/hooks/useTheme';
import { useFilterStore } from '@/state/filterStore';

interface ModeSwitcherProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'toggle' | 'pill' | 'icon';
}

function ModeSwitcherComponent({ className, size = 'sm', variant = 'pill' }: ModeSwitcherProps) {
  const { activeMode, isSwitching, switchMode, canSwitchMode } = useActiveMode();
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const resetClientFilters = useFilterStore((state) => state.resetClientFilters);
  const resetOwnerFilters = useFilterStore((state) => state.resetOwnerFilters);

  const handleModeSwitch = useCallback(async (newMode: ActiveMode) => {
    if (isSwitching || newMode === activeMode || !canSwitchMode) return;
    
    // Immediate physical feedback
    triggerHaptic('medium');
    uiSounds.playSwitch();
    
    // Reset filters for the side you are leaving so they never bleed across
    if (newMode === 'owner') resetClientFilters();
    else resetOwnerFilters();
    
    await switchMode(newMode);
  }, [isSwitching, activeMode, canSwitchMode, switchMode, resetClientFilters, resetOwnerFilters]);

  const handleToggle = useCallback((event: React.MouseEvent | React.PointerEvent) => {
    event.stopPropagation();
    event.preventDefault();

    const newMode = activeMode === 'client' ? 'owner' : 'client';
    handleModeSwitch(newMode);
  }, [activeMode, handleModeSwitch]);

  const onPointerDown = useCallback(() => {
    // Prefetch destination on first touch/hover for speed of light navigation
    const targetMode = activeMode === 'client' ? 'owner' : 'client';
    prefetchRoute(targetMode === 'owner' ? '/owner/dashboard' : '/client/dashboard');
  }, [activeMode]);

  // ── UNIFIED DESIGN SYSTEM ──
  const isClient = activeMode === 'client';
  const btnH = size === 'sm' ? 32 : size === 'md' ? 36 : 40;
  const iconW = Math.round(btnH * 1.15); // Perfectly wide enough for the icons

  const pillBg = 'transparent';
  const pillBorder = 'none';
  
  const clientColor = isClient ? '#f43f5e' : (isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.45)');
  const ownerColor = !isClient ? '#f97316' : (isLight ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.45)');

  return (
    <button 
      onPointerDown={onPointerDown}
      onClick={handleToggle}
      disabled={!canSwitchMode}
      className={cn(
        'relative flex items-center justify-center rounded-full overflow-hidden',
        'transition-all duration-150 ease-out',
        'active:scale-[0.92]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'touch-manipulation select-none',
        className
      )}
      style={{
        height: btnH,
        minWidth: iconW * 2,
        background: pillBg,
        border: pillBorder,
        padding: '0 4px',
      }}
      aria-label={`Switch to ${isClient ? 'Business' : 'Client'} mode`}
    >
      <div
        className="relative flex items-center w-full h-full"
        style={{ width: iconW * 2 }}
      >
        <motion.div
          layoutId="mode-highlight"
          className="absolute rounded-full"
          initial={false}
          animate={{ left: isClient ? '4%' : '54%' }}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          style={{
            width: '42%',
            height: '80%',
            background: 'transparent',
            top: '50%',
            y: '-50%',
          }}
        />

        <div className="flex-1 flex items-center justify-center relative z-10">
          <User
            strokeWidth={isClient ? 2 : 1.5}
            className="h-[18px] w-[18px] transition-all duration-200"
            style={{ color: clientColor, transform: isClient ? 'scale(1.1)' : 'scale(1)' }}
          />
        </div>

        <div className="flex-1 flex items-center justify-center relative z-10">
          <UserCheck
            strokeWidth={!isClient ? 2 : 1.5}
            className="h-[18px] w-[18px] transition-all duration-200"
            style={{ color: ownerColor, transform: !isClient ? 'scale(1.1)' : 'scale(1)' }}
          />
        </div>
      </div>
    </button>
  );
}

export const ModeSwitcher = memo(ModeSwitcherComponent);

export const ModeSwitcherCompact = memo(function ModeSwitcherCompact({ className }: { className?: string }) {
  return <ModeSwitcher size="sm" className={className} />;
});

export const ModeSwitcherToggle = memo(function ModeSwitcherToggle({ className }: { className?: string }) {
  return <ModeSwitcher size="md" className={className} />;
});


