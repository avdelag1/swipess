import { ChevronLeft } from 'lucide-react';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useActiveMode } from '@/hooks/useActiveMode';
import { triggerHaptic } from '@/utils/haptics';
import { useFilterStore } from '@/state/filterStore';
import useAppTheme from '@/hooks/useAppTheme';

/**
 * Persistent back arrow shown inside the swipe deck region.
 * Always visible (even when TopBar chrome is hidden) so the user can
 * always exit the deck back to the main category dashboard.
 */
export function SwipeDeckBackButton() {
  const { navigate } = useAppNavigate();
  const { activeMode } = useActiveMode();
  const setActiveCategory = useFilterStore((s) => s.setActiveCategory);
  const { isLight } = useAppTheme();

  return (
    <button
      data-no-cinematic
      onClick={(e) => {
        e.stopPropagation();
        triggerHaptic('light');
        // Exiting the deck means clearing the active category so the
        // dashboard returns to the category-picker / poker-hand state.
        setActiveCategory(null as any);
        navigate(`/${activeMode}/dashboard`);
      }}
      aria-label="Back to dashboard"
      className={`absolute left-3 z-[60] flex items-center justify-center w-11 h-11 bg-transparent border-0 shadow-none transition-all active:scale-90 pointer-events-auto ${isLight ? 'text-black' : 'text-white'}`}
      style={{
        top: 'calc(var(--safe-top, 0px) + 12px)',
        backgroundColor: 'transparent',
        boxShadow: 'none',
        filter: isLight ? 'drop-shadow(0 1px 1px rgba(255,255,255,0.95)) drop-shadow(0 2px 6px rgba(0,0,0,0.42))' : 'drop-shadow(0 2px 7px rgba(0,0,0,0.9))',
      }}
    >
      <ChevronLeft className="w-8 h-8" strokeWidth={2.35} />
    </button>
  );
}
