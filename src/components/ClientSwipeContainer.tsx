import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValue } from 'framer-motion';
import { SwipeAllDashboard } from './swipe/SwipeAllDashboard';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { triggerHaptic } from '@/utils/haptics';
import { preloadClientImageToCache, isClientImageDecodedInCache } from '@/lib/swipe/imageCache';
import { imagePreloadController } from '@/lib/swipe/ImagePreloadController';
import { imageCache } from '@/lib/swipe/cardImageCache';
import { swipeQueue } from '@/lib/swipe/SwipeQueue';
import { PrefetchScheduler } from '@/lib/swipe/PrefetchScheduler';
import { useSmartClientMatching } from '@/hooks/useSmartMatching';
import { useAuth } from '@/hooks/useAuth';
import { useSwipeWithMatch } from '@/hooks/useSwipeWithMatch';
import { useCanAccessMessaging } from '@/hooks/useMessaging';
import { useSwipeUndo } from '@/hooks/useSwipeUndo';
import { SimpleOwnerSwipeCard, SimpleOwnerSwipeCardRef } from './SimpleOwnerSwipeCard';
import { useRecordProfileView } from '@/hooks/useProfileRecycling';
import { usePrefetchImages } from '@/hooks/usePrefetchImages';
import { usePrefetchManager, useSwipePrefetch } from '@/hooks/usePrefetchManager';
import { persistDeckToSession, useSwipeDeckStore } from '@/state/swipeDeckStore';
import { useFilterStore } from '@/state/filterStore';
import { useShallow } from 'zustand/react/shallow';
import { useSwipeDismissal } from '@/hooks/useSwipeDismissal';
import { useSwipeSounds } from '@/hooks/useSwipeSounds';
import { Bike, MapPin, Users, Wrench } from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { appToast } from '@/utils/appNotification';
import { useStartConversation, useConversations } from '@/hooks/useConversations';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/utils/prodLogger';
import { SwipeExhaustedState } from './swipe/SwipeExhaustedState';
import { SwipessLoader } from './swipe/SwipessLoader';
import { SwipeDeckBackButton } from './swipe/SwipeDeckBackButton';
import { usePullDownToDismiss } from './swipe/usePullDownToDismiss';

import { cn } from '@/lib/utils';
import useAppTheme from "@/hooks/useAppTheme";
import { ConnectingOverlay } from '@/components/ConnectingOverlay';
import { SwipessLogo } from '@/components/SwipessLogo';

// FIX: Lazy-load modals via portal 
const ShareDialog = lazy(() => import('./ShareDialog').then(m => ({ default: m.ShareDialog })));
const MessageConfirmationDialog = lazy(() => import('./MessageConfirmationDialog').then(m => ({ default: m.MessageConfirmationDialog })));
const ReportDialog = lazy(() => import('./ReportDialog').then(m => ({ default: m.ReportDialog })));



interface ClientSwipeContainerProps {
  onClientTap: (clientId: string) => void;
  onInsights?: (clientId: string) => void;
  onMessageClick?: (clientId: string) => void;
  profiles?: any[]; // Accept profiles from parent
  isLoading?: boolean;
  error?: any;
  insightsOpen?: boolean; // Whether insights modal is open - hides action buttons
  category?: string; // Category for owner deck persistence (property, moto, etc.)
  filters?: any; // Filters from parent (quick filters + advanced filters)
}

