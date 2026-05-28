import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { logger } from '@/utils/prodLogger';

/**
 * SwipeDeckStore - Persists swipe deck state across navigation
 *
 * This store ensures that when users navigate away from dashboard and back,
 * the deck does NOT reset to empty. It maintains deck items, current index,
 * and hydration state for both client and owner roles.
 */

export interface DeckItem {
  id: string;
  [key: string]: any;
}

export interface DeckState {
  deckItems: DeckItem[];
  currentIndex: number;
  currentPage: number;
  lastFetchAt: number;
  isHydrated: boolean;
  isReady: boolean; // True when deck is fully initialized and ready for instant return
  swipedIds: Set<string>;
  lastSwipedId: string | null; // Track last swipe for one-time undo
}

export interface SwipeDeckSlice {
  // Client dashboard deck (listings) - keyed by category
  clientDecks: Record<string, DeckState>;
  // Owner dashboard deck (clients) - keyed by category
  ownerDecks: Record<string, DeckState>;

  // Actions for client deck
  setClientDeck: (category: string, items: DeckItem[], append?: boolean) => void;
  setClientIndex: (category: string, index: number) => void;
  setClientPage: (category: string, page: number) => void;
  markClientSwiped: (category: string, id: string) => void;
  undoClientSwipe: (category: string) => boolean; // Returns true if undo was successful
  resetClientDeck: (category: string) => void;
  hydrateClientDeck: (category: string) => void;
  markClientReady: (category: string) => void; // Mark deck as ready for instant return

  // Actions for owner deck
  setOwnerDeck: (category: string, items: DeckItem[], append?: boolean) => void;
  setOwnerIndex: (category: string, index: number) => void;
  setOwnerPage: (category: string, page: number) => void;
  markOwnerSwiped: (category: string, id: string) => void;
  undoOwnerSwipe: (category: string) => boolean; // Returns true if undo was successful
  resetOwnerDeck: (category: string) => void;
  hydrateOwnerDeck: (category: string) => void;
  markOwnerReady: (category: string) => void; // Mark deck as ready for instant return

  // Get hydrated/ready status
  isClientHydrated: (category: string) => boolean;
  isOwnerHydrated: (category: string) => boolean;
  isClientReady: (category: string) => boolean;
  isOwnerReady: (category: string) => boolean;

  // Get current deck items
  getClientDeckItems: (category: string) => DeckItem[];
  getOwnerDeckItems: (category: string) => DeckItem[];
}

const createEmptyDeckState = (): DeckState => ({
  deckItems: [],
  currentIndex: 0,
  currentPage: 0,
  lastFetchAt: 0,
  isHydrated: false,
  isReady: false,
  swipedIds: new Set(),
  lastSwipedId: null,
});

// CACHE INVALIDATION: Clear stale localStorage on app load to prevent FK errors
// This runs once on module load and clears any stale mock data
const CACHE_VERSION = 'v13'; // v13: force-clear any double-stringified corrupted state
const CACHE_KEY = 'swipe-deck-store';
const CACHE_VERSION_KEY = 'swipe-deck-version';
if (typeof window !== 'undefined') {
  const storedVersion = localStorage.getItem(CACHE_VERSION_KEY);
  if (storedVersion !== CACHE_VERSION) {
    localStorage.removeItem(CACHE_KEY);
    localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);
    if (import.meta.env.DEV) console.warn('[SwipeDeckStore] Cleared stale cache - version mismatch');
  }
}

