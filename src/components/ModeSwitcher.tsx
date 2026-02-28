import { memo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserCog, ArrowLeftRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActiveMode, ActiveMode } from '@/hooks/useActiveMode';
import { triggerHaptic } from '@/utils/haptics';
import { useTheme } from '@/hooks/useTheme';

interface ModeSwitcherProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'toggle' | 'pill' | 'icon';
}

function ModeSwitcherComponent({ className, size = 'sm', variant = 'pill' }: ModeSwitcherProps) {
  const { activeMode, isSwitching, switchMode, canSwitchMode } = useActiveMode();
  const { theme } = useTheme();
  const isDark = theme === 'black-matte';
  const lastClickTime = useRef(0);

  const glassBg = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)';
  const glassBorder = isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(0, 0, 0, 0.08)';
  const floatingShadow = isDark
    ? 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.3)'
    : 'inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 12px rgba(0,0,0,0.08)';

  const handleModeSwitch = useCallback(async (newMode: ActiveMode) => {
    const now = Date.now();
    if (now - lastClickTime.current < 300) return;
    lastClickTime.current = now;

    if (isSwitching || newMode === activeMode || !canSwitchMode) return;
    triggerHaptic('medium');
    await switchMode(newMode);
  }, [isSwitching, activeMode, canSwitchMode, switchMode]);

  const handleToggle = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();

    const newMode = activeMode === 'client' ? 'owner' : 'client';
    handleModeSwitch(newMode);
  }, [activeMode, handleModeSwitch]);

  const sizeClasses = {
    sm: 'h-7 text-[10px]',
    md: 'h-8 text-xs',
    lg: 'h-9 text-sm',
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={(e) => handleToggle(e)}
        disabled={isSwitching || !canSwitchMode}
        className={cn(
          'relative flex items-center justify-center rounded-lg',
          'transition-all duration-100 ease-out',
          'active:scale-[0.9]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'touch-manipulation',
          '-webkit-tap-highlight-color-transparent',
          size === 'sm' ? 'h-8 w-8 rounded-xl' : size === 'md' ? 'h-10 w-10 rounded-2xl' : 'h-11 w-11 rounded-2xl',
          className
        )}
        style={{
          backgroundColor: glassBg,
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          border: glassBorder,
          boxShadow: floatingShadow,
        }}
        aria-label={`Switch to ${activeMode === 'client' ? 'Client Side' : 'Business Side'} mode`}
      >
        <AnimatePresence mode="wait">
          {isSwitching ? (
            <motion.div
              key="loader"
              initial={{ opacity: 0, rotate: 0 }}
              animate={{ opacity: 1, rotate: 360 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            </motion.div>
          ) : (
            <motion.div
              key={activeMode}
              initial={{ opacity: 0, scale: 0.8, rotate: -180 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              {/* HIGH CONTRAST: Clear icon colors */}
              {activeMode === 'client' ? (
                <User strokeWidth={4} className="h-3.5 w-3.5 text-teal-400" />
              ) : (
                <UserCog strokeWidth={4} className="h-3.5 w-3.5 text-orange-400" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    );
  }

  if (variant === 'toggle') {
    return (
      <button
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
            backgroundColor: activeMode === 'client' ? 'rgba(45, 212, 191, 0.2)' : 'rgba(251, 146, 60, 0.2)',
            boxShadow: 'none'
          }}
          transition={{ type: 'spring', stiffness: 450, damping: 30 }}
          style={{ willChange: 'left, right, background-color' }}
        />

        {/* HIGH CONTRAST: Clear active state distinction */}
        <div className={cn(
          'relative z-10 flex items-center justify-center w-full gap-1 px-2 py-0.5 rounded-full transition-all duration-300',
          activeMode === 'client' ? 'text-teal-400 font-black scale-105' : 'text-white/50 hover:text-white/80'
        )}>
          <User strokeWidth={4} className="h-3 w-3" />
          <span className="text-[10px] uppercase tracking-wider font-extrabold line-clamp-1">Client</span>
        </div>

        <div className={cn(
          'relative z-10 flex items-center justify-center w-full gap-1 px-2 py-0.5 rounded-full transition-all duration-300',
          activeMode === 'owner' ? 'text-orange-400 font-black scale-105' : 'text-white/50 hover:text-white/80'
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
      onClick={(e) => handleToggle(e)}
      disabled={isSwitching || !canSwitchMode}
      className={cn(
        'relative flex items-center gap-1.5 rounded-xl px-2.5',
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
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: glassBorder,
        boxShadow: floatingShadow,
      }}
      aria-label={`Switch to ${activeMode === 'client' ? 'Client Side' : 'Business Side'} mode`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activeMode}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="flex items-center gap-1.5"
        >
          {/* HIGH CONTRAST: Clear colors without glow effects */}
          {isSwitching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
          ) : activeMode === 'client' ? (
            <>
              <User strokeWidth={4} className="h-3.5 w-3.5 text-teal-400" />
              <span className="font-black text-teal-400 uppercase tracking-tight">Client Side</span>
            </>
          ) : (
            <>
              <UserCog strokeWidth={4} className="h-3.5 w-3.5 text-orange-400" />
              <span className="font-black text-orange-400 uppercase tracking-tight">Business Side</span>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <ArrowLeftRight className="h-3 w-3 text-white/80" />
    </button>
  );
}

export const ModeSwitcher = memo(ModeSwitcherComponent, (prevProps, nextProps) => {
  return (
    prevProps.className === nextProps.className &&
    prevProps.size === nextProps.size &&
    prevProps.variant === nextProps.variant
  );
});

export const ModeSwitcherCompact = memo(function ModeSwitcherCompact({ className }: { className?: string }) {
  return <ModeSwitcher variant="icon" size="sm" className={className} />;
});

export const ModeSwitcherToggle = memo(function ModeSwitcherToggle({ className }: { className?: string }) {
  return <ModeSwitcher variant="toggle" size="sm" className={className} />;
});
