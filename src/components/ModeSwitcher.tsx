import { memo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserCog, ArrowLeftRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveMode, ActiveMode } from '@/hooks/useActiveMode';
import { triggerHaptic } from '@/utils/haptics';
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
  const _lastClickTime = useRef(0);
  const resetClientFilters = useFilterStore((state) => state.resetClientFilters);
  const resetOwnerFilters = useFilterStore((state) => state.resetOwnerFilters);

  const glassBg = isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.06)';
  const glassBorder = isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.12)';
  const floatingShadow = isLight
    ? '0 4px 12px rgba(0,0,0,0.05)'
    : 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.3)';

  const handleModeSwitch = useCallback(async (newMode: ActiveMode) => {
    if (isSwitching || newMode === activeMode || !canSwitchMode) return;
    
    // Immediate physical feedback
    triggerHaptic('medium');
    
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

  const sizeClasses = {
    sm: 'h-7 text-[10px]',
    md: 'h-8 text-xs',
    lg: 'h-9 text-sm',
  };

  if (variant === 'icon') {
    const pillH = size === 'sm' ? 30 : size === 'md' ? 34 : 38;
    const pillBg = activeMode === 'client'
      ? (isLight ? 'rgba(244, 63, 94, 0.12)' : 'rgba(244, 63, 94, 0.2)')
      : (isLight ? 'rgba(249, 115, 22, 0.12)' : 'rgba(249, 115, 22, 0.2)');
    const pillBorder = activeMode === 'client'
      ? (isLight ? '1px solid rgba(244, 63, 94, 0.25)' : '1px solid rgba(244, 63, 94, 0.35)')
      : (isLight ? '1px solid rgba(249, 115, 22, 0.25)' : '1px solid rgba(249, 115, 22, 0.35)');
    const labelColor = activeMode === 'client' ? '#f43f5e' : '#f97316';

    return (
      <button
        onPointerDown={onPointerDown}
        onClick={(e) => handleToggle(e)}
        disabled={isSwitching || !canSwitchMode}
        className={cn(
          'relative flex items-center gap-1.5 rounded-full overflow-hidden px-3',
          'transition-all duration-150 ease-out',
          'active:scale-[0.92]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'touch-manipulation select-none',
          className
        )}
        style={{
          height: pillH,
          minWidth: 78,
          background: pillBg,
          border: pillBorder,
          boxShadow: 'none',
        }}
        aria-label={`Switch to ${activeMode === 'client' ? 'Business Side' : 'Client Side'} mode`}
      >
        {isSwitching ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: labelColor }} />
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div
              key={activeMode}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.5 }}
              className="flex items-center gap-1.5"
            >
              {activeMode === 'client' ? (
                <User strokeWidth={3} className="h-3.5 w-3.5" style={{ color: labelColor }} />
              ) : (
                <UserCog strokeWidth={3} className="h-3.5 w-3.5" style={{ color: labelColor }} />
              )}
              <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: labelColor }}>
                {activeMode === 'client' ? 'Client' : 'Owner'}
              </span>
            </motion.div>
          </AnimatePresence>
        )}
        <ArrowLeftRight className="h-2.5 w-2.5" style={{ color: labelColor, opacity: 0.6 }} />
      </button>
    );
  }

  if (variant === 'toggle') {
    return (
      <button
        onPointerDown={onPointerDown}
        onClick={(e) => handleToggle(e)}
        disabled={isSwitching || !canSwitchMode}
        className={cn(
          'relative flex items-center gap-1.5 rounded-full px-2 py-1',
          'bg-white/5',
          'hover:bg-white/10',
          'transition-all duration-100 ease-out',
          'active:scale-[0.97]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'touch-manipulation',
          '-webkit-tap-highlight-color-transparent',
          sizeClasses[size],
          className
        )}
        aria-label={`Switch to ${activeMode === 'client' ? 'Client Side' : 'Business Side'} mode`}
      >
        <motion.div
          className="absolute inset-y-1 rounded-full bg-gradient-to-r shadow-sm"
          initial={false}
          animate={{
            left: activeMode === 'client' ? '3px' : '50%',
            right: activeMode === 'client' ? '50%' : '3px',
            backgroundColor: activeMode === 'client' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(251, 146, 60, 0.2)',
            boxShadow: 'none'
          }}
          transition={{ type: 'spring', stiffness: 650, damping: 38 }}
          style={{ willChange: 'left, right, background-color' }}
        />

        {/* HIGH CONTRAST: Clear active state distinction */}
        <div className={cn(
          'relative z-10 flex items-center justify-center w-full gap-1 px-2 py-0.5 rounded-full transition-all duration-300',
          activeMode === 'client' ? 'text-rose-400 font-black scale-105' : (isLight ? 'text-foreground/50 hover:text-foreground/80' : 'text-white/50 hover:text-white/80')
        )}>
          <User strokeWidth={4} className="h-3 w-3" />
          <span className="text-[10px] uppercase tracking-wider font-extrabold line-clamp-1">Client</span>
        </div>

        <div className={cn(
          'relative z-10 flex items-center justify-center w-full gap-1 px-2 py-0.5 rounded-full transition-all duration-300',
          activeMode === 'owner' ? 'text-orange-400 font-black scale-105' : (isLight ? 'text-foreground/50 hover:text-foreground/80' : 'text-white/50 hover:text-white/80')
        )}>
          <UserCog strokeWidth={4} className="h-3 w-3" />
          <span className="text-[10px] uppercase tracking-wider font-extrabold line-clamp-1">Business</span>
        </div>

        <AnimatePresence>
          {isSwitching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    );
  }

  return (
    <button
      onPointerDown={onPointerDown}
      onClick={(e) => handleToggle(e)}
      disabled={isSwitching || !canSwitchMode}
      className={cn(
        'relative flex items-center gap-1 rounded-lg px-2',
        'transition-all duration-100 ease-out',
        'active:scale-[0.95]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'touch-manipulation',
        '-webkit-tap-highlight-color-transparent',
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: glassBg,
        border: glassBorder,
        boxShadow: floatingShadow,
      }}
      aria-label={`Switch to ${activeMode === 'client' ? 'Client Side' : 'Business Side'} mode`}
    >
      <AnimatePresence mode="popLayout">
        <motion.div
          key={activeMode}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30, mass: 0.5 }}
          className="flex items-center gap-1.5"
        >
          {/* HIGH CONTRAST: Clear colors without glow effects */}
          {isSwitching ? (
            <Loader2 className={cn("h-3.5 w-3.5 animate-spin", isLight ? "text-foreground" : "text-white")} />
          ) : activeMode === 'client' ? (
            <>
              <User strokeWidth={4} className="h-3.5 w-3.5 text-rose-400" />
              <span className="font-black text-rose-400 uppercase tracking-tight">Client Side</span>
            </>
          ) : (
            <>
              <UserCog strokeWidth={4} className="h-3.5 w-3.5 text-orange-400" />
              <span className="font-black text-orange-400 uppercase tracking-tight">Business Side</span>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <ArrowLeftRight className={cn("h-3 w-3", isLight ? "text-foreground/60" : "text-white/80")} />
    </button>
  );
}

export const ModeSwitcher = memo(ModeSwitcherComponent);

export const ModeSwitcherCompact = memo(function ModeSwitcherCompact({ className }: { className?: string }) {
  return <ModeSwitcher variant="icon" size="sm" className={className} />;
});

export const ModeSwitcherToggle = memo(function ModeSwitcherToggle({ className }: { className?: string }) {
  return <ModeSwitcher variant="toggle" size="sm" className={className} />;
});