// Custom storage handler to serialize/deserialize Sets
const customStorage = {
  getItem: (name: string) => {
    const str = localStorage.getItem(name);
    if (!str) return null;
    try {
      const parsed = JSON.parse(str);
      // Convert arrays back to Sets and add default values for missing fields
      if (parsed.state?.clientDecks) {
        Object.keys(parsed.state.clientDecks).forEach(key => {
          if (parsed.state.clientDecks[key]?.swipedIds) {
            parsed.state.clientDecks[key].swipedIds = new Set(parsed.state.clientDecks[key].swipedIds);
          }
          if (parsed.state.clientDecks[key]?.isReady === undefined) {
            parsed.state.clientDecks[key].isReady = false;
          }
          if (parsed.state.clientDecks[key]?.isHydrated === undefined) {
            parsed.state.clientDecks[key].isHydrated = false;
          }
        });
      }
      if (parsed.state?.ownerDecks) {
        Object.keys(parsed.state.ownerDecks).forEach(key => {
          if (parsed.state.ownerDecks[key]?.swipedIds) {
            parsed.state.ownerDecks[key].swipedIds = new Set(parsed.state.ownerDecks[key].swipedIds);
          }
          // Ensure isReady has a default value (for old persisted data)
          if (parsed.state.ownerDecks[key]?.isReady === undefined) {
            parsed.state.ownerDecks[key].isReady = false;
          }
          if (parsed.state.ownerDecks[key]?.isHydrated === undefined) {
            parsed.state.ownerDecks[key].isHydrated = false;
          }
        });
      }
      return parsed;
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: any) => {
    try {
      // Convert Sets to arrays for JSON serialization
      const toSerialize = { ...value };
      if (toSerialize.state?.clientDecks) {
        toSerialize.state = { ...toSerialize.state };
        toSerialize.state.clientDecks = { ...toSerialize.state.clientDecks };
        Object.keys(toSerialize.state.clientDecks).forEach(key => {
          if (toSerialize.state.clientDecks[key]?.swipedIds instanceof Set) {
            toSerialize.state.clientDecks[key] = { ...toSerialize.state.clientDecks[key] };
            toSerialize.state.clientDecks[key].swipedIds = Array.from(toSerialize.state.clientDecks[key].swipedIds);
          }
        });
      }
      if (toSerialize.state?.ownerDecks) {
        toSerialize.state = { ...toSerialize.state };
        toSerialize.state.ownerDecks = { ...toSerialize.state.ownerDecks };
        Object.keys(toSerialize.state.ownerDecks).forEach(key => {
          if (toSerialize.state.ownerDecks[key]?.swipedIds instanceof Set) {
            toSerialize.state.ownerDecks[key] = { ...toSerialize.state.ownerDecks[key] };
            toSerialize.state.ownerDecks[key].swipedIds = Array.from(toSerialize.state.ownerDecks[key].swipedIds);
          }
        });
      }
      localStorage.setItem(name, JSON.stringify(toSerialize));
    } catch (e) {
      logger.warn('Failed to persist swipe deck state', e);
    }
  },
  removeItem: (name: string) => localStorage.removeItem(name),
};

export const useSwipeDeckStore = create<SwipeDeckSlice>()(
  persist(
    (set, get) => ({
      clientDecks: {},
      ownerDecks: {},

      // Client deck actions
      setClientDeck: (category, items, append = false) => {
        set((state) => {
          const existingDeck = state.clientDecks[category] || createEmptyDeckState();
          const existingIds = new Set(existingDeck.deckItems.map(i => i.id));
          const swipedIds = existingDeck.swipedIds;

          // Filter out duplicates and already-swiped items
          const newItems = items.filter(item =>
            !existingIds.has(item.id) && !swipedIds.has(item.id)
          );

          let deckItems: DeckItem[];
          if (append && existingDeck.deckItems.length > 0) {
            deckItems = [...existingDeck.deckItems, ...newItems];
          } else if (existingDeck.deckItems.length > 0 && !append) {
            // If not appending but we have items, just add new ones
            deckItems = [...existingDeck.deckItems, ...newItems];
          } else {
            deckItems = items.filter(item => !swipedIds.has(item.id));
          }

          // Cap at 100 items to prevent memory bloat
          let currentIndex = existingDeck.currentIndex;
          if (deckItems.length > 100) {
            const offset = deckItems.length - 100;
            deckItems = deckItems.slice(offset);
            currentIndex = Math.max(0, currentIndex - offset);
          }

          return {
            clientDecks: {
              ...state.clientDecks,
              [category]: {
                ...existingDeck,
                deckItems,
                currentIndex,
                lastFetchAt: Date.now(),
                isHydrated: true,
              }
            }
          };
        });
      },

      setClientIndex: (category, index) => {
        set((state) => {
          const existingDeck = state.clientDecks[category] || createEmptyDeckState();
          return {
            clientDecks: {
              ...state.clientDecks,
              [category]: { ...existingDeck, currentIndex: index }
            }
          };
        });
      },

      setClientPage: (category, page) => {
        set((state) => {
          const existingDeck = state.clientDecks[category] || createEmptyDeckState();
          return {
            clientDecks: {
              ...state.clientDecks,
              [category]: { ...existingDeck, currentPage: page }
            }
          };
        });
      },

      markClientSwiped: (category, id) => {
        set((state) => {
          const existingDeck = state.clientDecks[category] || createEmptyDeckState();
          const newSwipedIds = new Set(existingDeck.swipedIds);
          newSwipedIds.add(id);
          return {
            clientDecks: {
              ...state.clientDecks,
              [category]: {
                ...existingDeck,
                swipedIds: newSwipedIds,
                currentIndex: existingDeck.currentIndex + 1,
                lastSwipedId: id,
              }
            }
          };
        });
      },

      undoClientSwipe: (category) => {
        let success = false;
        set((state) => {
          const existingDeck = state.clientDecks[category] || createEmptyDeckState();
          const lastId = existingDeck.lastSwipedId;
          // Can only undo if there's a last swiped ID
          if (!lastId) {
            return state; // No changes - nothing to undo
          }

          // Remove from swiped set (immutable copy)
          const newSwipedIds = new Set(existingDeck.swipedIds);
          newSwipedIds.delete(lastId);
          success = true;

          const newIndex = Math.max(0, existingDeck.currentIndex - 1);

          return {
            clientDecks: {
              ...state.clientDecks,
              [category]: {
                ...existingDeck,
                swipedIds: newSwipedIds,
                currentIndex: newIndex,
                lastSwipedId: null, // Clear after undo
              }
            }
          };
        });
        return success;
      },

      resetClientDeck: (category) => {
        set((state) => ({
          clientDecks: {
            ...state.clientDecks,
            [category]: createEmptyDeckState()
          }
        }));
      },

      hydrateClientDeck: (category) => {
        set((state) => {
          const existingDeck = state.clientDecks[category] || createEmptyDeckState();
          return {
            clientDecks: {
              ...state.clientDecks,
              [category]: { ...existingDeck, isHydrated: true }
            }
          };
        });
      },

      markClientReady: (category) => {
        set((state) => {
          const existingDeck = state.clientDecks[category] || createEmptyDeckState();
          return {
            clientDecks: {
              ...state.clientDecks,
              [category]: { ...existingDeck, isReady: true }
            }
          };
        });
      },

      // Owner deck actions
      setOwnerDeck: (category, items, append = false) => {
        set((state) => {
          const existingDeck = state.ownerDecks[category] || createEmptyDeckState();
          const existingIds = new Set(existingDeck.deckItems.map(i => i.id));
          const swipedIds = existingDeck.swipedIds;

          // Filter out duplicates and already-swiped items
          const newItems = items.filter(item =>
            !existingIds.has(item.id) && !swipedIds.has(item.id)
          );

          let deckItems: DeckItem[];
          if (append && existingDeck.deckItems.length > 0) {
            deckItems = [...existingDeck.deckItems, ...newItems];
          } else if (existingDeck.deckItems.length > 0 && !append) {
            deckItems = [...existingDeck.deckItems, ...newItems];
          } else {
            deckItems = items.filter(item => !swipedIds.has(item.id));
          }

          // Cap at 100 items
          let currentIndex = existingDeck.currentIndex;
          if (deckItems.length > 100) {
            const offset = deckItems.length - 100;
            deckItems = deckItems.slice(offset);
            currentIndex = Math.max(0, currentIndex - offset);
          }

          return {
            ownerDecks: {
              ...state.ownerDecks,
              [category]: {
                ...existingDeck,
                deckItems,
                currentIndex,
                lastFetchAt: Date.now(),
                isHydrated: true,
              }
            }
          };
        });
      },

      setOwnerIndex: (category, index) => {
        set((state) => {
          const existingDeck = state.ownerDecks[category] || createEmptyDeckState();
          return {
            ownerDecks: {
              ...state.ownerDecks,
              [category]: { ...existingDeck, currentIndex: index }
            }
          };
        });
      },

      setOwnerPage: (category, page) => {
        set((state) => {
          const existingDeck = state.ownerDecks[category] || createEmptyDeckState();
          return {
            ownerDecks: {
              ...state.ownerDecks,
              [category]: { ...existingDeck, currentPage: page }
            }
          };
        });
      },

      markOwnerSwiped: (category, id) => {
        set((state) => {
          const existingDeck = state.ownerDecks[category] || createEmptyDeckState();
          const newSwipedIds = new Set(existingDeck.swipedIds);
          newSwipedIds.add(id);
          return {
            ownerDecks: {
              ...state.ownerDecks,
              [category]: {
                ...existingDeck,
                swipedIds: newSwipedIds,
                currentIndex: existingDeck.currentIndex + 1,
                lastSwipedId: id,
              }
            }
          };
        });
      },

      undoOwnerSwipe: (category) => {
        let success = false;
        set((state) => {
          const existingDeck = state.ownerDecks[category] || createEmptyDeckState();
          const lastId = existingDeck.lastSwipedId;

          // Can only undo if there's a last swiped ID
          // FIX: Allow undo even if currentIndex is 0 (edge case after refresh)
          if (!lastId) {
            return state; // No changes - nothing to undo
          }

          // Remove from swiped set (immutable copy)
          const newSwipedIds = new Set(existingDeck.swipedIds);
          newSwipedIds.delete(lastId);
          success = true;

          // FIX: Only decrement if > 0 to prevent negative index
          const newIndex = Math.max(0, existingDeck.currentIndex - 1);

          return {
            ownerDecks: {
              ...state.ownerDecks,
              [category]: {
                ...existingDeck,
                swipedIds: newSwipedIds,
                currentIndex: newIndex,
                lastSwipedId: null,
              }
            }
          };
        });
        return success;
      },

      resetOwnerDeck: (category) => {
        set((state) => ({
          ownerDecks: {
            ...state.ownerDecks,
            [category]: createEmptyDeckState()
          }
        }));
      },

      hydrateOwnerDeck: (category) => {
        set((state) => {
          const existingDeck = state.ownerDecks[category] || createEmptyDeckState();
          return {
            ownerDecks: {
              ...state.ownerDecks,
              [category]: { ...existingDeck, isHydrated: true }
            }
          };
        });
      },

      markOwnerReady: (category) => {
        set((state) => {
          const existingDeck = state.ownerDecks[category] || createEmptyDeckState();
          return {
            ownerDecks: {
              ...state.ownerDecks,
              [category]: { ...existingDeck, isReady: true }
            }
          };
        });
      },

      // Getters - use ?? false to handle undefined from old persisted data
      isClientHydrated: (category) => get().clientDecks[category]?.isHydrated ?? false,
      isOwnerHydrated: (category) => get().ownerDecks[category]?.isHydrated ?? false,
      isClientReady: (category) => get().clientDecks[category]?.isReady ?? false,
      isOwnerReady: (category) => get().ownerDecks[category]?.isReady ?? false,
      getClientDeckItems: (category) => get().clientDecks[category]?.deckItems ?? [],
      getOwnerDeckItems: (category) => get().ownerDecks[category]?.deckItems ?? [],
    }),
    {
      name: 'swipe-deck-store',
      storage: createJSONStorage(() => customStorage as any),
      partialize: (state) => ({
        // INSTANT DECK CACHE: Persist minimal deck items for instant render on return
        // Store first 20 items with minimal fields needed for card render
        clientDecks: Object.fromEntries(
          Object.entries(state.clientDecks).map(([key, deck]) => [
            key,
            {
              currentIndex: deck.currentIndex,
              currentPage: deck.currentPage,
              isHydrated: deck.isHydrated,
              isReady: deck.isReady,
              swipedIds: deck.swipedIds,
              lastSwipedId: deck.lastSwipedId,
              // CRITICAL: Persist minimal deck items for instant render (no dark cards)
              deckItems: deck.deckItems.slice(0, 20).map(item => ({
                id: item.id,
                title: item.title,
                price: item.price,
                city: item.city,
                neighborhood: item.neighborhood,
                images: item.images, // Keep ALL images for carousel
                beds: item.beds,
                baths: item.baths,
                square_footage: item.square_footage,
                category: item.category,
                listing_type: item.listing_type,
                owner_id: item.owner_id,
                brand: item.brand,
                model: item.model,
                year: item.year,
                mileage: item.mileage,
                amenities: item.amenities?.slice(0, 5), // First 5 amenities
              })),
              lastFetchAt: deck.lastFetchAt,
            }
          ])
        ),
        ownerDecks: Object.fromEntries(
          Object.entries(state.ownerDecks).map(([key, deck]) => [
            key,
            {
              currentIndex: deck.currentIndex,
              currentPage: deck.currentPage,
              isHydrated: deck.isHydrated,
              isReady: deck.isReady,
              swipedIds: deck.swipedIds,
              lastSwipedId: deck.lastSwipedId,
              // CRITICAL: Persist minimal deck items for instant render (no dark cards)
              deckItems: deck.deckItems.slice(0, 20).map(item => ({
                id: item.id || item.user_id,
                user_id: item.user_id,
                name: item.name,
                full_name: item.full_name,
                age: item.age,
                city: item.city,
                images: item.images, // Keep ALL images for carousel
                profile_images: item.profile_images,
                avatar_url: item.avatar_url,
                verified: item.verified,
                budget_max: item.budget_max,
                budget_min: item.budget_min,
                interests: item.interests?.slice(0, 5),
                lifestyle_tags: item.lifestyle_tags?.slice(0, 5),
              })),
              lastFetchAt: deck.lastFetchAt,
            }
          ])
        ),
      }),
    }
  )
);

// Session storage for deck items (faster, clears on tab close)
const SESSION_KEY = 'swipe-deck-items';

export const persistDeckToSession = (role: 'client' | 'owner', category: string, items: DeckItem[]) => {
  try {
    const existing = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}');
    const key = role === 'client' ? 'client' : `owner_${category}`;
    existing[key] = items.slice(0, 50); // Limit to 50 items
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(existing));
  } catch {
    // Session storage full or unavailable
  }
};

export const getDeckFromSession = (role: 'client' | 'owner', category: string): DeckItem[] => {
  try {
    const existing = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}');
    const key = role === 'client' ? 'client' : `owner_${category}`;
    return existing[key] || [];
  } catch {
    return [];
  }
};

export const clearDeckSession = (role: 'client' | 'owner', category?: string) => {
  try {
    const existing = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}');
    const key = role === 'client' ? 'client' : `owner_${category}`;
    delete existing[key];
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(existing));
  } catch {
    // Ignore
  }
};


