import { useState, useCallback, useEffect, memo, useRef, useMemo, lazy, Suspense } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { createPortal } from 'react-dom';
import { triggerHaptic } from '@/utils/haptics';
import { SimpleSwipeCard, SimpleSwipeCardRef } from './SimpleSwipeCard';
import { SwipeActionButtonBar } from './SwipeActionButtonBar';
import { preloadImageToCache, isImageDecodedInCache } from '@/lib/swipe/imageCache';
import { imageCache } from '@/lib/swipe/cardImageCache';
// PrefetchScheduler imported from SwipeUtils below

// FIX #3: Lazy-load modals to prevent them from affecting swipe tree
// These are rendered via portal outside the swipe container's React tree
const SwipeInsightsModal = lazy(() => import('./SwipeInsightsModal').then(m => ({ default: m.SwipeInsightsModal })));
const ShareDialog = lazy(() => import('./ShareDialog').then(m => ({ default: m.ShareDialog })));
import { useSmartListingMatching, ListingFilters } from '@/hooks/useSmartMatching';
import { useAuth } from '@/hooks/useAuth';
import { swipeQueue } from '@/lib/swipe/SwipeQueue';
import { imagePreloadController } from '@/lib/swipe/ImagePreloadController';
import { useCanAccessMessaging } from '@/hooks/useMessaging';
import { useSwipeUndo } from '@/hooks/useSwipeUndo';
import { useSwipe } from '@/hooks/useSwipe';
import { useStartConversation } from '@/hooks/useConversations';
import { useRecordProfileView } from '@/hooks/useProfileRecycling';
import { usePrefetchImages } from '@/hooks/usePrefetchImages';
import { useSwipePrefetch, usePrefetchManager } from '@/hooks/usePrefetchManager';
import { useSwipeDeckStore, persistDeckToSession, getDeckFromSession } from '@/state/swipeDeckStore';
import { useFilterStore } from '@/state/filterStore';
import { useSwipeDismissal } from '@/hooks/useSwipeDismissal';
import { useSwipeSounds } from '@/hooks/useSwipeSounds';
import { shallow } from 'zustand/shallow';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RotateCcw, RefreshCw, Home, Bike, Briefcase, Sparkles } from 'lucide-react';
import { RadarSearchEffect, RadarSearchIcon } from '@/components/ui/RadarSearchEffect';
import { toast } from '@/components/ui/sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { logger } from '@/utils/logger';
import { MessageConfirmationDialog } from './MessageConfirmationDialog';
import { DirectMessageDialog } from './DirectMessageDialog';
import { isDirectMessagingListing } from '@/utils/directMessaging';
import { useQueryClient } from '@tanstack/react-query';
import {
  getActiveCategoryInfo,
  useDebounce,
  useNavigationGuard,
  PrefetchScheduler
} from './swipe/SwipeUtils';
import { SwipeLoadingSkeleton } from './swipe/SwipeLoadingSkeleton';
import { AllCaughtUpView, ErrorStateView, EmptyStateView } from './swipe/SwipeStates';
import { MatchedListing as Listing } from '@/hooks/smartMatching/types';

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

