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
  const roleText = activeMode.toUpperCase() + '!';
  
  // Design metrics from screenshot
  const pillHeight = 44; // Premium oversized pill
  const pillPadding = 12;

  const glassStyle: React.CSSProperties = {
    background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(20px) saturate(1.8)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.8)',
    border: `1.5px solid ${isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.15)'}`,
    boxShadow: isLight 
      ? '0 6px 18px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.4)' 
      : '0 8px 32px rgba(0,0,0,0.45), inset 0 0.5px 1px rgba(255,255,255,0.1)',
  };

  const clientColor = '#f43f5e';
  const ownerColor = '#f97316';
  const activeColor = isClient ? clientColor : ownerColor;

  return (
    <motion.button 
      onPointerDown={onPointerDown}
      onClick={handleToggle}
      disabled={!canSwitchMode}
      whileTap={{ scale: 0.96 }}
      className={cn(
        'relative flex items-center gap-1.5 rounded-2xl overflow-hidden',
        'transition-all duration-300 ease-out',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'touch-manipulation select-none pointer-events-auto',
        className
      )}
      style={{
        ...glassStyle,
        height: pillHeight,
        paddingLeft: pillPadding,
        paddingRight: 6, // icons on right have less padding
      }}
      aria-label={`Switch to ${isClient ? 'Business' : 'Client'} mode`}
    >
      {/* Role Identity (Logo + Text) */}
      <div className="flex items-center gap-2 pr-2 border-r border-white/10 h-3/5">
        <div className="w-7 h-7 shrink-0 rounded-[10px] overflow-hidden bg-black/40 flex items-center justify-center p-1.5 border border-white/10 shadow-lg">
          <img src="/favicon-32x32.png" alt="" className="w-full h-full object-contain" />
        </div>
        <AnimatePresence mode="wait">

          <motion.span
            key={roleText}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 5 }}
            className={cn(
              "text-[14px] font-black italic tracking-tighter whitespace-nowrap",
              isLight ? "text-foreground" : "text-white"
            )}
            style={{ color: activeColor }}
          >
            {roleText}
          </motion.span>
        </AnimatePresence>
      </div>

      {/* Mode Selectors */}
      <div className="flex items-center gap-1">
        <div className={cn(
          "relative w-7 h-7 flex items-center justify-center rounded-xl transition-all duration-300",
          isClient ? "bg-white/10 shadow-lg" : "opacity-30"
        )}>
          <User
             strokeWidth={isClient ? 3 : 2}
             className="h-4 w-4"
             style={{ color: isClient ? clientColor : (isLight ? '#000' : '#fff') }}
          />
        </div>
        <div className={cn(
          "relative w-7 h-7 flex items-center justify-center rounded-xl transition-all duration-300",
          !isClient ? "bg-white/10 shadow-lg" : "opacity-30"
        )}>
          <UserCheck
             strokeWidth={!isClient ? 3 : 2}
             className="h-4 w-4"
             style={{ color: !isClient ? ownerColor : (isLight ? '#000' : '#fff') }}
          />
        </div>
      </div>

      {/* Switching indicator */}
      {isSwitching && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-background/40 backdrop-blur-md flex items-center justify-center"
        >
          <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
        </motion.div>
      )}
    </motion.button>
  );
}

export const ModeSwitcher = memo(ModeSwitcherComponent);

export const ModeSwitcherCompact = memo(function ModeSwitcherCompact({ className }: { className?: string }) {
  return <ModeSwitcher size="sm" className={className} />;
});

export const ModeSwitcherToggle = memo(function ModeSwitcherToggle({ className }: { className?: string }) {
  return <ModeSwitcher size="md" className={className} />;
});
