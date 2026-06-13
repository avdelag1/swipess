import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { lazyWithRetry } from '@/utils/lazyRetry';
import { cn } from '@/lib/utils';
// import { } from '@/state/modalStore';
import { triggerHaptic } from '@/utils/haptics';
import { getCardImageUrl } from '@/utils/imageOptimization';
import { SimpleSwipeCard, SimpleSwipeCardRef } from './SimpleSwipeCard';
import { SwipeExhaustedState } from './swipe/SwipeExhaustedState';
import { SwipessLoader } from './swipe/SwipessLoader';
import { normalizeCategoryName } from '@/types/filters';

import { SimpleOwnerSwipeCard } from './SimpleOwnerSwipeCard';

const MatchCelebrateModal = lazy(() => import('./swipe/MatchCelebrateModal').then(mod => ({ default: mod.MatchCelebrateModal })));
const ClientPreferencesDialog = lazyWithRetry(() => import('./ClientPreferencesDialog').then(m => ({ default: m.ClientPreferencesDialog })));
const OwnerClientFilterDialog = lazyWithRetry(() => import('./OwnerClientFilterDialog').then(m => ({ default: m.OwnerClientFilterDialog })));
import { preloadImageToCache } from '@/lib/swipe/imageCache';
import { imageCache } from '@/lib/swipe/cardImageCache';
import { PrefetchScheduler } from '@/lib/swipe/PrefetchScheduler';
import { ClientFilters, ListingFilters, useSmartClientMatching, useSmartListingMatching } from '@/hooks/useSmartMatching';
import { useAuth } from '@/hooks/useAuth';

import { useUserRole } from '@/hooks/useUserRole';
import { useActiveMode } from '@/hooks/useActiveMode';
import { swipeQueue } from '@/lib/swipe/SwipeQueue';
import { imagePreloadController } from '@/lib/swipe/ImagePreloadController';
import { useSwipeUndo } from '@/hooks/useSwipeUndo';
import { useSwipeWithMatch } from '@/hooks/useSwipeWithMatch';
import { useConversations, useStartConversation } from '@/hooks/useConversations';
import { useRecordProfileView } from '@/hooks/useProfileRecycling';
import { usePrefetchImages } from '@/hooks/usePrefetchImages';
import { usePrefetchManager, useSwipePrefetch } from '@/hooks/usePrefetchManager';
import { persistDeckToSession, useSwipeDeckStore } from '@/state/swipeDeckStore';
import { useFilterActions, useFilterStore } from '@/state/filterStore';
import { useShallow } from 'zustand/react/shallow';
import { useSwipeDismissal } from '@/hooks/useSwipeDismissal';
import { Bike, Briefcase, Home } from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { useSwipeSounds } from '@/hooks/useSwipeSounds';
import { appToast } from '@/utils/appNotification';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { logger } from '@/utils/prodLogger';
const MessageConfirmationDialog = lazyWithRetry(() => import('./MessageConfirmationDialog').then(m => ({ default: m.MessageConfirmationDialog })));
const DirectMessageDialog = lazyWithRetry(() => import('./DirectMessageDialog').then(m => ({ default: m.DirectMessageDialog })));
import { useQueryClient } from '@tanstack/react-query';
import { BentoCategoryDashboard } from './swipe/BentoCategoryDashboard';
import { SwipeDeckBackButton } from './swipe/SwipeDeckBackButton';
import { usePullDownToDismiss } from './swipe/usePullDownToDismiss';