const SwipessSwipeContainerComponent = ({ onListingTap, onInsights, onMessageClick, locationFilter, filters }: SwipessSwipeContainerProps) => {
  const [page, setPage] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [insightsModalOpen, setInsightsModalOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshMode, setIsRefreshMode] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [directMessageDialogOpen, setDirectMessageDialogOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  // PERF: Get userId from auth to pass to query (avoids getUser() inside queryFn)
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // PERF: Use selective subscriptions to prevent re-renders on unrelated store changes
  // Only subscribe to actions (stable references) - NOT to clientDeck object
  // This is the key fix for "double render" feeling when navigating back to dashboard
  const setClientDeck = useSwipeDeckStore((state) => state.setClientDeck);
  const markClientSwiped = useSwipeDeckStore((state) => state.markClientSwiped);
  const resetClientDeck = useSwipeDeckStore((state) => state.resetClientDeck);
  const isClientHydrated = useSwipeDeckStore((state) => state.isClientHydrated);
  const isClientReady = useSwipeDeckStore((state) => state.isClientReady);
  const markClientReady = useSwipeDeckStore((state) => state.markClientReady);

  // Read active category directly from filter store for guaranteed sync with quick filter UI
  // This ensures empty state messages update instantly when user clicks a quick filter
  const storeCategories = useFilterStore((state) => state.categories);
  const storeActiveCategory = storeCategories.length > 0 ? storeCategories[0] : null;

  // Local state for immediate UI updates - drives the swipe animation
  const [currentIndex, setCurrentIndex] = useState(0);

  // FIX: Track deck length in state to force re-render when listings are appended
  // Without this, appending to deckQueueRef doesn't trigger re-render and empty state persists
  const [deckLength, setDeckLength] = useState(0);

  // =============================================================================
  // FIX #1: SWIPE PHASE ISOLATION - DOM moves first, React cleans up after
  // This is the key to "Tinder-level" feel: freeze React during the swipe gesture
  // =============================================================================
  interface PendingSwipe {
    listing: Listing;
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

  // Initialize synchronously from persisted state to prevent dark/empty cards
  // PERF: Use getState() for initial values - no subscription needed
  const deckQueueRef = useRef<Listing[]>(getInitialDeck());
  const currentIndexRef = useRef(useSwipeDeckStore.getState().clientDeck.currentIndex);
  const swipedIdsRef = useRef<Set<string>>(new Set(useSwipeDeckStore.getState().clientDeck.swipedIds));
  const initializedRef = useRef(deckQueueRef.current.length > 0);

  // Ref to trigger swipe animations from the fixed action buttons
  const cardRef = useRef<SimpleSwipeCardRef>(null);

  // Sync state with ref on mount
  useEffect(() => {
    setCurrentIndex(currentIndexRef.current);
  }, []);

  // FILTER CHANGE DETECTION: Reset deck when filters change
  // Track previous filter state to detect changes
  const prevFiltersRef = useRef(filters);
  useEffect(() => {
    // Skip on initial mount
    if (!prevFiltersRef.current && !filters) return;

    // PERFORMANCE: Use efficient comparison instead of JSON.stringify
    const arraysEqual = (a?: any[], b?: any[]) => {
      if (!a && !b) return true;
      if (!a || !b) return false;
      if (a.length !== b.length) return false;
      return a.every((val, i) => val === b[i]);
    };

    const objectsEqual = (a?: any, b?: any) => {
      if (!a && !b) return true;
      if (!a || !b) return false;
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      return keysA.every(key => a[key] === b[key]);
    };

    // Check if filters actually changed (optimized comparison)
    // FIX: category is a string, not an array - use direct comparison
    const filtersChanged =
      !arraysEqual(prevFiltersRef.current?.categories, filters?.categories) ||
      prevFiltersRef.current?.category !== filters?.category ||
      prevFiltersRef.current?.listingType !== filters?.listingType ||
      !objectsEqual(prevFiltersRef.current?.priceRange, filters?.priceRange) ||
      !arraysEqual(prevFiltersRef.current?.serviceCategory, filters?.serviceCategory) ||
      !arraysEqual(prevFiltersRef.current?.workTypes, filters?.workTypes) ||
      !arraysEqual(prevFiltersRef.current?.skills, filters?.skills) ||
      !arraysEqual(prevFiltersRef.current?.daysAvailable, filters?.daysAvailable) ||
      !arraysEqual(prevFiltersRef.current?.experienceLevel, filters?.experienceLevel) ||
      !arraysEqual(prevFiltersRef.current?.scheduleTypes, filters?.scheduleTypes);

    if (filtersChanged) {
      logger.info('[SwipessSwipeContainer] Filters changed, resetting deck');

      // Reset local state and refs
      currentIndexRef.current = 0;
      setCurrentIndex(0);
      setDeckLength(0);
      deckQueueRef.current = [];
      swipedIdsRef.current.clear();
      setPage(0);

      // Reset store
      resetClientDeck();

      // Update prev filters
      prevFiltersRef.current = filters;
    }
  }, [filters, resetClientDeck]);

  // PERF FIX: Track if we're returning to dashboard (has hydrated data AND is ready)
  // When true, skip initial animations to prevent "double render" feeling
  // Use isReady flag from store to determine if deck is fully initialized
  const isReturningRef = useRef(
    deckQueueRef.current.length > 0 && useSwipeDeckStore.getState().clientDeck.isReady
  );
  const hasAnimatedOnceRef = useRef(isReturningRef.current);

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
    try { sessionStorage.removeItem('swipe-deck-client-listings'); } catch (err) { /* Ignore session storage errors */ }
  }, []);

  // HYDRATE FILTER STORE FROM DATABASE on mount
  // If the Zustand store has no categories selected but the DB has stored preferences,
  // seed the store so the swipe deck uses the user's saved filters
  useEffect(() => {
    if (!user?.id) return;
    const state = useFilterStore.getState();
    // Only hydrate if store is empty (user hasn't actively set filters this session)
    if (state.categories.length > 0 || state.listingType !== 'both') return;

    (async () => {
      try {
        const { data } = await supabase
          .from('client_filter_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!data) return;
        const currentState = useFilterStore.getState();
        // Double-check store is still empty (race condition guard)
        if (currentState.categories.length > 0) return;

        const cats = Array.isArray(data.preferred_categories) ? data.preferred_categories as string[] : [];
        const listingTypes = Array.isArray(data.preferred_listing_types) ? data.preferred_listing_types as string[] : [];

        if (cats.length > 0) {
          useFilterStore.getState().setCategories(cats as any);
        }
        if (listingTypes.length === 1 && listingTypes[0] !== 'both') {
          useFilterStore.getState().setListingType(listingTypes[0] as any);
        }
        logger.info('[SwipessSwipeContainer] Hydrated filter store from DB:', { cats, listingTypes });
      } catch (err) {
        logger.error('[SwipessSwipeContainer] Error hydrating filters from DB:', err);
      }
    })();
  }, [user?.id]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      prefetchSchedulerRef.current.cancel();
    };
  }, []);

  // Hooks for functionality
  const { canAccess: hasPremiumMessaging, needsUpgrade } = useCanAccessMessaging();
  const navigate = useNavigate();
  const { recordSwipe, undoLastSwipe, canUndo, isUndoing, undoSuccess, resetUndoState } = useSwipeUndo();
  const swipeMutation = useSwipe();
  const startConversation = useStartConversation();

  // Swipe dismissal tracking
  const { dismissedIds, dismissTarget, filterDismissed } = useSwipeDismissal('listing');

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

  // PERF: Memoize filters to prevent unnecessary query re-runs
  const stableFilters = useMemo(() => {
    return filters;
  }, [
    // Only re-create when actual filter values change
    filters?.category,
    filters?.categories?.join(','),
    filters?.listingType,
    filters?.priceRange?.[0],
    filters?.priceRange?.[1],
    filters?.bedrooms?.join(','),
    filters?.bathrooms?.join(','),
    filters?.amenities?.join(','),
    filters?.propertyType?.join(','),
    filters?.petFriendly,
    filters?.furnished,
    filters?.verified,
    filters?.premiumOnly,
    filters?.showHireServices,
    filters?.clientGender,
    filters?.clientType,
  ]);

  // PERF FIX: Create stable filter signature for deck versioning
  // This detects when filters actually changed vs just navigation return
  const filterSignature = useMemo(() => {
    if (!filters) return 'default';
    return [
      filters.category || '',
      filters.categories?.join(',') || '',
      filters.listingType || '',
      filters.priceRange?.join('-') || '',
      filters.bedrooms?.join(',') || '',
      filters.bathrooms?.join(',') || '',
      filters.amenities?.join(',') || '',
      filters.propertyType?.join(',') || '',
      filters.petFriendly ? '1' : '0',
      filters.furnished ? '1' : '0',
      filters.verified ? '1' : '0',
      filters.premiumOnly ? '1' : '0',
      filters.showHireServices ? '1' : '0',
      filters.clientGender || '',
      filters.clientType || '',
    ].join('|');
  }, [filters]);

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
  }, [filterSignature, resetClientDeck]);

  // Get listings with filters - PERF: pass userId to avoid getUser() inside queryFn
  const {
    data: smartListings = [],
    isLoading: smartLoading,
    isFetching: smartFetching,
    error: smartError,
    refetch: refetchSmart
  } = useSmartListingMatching(user?.id, [], stableFilters, page, 10, isRefreshMode);

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
    currentIndexRef.current,
    page,
    deckQueueRef.current.length,
    stableFilters as unknown
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

    return () => {
      prefetchSchedulerRef.current.cancel();
    };

  }, [currentIndex, prefetchListingDetails, isDashboard]); // currentIndex updates on each swipe, triggering reliable prefetch

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
      setClientDeck(deckQueueRef.current as any, true);
      persistDeckToSession('client', 'listings', deckQueueRef.current as any);

      // PERF: Mark deck as ready for instant return on re-navigation
      // This ensures that when user returns to dashboard, we skip all initialization
      if (!isClientReady()) {
        markClientReady();
      }
    }

    isFetchingMore.current = false;
  }, [listingIdsSignature, isLoading, isFetching, smartListings, setClientDeck, isClientReady, markClientReady, dismissedIds]);

  // Get current visible cards for 2-card stack (top + next)
  // Use currentIndex from state (already synced with currentIndexRef)
  const deckQueue = deckQueueRef.current;
  // FIX: Don't clamp the index - allow topCard to be null when all cards are swiped
  // This ensures the "All Caught Up" screen shows correctly
  const topCard = currentIndex < deckQueue.length ? deckQueue[currentIndex] : null;
  const nextCard = currentIndex + 1 < deckQueue.length ? deckQueue[currentIndex + 1] : null;

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

    // Reset shared motion value BEFORE React re-render so new top card
    // mounts with x=0 (prevents stale rotation/opacity on the incoming card)
    topCardX.set(0);

    // Gate entrance animation — only spring-in for cards after the first swipe
    hasSwipedRef.current = true;

    // NOW it's safe to update React state - animation is done
    setCurrentIndex(newIndex);

    // Update local ref for swiped IDs (already done in phase 1, but ensure consistency)
    swipedIdsRef.current.add(listing.id);

    // FIX: Save to DB FIRST, then update cache only on success
    // This prevents liked listings from showing in cache if DB save fails
    if (direction === 'right') {
      // Save swipe to DB with proper error handling
      swipeMutation.mutateAsync({
        targetId: listing.id,
        direction,
        targetType: 'listing'
      }).then(() => {
        // SUCCESS: Add the liked listing to the cache AFTER DB write succeeds
        queryClient.setQueryData(['liked-properties'], (oldData: any[] | undefined) => {
          const currentListing = listing;
          if (!oldData) {
            return [currentListing];
          }
          // Check if already in the list to avoid duplicates
          const exists = oldData.some((item: any) => item.id === currentListing.id);
          if (exists) {
            return oldData;
          }
          return [currentListing, ...oldData];
        });
      }).catch((err) => {
        // ERROR: DB save failed - show error to user
        logger.error('[SwipessSwipeContainer] Failed to save like:', err);

        // Only show error for unexpected failures (not duplicates/RLS)
        const errorMessage = err?.message?.toLowerCase() || '';
        const errorCode = err?.code || '';
        const isExpectedError =
          errorMessage.includes('duplicate') ||
          errorMessage.includes('already exists') ||
          errorMessage.includes('unique constraint') ||
          errorCode === '23505' || // Unique constraint violation
          errorCode === '42501';   // RLS policy violation

        if (!isExpectedError) {
          toast.error('Failed to save like', {
            description: 'Your like was not saved. Please try again.',
          });
        }
      });
    } else {
      // For left swipes (dislikes), just save without cache update
      swipeMutation.mutateAsync({
        targetId: listing.id,
        direction,
        targetType: 'listing'
      }).catch((err) => {
        // Non-critical - dislike not saved, but user can continue swiping
        logger.error('[SwipessSwipeContainer] Failed to save dislike:', err);
      });
    }

    // Track dismissal on left swipe (dislike)
    if (direction === 'left') {
      dismissTarget(listing.id).catch(() => {
        // Non-critical error - already logged in hook
      });
    }

    // Zustand update - DEFERRED until animation complete
    markClientSwiped(listing.id);

    // Record for undo (only left swipes are saved for undo)
    recordSwipe(listing.id, 'listing', direction);

    // FIX #2: DEFERRED PERSISTENCE - use requestIdleCallback
    // This prevents sessionStorage from blocking the main thread
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        persistDeckToSession('client', 'listings', deckQueueRef.current as any);
      }, { timeout: 2000 });
    } else {
      // Fallback: defer to next frame at minimum
      setTimeout(() => {
        persistDeckToSession('client', 'listings', deckQueueRef.current as any);
      }, 0);
    }

    // Background: Profile view recording (non-critical, fire-and-forget)
    queueMicrotask(() => {
      recordProfileView.mutateAsync({
        profileId: listing.id,
        viewType: 'listing',
        action: direction === 'right' ? 'like' : 'pass'
      }).catch(() => { });
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

    // Eagerly preload next card's image using both preloaders
    const nextNextCard = deckQueueRef.current[newIndex + 1];
    if (nextNextCard?.images?.[0]) {
      preloadImageToCache(nextNextCard.images[0]);
      // FIX: Also add to simple imageCache so CardImage.tsx detects cached images
      imageCache.set(nextNextCard.images[0], true);
      imagePreloadController.preload(nextNextCard.images[0], 'high');
    }
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

    // Immediate haptic feedback
    triggerHaptic(direction === 'right' ? 'success' : 'warning');

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setIsRefreshMode(true);
    triggerHaptic('medium');

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
      toast.success(`${String(refreshCategoryInfo?.plural || 'Listings')} Refreshed`, {
        description: `Showing ${refreshLabel} you passed on. Liked ones stay saved!`,
      });
    } catch (err) {
      toast.error('Refresh Failed', {
        description: 'Please try again.',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleInsights = () => {
    setInsightsModalOpen(true);
    triggerHaptic('light');
  };

  const handleShare = () => {
    setShareDialogOpen(true);
    triggerHaptic('light');
  };

  const handleMessage = () => {
    const listing = deckQueueRef.current[currentIndexRef.current];

    if (!canNavigate()) return;

    if (!listing?.owner_id) {
      toast.error('Cannot Start Conversation', {
        description: 'Owner information not available.',
      });
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
      toast('Subscription Required', {
        description: 'Upgrade to message property owners.',
      });
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
  };

  const handleSendMessage = async (message: string) => {
    if (isCreatingConversation || !selectedListing?.owner_id) return;

    // Content moderation check
    const { validateContent: vc } = await import('@/utils/contactInfoValidation');
    const result = vc(message);
    if (!result.isClean) {
      toast.error('Content blocked', { description: result.message });
      return;
    }

    setIsCreatingConversation(true);
    startNavigation();

    try {
      toast('Creating conversation...', {
        description: 'Please wait'
      });

      const result = await startConversation.mutateAsync({
        otherUserId: selectedListing.owner_id,
        listingId: selectedListing.id,
        initialMessage: message,
        canStartNewConversation: true,
      });

      if (result?.conversationId) {
        toast.success('Conversation created!', {
          description: 'Opening chat...'
        });
        setMessageDialogOpen(false);
        setDirectMessageDialogOpen(false);
        await new Promise(resolve => setTimeout(resolve, 300));
        navigate(`/messages?conversationId=${result.conversationId}`);
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        logger.error('[SwipessSwipe] Error starting conversation:', err);
      }
      toast.error('Error', {
        description: err instanceof Error ? err.message : 'Could not start conversation'
      });
    } finally {
      setIsCreatingConversation(false);
      endNavigation();
    }
  };

  // PREMIUM: Hover-based prefetch - prefetch next batch when user hovers near bottom of deck
  const handleDeckHover = useCallback(() => {
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

  const progress = deckQueue.length > 0 ? ((currentIndex + 1) / deckQueue.length) * 100 : 0;


  const currentCategoryInfo = getActiveCategoryInfo(filters, storeActiveCategory);

  // STABLE LOADING SHELL: GPU-accelerated skeleton while fetching initial deck
  const hasHydratedData = isClientHydrated() && deckQueue.length > 0;
  if (!hasHydratedData && isLoading) {
    return <SwipeLoadingSkeleton />;
  }

  if (currentIndex > 0 && currentIndex >= deckQueue.length && !isLoading) {
    return (
      <AllCaughtUpView
        categoryInfo={currentCategoryInfo}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />
    );
  }

  // Error state - ONLY show if we have NO cards at all (not when deck is exhausted)
  if (error && currentIndex === 0 && deckQueue.length === 0) {
    return (
      <ErrorStateView
        categoryInfo={currentCategoryInfo}
        onRefresh={handleRefresh}
      />
    );
  }

  if (deckQueue.length === 0 && !isLoading) {
    return (
      <EmptyStateView
        categoryInfo={currentCategoryInfo}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />
    );
  }

  // Main swipe view - FULL-BLEED edge-to-edge cards (no max-width constraint)
  return (
    <div
      className="relative w-full flex flex-col"
      style={{ height: '100%', minHeight: '100dvh' }}
      onMouseEnter={handleDeckHover}
    >
      {/* Category title removed - clean immersive card experience */}

      <div className="relative flex-1 w-full">
        {/* NEXT CARD - Visible behind current card (Tinder-style anticipation)
            - Scale slightly smaller to create depth
            - Lower z-index so it sits behind
            - Already preloaded so transition is instant */}
        {(() => {
          const nextCard = deckQueueRef.current[currentIndexRef.current + 1];
          if (!nextCard) return null;
          return (
            <motion.div
              key={`next-${nextCard.id}`}
              className="w-full h-full absolute inset-0 gpu-layer"
              style={{
                zIndex: 5,
                scale: nextCardScale,
                opacity: nextCardOpacity,
                translateZ: 0,
                pointerEvents: 'none',
              }}
            >
              <SimpleSwipeCard
                listing={nextCard}
                onSwipe={() => { }}
                isTop={false}
              />
            </motion.div>
          );
        })()}

        {/* CURRENT CARD - Top of stack, fully interactive */}
        {topCard && (
          <motion.div
            key={topCard.id}
            className="w-full h-full absolute inset-0"
            // Spring-forward entrance: card pops from "peeked" position to full size.
            // Skipped on first card (hasSwipedRef.current=false) to avoid jarring load animation.
            initial={hasSwipedRef.current ? { scale: 0.97, opacity: 0.72 } : false}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28, mass: 0.85 }}
            style={{ zIndex: 10 }}
          >
            <SimpleSwipeCard
              ref={cardRef}
              listing={topCard}
              onSwipe={handleSwipe}
              onTap={() => onListingTap(topCard.id)}
              onInsights={handleInsights}
              isTop={true}
              externalX={topCardX}
            />
          </motion.div>
        )}

        {/* Action buttons INSIDE card area - Tinder style overlay */}
        {topCard && !insightsModalOpen && (
          <div className="absolute left-0 right-0 flex justify-center z-30" style={{ bottom: 'clamp(88px, 14vh, 128px)' }}>
            <SwipeActionButtonBar
              onLike={handleButtonLike}
              onDislike={handleButtonDislike}
              onShare={handleShare}
              onUndo={undoLastSwipe}
              onMessage={handleMessage}
              canUndo={canUndo}
            />
          </div>
        )}
      </div>

      {/* FIX #3: PORTAL ISOLATION - Modals render outside swipe tree
          This prevents modal state changes from causing re-renders in the swipe container
          The modal lives in a completely separate React subtree */}
      {typeof document !== 'undefined' && createPortal(
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
        </Suspense>,
        document.body
      )}

      {/* Message Confirmation Dialog - Shows remaining tokens */}
      <MessageConfirmationDialog
        open={messageDialogOpen}
        onOpenChange={setMessageDialogOpen}
        onConfirm={handleSendMessage}
        recipientName={selectedListing ? `the owner of ${selectedListing.title}` : 'the owner'}
        isLoading={isCreatingConversation}
      />

      {/* Direct Message Dialog - For motorcycle/bicycle listings (free messaging) */}
      <DirectMessageDialog
        open={directMessageDialogOpen}
        onOpenChange={setDirectMessageDialogOpen}
        onConfirm={handleSendMessage}
        recipientName={selectedListing ? `the owner of ${selectedListing.title}` : 'the owner'}
        isLoading={isCreatingConversation}
        category={selectedListing?.category}
      />
    </div>
  );
};

export const SwipessSwipeContainer = memo(SwipessSwipeContainerComponent);
