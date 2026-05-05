import { ChevronLeft } from 'lucide-react';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useActiveMode } from '@/hooks/useActiveMode';
import { triggerHaptic } from '@/utils/haptics';
import { useFilterStore } from '@/state/filterStore';

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
      onClick={(e) => {
        e.stopPropagation();
        triggerHaptic('light');
        // Exiting the deck means clearing the active category so the
        // dashboard returns to the category-picker / poker-hand state.
        setActiveCategory(null as any);
        navigate(`/${activeMode}/dashboard`);
      }}
      aria-label="Back to dashboard"
      className="absolute left-3 z-[60] flex items-center justify-center w-9 h-9 rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md transition-all active:scale-90 pointer-events-auto"
      style={{
        top: 'calc(var(--safe-top, 0px) + 12px)',
        boxShadow: '0 6px 18px rgba(0,0,0,0.35)',
      }}
    >
      <ChevronLeft className="w-5 h-5" strokeWidth={2.4} />
    </button>
  );
}
