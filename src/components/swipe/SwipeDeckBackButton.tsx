import { ChevronLeft } from 'lucide-react';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useActiveMode } from '@/hooks/useActiveMode';
import { triggerHaptic } from '@/utils/haptics';
import { useFilterStore } from '@/state/filterStore';
import { hideChrome } from '@/hooks/useChromeReveal';

/**
 * Persistent back arrow shown inside the swipe deck region.
 * Always visible (even when TopBar chrome is hidden) so the user can
 * always exit the deck back to the main category dashboard.
 */
export function SwipeDeckBackButton() {
  const { navigate } = useAppNavigate();
  const { activeMode } = useActiveMode();
  const setActiveCategory = useFilterStore((s) => s.setActiveCategory);

  return (
    <button
      data-no-cinematic
      data-no-pull-dismiss
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        triggerHaptic('light');
        hideChrome();
        // Exiting the deck means clearing the active category so the
        // dashboard returns to the category-picker / poker-hand state.
        setActiveCategory(null as any);
        navigate(`/${activeMode}/dashboard`);
      }}
      aria-label="Back to dashboard"
      className="absolute left-2 z-[10020] flex items-center justify-center w-14 h-14 bg-transparent border-0 shadow-none transition-all active:scale-90 pointer-events-auto"
      style={{
        top: 'calc(var(--safe-top, 0px) + var(--top-bar-height) - 4px)',
        backgroundColor: 'transparent',
        boxShadow: 'none',
        color: '#FFFFFF',
        filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.7))',
      }}
    >
      <ChevronLeft
        className="w-9 h-9"
        strokeWidth={2.6}
        style={{ color: '#FFFFFF' }}
      />
    </button>
  );
}
