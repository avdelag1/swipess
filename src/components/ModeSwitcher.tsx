import { memo, useCallback, useRef } from 'react';
import { User, Building2, Loader2 } from 'lucide-react';
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

  const handleModeSwitch = useCallback(async (newMode: ActiveMode) => {
    if (isSwitching || newMode === activeMode || !canSwitchMode) return;
    triggerHaptic('medium');
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
    const targetMode = activeMode === 'client' ? 'owner' : 'client';
    prefetchRoute(targetMode === 'owner' ? '/owner/dashboard' : '/client/dashboard');
  }, [activeMode]);

  // ── UNIFIED DUAL-ICON TOGGLE (default for all variants now) ──
  const isClient = activeMode === 'client';

  const pillBg = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)';
  const pillBorder = isLight ? '1px solid rgba(0,0,0,0.10)' : '1px solid rgba(255,255,255,0.14)';

  const clientColor = isClient ? '#f43f5e' : (isLight ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.25)');
  const ownerColor = !isClient ? '#f97316' : (isLight ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.25)');

  return (
    <button
      onPointerDown={onPointerDown}
      onClick={handleToggle}
      disabled={isSwitching || !canSwitchMode}
      className={cn(
        'relative flex items-center justify-center gap-3 rounded-full overflow-hidden',
        'transition-all duration-100 ease-out',
        'active:scale-[0.92]',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'touch-manipulation select-none',
        className
      )}
      style={{
        height: 36,
        minWidth: 82,
        background: pillBg,
        border: pillBorder,
        padding: '0 14px',
      }}
      aria-label={`Switch to ${isClient ? 'Business' : 'Client'} mode`}
    >
      {isSwitching ? (
        <Loader2 className="h-4 w-4 animate-spin" style={{ color: isClient ? '#f43f5e' : '#f97316' }} />
      ) : (
        <>
          {/* Sliding highlight behind active icon */}
          <div
            className="absolute rounded-full transition-all duration-200 ease-out"
            style={{
              width: 28,
              height: 28,
              background: isClient
                ? (isLight ? 'rgba(244,63,94,0.12)' : 'rgba(244,63,94,0.18)')
                : (isLight ? 'rgba(249,115,22,0.12)' : 'rgba(249,115,22,0.18)'),
              left: isClient ? 10 : 'auto',
              right: isClient ? 'auto' : 10,
            }}
          />
          <User
            strokeWidth={2.5}
            className="relative z-10 h-4 w-4 transition-colors duration-150"
            style={{ color: clientColor }}
          />
          <Building2
            strokeWidth={2.5}
            className="relative z-10 h-4 w-4 transition-colors duration-150"
            style={{ color: ownerColor }}
          />
        </>
      )}
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
