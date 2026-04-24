import { useState, useCallback, useEffect, memo, useRef, useMemo, lazy, Suspense } from 'react';
import { cn } from '@/lib/utils';
import { useModalStore } from '@/state/modalStore';
import { createPortal } from 'react-dom';
import { triggerHaptic } from '@/utils/haptics';
import useAppTheme from '@/hooks/useAppTheme';
import { SimpleSwipeCard, SimpleSwipeCardRef } from './SimpleSwipeCard';
import { SwipeActionButtonBar } from './SwipeActionButtonBar';
import { SwipeExhaustedState } from './swipe/SwipeExhaustedState';
import { SwipeLoadingSkeleton } from './swipe/SwipeLoadingSkeleton';
import type { QuickFilterCategory } from '@/types/filters';
import { getActiveCategoryInfo, POKER_CARDS, OWNER_INTENT_CARDS } from './swipe/SwipeConstants';
import { SwipeAllDashboard } from './swipe/SwipeAllDashboard';
import { MatchCelebrateModal } from './swipe/MatchCelebrateModal';
import { ClientPreferencesDialog } from './ClientPreferencesDialog';
import { OwnerClientFilterDialog } from './OwnerClientFilterDialog';
import { preloadImageToCache } from '@/lib/swipe/imageCache';
import { imageCache } from '@/lib/swipe/cardImageCache';
import { PrefetchScheduler } from '@/lib/swipe/PrefetchScheduler';
import { useSmartListingMatching, ListingFilters } from '@/hooks/useSmartMatching';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { swipeQueue } from '@/lib/swipe/SwipeQueue';
import { imagePreloadController } from '@/lib/swipe/ImagePreloadController';
import { useCanAccessMessaging } from '@/hooks/useMessaging';
import { useSwipeUndo } from '@/hooks/useSwipeUndo';
import { useSwipeWithMatch } from '@/hooks/useSwipeWithMatch';
import { useStartConversation } from '@/hooks/useConversations';
import { useRecordProfileView } from '@/hooks/useProfileRecycling';
import { usePrefetchImages } from '@/hooks/usePrefetchImages';
import { useSwipePrefetch, usePrefetchManager } from '@/hooks/usePrefetchManager';
import { useSwipeDeckStore, persistDeckToSession } from '@/state/swipeDeckStore';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import { useShallow } from 'zustand/react/shallow';
import { useSwipeDismissal } from '@/hooks/useSwipeDismissal';
import { Home, Bike, Briefcase, ChevronLeft, Radar, SlidersHorizontal, LayoutGrid } from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { useSwipeSounds } from '@/hooks/useSwipeSounds';
import { appToast } from '@/utils/appNotification';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { logger } from '@/utils/prodLogger';
import { MessageConfirmationDialog } from './MessageConfirmationDialog';
import { DirectMessageDialog } from './DirectMessageDialog';
import { isDirectMessagingListing } from '@/utils/directMessaging';
import { useQueryClient } from '@tanstack/react-query';
import { LocationRadiusSelector } from './swipe/LocationRadiusSelector';
import { ReportDialog } from './ReportDialog';



// FIX #3: Lazy-load modals 
const SwipeInsightsModal = lazy(() => import('./SwipeInsightsModal').then(m => ({ default: m.SwipeInsightsModal })));
const ShareDialog = lazy(() => import('./ShareDialog').then(m => ({ default: m.ShareDialog })));

const CATEGORY_ICON_MAP: Record<string, any> = {
  property: Home,
  motorcycle: MotorcycleIcon,
  bicycle: Bike,
  services: Briefcase,
  worker: Briefcase,
};



// Navigation guard to prevent double-taps
function useNavigationGuard() {
  const isNavigatingRef = useRef(false);
  const lastNavigationRef = useRef(0);

  const canNavigate = useCallback(() => {
    const now = Date.now();
    if (isNavigatingRef.current || now - lastNavigationRef.current < 300) {
      return false;
    }
    return true;
  }, []);

  const startNavigation = useCallback(() => {
    isNavigatingRef.current = true;
    lastNavigationRef.current = Date.now();
  }, []);

  const endNavigation = useCallback(() => {
    isNavigatingRef.current = false;
  }, []);

  return { canNavigate, startNavigation, endNavigation };
}

// PrefetchScheduler imported from '@/lib/swipe/PrefetchScheduler'







interface SwipessSwipeContainerProps {
  onListingTap: (listingId: string) => void;
  onInsights?: (listingId: string) => void;
  onMessageClick?: () => void;
  locationFilter?: {
    latitude: number;
    longitude: number;
    city?: string;
    radius: number;
  } | null;
  filters?: ListingFilters;
}