const ClientSwipeContainerComponent = ({
  onClientTap,
  onInsights: _onInsights,
  onMessageClick: _onMessageClick,
  profiles: externalProfiles,
  isLoading: externalIsLoading,
  error: externalError,
  insightsOpen: _insightsOpen = false,
  category = 'default',
  filters,
}: ClientSwipeContainerProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isLight } = useAppTheme();
  // PERF: Get userId from auth to pass to query (avoids getUser() inside queryFn)
  const { user } = useAuth();

  // Dynamic labels based on category
  const getCategoryLabel = () => {
    switch (category) {
      case 'property': return { singular: 'Property', plural: 'Properties', searchText: 'Searching for Properties', Icon: MapPin, color: 'text-primary' };
      case 'bicycle': return { singular: 'Bicycle', plural: 'Bicycles', searchText: 'Searching for Bicycles', Icon: Bike, color: 'text-rose-500' };
      case 'motorcycle': return { singular: 'Motorcycle', plural: 'Motorcycles', searchText: 'Searching for Motorcycles', Icon: MotorcycleIcon, color: 'text-orange-500' };
      case 'services':
      case 'worker':
      case 'hire': return { singular: 'Service', plural: 'Services', searchText: 'Searching for Service Clients', Icon: Wrench, color: 'text-purple-500' };
      case 'buyers': return { singular: 'Buyer', plural: 'Buyers', searchText: 'Searching for Buyers', Icon: Users, color: 'text-pink-500' };
      case 'renters': return { singular: 'Renter', plural: 'Renters', searchText: 'Searching for Renters', Icon: Users, color: 'text-orange-500' };
      case 'all-clients': return { singular: 'Client', plural: 'All Clients', searchText: 'Searching for Clients', Icon: Users, color: 'text-cyan-500' };
      default: return { singular: 'Client', plural: 'Clients', searchText: 'Searching for Clients', Icon: Users, color: 'text-pink-500' };
    }
  };

  const labels = getCategoryLabel();
  const storeActiveCategory = useFilterStore((s) => s.activeCategory);
  const setActiveCategory = useFilterStore((s) => s.setActiveCategory);


  // DEBUG: Monitor if activeCategory changes unexpectedly
  useEffect(() => {
    if (storeActiveCategory && storeActiveCategory !== category) {
      console.warn('[ClientSwipeContainer] Store activeCategory differs from component category:', { storeActiveCategory, componentCategory: category });
    }
  }, [storeActiveCategory, category]);



  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [_swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const swipeDirectionRef = useRef<'left' | 'right'>('right');
  const skipDirectionRef = useRef<'up' | 'down' | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingRecipient, setConnectingRecipient] = useState("");
  const cardRef = useRef<SimpleOwnerSwipeCardRef>(null);

  // Prevent accidental back button clicks within 1.5 seconds of mount
  const [_canClickBack, setCanClickBack] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setCanClickBack(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // PERF: Use selective subscriptions to prevent re-renders on unrelated store changes
  // Only subscribe to actions (stable references) - NOT to ownerDecks object
  // This is the key fix for "double render" feeling when navigating back to dashboard
  const { setOwnerDeck, markOwnerSwiped, resetOwnerDeck, isOwnerHydrated, isOwnerReady, markOwnerReady } = useSwipeDeckStore(
    useShallow((state) => ({
      setOwnerDeck: state.setOwnerDeck,
      markOwnerSwiped: state.markOwnerSwiped,
      resetOwnerDeck: state.resetOwnerDeck,
      isOwnerHydrated: state.isOwnerHydrated,
      isOwnerReady: state.isOwnerReady,
      markOwnerReady: state.markOwnerReady,
    }))
  );

  // Local state for immediate UI updates - drives the swipe animation
  const [currentIndex, setCurrentIndex] = useState(0);

  // FIX: Track deck length in state to force re-render when profiles are appended
  // Without this, the "No Clients Found" empty state persists because
  // appending to deckQueueRef alone doesn't trigger a React re-render
  const [_deckLength, setDeckLength] = useState(0);
  // True from the moment the category/filter changes until the new query
  // settles — keeps the clean loader up so the exhausted card never flashes.
  const [isCategoryTransitioning, setIsCategoryTransitioning] = useState(false);

  // PERF: Get initial state ONCE using getState() - no subscription
  // This is synchronous and doesn't cause re-renders when store updates
  const radiusKm = useFilterStore(s => s.radiusKm);
  const setRadiusKm = useFilterStore(s => s.setRadiusKm);
  const userLatitude = useFilterStore(s => s.userLatitude);
  const userLongitude = useFilterStore(s => s.userLongitude);
  const setUserLocation = useFilterStore(s => s.setUserLocation);
  
  const [locationDetecting, setLocationDetecting] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const [deckReady, setDeckReady] = useState(false);





  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocationDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation(pos.coords.latitude, pos.coords.longitude);
        setRadiusKm(5); // Auto-set to 5km when location is detected
        setLocationDetected(true);
        setLocationDetecting(false);
      },
      () => {
        setLocationDetecting(false);
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  }, [setUserLocation, setRadiusKm]);

  // 📍 Location is requested ONLY on explicit user action (filter button or
  // kilometer slider interaction). No auto-prompt on mount/sign-in to avoid
  // an invasive permission dialog.

  // CRITICAL: Filter out own profile from cached deck items
  const _filterOwnProfile = useCallback((items: any[], userId: string | undefined) => {
    if (!userId) return items;
    return items.filter(p => {
      const profileId = p.user_id || p.id;
      if (profileId === userId) {
        logger.warn('[ClientSwipeContainer] Filtering own profile from cached deck:', profileId);
        return false;
      }
      return true;
    });
  }, []);

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
  const currentDeckState = useSwipeDeckStore.getState().ownerDecks[category];
  const currentIndexRef = useRef(currentDeckState?.currentIndex || 0);
  const swipedIdsRef = useRef<Set<string>>(new Set(currentDeckState?.swipedIds || []));
  const _initializedRef = useRef(deckQueueRef.current.length > 0);
  // Tracks the signature of the profile list we last sync-seeded into the
  // deck so React Query's stale data can't reseed across filter changes.
  const prevProfileIdsRef = useRef<string>('');

  // Sync state with ref on mount
  useEffect(() => {
    setCurrentIndex(currentIndexRef.current);
  }, []);

  // FLICKER FIX: Track whether we've given the query a chance to start fetching.
  const isMountSettledRef = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => { isMountSettledRef.current = true; }, 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (deckReady) return;
    if (deckQueueRef.current.length === 0) return;

    const topProfile = deckQueueRef.current[0];
    const primaryImage = topProfile?.profile_images?.[0] || topProfile?.avatar_url;

    if (!primaryImage) {
      setDeckReady(true);
      return;
    }

    preloadClientImageToCache(primaryImage);

    const check = setInterval(() => {
      if (isClientImageDecodedInCache(primaryImage)) {
        setDeckReady(true);
        clearInterval(check);
      }
    }, 50);

    const timeout = setTimeout(() => {
      setDeckReady(true);
      clearInterval(check);
    }, 3000);

    return () => { clearInterval(check); clearTimeout(timeout); };
  }, [deckReady, currentIndex]);

  // PERF FIX: Create stable filter signature for deck versioning
  // This detects when filters actually changed vs just navigation return
  // More precise than array comparison - handles all filter types
  const filterSignature = useMemo(() => {
    if (!filters) return 'default';
    return [
      filters.category || '',
      Array.isArray(filters.categories) ? filters.categories.join(',') : '',
      filters.listingType || '',
      filters.clientGender || '',
      filters.clientType || '',
    ].join('|');
  }, [filters]);

  // Track previous filter signature to detect filter changes
  const prevFilterSignatureRef = useRef<string>(filterSignature);
  const filterChangedRef = useRef(false);

  // Detect filter changes synchronously during render (not in useEffect)
  if (filterSignature !== prevFilterSignatureRef.current) {
    filterChangedRef.current = true;
    prevFilterSignatureRef.current = filterSignature;
    // Clear deck synchronously during render so the previous category's
    // top card photo doesn't flash before the new query resolves.
    deckQueueRef.current = [];
    currentIndexRef.current = 0;
    swipedIdsRef.current.clear();
    prevProfileIdsRef.current = '';
  }

  // PERF FIX: Reset deck ONLY when filters actually change (not on navigation return)
  useEffect(() => {
    // Skip on initial mount
    if (!filterChangedRef.current) return;

    // Reset the filter changed flag
    filterChangedRef.current = false;
    setIsCategoryTransitioning(true);

    logger.info('[ClientSwipeContainer] Filters changed, resetting deck');

    // Reset local state and refs
    currentIndexRef.current = 0;
    setCurrentIndex(0);
    setDeckLength(0);
    deckQueueRef.current = [];
    swipedIdsRef.current.clear();
    setPage(0);

    // Reset store
    resetOwnerDeck(category);
  }, [filterSignature, category, resetOwnerDeck]);

  // PERF FIX: Track if we're returning to dashboard (has hydrated data AND is ready)
  // When true, skip initial animations to prevent "double render" feeling
  // Use isReady flag from store to determine if deck is fully initialized
  const isReturningRef = useRef(
    deckQueueRef.current.length > 0 && useSwipeDeckStore.getState().ownerDecks[category]?.isReady
  );
  const _hasAnimatedOnceRef = useRef(isReturningRef.current);

  // PERF FIX: Eagerly preload top 5 cards' images when we have hydrated deck data
  // This runs SYNCHRONOUSLY during component initialization (before first paint)
  // The images will be in cache when OwnerClientCard renders, preventing any flash
  // ALWAYS keep 2-3 cards preloaded to prevent swipe delays
  const eagerPreloadInitiatedRef = useRef(false);
  if (!eagerPreloadInitiatedRef.current && deckQueueRef.current.length > 0) {
    eagerPreloadInitiatedRef.current = true;
    const currentIdx = currentIndexRef.current;

    // Preload ALL images of current + next 4 profiles for smooth swiping
    const imagesToPreload: string[] = [];
    [0, 1, 2, 3, 4].forEach((offset) => {
      const profile = deckQueueRef.current[currentIdx + offset];
      if (profile?.profile_images && Array.isArray(profile.profile_images)) {
        profile.profile_images.forEach((imgUrl: string) => {
          if (imgUrl) {
            imagesToPreload.push(imgUrl);
            preloadClientImageToCache(imgUrl);
            // Mark in simple boolean cache so CardImage.tsx detects cached images instantly
            imageCache.set(imgUrl, true);
          }
        });
      } else if (profile?.avatar_url) {
        imagesToPreload.push(profile.avatar_url);
        preloadClientImageToCache(profile.avatar_url);
        imageCache.set(profile.avatar_url, true);
      }
    });

    // Also batch preload with ImagePreloadController for GPU-decode support
    if (imagesToPreload.length > 0) {
      imagePreloadController.preloadBatch(imagesToPreload);
    }
  }

  // Use external profiles if provided, otherwise fetch internally (fallback for standalone use)
  const [isRefreshMode, _setIsRefreshMode] = useState(false);
  const [page, setPage] = useState(0);
  const isFetchingMore = useRef(false);
  const prefetchSchedulerRef = useRef(new PrefetchScheduler());

  // ─── PREDICTIVE CARD TRANSITIONS ─────────────────────────────────────────
  const topCardX = useMotionValue(0);
  const topCardY = useMotionValue(0);

  // The under-card stays fully sized and opaque as a static backdrop — no
  // reactive transforms or willChange churn, so it never pops or flashes when
  // the top card exits and becomes the new top.
  // ─────────────────────────────────────────────────────────────────────────

  // FIX: Hydration sync disabled — DB query is the single source of truth
  // The query with refetchOnMount:'always' ensures fresh data on every mount
  // No need to restore stale cached decks that may contain already-swiped items
  useEffect(() => {
    // Clear any stale session storage on mount
    try { sessionStorage.removeItem('swipe-deck-items'); } catch (_err) { /* Ignore session storage errors */ }
  }, [category]);

  // ========================================
  // 🔥 CRITICAL: ALL HOOKS MUST BE AT TOP
  // ========================================
  // React requires hooks to be called in the SAME ORDER on EVERY render.
  // NO early returns before all hooks execute!

  // PERF: pass userId to avoid getUser() inside queryFn
  // Extract category from filters if available (for filtering client profiles by their interests)
  const filterCategory = filters?.categories?.[0] || filters?.category || undefined;
  const {
    data: internalProfiles = [],
    isLoading: internalIsLoading,
    isFetching: internalIsFetching,
    refetch: _refetch,
    isRefetching: _isRefetching,
    error: internalError
  } = useSmartClientMatching(
    user?.id, 
    filterCategory, 
    page, 
    50, 
    isRefreshMode, 
    filters,
    false,
    !!externalProfiles // Pass a flag to disable if external profiles exist
  );

  const clientProfiles = externalProfiles || internalProfiles;
  const isLoading = externalIsLoading !== undefined ? externalIsLoading : internalIsLoading;
  const isFetching = externalProfiles !== undefined ? false : internalIsFetching;
  const error = externalError !== undefined ? externalError : internalError;

  // SYNC SEED: when the deck is empty and fresh profile data arrives, populate
  // the deck during render — same pattern as SwipessSwipeContainer (lines
  // 473-492). Without this, after a quick-filter wipe there's an extra frame
  // where deckQueueRef is empty but data has already arrived, causing
  // AnimatePresence to flip exhausted → deck across two frames. That gap is
  // the flicker: the new card mounts cold instead of appearing in the same
  // frame as the data.
  const profileIdsSignature = clientProfiles.length > 0
    ? `${clientProfiles[0]?.user_id || ''}_${clientProfiles[clientProfiles.length - 1]?.user_id || ''}_${clientProfiles.length}`
    : '';
  if (
    profileIdsSignature !== prevProfileIdsRef.current &&
    profileIdsSignature.length > 0 &&
    deckQueueRef.current.length === 0 &&
    clientProfiles.length > 0
  ) {
    prevProfileIdsRef.current = profileIdsSignature;
    const fresh = clientProfiles.filter(p => {
      if (user?.id && p.user_id === user.id) return false;
      return !swipedIdsRef.current.has(p.user_id);
    });
    if (fresh.length > 0) {
      deckQueueRef.current = fresh;
    }
  }

  // Release the transition guard once the new query has settled (or errored).
  useEffect(() => {
    if (isCategoryTransitioning && !isLoading && !isFetching) {
      setIsCategoryTransitioning(false);
    }
  }, [isCategoryTransitioning, isLoading, isFetching]);

  useEffect(() => {
    logger.info('[ClientSwipeContainer] State Update:', {
      externalProfilesCount: externalProfiles?.length,
      internalProfilesCount: internalProfiles?.length,
      isLoading,
      hasError: !!error,
      category
    });
  }, [externalProfiles, internalProfiles, isLoading, error, category]);

  const swipeMutation = useSwipeWithMatch();
  const { canAccess: _hasPremiumMessaging, needsUpgrade: _needsUpgrade } = useCanAccessMessaging();
  const { recordSwipe, undoLastSwipe, canUndo, isUndoing: _isUndoing, undoSuccess, resetUndoState } = useSwipeUndo();
  const startConversation = useStartConversation();
  const { data: conversations = [] } = useConversations();
  const recordProfileView = useRecordProfileView();
  const { playSwipeSound } = useSwipeSounds();

  // Swipe dismissal tracking for client profiles
  const { dismissedIds, dismissTarget, filterDismissed: _filterDismissed } = useSwipeDismissal('client');

  // Prefetch manager for client profile details
  const { prefetchClientProfileDetails } = usePrefetchManager();

  // FIX: Sync local state when undo completes successfully
  useEffect(() => {
    if (undoSuccess) {
      // Get the updated state from the store
      const storeState = useSwipeDeckStore.getState();
      const ownerDeck = storeState.ownerDecks[category];
      const newIndex = ownerDeck?.currentIndex ?? 0;

      // Sync local refs and state with store
      currentIndexRef.current = newIndex;
      setCurrentIndex(newIndex);

      // Sync the entire swipedIds set with store (source of truth)
      swipedIdsRef.current = new Set(ownerDeck?.swipedIds || []);

      // Reset undo state so this effect doesn't run again
      resetUndoState();

      logger.info('[ClientSwipeContainer] Synced local state after undo, new index:', newIndex);
    }
  }, [undoSuccess, resetUndoState, category]);

  // Prefetch images for next cards
  // PERF: Use currentIndex state as trigger (re-runs when index changes)
  usePrefetchImages({
    currentIndex: currentIndex,
    profiles: deckQueueRef.current,
    prefetchCount: 3,
    trigger: currentIndex
  });

  // Prefetch next batch of client profiles when approaching end of current batch
  // Uses requestIdleCallback internally for non-blocking prefetch
  useSwipePrefetch(
    user?.id,
    currentIndexRef.current,
    page,
    deckQueueRef.current.length
  );

  // PERF: Initialize swipeQueue with user ID for fire-and-forget background writes
  // This eliminates the async auth call on every swipe
  useEffect(() => {
    if (user?.id) {
      swipeQueue.setUserId(user.id);
    }
  }, [user?.id]);

  // Cleanup prefetch scheduler on unmount
  useEffect(() => {
    const scheduler = prefetchSchedulerRef.current;
    return () => {
      scheduler.cancel();
    };
  }, []);

  // Prefetch next client profile details when card becomes "next up"
  // PERF: Use throttled scheduler - waits 300ms then uses requestIdleCallback
  // This ensures prefetch doesn't compete with current image decoding
  useEffect(() => {
    const nextProfile = deckQueueRef.current[currentIndex + 1];
    if (nextProfile?.user_id) {
      prefetchSchedulerRef.current.schedule(() => {
        prefetchClientProfileDetails(nextProfile.user_id);
      }, 300);
    }

    const scheduler = prefetchSchedulerRef.current;
    return () => {
      scheduler.cancel();
    };
  }, [currentIndex, prefetchClientProfileDetails]);

  // CONSTANT-TIME: Append new unique profiles to queue AND persist to store
  useEffect(() => {
    if (clientProfiles.length > 0 && !isLoading) {
      const existingIds = new Set(deckQueueRef.current.map(p => p.user_id));
      const dismissedSet = new Set(dismissedIds);

      // CRITICAL: Filter out current user's own profile AND dismissed/swiped profiles
      const newProfiles = clientProfiles.filter(p => {
        // NEVER show user their own profile (defense in depth)
        if (user?.id && p.user_id === user.id) {
          logger.warn('[ClientSwipeContainer] Filtering out own profile from deck:', p.user_id);
          return false;
        }
        return !existingIds.has(p.user_id) && !swipedIdsRef.current.has(p.user_id) && !dismissedSet.has(p.user_id);
      });

      if (newProfiles.length > 0) {
        deckQueueRef.current = [...deckQueueRef.current, ...newProfiles];
        // Cap at 50 profiles
        if (deckQueueRef.current.length > 50) {
          const offset = deckQueueRef.current.length - 50;
          deckQueueRef.current = deckQueueRef.current.slice(offset);
          const newIndex = Math.max(0, currentIndexRef.current - offset);
          currentIndexRef.current = newIndex;
          setCurrentIndex(newIndex);
        }

        // FIX: Force re-render when deck goes from empty to populated
        // Without this, the "No Clients Found" empty state persists because
        // appending to deckQueueRef alone doesn't trigger a React re-render
        setDeckLength(deckQueueRef.current.length);

        // PERSIST: Save to store and session for navigation survival
        setOwnerDeck(category, deckQueueRef.current, true);
        persistDeckToSession('owner', category, deckQueueRef.current);

        // PERF: Mark deck as ready for instant return on re-navigation
        // This ensures that when user returns to dashboard, we skip all initialization
        if (!isOwnerReady(category)) {
          markOwnerReady(category);
        }
      }
      isFetchingMore.current = false;
    }
  }, [clientProfiles, isLoading, setOwnerDeck, category, isOwnerReady, markOwnerReady, dismissedIds, user?.id]);

  const topCardIdentity = deckQueueRef.current[currentIndex]?.user_id || deckQueueRef.current[currentIndex]?.id || '';

  useEffect(() => {
    topCardX.stop();
    topCardX.set(0);
    topCardY.stop();
    topCardY.set(0);
    setSwipeDirection(null);
  }, [topCardIdentity, filterSignature, category, topCardX, topCardY]);

  // INSTANT SWIPE: Update UI immediately, fire DB operations in background
  const executeSwipe = useCallback((direction: 'left' | 'right') => {
    const profile = deckQueueRef.current[currentIndexRef.current];
    // FIX: Add explicit null/undefined check to prevent errors
    if (!profile || !profile.user_id) {
      logger.warn('[ClientSwipeContainer] Cannot swipe - no valid profile at current index');
      return;
    }

    

    // CRITICAL: Prevent swiping on own profile (should never happen, but defense in depth)
    if (user?.id && profile.user_id === user.id) {
      logger.error('[ClientSwipeContainer] BLOCKED: Attempted to swipe on own profile!', { userId: user.id });
      appToast.error('Oops!', 'You cannot swipe on your own profile');
      return;
    }

    const newIndex = currentIndexRef.current + 1;

    topCardX.stop();
    topCardX.set(0);
    topCardY.stop();
    topCardY.set(0);

    // 1. UPDATE UI STATE FIRST (INSTANT)
    swipeDirectionRef.current = direction;
    skipDirectionRef.current = null;
    setSwipeDirection(direction);
    currentIndexRef.current = newIndex;
    setCurrentIndex(newIndex); // This triggers re-render with new card
    swipedIdsRef.current.add(profile.user_id);

    // 2. BACKGROUND TASKS (Fire-and-forget, don't block UI)
    // These happen AFTER UI has already updated
    Promise.all([
      // Persist to store
      Promise.resolve(markOwnerSwiped(category, profile.user_id)),

      // Record profile view
      recordProfileView.mutateAsync({
        profileId: profile.user_id,
        viewType: 'profile',
        action: direction === 'left' ? 'pass' : 'like'
      }).catch((err) => {
        logger.error('[ClientSwipeContainer] Failed to record profile view:', err);
      }),

      // Save swipe to DB with match detection - CRITICAL: Must succeed for likes to save
      swipeMutation.mutateAsync({
          targetId: profile.user_id,
          direction,
          targetType: 'profile'
        }).then(() => {
          // SUCCESS: Like saved successfully
          logger.info('[ClientSwipeContainer] Swipe saved successfully:', { direction, profileId: profile.user_id });

          // OPTIMISTIC: Add liked client to cache AFTER DB write succeeds (same pattern as TinderentSwipeContainer)
          if (direction === 'right' && user?.id) {
            queryClient.setQueryData(['liked-clients', user.id], (oldData: any[] | undefined) => {
              const likedClient = {
                id: profile.user_id,
                user_id: profile.user_id,
                full_name: profile.full_name || profile.name || 'Unknown',
                name: profile.full_name || profile.name || 'Unknown',
                age: profile.age || 0,
                bio: profile.bio || '',
                profile_images: profile.profile_images || profile.images || [],
                images: profile.profile_images || profile.images || [],
                location: profile.location,
                liked_at: new Date().toISOString(),
                occupation: profile.occupation,
                nationality: profile.nationality,
                interests: profile.interests,
                monthly_income: profile.monthly_income,
                verified: profile.verified,
                property_types: profile.preferred_property_types || [],
                moto_types: [],
                bicycle_types: [],
              };
              if (!oldData) {
                return [likedClient];
              }
              // Check if already in the list to avoid duplicates
              const exists = oldData.some((item: any) => item.id === likedClient.id || item.user_id === likedClient.user_id);
              if (exists) {
                return oldData;
              }
              return [likedClient, ...oldData];
            });
          }
        }).catch((err: any) => {
          // ERROR: Save failed - log and handle appropriately
          logger.error('[ClientSwipeContainer] Swipe save error:', err);

          // Check for specific error types
          const errorMessage = err?.message?.toLowerCase() || '';
          const errorCode = err?.code || '';

          // Expected errors that we can safely ignore (already handled by the hook)
          const isExpectedError =
            errorMessage.includes('cannot like your own') ||
            errorMessage.includes('your own profile') ||
            errorMessage.includes('duplicate') ||
            errorMessage.includes('already exists') ||
            errorMessage.includes('violates unique constraint') ||
            errorMessage.includes('profile not found') || // Stale cache data
            errorMessage.includes('skipped') || // FK violation from stale data
            errorCode === '23505' || // Unique constraint violation
            errorCode === '42501' || // RLS policy violation
            errorCode === '23503';   // FK violation

          // Show friendly message for self-likes (shouldn't happen but defense in depth)
          if (errorMessage.includes('cannot like your own') || errorMessage.includes('your own profile')) {
            logger.warn('[ClientSwipeContainer] User attempted to like their own profile - this should have been filtered');
            appToast.error('Oops!', 'You cannot swipe on your own profile');
          }
          // Show specific error messages for profile issues (not available, inactive, etc.)
          else if (
            errorMessage.includes('no longer available') ||
            errorMessage.includes('no longer active') ||
            errorMessage.includes('unable to save like')
          ) {
            appToast.error('Unable to save like', err?.message || 'This profile is no longer available');
          }
          // Show error for unexpected failures (network, auth, server errors)
          // These need user attention as the like was NOT saved
          else if (!isExpectedError) {
            appToast.error('Failed to save your like', 'Your swipe was not saved. Please try again or check your connection.');
          }
          // For expected errors (duplicates, stale data), silently ignore
          // The user experience is not affected as these are edge cases
        }),

      // Track dismissal on left swipe (dislike)
      direction === 'left' ? dismissTarget(profile.user_id).catch(() => { /* silently ignore dismissal errors */ }) : Promise.resolve(),

      // Record for undo - pass category so deck can be properly restored
      Promise.resolve(recordSwipe(profile.user_id, 'profile', direction, category))
    ]).catch(err => {
      logger.error('[ClientSwipeContainer] Background swipe tasks failed:', err);
    });

    // Clear direction for next swipe
    setTimeout(() => setSwipeDirection(null), 300);

    // FIX: Prevent pagination trigger after final card
    if (
      newIndex < deckQueueRef.current.length &&
      newIndex >= deckQueueRef.current.length - 3 &&
      deckQueueRef.current.length > 0 &&
      !isFetchingMore.current &&
      !error
    ) {
      isFetchingMore.current = true;
      setPage(p => p + 1);
    }
  }, [swipeMutation, recordSwipe, recordProfileView, markOwnerSwiped, category, dismissTarget, topCardX, error]);

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    const profile = deckQueueRef.current[currentIndexRef.current];
    // FIX: Add explicit null/undefined check to prevent errors
    if (!profile || !profile.user_id) {
      logger.warn('[ClientSwipeContainer] Cannot swipe - no valid profile at current index');
      return;
    }

    // Immediate haptic feedback
    triggerHaptic(direction === 'right' ? 'success' : 'light');

    // Play swipe sound effect
    playSwipeSound(direction);

    // INSTANT SWIPE: Always execute immediately - never block on image prefetch
    // The next card will show with skeleton placeholder until image loads
    executeSwipe(direction);

    [1, 2, 3].forEach((offset) => {
      const futureProfile = deckQueueRef.current[currentIndexRef.current + offset];
      if (futureProfile?.profile_images && Array.isArray(futureProfile.profile_images)) {
        futureProfile.profile_images.forEach((imgUrl: string) => {
          if (imgUrl) preloadClientImageToCache(imgUrl);
        });
      } else if (futureProfile?.avatar_url) {
        preloadClientImageToCache(futureProfile.avatar_url);
      }
    });

    prefetchSchedulerRef.current.schedule(() => {
      [4, 5].forEach((offset) => {
        const futureProfile = deckQueueRef.current[currentIndexRef.current + offset];
        if (futureProfile?.profile_images && Array.isArray(futureProfile.profile_images)) {
          futureProfile.profile_images.forEach((imgUrl: string) => {
            if (imgUrl) preloadClientImageToCache(imgUrl);
          });
        } else if (futureProfile?.avatar_url) {
          preloadClientImageToCache(futureProfile.avatar_url);
        }
      });
    }, 200);
  }, [executeSwipe, playSwipeSound]);

  // Vertical swipe = skip to next profile without writing to backend.
  const handleSkip = useCallback(() => {
    const profile = deckQueueRef.current[currentIndexRef.current];
    if (!profile?.user_id) return;
    triggerHaptic('light');
    skipDirectionRef.current = 'up';
    const newIndex = currentIndexRef.current + 1;
    topCardX.stop();
    topCardX.set(0);
    topCardY.stop();
    topCardY.set(0);
    currentIndexRef.current = newIndex;
    setCurrentIndex(newIndex);
    [1, 2, 3].forEach((offset) => {
      const future = deckQueueRef.current[newIndex + offset];
      if (future?.profile_images?.[0]) preloadClientImageToCache(future.profile_images[0]);
    });
  }, [topCardX, topCardY]);

  // Vertical-up swipe = rewind to the previously viewed profile without writing.
  const handleSkipBack = useCallback(() => {
    if (currentIndexRef.current <= 0) return;
    triggerHaptic('light');
    skipDirectionRef.current = 'down';
    topCardX.stop();
    topCardX.set(0);
    topCardY.stop();
    topCardY.set(0);
    const newIndex = Math.max(0, currentIndexRef.current - 1);
    currentIndexRef.current = newIndex;
    setCurrentIndex(newIndex);
  }, [topCardX, topCardY]);

  const handleButtonLike = useCallback(() => {
    if (cardRef.current) {
      cardRef.current.triggerSwipe('right');
    } else {
      handleSwipe('right');
    }
  }, [handleSwipe]);

  const handleButtonDislike = useCallback(() => {
    if (cardRef.current) {
      cardRef.current.triggerSwipe('left');
    } else {
      handleSwipe('left');
    }
  }, [handleSwipe]);



  const handleDragStart = useCallback(() => {
    const n2 = deckQueueRef.current[currentIndexRef.current + 2];
    if (n2?.profile_images && Array.isArray(n2.profile_images)) {
      n2.profile_images.forEach((imgUrl: string) => {
        if (imgUrl) imagePreloadController.preload(imgUrl, 'high');
      });
    } else if (n2?.avatar_url) {
      imagePreloadController.preload(n2.avatar_url, 'high');
    }
  }, []);

  const handleInsights = useCallback((clientId: string) => {
    navigate(`/owner/view-client/${clientId}`);
  }, [navigate]);

  const handleShare = useCallback(() => {
    setShareDialogOpen(true);
    triggerHaptic('light');
  }, []);

  const handleSoon = useCallback(() => {
    appToast.success('Saved for later');
    triggerHaptic('light');
  }, []);

  const handleConnect = useCallback((clientId: string) => {
    logger.info('[ClientSwipeContainer] Message icon clicked');
    setSelectedClientId(clientId);
    const existing = conversations?.find(c => c.other_user?.id === clientId);
    if (existing) {
      navigate(`/messages?conversationId=${existing.id}`);
    } else {
      navigate(`/messages?startConversation=${clientId}`);
    }
    triggerHaptic('light');
  }, [navigate, conversations]);

  const handleSendMessage = useCallback(async (message: string) => {
    if (isCreatingConversation || !selectedClientId) return;

    // Content moderation check
    const { validateContent: vc } = await import('@/utils/contactInfoValidation');
    const result = vc(message);
    if (!result.isClean) {
      appToast.error('Content blocked', result.message || undefined);
      return;
    }

    setIsCreatingConversation(true);

    try {
      appToast.info('Creating conversation...', 'Please wait');

      const result = await startConversation.mutateAsync({
        otherUserId: selectedClientId,
        initialMessage: message,
        canStartNewConversation: true,
      });

      if (result?.conversationId) {
        const recipientName = selectedClientId ? deckQueueRef.current.find(p => p.user_id === selectedClientId)?.name || 'Professional' : 'Professional';
        setConnectingRecipient(recipientName);
        setIsConnecting(true);
        setMessageDialogOpen(false);
        
        // Premium cinematic delay
        await new Promise(resolve => setTimeout(resolve, 2200));
        
        navigate(`/messages?conversationId=${result.conversationId}`);
      }
    } catch (error) {
      appToast.error('Could not start conversation', error instanceof Error ? error.message : 'Try again');
    } finally {
      setIsCreatingConversation(false);
      setIsConnecting(false);
    }
  }, [isCreatingConversation, selectedClientId, startConversation, navigate]);

  // ========================================
  // 🔥 ALL HOOKS ABOVE - DERIVED STATE BELOW
  // ========================================
  // Derived UI flags (NO hooks here - just calculations)

  // Get current visible cards for 2-card stack (top + next)
  // Use currentIndex from state (already synced with currentIndexRef)
  const deckQueue = deckQueueRef.current;
  // FIX: Don't clamp the index - allow topCard to be null when all cards are swiped
  // This ensures the "All Caught Up" screen shows correctly
  const topCard = currentIndex < deckQueue.length ? deckQueue[currentIndex] : null;
  const pullDown = usePullDownToDismiss();
  const _nextCard = currentIndex + 1 < deckQueue.length ? deckQueue[currentIndex + 1] : null;

  // Check if we have hydrated data (from store/session) - prevents blank deck flash
  // isReady means we've fully initialized at least once - skip loading UI on return
  const hasHydratedData = isOwnerHydrated(category) || isOwnerReady(category) || deckQueue.length > 0;

  // Loading skeleton - only show if we have NO data and we are either actually loading OR just mounted
  const showLoadingSkeleton = !hasHydratedData && (isLoading || !isMountSettledRef.current);

  // "All Caught Up" — user has swiped through every card in the current deck
  // Only true once past initial load and topCard is exhausted
  const _isDeckFinished = !showLoadingSkeleton && topCard === null && (hasHydratedData || !isLoading || isMountSettledRef.current);

  // showInitialError: Only show if we have NO cards and a hard error occurred during initial load
  const _showInitialError = !hasHydratedData && error && deckQueue.length === 0;

  // showEmptyState: Only show if loading is DONE and we still have no cards
  const _showEmptyState = !isLoading && deckQueue.length === 0 && !error && isMountSettledRef.current;

  // ========================================
  // 🔥 SINGLE RETURN BLOCK - SAFE ORDER
  // ========================================
  // All conditions use derived flags - NO hooks called after this point

  if (showLoadingSkeleton || !deckReady) {
    return (
      <div className="relative w-full h-full flex-1 flex items-center justify-center bg-black">
        <div className="animate-pulse">
          <SwipessLogo size="lg" variant="transparent" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn(
        "relative w-full h-full flex flex-col transition-colors duration-500 min-h-0",
        isLight ? "bg-transparent" : "bg-black"
      )}>
        <div className={cn(
          "absolute inset-0 pointer-events-none -z-10 transition-colors duration-500",
          isLight ? "bg-transparent" : "bg-black"
        )} />

        {/* Static ambient background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10" />

        {/* Pull-down backdrop: dashboard category picker revealed behind the deck */}
        <motion.div
          aria-hidden
          className="absolute inset-0 pointer-events-none z-[1] bg-background"
          style={{
            opacity: pullDown.backdropOpacity,
            scale: pullDown.backdropScale,
            filter: pullDown.backdropBlur,
            transformOrigin: 'center center',
          }}
        >
          <div className="w-full h-full">
            <SwipeAllDashboard setCategories={() => {}} />
          </div>
        </motion.div>

        {/* Single back button is owned by SwipeDeckBackButton (rendered below) — no duplicate header here */}

        {/* 📡 Radar HUD removed from here — now managed at the Dashboard level for persistence */}

        <div
          className="flex-1 relative flex w-full h-full items-center justify-center px-0 z-10 pointer-events-auto min-h-0 overflow-hidden"
          {...pullDown.bind}
        >
        <SwipeDeckBackButton />
        <motion.div
          className="relative w-full h-full mx-auto flex items-center justify-center pointer-events-auto"
          style={{ y: pullDown.y, scale: pullDown.scale, opacity: pullDown.opacity, filter: pullDown.blur }}
        >
          <motion.div
            aria-hidden
            className="absolute inset-0 z-0 pointer-events-none bg-swipe-frame"
            style={{ opacity: pullDown.opacity }}
          />
          <AnimatePresence mode="sync" initial={false}>
            {topCard ? (
              <motion.div
                key="owner-deck"
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-0 mx-auto transform-gpu"
              >
                <AnimatePresence>
                {deckQueue.slice(currentIndex, currentIndex + 2).reverse().map((profile) => {
                  const isTopCard = profile.user_id === topCard.user_id;

                  return (
                    <motion.div
                      key={profile.user_id}
                      exit={{
                        // Card stays fully solid (opacity 1) and slides off the
                        // edge — no fade. The 1.2x over-travel guarantees it is
                        // completely off-screen, so it reads as a real card
                        // leaving, not a ghost dissolving.
                        x: swipeDirectionRef.current === 'right' ? (typeof window !== 'undefined' ? window.innerWidth : 600) * 1.2 : (typeof window !== 'undefined' ? -window.innerWidth : -600) * 1.2,
                        y: skipDirectionRef.current === 'up' ? -(typeof window !== 'undefined' ? window.innerHeight : 800) * 1.2 : skipDirectionRef.current === 'down' ? (typeof window !== 'undefined' ? window.innerHeight : 800) * 1.2 : 0,
                        transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] }
                      }}
                      className={cn("absolute inset-0 w-full h-full", isTopCard ? "z-20" : "z-10")}
                    >
                      <SimpleOwnerSwipeCard
                        ref={isTopCard ? cardRef : undefined}
                        profile={profile}
                        onSwipe={isTopCard ? handleSwipe : () => {}}
                        onSkip={isTopCard ? handleSkip : undefined}
                        onSkipBack={isTopCard ? handleSkipBack : undefined}
                        onTap={isTopCard ? () => onClientTap(profile.user_id) : undefined}
                        onInsights={isTopCard ? () => handleInsights(profile.user_id) : undefined}
                        onMessage={isTopCard ? () => handleConnect(profile.user_id) : undefined}
                        onShare={isTopCard ? handleShare : undefined}
                        onSoon={isTopCard ? handleSoon : undefined}
                        onReport={isTopCard ? () => { triggerHaptic('medium'); setReportDialogOpen(true); } : undefined}
                        onUndo={isTopCard ? undoLastSwipe : undefined}
                        onLike={isTopCard ? handleButtonLike : undefined}
                        onDislike={isTopCard ? handleButtonDislike : undefined}
                        onDragStart={isTopCard ? handleDragStart : undefined}
                        canUndo={canUndo}
                        isTop={isTopCard}
                        fullScreen={true}
                        externalX={isTopCard ? topCardX : undefined}
                        externalY={isTopCard ? topCardY : undefined}
                        canGoBack={currentIndex > 0}
                      />
                    </motion.div>
                  );
                })}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.div
                key="exhausted"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full z-50 overflow-hidden"
              >
                {(isLoading || isFetching || isCategoryTransitioning || !isMountSettledRef.current) ? (
                  <SwipessLoader />
                ) : (
                <SwipeExhaustedState
                  radiusKm={radiusKm}
                  onRadiusChange={((km: number) => {
                    setRadiusKm(km);
                    if (!userLatitude || !userLongitude) detectLocation();
                  }) as any}
                  onDetectLocation={detectLocation}
                  detecting={locationDetecting}
                  detected={locationDetected}
                  categoryName={labels.plural}
                  isLoading={isLoading}
                  activeCategory={storeActiveCategory || category}
                  onCategoryChange={(cat) => {
                    setActiveCategory(cat as any);
                  }}
                  onOpenFilters={() => {
                    navigate('/owner/filters');
                  }}
                  role="owner"
                />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        </div>


        {/* Bottom action bar removed — Share / Message / Insights /
            Report now live on the right-side rail inside the card. */}
      </div>


      {typeof document !== 'undefined' && document.body && createPortal(
        <Suspense fallback={null}>
          <MessageConfirmationDialog
            open={messageDialogOpen}
            onOpenChange={setMessageDialogOpen}
            onConfirm={handleSendMessage}
            recipientName={selectedClientId ? deckQueueRef.current.find(p => p.user_id === selectedClientId)?.name || 'this person' : 'this person'}
            isLoading={isCreatingConversation}
          />

          {topCard && (
            <ShareDialog
              open={shareDialogOpen}
              onOpenChange={setShareDialogOpen}
              profileId={topCard.user_id}
              title={topCard.name ? `Check out ${String(topCard.name)}'s profile` : 'Check out this profile'}
              description={`Budget: $${topCard.budget_max?.toLocaleString() || 'N/A'} - Looking for: ${Array.isArray(topCard.preferred_listing_types) ? topCard.preferred_listing_types.join(', ') : 'Various properties'}`}
            />
          )}

          {topCard && (
            <ReportDialog
              open={reportDialogOpen}
              onOpenChange={setReportDialogOpen}
              reportedUserId={topCard.user_id}
              reportedUserName={topCard.name || undefined}
              category="user_profile"
            />
          )}
        </Suspense>,
        document.body
      )}

      <ConnectingOverlay 
        isOpen={isConnecting}
        recipientName={connectingRecipient}
      />
    </>
  );
};

export const ClientSwipeContainer = memo(ClientSwipeContainerComponent);

// Also export default for backwards compatibility
export default ClientSwipeContainer;


