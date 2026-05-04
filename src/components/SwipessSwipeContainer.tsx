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

const CLIENT_CYCLE: QuickFilterCategory[] = ['property', 'motorcycle', 'bicycle', 'services'];
const OWNER_CYCLE: QuickFilterCategory[] = ['all-clients', 'buyers', 'renters', 'hire'];
import { getActiveCategoryInfo, POKER_CARDS, OWNER_INTENT_CARDS } from './swipe/SwipeConstants';
import { MatchCelebrateModal } from './swipe/MatchCelebrateModal';
import { ClientPreferencesDialog } from './ClientPreferencesDialog';
import { OwnerClientFilterDialog } from './OwnerClientFilterDialog';
import { preloadImageToCache } from '@/lib/swipe/imageCache';
import { imageCache } from '@/lib/swipe/cardImageCache';
import { PrefetchScheduler } from '@/lib/swipe/PrefetchScheduler';
import { useSmartListingMatching, useSmartClientMatching, ListingFilters, MatchedClientProfile, ClientFilters } from '@/hooks/useSmartMatching';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useActiveMode } from '@/hooks/useActiveMode';
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
import { Home, Bike, Briefcase, ChevronLeft } from 'lucide-react';
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
import { SwipeAllDashboard } from './swipe/SwipeAllDashboard';

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
  const { activeMode } = useActiveMode();
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
      : store.getClientDeckItems();
    return items;
  };

  const deckQueueRef = useRef<any[]>(getInitialDeck());
  const currentIndexRef = useRef(
    activeMode === 'owner' 
      ? (useSwipeDeckStore.getState().ownerDecks[storeActiveCategory || 'all']?.currentIndex || 0)
      : useSwipeDeckStore.getState().clientDeck.currentIndex
  );
  const swipedIdsRef = useRef<Set<string>>(new Set(useSwipeDeckStore.getState().clientDeck.swipedIds));
  const _initializedRef = useRef(deckQueueRef.current.length > 0);

  const cardRef = useRef<SimpleSwipeCardRef>(null);

  useEffect(() => {
    setCurrentIndex(currentIndexRef.current);
  }, []);

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

  const isReturningRef = useRef(
    deckQueueRef.current.length > 0 && useSwipeDeckStore.getState().clientDeck.isReady
  );
  const _hasAnimatedOnceRef = useRef(isReturningRef.current);

  const eagerPreloadInitiatedRef = useRef(false);
  if (!eagerPreloadInitiatedRef.current && deckQueueRef.current.length > 0) {
    eagerPreloadInitiatedRef.current = true;
    const currentIdx = currentIndexRef.current;

    const imagesToPreload: string[] = [];
    [0, 1, 2, 3, 4].forEach((offset) => {
      const card = deckQueueRef.current[currentIdx + offset];
      if (card?.images && Array.isArray(card.images)) {
        card.images.forEach((imgUrl: string) => {
          if (imgUrl) {
            imagesToPreload.push(imgUrl);
            preloadImageToCache(imgUrl);
            imageCache.set(imgUrl, true);
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

  const topCardX = useMotionValue(0);

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

  const hasSwipedRef = useRef(false);

  useEffect(() => {
    try { sessionStorage.removeItem('swipe-deck-client-listings'); } catch (_err) { }
  }, []);

  useEffect(() => {
    const scheduler = prefetchSchedulerRef.current;
    return () => {
      scheduler.cancel();
    };
  }, []);

  const { canAccess: hasPremiumMessaging, needsUpgrade } = useCanAccessMessaging();
  const { recordSwipe, undoLastSwipe, canUndo, isUndoing: _isUndoing, undoSuccess, resetUndoState } = useSwipeUndo();
  const swipeMutation = useSwipeWithMatch({
    onMatch: (clientProfile, ownerProfile) => setMatchData({ client: clientProfile, owner: ownerProfile })
  });
  const startConversation = useStartConversation();

  const { dismissedIds, dismissTarget, filterDismissed: _filterDismissed } = useSwipeDismissal('listing');

  useEffect(() => {
    if (undoSuccess) {
      const storeState = useSwipeDeckStore.getState();
      const newIndex = storeState.clientDeck.currentIndex;
      currentIndexRef.current = newIndex;
      setCurrentIndex(newIndex);
      swipedIdsRef.current = new Set(storeState.clientDeck.swipedIds);
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

  if (filterSignature !== prevFilterSignatureRef.current) {
    filterChangedRef.current = true;
    prevFilterSignatureRef.current = filterSignature;
  }

  useEffect(() => {
    if (!filterChangedRef.current) return;
    filterChangedRef.current = false;
    isMountSettledRef.current = false;
    const settledTimer = setTimeout(() => { isMountSettledRef.current = true; }, 400);

    deckQueueRef.current = [];
    currentIndexRef.current = 0;
    swipedIdsRef.current.clear();
    prevListingIdsRef.current = '';
    hasNewListingsRef.current = false;
    setPage(0);
    resetClientDeck();
    currentIndexRef.current = 0;
    setCurrentIndex(0);
    setDeckLength(0);

    return () => clearTimeout(settledTimer);
  }, [filterSignature, resetClientDeck]);

  const {
    data: smartListings = [],
    isLoading: smartListingsLoading,
    isFetching: smartListingsFetching,
    error: smartListingsError,
  } = useSmartListingMatching(user?.id, [], stableFilters, page, 20, isRefreshMode && activeMode === 'client');

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
    isRefreshMode && activeMode === 'owner', 
    stableFilters as unknown as ClientFilters,
    false,
    activeMode !== 'owner'
  );

  const smartData = activeMode === 'owner' ? smartClients : smartListings;
  const isLoading = activeMode === 'owner' ? smartClientsLoading : smartListingsLoading;
  const isFetching = activeMode === 'owner' ? smartClientsFetching : smartListingsFetching;
  const error = activeMode === 'owner' ? smartClientsError : smartListingsError;

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
      setClientDeck(deckQueueRef.current, true);
      persistDeckToSession('client', 'listings', deckQueueRef.current);

      if (!isClientReady()) {
        markClientReady();
      }
    }

    isFetchingMore.current = false;
  }, [listingIdsSignature, isLoading, isFetching, smartListings, setClientDeck, isClientReady, markClientReady, dismissedIds]);

  const deckQueue = deckQueueRef.current;
  const topCard = currentIndex < deckQueue.length ? deckQueue[currentIndex] : null;

  const flushPendingSwipe = useCallback(() => {
    const pending = pendingSwipeRef.current;
    if (!pending) return;

    const { listing, direction, newIndex } = pending;
    pendingSwipeRef.current = null;
    isSwipeAnimatingRef.current = false;

    animate(topCardX, 0, { type: 'spring', stiffness: 500, damping: 35, mass: 0.4 });
    hasSwipedRef.current = true;
    setCurrentIndex(newIndex);
    markClientSwiped(listing.id);
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
    playSwipeSound(direction);
    setSwipeDirection(direction);

    setTimeout(() => {
      if (pendingSwipeRef.current?.listing.id === listing.id) {
        flushPendingSwipe();
      }
    }, 350);
  }, [flushPendingSwipe, playSwipeSound]);

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    const listing = deckQueueRef.current[currentIndexRef.current];
    if (!listing) return;
    playSwipeSound(direction);
    executeSwipe(direction);

    const imagesToPreload: string[] = [];
    [1, 2, 3, 4, 5].forEach((offset) => {
      const futureCard = deckQueueRef.current[currentIndexRef.current + offset];
      if (futureCard?.images && Array.isArray(futureCard.images)) {
        futureCard.images.forEach((imgUrl: string) => {
          if (imgUrl) {
            imagesToPreload.push(imgUrl);
            preloadImageToCache(imgUrl);
            imageCache.set(imgUrl, true);
          }
        });
      }
    });

    if (imagesToPreload.length > 0) {
      imagePreloadController.preloadBatch(imagesToPreload);
    }
  }, [executeSwipe, playSwipeSound]);

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

    currentIndexRef.current = 0;
    setCurrentIndex(0);
    setDeckLength(0);
    deckQueueRef.current = [];
    swipedIdsRef.current.clear();
    setPage(0);
    resetClientDeck();

    try {
      await queryClient.invalidateQueries({ queryKey: ['smart-listing-matches'] });
      await queryClient.invalidateQueries({ queryKey: ['smart-client-matches'] });
      const refreshCategoryInfo = getActiveCategoryInfo(filters, storeActiveCategory);
      const refreshLabel = String(refreshCategoryInfo?.plural || 'Listings').toLowerCase();
      appToast.success(`${String(refreshCategoryInfo?.plural || 'Listings')} Refreshed`, `Showing ${refreshLabel} you passed on. Liked ones stay saved!`);
    } catch (_err) {
      appToast.error('Refresh Failed', 'Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  }, [filters, storeActiveCategory, queryClient, resetClientDeck]);

  const handleInsights = () => {
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
    const isDirectMessaging = isDirectMessagingListing(listing);
    if (isDirectMessaging) {
      setSelectedListing(listing);
      setDirectMessageDialogOpen(true);
      triggerHaptic('light');
      return;
    }
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
    setSelectedListing(listing);
    setMessageDialogOpen(true);
    triggerHaptic('light');
    if (onMessageClick) onMessageClick();
  };

  const handleSendMessage = async (message: string) => {
    if (isCreatingConversation || !selectedListing?.owner_id) return;
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
      appToast.error('Error', err instanceof Error ? err.message : 'Could not start conversation');
    } finally {
      setIsCreatingConversation(false);
      endNavigation();
    }
  };

  const handleCycleCategory = useCallback(() => {
    triggerHaptic('heavy');
    const cycle = userRole === 'owner' ? OWNER_CYCLE : CLIENT_CYCLE;
    const currentIdx = cycle.indexOf(storeActiveCategory as any);
    const nextIdx = (currentIdx + 1) % cycle.length;
    setActiveCategory(cycle[nextIdx] as any);
  }, [storeActiveCategory, userRole, setActiveCategory]);

  if (!storeActiveCategory) {
    return (
      <>
        <div className="relative w-full h-full flex flex-col">
          <SwipeAllDashboard setCategories={(cat) => {
            setActiveCategory(cat as any);
            setCategories([cat] as any);
          }} />
        </div>
        {typeof document !== 'undefined' && document.body && createPortal(
          <Suspense fallback={null}>
            {userRole === 'owner' ? (
              <OwnerClientFilterDialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen} />
            ) : (
              <ClientPreferencesDialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen} />
            )}
          </Suspense>,
          document.body
        )}
      </>
    );
  }

  const categoryNames: Record<string, string> = {
    property: 'Properties', motorcycle: 'Motorcycles', bicycle: 'Bicycles',
    services: 'Services', buyers: 'Buyers', renters: 'Renters', hire: 'Workers',
  };
  const currentCategoryName = categoryNames[storeActiveCategory] || storeActiveCategory;
  const hasCards = deckQueue.length > 0 && currentIndex < deckQueue.length;

  return (
    <>
    <div className={cn(
      "absolute inset-0 w-full h-full flex flex-col transition-colors duration-500 overflow-hidden",
      isLight ? "bg-transparent" : "bg-black"
    )}>
      <div className={cn(
        "absolute inset-0 pointer-events-none -z-10 transition-colors duration-500",
        isLight ? "bg-transparent" : "bg-black"
      )} />

      {!hasCards && (
        <div className="absolute top-[calc(var(--safe-top,0px)+64px)] left-4 z-[70] flex items-center gap-3 pointer-events-auto">
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveCategory(null as any);
              setCategories([] as any);
            }}
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full border transition-all active:scale-90",
              isLight ? "bg-white border-black/10 text-black" : "bg-black/80 border-white/20 text-white"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className={cn("text-sm font-black uppercase tracking-wider", isLight ? "text-black" : "text-white")}>
            {currentCategoryName}
          </span>
        </div>
      )}

      <div className={cn(
        "flex-1 relative flex w-full h-full items-center justify-center px-0 z-10 pointer-events-auto min-h-0 overflow-hidden"
      )}>
        <div className="relative w-full h-full max-w-[440px] mx-auto flex items-center justify-center pointer-events-auto">
          <AnimatePresence mode="sync" initial={true}>
            {deckQueue.length > 0 && currentIndex < deckQueue.length ? (
              <motion.div
                key={`deck-${storeActiveCategory ?? 'all'}`}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-1.5 pt-[calc(var(--safe-top,0px)+72px)] pb-[calc(var(--bottom-nav-height,72px)+16px)] mx-auto transform-gpu"
              >
                {currentIndex + 1 < deckQueue.length && (
                  <motion.div
                    className="absolute inset-0 w-full h-full z-10"
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

                <div className="absolute inset-0 w-full h-full z-20">
                  <SimpleSwipeCard
                    key={topCard?.id}
                    ref={cardRef}
                    listing={topCard}
                    onSwipe={handleSwipe}
                    onInsights={() => {
                      handleInsights();
                      if (onListingTap) onListingTap(topCard.id);
                    }}
                    onShare={handleShare}
                    onReport={() => {
                      setSelectedListing(topCard);
                      setReportDialogOpen(true);
                      triggerHaptic('medium');
                    }}
                    onDragStart={handleDragStart}
                    isTop={true}
                    externalX={topCardX}
                  />
                </div>
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
                  radiusKm={radiusKm}
                  onRadiusChange={setRadiusKm as any}
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
              </motion.div>
            )}
          </AnimatePresence>
      </div>
    </div>

    {hasCards && (
        <div className="absolute bottom-[calc(var(--bottom-nav-height,64px)+8px)] left-0 right-0 z-[100] flex justify-center pointer-events-auto">
          <SwipeActionButtonBar
            onLike={handleButtonLike}
            onDislike={handleButtonDislike}
            onShare={handleShare}
            onInsights={() => {
              handleInsights();
              if (onListingTap) onListingTap(topCard.id);
            }}
            onUndo={undoLastSwipe}
            onMessage={handleMessage}
            onCycleCategory={handleCycleCategory}
            canUndo={canUndo}
          />
        </div>
      )}
    </div>

      {matchData && (
        <MatchCelebrateModal 
          isOpen={true} 
          onClose={() => setMatchData(null)}
          clientProfile={matchData.client} 
          ownerProfile={matchData.owner} 
        />
      )}

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

          {userRole === 'owner' ? (
            <OwnerClientFilterDialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen} />
          ) : (
            <ClientPreferencesDialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen} />
          )}

          {selectedListing && (
            <ReportDialog
              open={reportDialogOpen}
              onOpenChange={setReportDialogOpen}
              reportedListingId={selectedListing.id}
              reportedListingTitle={selectedListing.title}
              reportedUserId={selectedListing.owner_id}
              reportedUserAge={selectedListing.age || (selectedListing as any).owner_age}
              category="listing"
            />
          )}
        </Suspense>,
        document.body
      )}
    </>
  );
};

export const SwipessSwipeContainer = memo(SwipessSwipeContainerComponent);
