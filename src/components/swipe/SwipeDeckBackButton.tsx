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
      className="absolute left-3 z-[60] flex items-center justify-center w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-white/25 transition-all active:scale-90 pointer-events-auto"
      style={{
        top: 'calc(var(--safe-top, 0px) + 12px)',
        color: '#FFFFFF',
        boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
      }}
    >
      <ChevronLeft
        className="w-7 h-7"
        strokeWidth={2.6}
        style={{ color: '#FFFFFF' }}
      />
    </button>
  );
}