const SwipessSwipeContainerComponent = ({ onListingTap, onInsights: _onInsights, onMessageClick, locationFilter: _locationFilter, filters }: SwipessSwipeContainerProps) => {
  const navigate = useNavigate();
  const { theme, isLight } = useAppTheme();
  const [page, setPage] = useState(0);
  const [_swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [insightsModalOpen, setInsightsModalOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshMode, setIsRefreshMode] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [directMessageDialogOpen, setDirectMessageDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<any | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);


  // Epic Match State
  const [matchData, setMatchData] = useState<{ client: any, owner: any } | null>(null);

  // ── Distance filter state ─────────────────────────────────────────────────
  const radiusKm = useFilterStore((s) => s.radiusKm);
  const setRadiusKm = useFilterStore((s) => s.setRadiusKm);
  const setUserLocation = useFilterStore((s) => s.setUserLocation);
  const userLatitude = useFilterStore((s) => s.userLatitude);
  const userLongitude = useFilterStore((s) => s.userLongitude);
  const setActiveCategory = useFilterStore((s) => s.setActiveCategory);
  const { setCategories } = useFilterActions();
  const activeCategory = useFilterStore(s => s.activeCategory);
  const [locationDetecting, setLocationDetecting] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocationDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation(pos.coords.latitude, pos.coords.longitude);
        setLocationDetected(true);
        setLocationDetecting(false);
      },
      () => {
        setLocationDetecting(false);
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  }, [setUserLocation]);



  // PERF: Get userId from auth to pass to query (avoids getUser() inside queryFn)
  const { user } = useAuth();
  const { data: userRole } = useUserRole(user?.id);
  const queryClient = useQueryClient();

  // PERF: Use selective subscriptions to prevent re-renders on unrelated store changes
  // Only subscribe to actions (stable references) - NOT to clientDeck object
  // This is the key fix for "double render" feeling when navigating back to dashboard
  const { setClientDeck, markClientSwiped, resetClientDeck, isClientReady, markClientReady } = useSwipeDeckStore(
    useShallow((state) => ({
      setClientDeck: state.setClientDeck,
      markClientSwiped: state.markClientSwiped,
      resetClientDeck: state.resetClientDeck,
      isClientReady: state.isClientReady,
      markClientReady: state.markClientReady,
    }))
  );

  // Read active category directly from filter store for guaranteed sync with quick filter UI
  // This ensures empty state messages update instantly when user clicks a quick filter
  const storeCategories = useFilterStore((state) => state.categories);
  const storeActiveCategory = storeCategories.length > 0 ? storeCategories[0] : null;

  // Local state for immediate UI updates - drives the swipe animation
  const [currentIndex, setCurrentIndex] = useState(0);

  // FIX: Track deck length in state to force re-render when listings are appended
  // Without this, appending to deckQueueRef doesn't trigger re-render and empty state persists
  const [_deckLength, setDeckLength] = useState(0);

  // (isTransitioning removed — it caused a 1-frame blank flash worse than the skeleton)

  // =============================================================================
  // FIX #1: SWIPE PHASE ISOLATION - DOM moves first, React cleans up after
  // This is the key to "Tinder-level" feel: freeze React during the swipe gesture
  // =============================================================================
  interface PendingSwipe {
    listing: any;
    direction: 'left' | 'right';
    newIndex: number;
  }
  const pendingSwipeRef = useRef<PendingSwipe | null>(null);
  const isSwipeAnimatingRef = useRef(false);

  // PERF: Get initial state ONCE using getState() - no subscription
  // This is synchronous and doesn't cause re-renders when store updates
  // FIX: Don't restore from cache — always start empty and let DB query populate
  // The DB query (with refetchOnMount:'always') excludes swiped items at SQL level
  // Restoring from cache caused swiped cards to reappear across sessions/dashboard switches
  const getInitialDeck = () => {
    return [];
  };

  // CONSTANT-TIME SWIPE DECK: Use refs for queue management (no re-renders on swipe)
  // Initialize synchronously from persisted state to prevent dark/empty cards
  // PERF: Use getState() for initial values - no subscription needed
  const deckQueueRef = useRef<any[]>(getInitialDeck());
  const currentIndexRef = useRef(useSwipeDeckStore.getState().clientDeck.currentIndex);
  const swipedIdsRef = useRef<Set<string>>(new Set(useSwipeDeckStore.getState().clientDeck.swipedIds));
  const _initializedRef = useRef(deckQueueRef.current.length > 0);

  // Ref to trigger swipe animations from the fixed action buttons
  const cardRef = useRef<SimpleSwipeCardRef>(null);

  // Sync state with ref on mount
  useEffect(() => {
    setCurrentIndex(currentIndexRef.current);
  }, []);

  // FLICKER FIX: Track whether we've given the query a chance to start fetching.
  // On quick filter change, deckQueue resets to [] before React Query re-triggers.
  // During this ~100-300ms gap, isLoading is false → exhausted state flashes.
  // We use a mount-settled ref to block exhausted state until after first fetch attempt.
  const isMountSettledRef = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => { isMountSettledRef.current = true; }, 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handleOpenFilters = () => {
      triggerHaptic('medium');
      setFilterDialogOpen(true);
    };
    window.addEventListener('open-filters', handleOpenFilters);
    return () => window.removeEventListener('open-filters', handleOpenFilters);
  }, []);
  // A single reset path prevents duplicate state mutations that cause React error #185.

  // PERF FIX: Track if we're returning to dashboard (has hydrated data AND is ready)
  // When true, skip initial animations to prevent "double render" feeling
  // Use isReady flag from store to determine if deck is fully initialized
  const isReturningRef = useRef(
    deckQueueRef.current.length > 0 && useSwipeDeckStore.getState().clientDeck.isReady
  );
  const _hasAnimatedOnceRef = useRef(isReturningRef.current);

  // PERF FIX: Eagerly preload top 5 cards' images when we have hydrated deck data
  // This runs SYNCHRONOUSLY during component initialization (before first paint)
  // The images will be in cache when TinderSwipeCard renders, preventing any flash
  // ALWAYS keep 2-3 cards preloaded to prevent swipe delays
  const eagerPreloadInitiatedRef = useRef(false);
  if (!eagerPreloadInitiatedRef.current && deckQueueRef.current.length > 0) {
    eagerPreloadInitiatedRef.current = true;
    const currentIdx = currentIndexRef.current;

    // Preload ALL images of current + next 4 cards for smooth swiping
    const imagesToPreload: string[] = [];
    [0, 1, 2, 3, 4].forEach((offset) => {
      const card = deckQueueRef.current[currentIdx + offset];
      if (card?.images && Array.isArray(card.images)) {
        card.images.forEach((imgUrl: string) => {
          if (imgUrl) {
            imagesToPreload.push(imgUrl);
            preloadImageToCache(imgUrl);
            // FIX: Also add to simple imageCache so CardImage.tsx detects cached images
            imageCache.set(imgUrl, true);
          }
        });
      }
    });

    // Also batch preload with ImagePreloadController for decode support
    if (imagesToPreload.length > 0) {
      imagePreloadController.preloadBatch(imagesToPreload);
    }
  }

  // PERF: Throttled prefetch scheduler
  const prefetchSchedulerRef = useRef(new PrefetchScheduler());

  // Fetch guards
  const isFetchingMore = useRef(false);

  // Navigation guard
  const { canNavigate, startNavigation, endNavigation } = useNavigationGuard();

  // ─── PREDICTIVE CARD TRANSITIONS ─────────────────────────────────────────
  // Shared MotionValue: top card writes its X position here so the card
  // underneath can react in real-time without any React re-renders.
  const topCardX = useMotionValue(0);

  // Next card scales up and brightens as the top card is dragged away.
  // At rest (topCardX=0): scale 0.97, opacity 0.72  — the normal "peek" state.
  // At threshold (topCardX=±280): scale 1.0, opacity 0.98 — fully revealed.
  const nextCardScale = useTransform(
    topCardX,
    [-280, -60, 0, 60, 280],
    [1.0, 1.0, 0.97, 1.0, 1.0]
  );
  const nextCardOpacity = useTransform(
    topCardX,
    [-280, -60, 0, 60, 280],
    [0.98, 0.92, 0.72, 0.92, 0.98]
  );

  // Tracks whether the user has completed at least one swipe this session.
  // Used to gate the entrance spring so the very first card doesn't animate in.
  const hasSwipedRef = useRef(false);
  // ─────────────────────────────────────────────────────────────────────────

  // FIX: Hydration sync disabled — DB query is the single source of truth
  // The query with refetchOnMount:'always' ensures fresh data on every mount
  // No need to restore stale cached decks that may contain already-swiped items
  useEffect(() => {
    // Clear any stale session storage on mount
    try { sessionStorage.removeItem('swipe-deck-client-listings'); } catch (_err) { /* Ignore session storage errors */ }
  }, []);

  // PERF FIX: Removed competing filter hydration from client_filter_preferences.
  // useFilterPersistence (in PersistentDashboardLayout) is the SINGLE source of truth
  // for restoring saved filters from the database. Having two hydration paths
  // caused a race condition where both bumped filterVersion, triggering cascading
  // re-renders that led to React Error #185 (Maximum update depth exceeded).

  // Cleanup on unmount
  useEffect(() => {
    const scheduler = prefetchSchedulerRef.current;
    return () => {
      scheduler.cancel();
    };
  }, []);

  // Hooks for functionality
  const { canAccess: hasPremiumMessaging, needsUpgrade } = useCanAccessMessaging();
  const { recordSwipe, undoLastSwipe, canUndo, isUndoing: _isUndoing, undoSuccess, resetUndoState } = useSwipeUndo();
  const swipeMutation = useSwipeWithMatch({
    onMatch: (clientProfile, ownerProfile) => setMatchData({ client: clientProfile, owner: ownerProfile })
  });
  const startConversation = useStartConversation();

  // Swipe dismissal tracking
  const { dismissedIds, dismissTarget, filterDismissed: _filterDismissed } = useSwipeDismissal('listing');

  // FIX: Sync local state when undo completes successfully
  useEffect(() => {
    if (undoSuccess) {
      // Get the updated state from the store
      const storeState = useSwipeDeckStore.getState();
      const newIndex = storeState.clientDeck.currentIndex;

      // Sync local refs and state with store
      currentIndexRef.current = newIndex;
      setCurrentIndex(newIndex);

      // Sync the entire swipedIds set with store (source of truth)
      swipedIdsRef.current = new Set(storeState.clientDeck.swipedIds);

      // Reset undo state so this effect doesn't run again
      resetUndoState();

      logger.info('[SwipessSwipeContainer] Synced local state after undo, new index:', newIndex);
    }
  }, [undoSuccess, resetUndoState]);
  const recordProfileView = useRecordProfileView();
  const { playSwipeSound } = useSwipeSounds();

  // PERF: Initialize swipeQueue with user ID for fire-and-forget background writes
  // This eliminates the async auth call on every swipe
  useEffect(() => {
    if (user?.id) {
      swipeQueue.setUserId(user.id);
    }
  }, [user?.id]);

  // PERF FIX: Build filters from Zustand store directly instead of props.
  // This eliminates the cascading object recreation chain:
  // MyHub → ClientDashboard → SwipessSwipeContainer
  // Each intermediary was creating new filter objects on every filterVersion bump.
  const storeFilterVersion = useFilterStore((state) => state.filterVersion);
  const stableFilters = useMemo(() => {
    const state = useFilterStore.getState();
    return state.getListingFilters() as ListingFilters;
    // Only recompute when filterVersion changes (actual filter mutation)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeFilterVersion]);

  // PERF FIX: Create stable filter signature for deck versioning
  // This detects when filters actually changed vs just navigation return
  const filterSignature = useMemo(() => {
    return [
      stableFilters.category || '',
      stableFilters.categories?.join(',') || '',
      stableFilters.listingType || '',
      stableFilters.priceRange?.join('-') || '',
      stableFilters.bedrooms?.join(',') || '',
      stableFilters.bathrooms?.join(',') || '',
      stableFilters.amenities?.join(',') || '',
      stableFilters.propertyType?.join(',') || '',
      stableFilters.petFriendly ? '1' : '0',
      stableFilters.furnished ? '1' : '0',
      stableFilters.verified ? '1' : '0',
      stableFilters.premiumOnly ? '1' : '0',
      stableFilters.showHireServices ? '1' : '0',
      stableFilters.clientGender || '',
      stableFilters.clientType || '',
      stableFilters.radiusKm?.toString() || '50',
      stableFilters.userLatitude?.toString() || '0',
      stableFilters.userLongitude?.toString() || '0',
    ].join('|');
  }, [stableFilters]);

  // Track previous filter signature to detect filter changes
  const prevFilterSignatureRef = useRef<string>(filterSignature);
  const filterChangedRef = useRef(false);

  // PERF FIX: Track previous listing IDs signature to detect actual data changes
  // Declared early so they can be used in both filter reset and data append effects
  const prevListingIdsRef = useRef<string>('');
  const hasNewListingsRef = useRef(false);

  // Detect filter changes (not navigation)
  if (filterSignature !== prevFilterSignatureRef.current) {
    filterChangedRef.current = true;
    prevFilterSignatureRef.current = filterSignature;
  }

  // PERF FIX: Reset deck ONLY when filters actually change (not on navigation return)
  // This effect uses filterSignature as dependency to detect genuine filter changes
  useEffect(() => {
    // Skip on initial mount
    if (!filterChangedRef.current) return;

    // Reset the filter changed flag
    filterChangedRef.current = false;

    // FLICKER FIX: reset settled guard so exhausted state can't flash during new fetch
    isMountSettledRef.current = false;
    const settledTimer = setTimeout(() => { isMountSettledRef.current = true; }, 400);

    // Clear deck for fresh results with new filters
    deckQueueRef.current = [];
    currentIndexRef.current = 0;
    swipedIdsRef.current.clear();
    prevListingIdsRef.current = '';
    hasNewListingsRef.current = false;
    setPage(0);

    // Clear persisted deck since filters changed
    resetClientDeck();

    // Force UI update
    currentIndexRef.current = 0;
    setCurrentIndex(0);
    setDeckLength(0);

    return () => clearTimeout(settledTimer);
  }, [filterSignature, resetClientDeck]);

  // Get listings with filters - PERF: pass userId to avoid getUser() inside queryFn
  const {
    data: smartListings = [],
    isLoading: smartLoading,
    isFetching: smartFetching,
    error: smartError,
    refetch: refetchSmart
  } = useSmartListingMatching(user?.id, [], stableFilters, page, 20, isRefreshMode);

  const isLoading = smartLoading;
  const isFetching = smartFetching;
  const error = smartError;

  // PERF FIX: Cheap signature using first ID + last ID + length (avoids expensive join)
  // This prevents unnecessary deck updates when React Query returns same data with new reference
  const listingIdsSignature = useMemo(() => {
    if (smartListings.length === 0) return '';
    return `${smartListings[0]?.id || ''}_${smartListings[smartListings.length - 1]?.id || ''}_${smartListings.length}`;
  }, [smartListings]);

  // Determine if we have genuinely new data (not just reference change)
  if (listingIdsSignature !== prevListingIdsRef.current && listingIdsSignature.length > 0) {
    const currentIds = new Set(deckQueueRef.current.map(l => l.id));
    const newIds = smartListings.filter(l => !currentIds.has(l.id) && !swipedIdsRef.current.has(l.id));
    hasNewListingsRef.current = newIds.length > 0;
    prevListingIdsRef.current = listingIdsSignature;

    // SPEED OF LIGHT: Synchronous Hydration
    // Populating the ref during render ensures zero skeleton flicker on mount
    if (deckQueueRef.current.length === 0 && smartListings.length > 0) {
      deckQueueRef.current = smartListings;
      setDeckLength(smartListings.length);
    }
  }

  // Prefetch images for next cards (3 profiles ahead for smoother swiping)
  // PERF: Use currentIndex state as trigger (re-runs when index changes)
  usePrefetchImages({
    currentIndex: currentIndex,
    profiles: deckQueueRef.current,
    prefetchCount: 5,
    trigger: currentIndex
  });

  // Prefetch next batch of listings when approaching end of current batch
  // Uses requestIdleCallback internally for non-blocking prefetch
  useSwipePrefetch(
    user?.id,
    currentIndexRef.current,
    page,
    deckQueueRef.current.length,
    stableFilters
  );

  // PERFORMANCE: Prefetch next listing details when viewing current card
  // This pre-loads the data for the insights dialog
  // PERF: Guard with route check - skip expensive work when navigated away
  // PERF: Use throttled scheduler to not compete with current image decode
  const location = useLocation();
  const isDashboard = location.pathname.includes('/dashboard');
  const { prefetchListingDetails } = usePrefetchManager();

  useEffect(() => {
    // Skip expensive prefetch when not on dashboard - reduces CPU during route transitions
    if (!isDashboard) return;

    const nextListing = deckQueueRef.current[currentIndex + 1];
    if (nextListing?.id) {
      // PERF: Use throttled scheduler - waits 300ms then uses requestIdleCallback
      // This ensures prefetch doesn't compete with current image decoding
      prefetchSchedulerRef.current.schedule(() => {
        prefetchListingDetails(nextListing.id);
      }, 300);
    }

    const scheduler = prefetchSchedulerRef.current;
    return () => {
      scheduler.cancel();
    };

  }, [currentIndex, prefetchListingDetails, isDashboard]); // currentIndex updates on each swipe, triggering reliable prefetch

  // Auto-reset refresh mode when fetching completes or fails
  useEffect(() => {
    if (!isFetching && isRefreshMode) {
      const timer = setTimeout(() => {
        setIsRefreshMode(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isFetching, isRefreshMode]);



  // PREDICTIVE PRELOAD: When drag starts, bump card N+2 images to high priority.
  // RecyclingCardStack already preloads N+1 (high) and N+2 (low) after each swipe,
  // but during the ~260ms exit animation N+2 may still be decoding at low priority.
  // Firing high-priority decode here gives the full animation window to finish.
  const handleDragStart = useCallback(() => {
    const n2Card = deckQueueRef.current[currentIndexRef.current + 2];
    if (n2Card?.images && Array.isArray(n2Card.images)) {
      n2Card.images.forEach((imgUrl: string) => {
        if (imgUrl) imagePreloadController.preload(imgUrl, 'high');
      });
    }
  }, []); // deckQueueRef and currentIndexRef are refs — stable, no deps needed

  // CONSTANT-TIME: Append new unique listings to queue AND persist to store
  // PERF FIX: Only run when we have genuinely new listings (not just reference change)
  // Uses listingIdsSignature for stable dependency instead of smartListings array
  useEffect(() => {
    // Guard: Only process if we have new data and not in initial loading state
    if (!hasNewListingsRef.current || isLoading) {
      // Still reset the fetching flag when loading completes
      if (!isLoading && !isFetching) {
        isFetchingMore.current = false;
      }
      return;
    }

    // Reset the new listings flag
    hasNewListingsRef.current = false;

    const existingIds = new Set(deckQueueRef.current.map(l => l.id));
    const dismissedSet = new Set(dismissedIds);
    const newListings = smartListings.filter(l =>
      !existingIds.has(l.id) && !swipedIdsRef.current.has(l.id) && (!isRefreshMode ? !dismissedSet.has(l.id) : true)
    );

    if (newListings.length > 0) {
      deckQueueRef.current = [...deckQueueRef.current, ...newListings];
      // Cap at 50 listings
      if (deckQueueRef.current.length > 50) {
        const offset = deckQueueRef.current.length - 50;
        deckQueueRef.current = deckQueueRef.current.slice(offset);
        const newIndex = Math.max(0, currentIndexRef.current - offset);
        currentIndexRef.current = newIndex;
        setCurrentIndex(newIndex);
      }

      // FIX: Force re-render when deck goes from empty to populated
      // Without this, the "No Listings Found" empty state persists because
      // appending to deckQueueRef alone doesn't trigger a React re-render
      setDeckLength(deckQueueRef.current.length);

      // PERSIST: Save to store and session for navigation survival
      setClientDeck(deckQueueRef.current, true);
      persistDeckToSession('client', 'listings', deckQueueRef.current);

      // PERF: Mark deck as ready for instant return on re-navigation
      // This ensures that when user returns to dashboard, we skip all initialization
      if (!isClientReady()) {
        markClientReady();
      }
    }

    isFetchingMore.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingIdsSignature, isLoading, isFetching, smartListings, setClientDeck, isClientReady, markClientReady, dismissedIds]);

  // Get current visible cards for 2-card stack (top + next)
  // Use currentIndex from state (already synced with currentIndexRef)
  const deckQueue = deckQueueRef.current;
  // FIX: Don't clamp the index - allow topCard to be null when all cards are swiped
  // This ensures the "All Caught Up" screen shows correctly
  const topCard = currentIndex < deckQueue.length ? deckQueue[currentIndex] : null;
  const _nextCard = currentIndex + 1 < deckQueue.length ? deckQueue[currentIndex + 1] : null;

  // =============================================================================
  // FIX #1: SWIPE PHASE ISOLATION - Two-phase swipe for Tinder-level feel
  // PHASE 1 (0-200ms): DOM only - card flies away, React is frozen
  // PHASE 2 (after animation): Flush all state to React/Zustand/persistence
  // =============================================================================

  // PHASE 2: Called AFTER animation completes - flush all pending state
  const flushPendingSwipe = useCallback(() => {
    const pending = pendingSwipeRef.current;
    if (!pending) return;

    const { listing, direction, newIndex } = pending;

    // Clear pending immediately to prevent double-flush
    pendingSwipeRef.current = null;
    isSwipeAnimatingRef.current = false;

    // Smoothly reset shared motion value so the next card's peek transforms
    // don't snap — they ease back to rest while the new card springs in
    animate(topCardX, 0, { type: 'spring', stiffness: 500, damping: 35, mass: 0.4 });

    // Gate entrance animation — only spring-in for cards after the first swipe
    hasSwipedRef.current = true;

    // NOW it's safe to update React state - animation is done
    setCurrentIndex(newIndex);

    // Zustand update - DEFERRED until animation complete
    markClientSwiped(listing.id);

    // Record for undo (only left swipes are saved for undo)
    recordSwipe(listing.id, 'listing', direction);

    // Save swipe to DB with match detection and notifications
    swipeMutation.mutate({
      targetId: listing.id,
      direction,
      targetType: 'listing',
    });

    // Track dismissal on left swipe (dislike)
    if (direction === 'left') {
      dismissTarget(listing.id).catch(() => {
        // Non-critical error - already logged in hook
      });
    }

    // FIX #2: DEFERRED PERSISTENCE - use requestIdleCallback
    // This prevents sessionStorage from blocking the main thread
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        persistDeckToSession('client', 'listings', deckQueueRef.current);
      }, { timeout: 2000 });
    } else {
      // Fallback: defer to next frame at minimum
      setTimeout(() => {
        persistDeckToSession('client', 'listings', deckQueueRef.current);
      }, 0);
    }

    // Background: Profile view recording (non-critical, fire-and-forget)
    queueMicrotask(() => {
      recordProfileView.mutateAsync({
        profileId: listing.id,
        viewType: 'listing',
        action: direction === 'right' ? 'like' : 'pass'
      }).catch(() => { /* fire-and-forget: ignore analytics errors */ });
    });

    // Clear direction for next swipe
    setSwipeDirection(null);

    // Fetch more if running low
    // FIX: Prevent pagination when deck is exhausted to avoid empty fetch errors
    // Only fetch more if we're within the deck bounds (haven't swiped past the last card)
    // AND we're approaching the end (within 3 cards of the end)
    if (
      newIndex < deckQueueRef.current.length &&
      newIndex >= deckQueueRef.current.length - 3 &&
      deckQueueRef.current.length > 0 &&
      !isFetchingMore.current &&
      !error // Don't try to fetch more if previous fetch errored
    ) {
      isFetchingMore.current = true;
      setPage(p => p + 1);
    }

    const nextNextCard = deckQueueRef.current[newIndex + 1];
    if (nextNextCard?.images?.[0]) {
      preloadImageToCache(nextNextCard.images[0]);
      imageCache.set(nextNextCard.images[0], true);
      imagePreloadController.preload(nextNextCard.images[0], 'high');
    }

    prefetchSchedulerRef.current.schedule(() => {
      const batch: string[] = [];
      for (let offset = 2; offset <= 5; offset++) {
        const card = deckQueueRef.current[newIndex + offset];
        if (card?.images?.[0]) {
          batch.push(card.images[0]);
          imageCache.set(card.images[0], true);
        }
      }
      if (batch.length > 0) {
        batch.forEach(url => preloadImageToCache(url));
        imagePreloadController.preloadBatch(batch);
      }
    }, 200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordSwipe, recordProfileView, markClientSwiped, queryClient, dismissTarget, swipeMutation, error]);

  // PHASE 1: Called when user swipes - ONLY updates refs and triggers animation
  // NO React state updates, NO Zustand updates, NO persistence
  const executeSwipe = useCallback((direction: 'left' | 'right') => {
    // Prevent double-swipe while animation is in progress
    if (isSwipeAnimatingRef.current) return;

    const listing = deckQueueRef.current[currentIndexRef.current];
    if (!listing) return;

    const newIndex = currentIndexRef.current + 1;

    // PHASE 1: Only update refs and trigger animation
    // NO setCurrentIndex, NO markClientSwiped, NO persistence
    isSwipeAnimatingRef.current = true;
    pendingSwipeRef.current = { listing, direction, newIndex };

    // Update ONLY the refs (no React re-render)
    currentIndexRef.current = newIndex;
    swipedIdsRef.current.add(listing.id);

    // SOUNDS: Play sound based on direction
    playSwipeSound(direction);

    // Trigger exit animation direction (this is the ONLY React state we touch)
    setSwipeDirection(direction);

    // SAFETY NET: If animation callback doesn't fire within 350ms, force flush
    // This prevents stuck state if onAnimationComplete fails
    setTimeout(() => {
      if (pendingSwipeRef.current?.listing.id === listing.id) {
        flushPendingSwipe();
      }
    }, 350);
  }, [flushPendingSwipe]);

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    const listing = deckQueueRef.current[currentIndexRef.current];
    if (!listing) return;

    // NOTE: Haptic is fired by the card component (handleDragEnd or handleButtonSwipe)
    // or by ActionButton — do NOT fire again here to avoid double/triple haptic on device.

    // Play swipe sound effect
    playSwipeSound(direction);

    // INSTANT SWIPE: Always execute immediately - never block on image prefetch
    // The next card will show with skeleton placeholder until image loads
    executeSwipe(direction);

    // AGGRESSIVE PREFETCH: Preload ALL images of next 5 cards to prevent blink
    // Use BOTH preloaders for maximum cache coverage and instant display
    const imagesToPreload: string[] = [];
    [1, 2, 3, 4, 5].forEach((offset) => {
      const futureCard = deckQueueRef.current[currentIndexRef.current + offset];
      if (futureCard?.images && Array.isArray(futureCard.images)) {
        futureCard.images.forEach((imgUrl: string) => {
          if (imgUrl) {
            imagesToPreload.push(imgUrl);
            preloadImageToCache(imgUrl);
            // FIX: Also add to simple imageCache so CardImage.tsx detects cached images
            imageCache.set(imgUrl, true);
          }
        });
      }
    });

    // Batch preload with ImagePreloadController (decodes images for instant display)
    // First 3 get high priority, rest get low priority
    if (imagesToPreload.length > 0) {
      imagePreloadController.preloadBatch(imagesToPreload);
    }
  }, [executeSwipe, playSwipeSound]);

  // Button-triggered swipe - animates the card via ref
  const handleButtonLike = useCallback(() => {
    if (cardRef.current) {
      cardRef.current.triggerSwipe('right');
    }
  }, []);

  const handleButtonDislike = useCallback(() => {
    if (cardRef.current) {
      cardRef.current.triggerSwipe('left');
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    logger.info('[SwipessSwipeContainer] Manual Refresh Triggered');
    setIsRefreshing(true);
    setIsRefreshMode(true);
    triggerHaptic('heavy');

    // Reset local state and refs
    currentIndexRef.current = 0;
    setCurrentIndex(0);
    setDeckLength(0);
    deckQueueRef.current = [];
    swipedIdsRef.current.clear();
    setPage(0);

    // Reset store
    resetClientDeck();

    try {
      await refetchSmart();
      const refreshCategoryInfo = getActiveCategoryInfo(filters, storeActiveCategory);
      const refreshLabel = String(refreshCategoryInfo?.plural || 'Listings').toLowerCase();
      appToast.success(`${String(refreshCategoryInfo?.plural || 'Listings')} Refreshed`, `Showing ${refreshLabel} you passed on. Liked ones stay saved!`);
    } catch (_err) {
      appToast.error('Refresh Failed', 'Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  }, [filters, storeActiveCategory, refetchSmart, resetClientDeck]);

  const handleInsights = () => {
    // ALWAYS open the "cool window" (insights modal) instead of full page navigation
    setInsightsModalOpen(true);
    triggerHaptic('light');
  };

  const handleShare = () => {
    setShareDialogOpen(true);
    triggerHaptic('light');
  };

  const handleReport = () => {
    const listing = deckQueueRef.current[currentIndexRef.current];
    if (listing) {
      setSelectedListing(listing);
      setReportDialogOpen(true);
      triggerHaptic('medium');
    }
  };



  const handleMessage = () => {
    const listing = deckQueueRef.current[currentIndexRef.current];

    if (!canNavigate()) return;

    if (!listing?.owner_id) {
      appToast.error('Cannot Start Conversation', 'Owner information not available.');
      return;
    }

    // Check if this is a direct messaging category (motorcycle/bicycle)
    // These categories allow free messaging without subscription or quota checks
    const isDirectMessaging = isDirectMessagingListing(listing);

    if (isDirectMessaging) {
      // Direct messaging for motorcycles and bicycles - no subscription required
      logger.info('[SwipessSwipeContainer] Direct messaging category detected, opening direct message dialog');
      setSelectedListing(listing);
      setDirectMessageDialogOpen(true);
      triggerHaptic('light');
      return;
    }

    // Standard flow for properties and other categories - requires subscription
    if (needsUpgrade) {
      startNavigation();
      navigate('/client/settings#subscription');
      appToast.info('Subscription Required', 'Upgrade to message property owners.');
      setTimeout(endNavigation, 500);
      return;
    }

    if (!hasPremiumMessaging) {
      startNavigation();
      navigate('/client/settings#subscription');
      setTimeout(endNavigation, 500);
      return;
    }

    // Open confirmation dialog with message quota info
    logger.info('[SwipessSwipeContainer] Message icon clicked, opening confirmation dialog');
    setSelectedListing(listing);
    setMessageDialogOpen(true);
    triggerHaptic('light');

    if (onMessageClick) onMessageClick();
  };

  const handleSendMessage = async (message: string) => {
    if (isCreatingConversation || !selectedListing?.owner_id) return;

    // Content moderation check
    const { validateContent: vc } = await import('@/utils/contactInfoValidation');
    const result = vc(message);
    if (!result.isClean) {
      appToast.error('Content blocked', result.message || undefined);
      return;
    }

    setIsCreatingConversation(true);
    startNavigation();

    try {
      appToast.info('Creating conversation...', 'Please wait');

      const result = await startConversation.mutateAsync({
        otherUserId: selectedListing.owner_id,
        listingId: selectedListing.id,
        initialMessage: message,
        canStartNewConversation: true,
      });

      if (result?.conversationId) {
        appToast.success('Conversation created!', 'Opening chat...');
        setMessageDialogOpen(false);
        setDirectMessageDialogOpen(false);
        await new Promise(resolve => setTimeout(resolve, 300));
        navigate(`/messages?conversationId=${result.conversationId}`);
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        logger.error('[SwipessDiscoverySwipe] Error starting conversation:', err);
      }
      appToast.error('Error', err instanceof Error ? err.message : 'Could not start conversation');
    } finally {
      setIsCreatingConversation(false);
      endNavigation();
    }
  };

  // PREMIUM: Hover-based prefetch - prefetch next batch when user hovers near bottom of deck
  const _handleDeckHover = useCallback(() => {
    // Only prefetch if we're running low and not already fetching
    const remainingCards = deckQueueRef.current.length - currentIndexRef.current;
    // Don't fetch if we're past the end of the deck (remainingCards <= 0)
    if (remainingCards > 0 && remainingCards <= 5 && !isFetchingMore.current) {
      isFetchingMore.current = true;
      setPage(p => p + 1);

      // Also preload next 4 card images opportunistically using BOTH preloaders
      const imagesToPreload: string[] = [];
      [1, 2, 3, 4].forEach((offset) => {
        const futureCard = deckQueueRef.current[currentIndexRef.current + offset];
        if (futureCard?.images?.[0]) {
          imagesToPreload.push(futureCard.images[0]);
          preloadImageToCache(futureCard.images[0]);
          // FIX: Also add to simple imageCache so CardImage.tsx detects cached images
          imageCache.set(futureCard.images[0], true);
        }
      });

      // Use ImagePreloadController for decode (ensures GPU-ready images)
      if (imagesToPreload.length > 0) {
        imagePreloadController.preloadBatch(imagesToPreload);
      }
    }
  }, []);

  // ── RENDER — UINFIED DISCOVERY REEL ──────────────────────────────────────
  // The 'Premiums Dashboard' (SwipeAllDashboard) is now the interactive Slide 0
  // of the vertical snap-scrolling reel.
  return (
    <div className={cn(
      "relative w-full h-full overflow-hidden flex flex-col transition-colors duration-500",
      isLight ? "bg-transparent" : "bg-black"
    )}>
      <div className={cn(
        "absolute inset-0 pointer-events-none -z-10 transition-colors duration-500",
        isLight ? "bg-transparent" : "bg-black"
      )} />

      {/* Top Controls — LEAVE ONLY BACK BUTTON AND RADAR HERE */}
      {(!isLoading || deckQueue.length > 0) && !(storeActiveCategory && deckQueue.length === 0 && !isLoading) && (
        <div className="absolute top-0 left-0 right-0 z-[60] w-full flex items-center justify-between px-6 pt-10 pb-4">
            {/* Back / Reset Category */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                triggerHaptic('light');
                setActiveCategory(null);
              }}
              className={cn(
                "w-10 h-10 flex items-center justify-center transition-colors rounded-full backdrop-blur-xl border",
                isLight ? "bg-white/70 border-black/10 text-black/60 hover:text-black" : "bg-black/60 border-white/10 text-white/60 hover:text-white"
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>

            {/* Radar Context (Top Right) */}
            <LocationRadiusSelector
              radiusKm={radiusKm}
              onRadiusChange={setRadiusKm as any}
              onDetectLocation={detectLocation}
              detecting={locationDetecting}
              detected={locationDetected}
              lat={userLatitude}
              lng={userLongitude}
              variant="minimal"
              nodes={useMemo(() => (smartListings || []).map(l => ({
                id: l.id,
                lat: l.latitude || 0,
                lng: l.longitude || 0,
                label: l.title || 'Found'
              })), [smartListings])}
            />
        </div>
      )}


      {/* Card area — flex-1 fills remaining space */}
      <div className={cn(
        "flex-1 relative flex flex-col items-center justify-center px-0 pt-0 z-10 pointer-events-none min-h-0",
        (storeActiveCategory && deckQueue.length > 0 && currentIndex < deckQueue.length) ? "pb-0" : ""
      )}>

        <div className="w-full h-full flex items-center justify-center pointer-events-auto">
          <AnimatePresence mode="sync" initial={false}>
            {!storeActiveCategory ? (
              <motion.div 
                key="category-stack"
                initial={false}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="w-full h-full flex flex-col items-center justify-center max-w-[700px] mx-auto"
              >
                <SwipeAllDashboard setCategories={setActiveCategory} />
              </motion.div>
            ) : deckQueue.length > 0 && currentIndex < deckQueue.length ? (
              <motion.div 
                key={`deck-${storeActiveCategory}`}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full h-full max-w-[700px] mx-auto"
              >
                {/* Back card (Peek) */}
                {currentIndex + 1 < deckQueue.length && (
                  <motion.div
                    className="absolute inset-0 z-10"
                    style={{
                      scale: nextCardScale,
                      opacity: nextCardOpacity,
                      willChange: 'transform, opacity',
                    }}
                  >
                    <SimpleSwipeCard
                      key={deckQueue[currentIndex + 1].id}
                      listing={deckQueue[currentIndex + 1]}
                      onSwipe={() => { }}
                      isTop={false}
                    />
                  </motion.div>
                )}

                {/* Front card */}
                <SimpleSwipeCard
                  key={topCard?.id}
                  ref={cardRef}
                  listing={topCard}
                  onSwipe={handleSwipe}
                  onInsights={() => {
                    handleInsights();
                    if (onListingTap) onListingTap(topCard.id);
                  }}
                  onMessage={handleMessage}
                  onShare={handleShare}
                  onReport={handleReport}
                  onLike={handleButtonLike}
                  onDislike={handleButtonDislike}
                  onDragStart={handleDragStart}
                  isTop={true}
                  externalX={topCardX}
                />
              </motion.div>
            ) : (isLoading || isFetching || !isMountSettledRef.current) ? (
              <motion.div 
                key="loading-skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full flex items-center justify-center"
              >
                <SwipeLoadingSkeleton />
              </motion.div>
            ) : (
              <motion.div
                key="exhausted"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full z-50 overflow-hidden"
              >
                <SwipeExhaustedState 
                  {...({
                    onRefresh: handleRefresh,
                    isRefreshing,
                    radiusKm,
                    onRadiusChange: setRadiusKm as any,
                    onDetectLocation: detectLocation,
                    detecting: locationDetecting,
                    detected: locationDetected,
                    error,
                    role: userRole === 'owner' ? 'owner' : 'client',
                    lat: userLatitude,
                    lng: userLongitude
                  } as any)}
                />
              </motion.div>
            )}
          </AnimatePresence>
      </div>

      {/* 🚀 ZENITH DISCOVERY HUD: Clean, Text-based Switcher (Replaces cluttered icons) */}
      {(!isLoading || deckQueue.length > 0) && (
        <div className="absolute bottom-[42px] left-0 right-0 z-[100] flex flex-col items-center pointer-events-none px-6">
          
          <div className="flex flex-col items-center gap-4 w-full max-w-[360px] pointer-events-auto">
            {/* 🛸 THE SECTOR SWITCHER */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                triggerHaptic('heavy');
                // Cycle through main categories
                const categories: QuickFilterCategory[] = userRole === 'owner' 
                  ? ['buyers', 'renters', 'hire'] 
                  : ['property', 'motorcycle', 'services', 'bicycle'];
                const currentIdx = categories.indexOf(storeActiveCategory as QuickFilterCategory);
                const nextIdx = (currentIdx + 1) % categories.length;
                setActiveCategory(categories[nextIdx]);
              }}
              className={cn(
                "group relative w-full h-16 flex items-center justify-between px-6 rounded-[2rem] overflow-hidden transition-all",
                "backdrop-blur-[40px] border border-white/40 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)]",
                "bg-gradient-to-r from-black/80 via-black/90 to-black/80"
              )}
            >
              {/* Inner Glow */}
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 mb-0.5">Active Sector</span>
                <span className="text-[15px] font-black uppercase tracking-wider text-white flex items-center gap-2">
                  {storeActiveCategory?.replace(/-/g, ' ') || 'All Sectors'}
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--color-brand-primary-rgb),0.8)]" />
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-8 w-[1px] bg-white/10 mx-1" />
                <span className="text-[11px] font-bold text-primary tracking-tight group-hover:translate-x-1 transition-transform">
                  TAP TO SWITCH
                </span>
              </div>
            </motion.button>

            {/* Sub-Actions: Intel & Switch */}
            <div className="flex items-center gap-2 w-full">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                     triggerHaptic('medium');
                     setFilterDialogOpen(true);
                  }}
                  className="flex-1 h-12 rounded-2xl bg-white/10 backdrop-blur-3xl border border-white/20 flex items-center justify-center gap-2"
                >
                  <SlidersHorizontal className="w-4 h-4 text-white/70" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Intel Center</span>
                </motion.button>

               <motion.button
                 whileTap={{ scale: 0.95 }}
                 onClick={() => {
                    triggerHaptic('medium');
                    // Simple cycle for now or we could open a small menu
                    const categories = ['property', 'motorcycle', 'bicycle', 'services'];
                    const currentIndex = categories.indexOf(activeCategory || 'property');
                    const nextIndex = (currentIndex + 1) % categories.length;
                    setActiveCategory(categories[nextIndex] as any);
                 }}
                 className="flex-1 h-12 rounded-2xl bg-white/10 backdrop-blur-3xl border border-white/20 flex items-center justify-center gap-2"
               >
                 <LayoutGrid className="w-4 h-4 text-white/70" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Switch Deck</span>
               </motion.button>
            </div>
          </div>
        </div>
      )}

      {/* BUILD VERSION STAMP */}
      <div className="absolute bottom-[85px] right-6 z-0 pointer-events-none opacity-20">
          <span className={cn(
            "text-[8px] font-black uppercase tracking-[0.4em]",
            isLight ? "text-black" : "text-white"
          )}>FLAGSHIP BUILD v1.0.96-rc4</span>
      </div>
    </div>

      {/* Action buttons now live inside the card via DiscoverySidebar */}

      {/* Epic Match Celebration Modal */}
      {matchData && (
        <MatchCelebrateModal 
          isOpen={true} 
          onClose={() => setMatchData(null)}
          clientProfile={matchData.client} 
          ownerProfile={matchData.owner} 
        />
      )}

      {/* FIX #3: PORTAL ISOLATION - Modals render outside swipe tree */}
      {typeof document !== 'undefined' && document.body && createPortal(
        <Suspense fallback={null}>
          {insightsModalOpen && (
            <SwipeInsightsModal
              open={insightsModalOpen}
              onOpenChange={setInsightsModalOpen}
              listing={topCard}
            />
          )}
          {shareDialogOpen && topCard && (
            <ShareDialog
              open={shareDialogOpen}
              onOpenChange={setShareDialogOpen}
              listingId={topCard.id}
              title={topCard.title || 'Check out this listing'}
              description={topCard.description}
            />
          )}

          <MessageConfirmationDialog
            open={messageDialogOpen}
            onOpenChange={setMessageDialogOpen}
            onConfirm={handleSendMessage}
            recipientName={selectedListing ? `the owner of ${selectedListing.title}` : 'the owner'}
            isLoading={isCreatingConversation}
          />

          <DirectMessageDialog
            open={directMessageDialogOpen}
            onOpenChange={setDirectMessageDialogOpen}
            onConfirm={handleSendMessage}
            recipientName={selectedListing ? `the owner of ${selectedListing.title}` : 'the owner'}
            isLoading={isCreatingConversation}
            category={selectedListing?.category}
          />

          {/* DYNAMIC FILTER DIALOGS */}
          {userRole === 'owner' ? (
            <OwnerClientFilterDialog
              open={filterDialogOpen}
              onOpenChange={setFilterDialogOpen}
            />
          ) : (
            <ClientPreferencesDialog
              open={filterDialogOpen}
              onOpenChange={setFilterDialogOpen}
            />
          )}

          {selectedListing && (
            <ReportDialog
              open={reportDialogOpen}
              onOpenChange={setReportDialogOpen}
              reportedListingId={selectedListing.id}
              reportedListingTitle={selectedListing.title}
              reportedUserId={selectedListing.owner_id}
              category="listing"
            />
          )}
        </Suspense>,
        document.body
      )}
    </div>
  );
};

export const SwipessSwipeContainer = memo(SwipessSwipeContainerComponent);


