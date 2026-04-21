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
    <div 
      className={cn(
        'relative flex items-center bg-white/5 border border-white/10 rounded-full p-1',
        className
      )}
      style={{ height: btnH, minWidth: iconW * 2 + 8 }}
    >
      <button
        onClick={() => handleModeSwitch('client')}
        disabled={!canSwitchMode || isSwitching}
        className={cn(
          "flex-1 h-full flex items-center justify-center rounded-full transition-all duration-300 relative z-10",
          activeMode === 'client' ? "bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]" : "opacity-40 hover:opacity-100"
        )}
      >
        <User
          className="h-[16px] w-[16px]"
          style={{ color: activeMode === 'client' ? '#f43f5e' : (isLight ? '#000' : '#fff') }}
        />
      </button>

      <button
        onClick={() => handleModeSwitch('owner')}
        disabled={!canSwitchMode || isSwitching}
        className={cn(
          "flex-1 h-full flex items-center justify-center rounded-full transition-all duration-300 relative z-10",
          activeMode === 'owner' ? "bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]" : "opacity-40 hover:opacity-100"
        )}
      >
        <UserCheck
          className="h-[16px] w-[16px]"
          style={{ color: activeMode === 'owner' ? '#f97316' : (isLight ? '#000' : '#fff') }}
        />
      </button>
      
      {/* Dynamic Slide Background */}
      <motion.div
        className="absolute h-[calc(100%-8px)] rounded-full bg-white/5 border border-white/5 pointer-events-none"
        initial={false}
        animate={{ 
          left: activeMode === 'client' ? '4px' : '50%',
          width: 'calc(50% - 4px)'
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
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