const ReportDialog = lazyWithRetry(() => import('./ReportDialog').then(m => ({ default: m.ReportDialog })));
// Eager-load the card action modals. These were previously lazy-loaded, but a
// dynamic-import failure (stale service-worker cache / CDN chunk not yet
// propagated after a deploy) made the Share and Insights buttons silently
// open nothing — the tap registered but Suspense fell back to null. Bundling
// them in the main chunk guarantees they always open.
const SwipeInsightsModal = lazyWithRetry(() => import('./SwipeInsightsModal').then(m => ({ default: m.SwipeInsightsModal })));
const ShareDialog = lazyWithRetry(() => import('./ShareDialog').then(m => ({ default: m.ShareDialog })));
const _CATEGORY_ICON_MAP: Record<string, any> = {
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

const SwipessSwipeContainerComponent = ({ onListingTap: _onListingTap, onInsights: _onInsights, onMessageClick, locationFilter: _locationFilter, filters: _filters }: SwipessSwipeContainerProps) => {
  const navigate = useNavigate();
  const { activeMode, switchMode } = useActiveMode();
  const [page, setPage] = useState(0);
  const [, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [insightsModalOpen, setInsightsModalOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
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
  const { setCategories, setListingType } = useFilterActions();
  const listingType = useFilterStore((state) => state.listingType);
  const activeCategory = useFilterStore(s => s.activeCategory);
  const [locationDetecting, setLocationDetecting] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);

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

  // 📍 Location requested only on explicit user gesture (filter / slider).

  // PERF: Get userId from auth to pass to query (avoids getUser() inside queryFn)
  const { user } = useAuth();
  const { data: userRole } = useUserRole(user?.id);
  const queryClient = useQueryClient();

  const { setClientDeck, markClientSwiped, resetClientDeck, isClientReady, markClientReady } = useSwipeDeckStore(
    useShallow((state) => ({
      setClientDeck: state.setClientDeck,
      markClientSwiped: state.markClientSwiped,
      resetClientDeck: state.resetClientDeck,
      isClientReady: state.isClientReady,
      markClientReady: state.markClientReady,
    }))
  );

  const storeCategories = useFilterStore((state) => state.categories);
  const storeActiveCategory = storeCategories.length > 0 ? storeCategories[0] : null;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [_deckLength, setDeckLength] = useState(0);
  // True from the moment a quick-filter changes until the new query settles.
  // Keeps the clean loader on screen so the "No results" exhausted card can
  // never flash in the gap before react-query flips isFetching.
  const [isCategoryTransitioning, setIsCategoryTransitioning] = useState(false);

  interface PendingSwipe {
    listing: any;
    direction: 'left' | 'right';
    newIndex: number;
  }
  const pendingSwipeRef = useRef<PendingSwipe | null>(null);
  const isSwipeAnimatingRef = useRef(false);

  const getInitialDeck = () => {
    const store = useSwipeDeckStore.getState();
    const items = activeMode === 'owner' 
      ? store.getOwnerDeckItems(storeActiveCategory || 'all')
      : store.getClientDeckItems(storeActiveCategory || 'all');
    return items;
  };

  const deckQueueRef = useRef<any[]>(getInitialDeck());
  const currentIndexRef = useRef(
    activeMode === 'owner' 
      ? (useSwipeDeckStore.getState().ownerDecks[storeActiveCategory || 'all']?.currentIndex || 0)
      : (useSwipeDeckStore.getState().clientDecks[storeActiveCategory || 'all']?.currentIndex || 0)
  );
  const swipedIdsRef = useRef<Set<string>>(new Set(useSwipeDeckStore.getState().clientDecks[storeActiveCategory || 'all']?.swipedIds || []));

  const cardRef = useRef<SimpleSwipeCardRef>(null);

  useEffect(() => {
    setCurrentIndex(currentIndexRef.current);
  }, []);

  const isMountSettledRef = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => { isMountSettledRef.current = true; }, 100);
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

  const eagerPreloadInitiatedRef = useRef(false);
  if (!eagerPreloadInitiatedRef.current && deckQueueRef.current.length > 0) {
    eagerPreloadInitiatedRef.current = true;
    const currentIdx = currentIndexRef.current;

    const imagesToPreload: string[] = [];
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].forEach((offset) => {
      const card = deckQueueRef.current[currentIdx + offset];
      if (card?.images && Array.isArray(card.images)) {
        card.images.forEach((imgUrl: string) => {
          if (imgUrl) {
            imagesToPreload.push(imgUrl);
            preloadImageToCache(imgUrl);
            imageCache.set(getCardImageUrl(imgUrl), true);
          }
        });
      }
    });

    if (imagesToPreload.length > 0) {
      imagePreloadController.preloadBatch(imagesToPreload);
    }
  }

  const prefetchSchedulerRef = useRef(new PrefetchScheduler());
  const isFetchingMore = useRef(false);
  const { canNavigate, startNavigation, endNavigation } = useNavigationGuard();
  const swipeDirectionRef = useRef<'left' | 'right' | null>(null);

  // The under-card stays fully sized and opaque at all times — it acts as a
  // static backdrop so the top card reveals it cleanly on commit. No reactive
  // transforms, no willChange churn: the layer is stable across promotions.

  const hasSwipedRef = useRef(false);

  useEffect(() => {
    try { sessionStorage.removeItem('swipe-deck-client-listings'); } catch (_err) { logger.warn('session storage error', _err); }
  }, []);

  useEffect(() => {
    const scheduler = prefetchSchedulerRef.current;
    return () => {
      scheduler.cancel();
    };
  }, []);

  const { recordSwipe, undoLastSwipe, canUndo, isUndoing: _isUndoing, undoSuccess, resetUndoState } = useSwipeUndo();
  const swipeMutation = useSwipeWithMatch({
    onMatch: (clientProfile, ownerProfile) => setMatchData({ client: clientProfile, owner: ownerProfile })
  });
  const startConversation = useStartConversation();
  const { data: conversations = [] } = useConversations();

  const { dismissedIds, dismissTarget, filterDismissed: _filterDismissed } = useSwipeDismissal('listing');

  useEffect(() => {
    if (undoSuccess) {
      const storeState = useSwipeDeckStore.getState();
      const newIndex = storeState.clientDecks[storeActiveCategory || 'all']?.currentIndex || 0;
      currentIndexRef.current = newIndex;
      setCurrentIndex(newIndex);
      swipedIdsRef.current = new Set(storeState.clientDecks[storeActiveCategory || 'all']?.swipedIds || []);
      resetUndoState();
      logger.info('[SwipessSwipeContainer] Synced local state after undo, new index:', newIndex);
    }
  }, [undoSuccess, resetUndoState]);
  const recordProfileView = useRecordProfileView();
  const { playSwipeSound } = useSwipeSounds();

  useEffect(() => {
    if (user?.id) {
      swipeQueue.setUserId(user.id);
    }
  }, [user?.id]);

  const storeFilterVersion = useFilterStore((state) => state.filterVersion);
  const stableFilters = useMemo(() => {
    const state = useFilterStore.getState();
    return state.getListingFilters() as ListingFilters;
  }, [storeFilterVersion]);

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

  const prevFilterSignatureRef = useRef<string>(filterSignature);
  const filterChangedRef = useRef(false);

  const prevListingIdsRef = useRef<string>('');
  const hasNewListingsRef = useRef(false);

  useEffect(() => {
    if (activeMode !== 'client' || !user?.id) return;

    let previousUserId: string | null = null;
    try {
      previousUserId = sessionStorage.getItem('swipe-deck-client-user');
    } catch (_err) { logger.warn('session storage error', _err); }

    if (previousUserId && previousUserId !== user.id) {
      deckQueueRef.current = [];
      currentIndexRef.current = 0;
      swipedIdsRef.current.clear();
      prevListingIdsRef.current = '';
      hasNewListingsRef.current = false;
      setPage(0);
      setCurrentIndex(0);
      setDeckLength(0);
      resetClientDeck(storeActiveCategory || 'all');
      queryClient.removeQueries({ queryKey: ['smart-listings'] });
      try {
        sessionStorage.removeItem('swipe-deck-items');
        sessionStorage.removeItem('swipe-deck-client-listings');
      } catch (_err) { logger.warn('session storage error', _err); }
    }

    try { sessionStorage.setItem('swipe-deck-client-user', user.id); } catch (_err) { logger.warn('session storage error', _err); }
  }, [activeMode, user?.id, resetClientDeck, queryClient]);

  if (filterSignature !== prevFilterSignatureRef.current) {
    filterChangedRef.current = true;
    prevFilterSignatureRef.current = filterSignature;
    // Clear deck synchronously during render so the previous category's
    // top card photo doesn't flash before the new query resolves.
    deckQueueRef.current = [];
    currentIndexRef.current = 0;
    swipedIdsRef.current.clear();
    prevListingIdsRef.current = '';
    hasNewListingsRef.current = false;
  }

  useEffect(() => {
    if (!filterChangedRef.current) return;
    filterChangedRef.current = false;
    isMountSettledRef.current = false;
    setIsCategoryTransitioning(true);
    const settledTimer = setTimeout(() => { isMountSettledRef.current = true; }, 100);

    deckQueueRef.current = [];
    currentIndexRef.current = 0;
    swipedIdsRef.current.clear();
    prevListingIdsRef.current = '';
    hasNewListingsRef.current = false;
    setPage(0);
    resetClientDeck(storeActiveCategory || 'all');
    currentIndexRef.current = 0;
    setCurrentIndex(0);
    setDeckLength(0);

    return () => clearTimeout(settledTimer);
  }, [filterSignature, resetClientDeck]);

  const dataType = useMemo(() => {
    if (['buyers', 'renters', 'leads', 'hire'].includes(storeActiveCategory || '')) return 'people';
    if (storeActiveCategory === 'events') return 'events';
    return 'listing';
  }, [storeActiveCategory]);

  const {
    data: smartListings = [],
    isLoading: smartListingsLoading,
    isFetching: smartListingsFetching,
    error: smartListingsError,
  } = useSmartListingMatching(user?.id, [], stableFilters, page, 20, isRefreshMode && dataType === 'listing');

  const {
    data: smartClients = [],
    isLoading: smartClientsLoading,
    isFetching: smartClientsFetching,
    error: smartClientsError,
  } = useSmartClientMatching(
    user?.id, 
    activeCategory as any, 
    page, 
    20, 
    isRefreshMode && dataType === 'people', 
    stableFilters as unknown as ClientFilters,
    false,
    dataType !== 'people'
  );

  const selectedCategoryDb = useMemo(() => (storeActiveCategory ? normalizeCategoryName(storeActiveCategory) : undefined), [storeActiveCategory]);

  const smartData = useMemo(() => {
    const rawData = dataType === 'people' ? smartClients : smartListings;

    // React Query keeps previous data while fetching. Never let that stale
    // previous category seed the deck after a quick-filter change.
    if (dataType === 'listing' && selectedCategoryDb && selectedCategoryDb !== 'all') {
      return rawData.filter((item: any) => normalizeCategoryName(item?.category) === selectedCategoryDb);
    }

    if (dataType === 'people' && storeActiveCategory && ['buyers', 'renters', 'hire', 'leads'].includes(storeActiveCategory)) {
      const clientTypeMap: Record<string, string> = { buyers: 'buyer', renters: 'renter', hire: 'hire', leads: 'hire' };
      return rawData.filter((item: any) => (item?.client_type || item?.occupation) === clientTypeMap[storeActiveCategory]);
    }

    return rawData;
  }, [dataType, smartClients, smartListings, selectedCategoryDb, storeActiveCategory]);
  const isLoading = dataType === 'people' ? smartClientsLoading : smartListingsLoading;
  const isFetching = dataType === 'people' ? smartClientsFetching : smartListingsFetching;
  const error = dataType === 'people' ? smartClientsError : smartListingsError;

  // Release the transition guard once the new category's query has settled
  // (or errored). Until then the loader stays up — no exhausted-state flash.
  useEffect(() => {
    if (isCategoryTransitioning && !isLoading && !isFetching) {
      setIsCategoryTransitioning(false);
    }
  }, [isCategoryTransitioning, isLoading, isFetching]);

  const listingIdsSignature = useMemo(() => {
    if (smartData.length === 0) return '';
    return `${smartData[0]?.id || ''}_${smartData[smartData.length - 1]?.id || ''}_${smartData.length}`;
  }, [smartData]);

  if (listingIdsSignature !== prevListingIdsRef.current && listingIdsSignature.length > 0) {
    const currentIds = new Set(deckQueueRef.current.map(l => l.id));
    const newIds = smartData.filter(l => !currentIds.has(l.id) && !swipedIdsRef.current.has(l.id));
    hasNewListingsRef.current = newIds.length > 0;
    prevListingIdsRef.current = listingIdsSignature;

    if (deckQueueRef.current.length === 0 && smartData.length > 0) {
      deckQueueRef.current = smartData;
      setDeckLength(smartData.length);
    } else if (activeMode === 'client' && smartData.length > 0) {
      const firstIncoming = smartData[0]?.id;
      const firstCurrent = deckQueueRef.current[currentIndexRef.current]?.id;
      const userHasNotStartedThisDeck = currentIndexRef.current === 0 && swipedIdsRef.current.size === 0;
      if (userHasNotStartedThisDeck && firstIncoming && firstIncoming !== firstCurrent) {
        deckQueueRef.current = smartData;
        setDeckLength(smartData.length);
        setClientDeck(storeActiveCategory || 'all', smartData, false);
      }
    }
  }

  usePrefetchImages({
    currentIndex: currentIndex,
    profiles: deckQueueRef.current,
    prefetchCount: 5,
    trigger: currentIndex
  });

  useSwipePrefetch(
    user?.id,
    currentIndexRef.current,
    page,
    deckQueueRef.current.length,
    stableFilters
  );

  const location = useLocation();
  const isDashboard = location.pathname.includes('/dashboard');
  const { prefetchListingDetails } = usePrefetchManager();

  useEffect(() => {
    if (!isDashboard) return;

    const nextListing = deckQueueRef.current[currentIndex + 1];
    if (nextListing?.id) {
      prefetchSchedulerRef.current.schedule(() => {
        prefetchListingDetails(nextListing.id);
      }, 300);
    }

    const scheduler = prefetchSchedulerRef.current;
    return () => {
      scheduler.cancel();
    };
  }, [currentIndex, prefetchListingDetails, isDashboard]);

  useEffect(() => {
    if (!isFetching && isRefreshMode) {
      const timer = setTimeout(() => {
        setIsRefreshMode(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isFetching, isRefreshMode]);

  const handleDragStart = useCallback(() => {
    const n2Card = deckQueueRef.current[currentIndexRef.current + 2];
    if (n2Card?.images && Array.isArray(n2Card.images)) {
      n2Card.images.forEach((imgUrl: string) => {
        if (imgUrl) imagePreloadController.preload(imgUrl, 'high');
      });
    }
  }, []);

  useEffect(() => {
    if (!hasNewListingsRef.current || isLoading) {
      if (!isLoading && !isFetching) {
        isFetchingMore.current = false;
      }
      return;
    }

    hasNewListingsRef.current = false;

    const existingIds = new Set(deckQueueRef.current.map(l => l.id));
    const dismissedSet = new Set(dismissedIds);
    const newListings = smartData.filter(l =>
      !existingIds.has(l.id) && !swipedIdsRef.current.has(l.id) && (!isRefreshMode ? !dismissedSet.has(l.id) : true)
    );

    if (newListings.length > 0) {
      deckQueueRef.current = [...deckQueueRef.current, ...newListings];
      if (deckQueueRef.current.length > 50) {
        const offset = deckQueueRef.current.length - 50;
        deckQueueRef.current = deckQueueRef.current.slice(offset);
        const newIndex = Math.max(0, currentIndexRef.current - offset);
        currentIndexRef.current = newIndex;
        setCurrentIndex(newIndex);
      }

      setDeckLength(deckQueueRef.current.length);
      setClientDeck(storeActiveCategory || 'all', deckQueueRef.current, true);
      persistDeckToSession('client', 'listings', deckQueueRef.current);

      if (!isClientReady(storeActiveCategory || 'all')) {
        markClientReady(storeActiveCategory || 'all');
      }
    }

    isFetchingMore.current = false;
  }, [listingIdsSignature, isLoading, isFetching, smartListings, setClientDeck, isClientReady, markClientReady, dismissedIds]);

  const deckQueue = deckQueueRef.current;
  const topCard = currentIndex < deckQueue.length ? deckQueue[currentIndex] : null;
  const topCardIdentity = topCard?.id || topCard?.user_id || '';

  useEffect(() => {
    pendingSwipeRef.current = null;
    isSwipeAnimatingRef.current = false;
    swipeDirectionRef.current = null;
    setSwipeDirection(null);
  }, [topCardIdentity, filterSignature, activeMode]);

  const flushPendingSwipe = useCallback(() => {
    const pending = pendingSwipeRef.current;
    if (!pending) return;

    const { listing, direction, newIndex } = pending;
    pendingSwipeRef.current = null;
    isSwipeAnimatingRef.current = false;

    hasSwipedRef.current = true;
    setCurrentIndex(newIndex);
    markClientSwiped(storeActiveCategory || 'all', listing.id);
    recordSwipe(listing.id, 'listing', direction);

    swipeMutation.mutate({
      targetId: listing.id,
      direction,
      targetType: 'listing',
    });

    if (direction === 'left') {
      dismissTarget(listing.id).catch(() => { });
    }

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        persistDeckToSession('client', 'listings', deckQueueRef.current);
      }, { timeout: 2000 });
    } else {
      setTimeout(() => {
        persistDeckToSession('client', 'listings', deckQueueRef.current);
      }, 0);
    }

    queueMicrotask(() => {
      recordProfileView.mutateAsync({
        profileId: listing.id,
        viewType: 'listing',
        action: direction === 'right' ? 'like' : 'pass'
      }).catch(() => { });
    });

    setSwipeDirection(null);

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

    const nextNextCard = deckQueueRef.current[newIndex + 1];
    if (nextNextCard?.images?.[0]) {
      preloadImageToCache(nextNextCard.images[0]);
      imageCache.set(getCardImageUrl(nextNextCard.images[0]), true);
      imagePreloadController.preload(nextNextCard.images[0], 'high');
    }

    prefetchSchedulerRef.current.schedule(() => {
      const batch: string[] = [];
      for (let offset = 2; offset <= 5; offset++) {
        const card = deckQueueRef.current[newIndex + offset];
        if (card?.images?.[0]) {
          batch.push(card.images[0]);
          imageCache.set(getCardImageUrl(card.images[0]), true);
        }
      }
      if (batch.length > 0) {
        batch.forEach(url => preloadImageToCache(url));
        imagePreloadController.preloadBatch(batch);
      }
    }, 200);
  }, [recordSwipe, recordProfileView, markClientSwiped, queryClient, dismissTarget, swipeMutation, error]);

  const executeSwipe = useCallback((direction: 'left' | 'right') => {
    if (isSwipeAnimatingRef.current) return;
    const listing = deckQueueRef.current[currentIndexRef.current];
    if (!listing) return;

    const newIndex = currentIndexRef.current + 1;
    isSwipeAnimatingRef.current = true;
    pendingSwipeRef.current = { listing, direction, newIndex };
    currentIndexRef.current = newIndex;
    swipedIdsRef.current.add(listing.id);
    setSwipeDirection(direction);
    swipeDirectionRef.current = direction;

    flushPendingSwipe();
  }, [flushPendingSwipe, playSwipeSound]);

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    const listing = deckQueueRef.current[currentIndexRef.current];
    if (!listing) return;
    executeSwipe(direction);

    // Defer image prefetch off the swipe animation frame so the gesture stays smooth.
    const runPrefetch = () => {
      const imagesToPreload: string[] = [];
      [1, 2, 3, 4, 5].forEach((offset) => {
        const futureCard = deckQueueRef.current[currentIndexRef.current + offset];
        if (futureCard?.images && Array.isArray(futureCard.images)) {
          futureCard.images.forEach((imgUrl: string) => {
            if (imgUrl) {
              imagesToPreload.push(imgUrl);
              preloadImageToCache(imgUrl);
              imageCache.set(getCardImageUrl(imgUrl), true);
            }
          });
        }
      });
      if (imagesToPreload.length > 0) {
        imagePreloadController.preloadBatch(imagesToPreload);
      }
    };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as typeof window & { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void }).requestIdleCallback(runPrefetch, { timeout: 600 });
    } else {
      setTimeout(runPrefetch, 0);
    }
  }, [executeSwipe, playSwipeSound]);

  const handleInsights = () => {
    setInsightsModalOpen(true);
    triggerHaptic('light');
  };

  const handleShare = () => {
    setShareDialogOpen(true);
    triggerHaptic('light');
  };

  const handleSoon = () => {
    appToast.success('Saved for later');
    triggerHaptic('light');
  };

  const handleBack = useCallback(() => {
    triggerHaptic('light');
    setActiveCategory(null as any);
    navigate(`/${activeMode}/dashboard`);
  }, [navigate, activeMode, setActiveCategory]);

  const handleMessage = () => {
    const listing = deckQueueRef.current[currentIndexRef.current];
    if (!canNavigate()) return;
    const targetUserId = activeMode === 'owner' 
      ? (listing?.user_id || listing?.id) 
      : (listing?.owner_id || listing?.user_id || listing?.id);
    
    if (!targetUserId) {
      logger.error('handleMessage: No recipient user ID found', { listingId: listing?.id, activeMode });
      appToast.error('Cannot Start Conversation', 'User information not available.');
      return;
    }
    
    // Check if conversation already exists
    const existingConversation = conversations?.find(c => c.other_user?.id === targetUserId);
    if (existingConversation) {
      navigate(`/messages?conversationId=${existingConversation.id}`);
      return;
    }

    setSelectedListing(listing);
    setMessageDialogOpen(true);
    triggerHaptic('light');
    if (onMessageClick) onMessageClick();
  };

  const handleSendMessage = async (message: string) => {
    const targetUserId = activeMode === 'owner' 
      ? (selectedListing?.user_id || selectedListing?.id) 
      : (selectedListing?.owner_id || selectedListing?.user_id || selectedListing?.id);

    if (isCreatingConversation || !targetUserId) {
      if (!targetUserId) logger.error('handleSendMessage: No targetUserId found', { listingId: selectedListing?.id });
      return;
    }
    const { validateContent: vc } = await import('@/utils/contactInfoValidation');
    const result = vc(message);
    if (!result.isClean) {
      appToast.error('Content blocked', result.message || undefined);
      return;
    }
    setIsCreatingConversation(true);
    startNavigation();
    try {
      const result = await startConversation.mutateAsync({
        otherUserId: targetUserId,
        listingId: activeMode === 'owner' ? undefined : selectedListing.id,
        initialMessage: message,
        canStartNewConversation: true,
      });
      if (result?.conversationId) {
        setMessageDialogOpen(false);
        setDirectMessageDialogOpen(false);
        navigate(`/messages?conversationId=${result.conversationId}`);
      }
    } catch (err) {
      appToast.error('Error', err instanceof Error ? err.message : 'Could not start conversation');
    } finally {
      setIsCreatingConversation(false);
      endNavigation();
    }
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshMode(true);
    appToast.info('Refreshing', 'Loading latest listings...');
  }, []);

  const pullDown = usePullDownToDismiss({ onRefresh: handleRefresh });

  if (!storeActiveCategory) {
    return (
      <>
        <div className="relative w-full h-full flex flex-col">
          <BentoCategoryDashboard setCategories={(cat) => {
            if (cat === 'clients') {
              switchMode('owner');
              return;
            }
            if (cat === 'rentals') {
              setActiveCategory('property');
              setCategories(['property']);
              setListingType('rent');
              return;
            }
            if (cat === 'property') {
              setActiveCategory('property');
              setCategories(['property']);
              setListingType('sale');
              return;
            }
            setActiveCategory(cat as any);
            setCategories([cat] as any);
            setListingType('both');
          }} />
        </div>
        {dataType === 'people' ? (
          <Suspense fallback={null}><OwnerClientFilterDialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen} /></Suspense>
        ) : (
          <Suspense fallback={null}><ClientPreferencesDialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen} /></Suspense>
        )}
      </>
    );
  }

  const categoryNames: Record<string, string> = {
    property: listingType === 'rent' ? 'Rentals' : 'Properties',
    motorcycle: 'Motorcycles',
    bicycle: 'Bicycles',
    services: 'Services',
    pros: 'Pros',
    events: 'Events',
    buyers: 'Buyers',
    renters: 'Renters',
    leads: 'Leads',
    hire: 'Workers',
  };
  const currentCategoryName = categoryNames[storeActiveCategory] || storeActiveCategory;

  return (
    <>
    <div className={cn(
      "absolute inset-0 w-full h-full flex flex-col transition-colors duration-500 overflow-hidden",
      "bg-swipe-frame"
    )}>
      <div className={cn(
        "absolute inset-0 pointer-events-none -z-10 transition-colors duration-500",
        "bg-swipe-frame"
      )} />

      {/* Single back button is handled by TopBar now */}

      {/* Pull-down backdrop: dashboard category picker revealed behind the deck */}
      <motion.div
        aria-hidden
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          opacity: pullDown.backdropOpacity,
          scale: pullDown.backdropScale,
          transformOrigin: 'center center',
          backgroundColor: '#000',
        }}
      >
        <div className="w-full h-full">
          <BentoCategoryDashboard setCategories={() => {}} />
        </div>
      </motion.div>

      <div
        className={cn(
          "flex-1 relative flex w-full h-full items-stretch justify-center px-1 pt-1 z-10 pointer-events-auto min-h-0 overflow-hidden"
        )}
        {...pullDown.bind}
      >
        <SwipeDeckBackButton />
        <motion.div
          className="relative w-full h-full mx-auto flex items-stretch justify-stretch pointer-events-auto md:max-w-[640px]"
          style={{ y: pullDown.y, scale: pullDown.scale, opacity: pullDown.opacity, transform: 'translateZ(0)', willChange: 'transform' }}
        >
          {/* Rounded backdrop matches card corners so deck blends into background */}
          <div
            aria-hidden
            className={cn(
              "absolute inset-0 -z-10 transition-colors duration-500",
              "bg-swipe-frame"
            )}
            style={{ borderRadius: 48 }}
          />
          <AnimatePresence mode="sync" initial={false}>
            {deckQueue.length > 0 && currentIndex < deckQueue.length ? (
              <motion.div
                key="swipe-deck"
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-0 mx-auto transform-gpu"
              >
                <AnimatePresence>
                  {deckQueue.slice(currentIndex, currentIndex + 2).reverse().map((listing) => {
                    const isTopCard = listing.id === topCard?.id;
                    return (
                      <motion.div
                        key={listing.id}
                        exit={{ opacity: 0, transition: { duration: 0.15 } }}
                        className={cn("absolute inset-0 w-full h-full", isTopCard ? "z-20" : "z-10")}
                      >
                      {dataType === 'people' ? (
                        <SimpleOwnerSwipeCard
                          ref={isTopCard ? cardRef as any : undefined}
                          profile={listing}
                          onSwipe={isTopCard ? handleSwipe : () => {}}
                          onTap={isTopCard ? handleInsights : undefined}
                          onInsights={isTopCard ? handleInsights : undefined}
                          onShare={isTopCard ? handleShare : undefined}
                          onSoon={isTopCard ? handleSoon : undefined}
                          onMessage={isTopCard ? handleMessage : undefined}
                          onReport={isTopCard ? () => {
                            setSelectedListing(listing);
                            setReportDialogOpen(true);
                            triggerHaptic('medium');
                          } : undefined}
                          onDragStart={isTopCard ? handleDragStart : undefined}
                          isTop={isTopCard}
                          onUndo={isTopCard ? undoLastSwipe : undefined}
                          canUndo={canUndo}
                          onBack={handleBack}
                        />
                      ) : (
                        <SimpleSwipeCard
                          ref={isTopCard ? cardRef : undefined}
                          listing={listing}
                          isTop={isTopCard}
                          fullScreen={false}
                          onSwipe={isTopCard ? handleSwipe : () => {}}
                          onCardTap={isTopCard ? handleInsights : undefined}
                          onInsights={isTopCard ? handleInsights : undefined}
                          onShare={isTopCard ? handleShare : undefined}
                          onSoon={isTopCard ? handleSoon : undefined}
                          onMessage={isTopCard ? handleMessage : undefined}
                          onReport={isTopCard ? () => {
                            setSelectedListing(listing);
                            setReportDialogOpen(true);
                            triggerHaptic('medium');
                          } : undefined}
                          onDragStart={isTopCard ? handleDragStart : undefined}
                          onUndo={isTopCard ? undoLastSwipe : undefined}
                          canUndo={canUndo}
                          onBack={handleBack}
                        />
                      )}
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
                {(isLoading || isFetching || isCategoryTransitioning || !isMountSettledRef.current) && deckQueue.length === 0 ? (
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
                  categoryName={currentCategoryName}
                  isLoading={isLoading || isFetching}
                  activeCategory={storeActiveCategory}
                  onCategoryChange={(cat) => {
                    triggerHaptic('medium');
                    setActiveCategory(cat as any);
                    setCategories([cat] as any);
                  }}
                  onOpenFilters={() => {
                    triggerHaptic('medium');
                    navigate(userRole === 'owner' ? '/owner/filters' : '/client/filters');
                  }}
                  role={userRole === 'owner' ? 'owner' : 'client'}
                />
                )}
              </motion.div>
            )}
          </AnimatePresence>
      </motion.div>
    </div>

    {/* Bottom action bar removed — the same actions (Share / Message /
        Insights / Report) live on the right-side rail in SimpleSwipeCard,
        keeping the card photo unobstructed. */}
    </div>

      <Suspense fallback={null}>
        {matchData && (
          <MatchCelebrateModal 
            isOpen={true} 
            onClose={() => setMatchData(null)}
            clientProfile={matchData.client} 
            ownerProfile={matchData.owner} 
          />
        )}
      </Suspense>

      <>
        {insightsModalOpen && topCard && (
          <Suspense fallback={null}><SwipeInsightsModal
            open={insightsModalOpen}
            onOpenChange={setInsightsModalOpen}
            listing={dataType === 'people' ? null : topCard}
            profile={dataType === 'people' ? topCard : null}
          /></Suspense>
        )}
        {shareDialogOpen && topCard && (
          <Suspense fallback={null}><ShareDialog
            open={shareDialogOpen}
            onOpenChange={setShareDialogOpen}
            listingId={dataType === 'people' ? undefined : topCard.id}
            profileId={dataType === 'people' ? (topCard.user_id || topCard.id) : undefined}
            title={dataType === 'people' ? (topCard.name || 'Check out this profile') : (topCard.title || 'Check out this listing')}
            description={dataType === 'people' ? topCard.bio : topCard.description}
            previewImage={dataType === 'people'
              ? (Array.isArray((topCard as any).profile_images) && (topCard as any).profile_images[0]) || null
              : (Array.isArray((topCard as any).images) && (topCard as any).images[0]) || (topCard as any).image_url || null}
          /></Suspense>
        )}
        {reportDialogOpen && selectedListing && (
          <Suspense fallback={null}><ReportDialog
            open={reportDialogOpen}
            onOpenChange={setReportDialogOpen}
            reportedListingId={dataType === 'people' ? undefined : selectedListing.id}
            reportedListingTitle={dataType === 'people' ? undefined : selectedListing.title}
            reportedUserId={dataType === 'people' ? (selectedListing.user_id || selectedListing.id) : selectedListing.owner_id}
            reportedUserName={dataType === 'people' ? selectedListing.name : undefined}
            reportedUserAge={selectedListing.age || (selectedListing as any).owner_age}
            category={dataType === 'people' ? 'user_profile' : 'listing'}
          /></Suspense>
        )}
      </>

      <Suspense fallback={null}><MessageConfirmationDialog
        open={messageDialogOpen}
        onOpenChange={setMessageDialogOpen}
        onConfirm={handleSendMessage}
        recipientName={selectedListing ? `the owner of ${selectedListing.title}` : 'the owner'}
        isLoading={isCreatingConversation}
      /></Suspense>

      <Suspense fallback={null}><DirectMessageDialog
        open={directMessageDialogOpen}
        onOpenChange={setDirectMessageDialogOpen}
        onConfirm={handleSendMessage}
        recipientName={selectedListing ? `the owner of ${selectedListing.title}` : 'the owner'}
        isLoading={isCreatingConversation}
        category={selectedListing?.category}
      /></Suspense>

      {dataType === 'people' ? (
        <Suspense fallback={null}><OwnerClientFilterDialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen} /></Suspense>
      ) : (
        <Suspense fallback={null}><ClientPreferencesDialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen} /></Suspense>
      )}

    </>
  );
};

export const SwipessSwipeContainer = memo(SwipessSwipeContainerComponent);
