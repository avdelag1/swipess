import { useLocation } from 'react-router-dom';
import { useSwipeDeckStore } from '@/state/swipeDeckStore';
import { useFilterStore } from '@/state/filterStore';

/**
 * Returns true when the current dashboard route has visible swipe cards.
 * Used by the TopBar / ModeSwitcher / BottomNavigation to flip icon colors
 * (black over bright cards, white over dark empty frame).
 */
/**
 * Returns true when the UI should use DARK icons:
 *  - On dashboards with at least one swipe card visible (bright card behind icons)
 *  - On every non-dashboard route (default app surface is light)
 *
 * Returns false ONLY on a dashboard that currently has no cards (dark empty frame).
 */
export function useDeckHasCards(): boolean {
  const { pathname } = useLocation();
  const clientCount = useSwipeDeckStore((s) => s.clientDeck.deckItems.length - s.clientDeck.currentIndex);
  const ownerDecks = useSwipeDeckStore((s) => s.ownerDecks);
  const activeCategory = useFilterStore((s) => s.activeCategory);

  if (pathname.startsWith('/client/dashboard')) {
    return clientCount > 0;
  }
  if (pathname.startsWith('/owner/dashboard')) {
    const cat = activeCategory || 'default';
    const deck = ownerDecks[cat];
    if (!deck) return false;
    return deck.deckItems.length - deck.currentIndex > 0;
  }
  // Off-dashboard surfaces are light → use dark icons
  return true;
}
