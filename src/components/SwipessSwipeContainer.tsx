import { lazy, memo, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { lazyWithRetry } from '@/utils/lazyRetry';
import { cn } from '@/lib/utils';
// import { } from '@/state/modalStore';
import { triggerHaptic } from '@/utils/haptics';
import { getCardImageUrl } from '@/utils/imageOptimization';
import { canGeolocate, getCurrentPosition } from '@/utils/geolocation';
import { persistClientProfileGps } from '@/utils/persistProfileGps';
import { prefetchPassportMapImmediate } from '@/utils/prefetchMapModule';
import { SimpleSwipeCard, SimpleSwipeCardRef } from './SimpleSwipeCard';
import { EVENTS_FEED_PATH } from '@/constants/eventsRoutes';
import { SwipeExhaustedState } from './swipe/SwipeExhaustedState';
import { SwipeErrorState } from './swipe/SwipeErrorState';
import { SwipeLoadingSkeleton } from './swipe/SwipeLoadingSkeleton';
import { LocationRadiusSelector } from './swipe/LocationRadiusSelector';
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
import { enableChromeAutoHide, revealChrome } from '@/hooks/useChromeReveal';

import { useUserRole } from '@/hooks/useUserRole';
import { useActiveMode } from '@/hooks/useActiveMode';
import { swipeQueue } from '@/lib/swipe/SwipeQueue';
import { imagePreloadController } from '@/lib/swipe/ImagePreloadController';
import { useSwipeUndo } from '@/hooks/useSwipeUndo';
import { useSwipeWithMatch } from '@/hooks/useSwipeWithMatch';
import { useConversations, useStartConversation } from '@/hooks/useConversations';
import { useMessagingQuota } from '@/hooks/useMessagingQuota';
import { guardNewConversation, handleStartConversationError } from '@/utils/messagingQuotaUX';
import { useRecordProfileView } from '@/hooks/useProfileRecycling';
import { usePrefetchImages } from '@/hooks/usePrefetchImages';
import { usePrefetchManager, useSwipePrefetch } from '@/hooks/usePrefetchManager';
import { persistDeckToSession, useSwipeDeckStore } from '@/state/swipeDeckStore';
import { useFilterActions, useFilterStore } from '@/state/filterStore';
import { useShallow } from 'zustand/react/shallow';
import { useSwipeDismissal } from '@/hooks/useSwipeDismissal';
import { Anchor, Bike, Briefcase, Home } from 'lucide-react';
import { useModalStore } from '@/state/modalStore';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { useSwipeSounds } from '@/hooks/useSwipeSounds';
import { appToast } from '@/utils/appNotification';
import { categoryToClientType, resolveClientType } from '@/utils/clientType';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import { logger } from '@/utils/prodLogger';
const MessageConfirmationDialog = lazyWithRetry(() => import('./MessageConfirmationDialog').then(m => ({ default: m.MessageConfirmationDialog })));
const DirectMessageDialog = lazyWithRetry(() => import('./DirectMessageDialog').then(m => ({ default: m.DirectMessageDialog })));
import { useQueryClient } from '@tanstack/react-query';

import { BentoCategoryDashboard } from './swipe/BentoCategoryDashboard';

import { usePullDownToDismiss } from './swipe/usePullDownToDismiss';

const ReportDialog = lazyWithRetry(() => import('./ReportDialog').then(m => ({ default: m.ReportDialog })));
// Eager-load the card action modals. These were previously lazy-loaded, but a
// dynamic-import failure (stale service-worker cache / CDN chunk not yet
// propagated after a deploy) made the Share and Insights buttons silently
// open nothing ÔÇö the tap registered but Suspense fell back to null. Bundling
// them in the main chunk guarantees they always open.
const SwipeInsightsModal = lazyWithRetry(() => import('./SwipeInsightsModal').then(m => ({ default: m.SwipeInsightsModal })));
const ShareDialog = lazyWithRetry(() => import('./ShareDialog').then(m => ({ default: m.ShareDialog })));

const _CATEGORY_ICON_MAP: Record<string, any> = {
  property: Home,
  motorcycle: MotorcycleIcon,
  bicycle: Bike,
  yacht: Anchor,
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

  // ——— Distance filter state ——————————————————————————————————————————————————
  const radiusKm = useFilterStore((s) => s.radiusKm);
  const setRadiusKm = useFilterStore((s) => s.setRadiusKm);
  const setUserLocation = useFilterStore((s) => s.setUserLocation);
  const userLatitude = useFilterStore((s) => s.userLatitude);
  const userLongitude = useFilterStore((s) => s.userLongitude);
  const setActiveCategory = useFilterStore((s) => s.setActiveCategory);
  const { setCategories, selectDeckCategory } = useFilterActions();
  const listingType = useFilterStore((state) => state.listingType);
  const activeCategory = useFilterStore(s => s.activeCategory);
  const [locationDetecting, setLocationDetecting] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);
  const { user } = useAuth();

  const detectLocation = useCallback(() => {
    if (!canGeolocate()) return;
    setLocationDetecting(true);
    getCurrentPosition({ timeout: 8000, maximumAge: 60000 })
      .then(({ latitude, longitude }) => {
        setUserLocation(latitude, longitude);
        setRadiusKm(100);
        setLocationDetected(true);
        setLocationDetecting(false);
        if (user?.id) void persistClientProfileGps(user.id, latitude, longitude);
      })
      .catch(() => {
        setLocationDetecting(false);
      });
  }, [setUserLocation, setRadiusKm, user?.id]);

  const memoizedTopRail = useMemo(() => {
    return (
      <LocationRadiusSelector
        radiusKm={radiusKm}
        onRadiusChange={setRadiusKm}
        onDetectLocation={detectLocation}
        detecting={locationDetecting}
        detected={locationDetected}
        lat={userLatitude}
        lng={userLongitude}
        orientation="vertical"
      />
    );
  }, [radiusKm, setRadiusKm, detectLocation, locationDetecting, locationDetected, userLatitude, userLongitude]);

  useEffect(() => {
    if (userLatitude != null && userLongitude != null) {
      setLocationDetected(true);
    }
  }, [userLatitude, userLongitude]);

  // Location requested only on explicit user gesture (filter / slider).
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

  const deckCategory = activeCategory;

  const [currentIndex, setCurrentIndex] = useState(0);

  const topCardX = useMotionValue(0);
  const topCardY = useMotionValue(0);
  // Map horizontal drag distance (-200 to 200) into a 0 to 1 progress value
  const dragProgress = useTransform(topCardX, [-200, 0, 200], [1, 0, 1]);
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
      ? store.getOwnerDeckItems(deckCategory || 'all')
      : store.getClientDeckItems(deckCategory || 'all');
    return items;
  };

  const deckQueueRef = useRef<any[]>(getInitialDeck());
  const currentIndexRef = useRef(
    activeMode === 'owner' 
      ? (useSwipeDeckStore.getState().ownerDecks[deckCategory || 'all']?.currentIndex || 0)
      : (useSwipeDeckStore.getState().clientDecks[deckCategory || 'all']?.currentIndex || 0)
  );
  const swipedIdsRef = useRef<Set<string>>(new Set(useSwipeDeckStore.getState().clientDecks[deckCategory || 'all']?.swipedIds || []));

  const cardRef = useRef<SimpleSwipeCardRef>(null);

  // Events live on the vertical Reels feed — never in the swipe deck.
  useEffect(() => {
    if (deckCategory !== 'events') return;
    setCategories([]);
    setActiveCategory(null);
    navigate(EVENTS_FEED_PATH);
  }, [deckCategory, navigate, setCategories, setActiveCategory]);

  useEffect(() => {
    setCurrentIndex(currentIndexRef.current);
  }, []);

  const [isMountSettled, setIsMountSettled] = useState(false);
  const isMountSettledRef = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => { setIsMountSettled(true); isMountSettledRef.current = true; }, 100);
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
  const { canStartNewConversation } = useMessagingQuota();

  const { dismissedIds, dismissTarget, filterDismissed: _filterDismissed } = useSwipeDismissal('listing');

  useEffect(() => {
    if (undoSuccess) {
      const storeState = useSwipeDeckStore.getState();
      const newIndex = storeState.clientDecks[deckCategory || 'all']?.currentIndex || 0;
      currentIndexRef.current = newIndex;
      setCurrentIndex(newIndex);
      swipedIdsRef.current = new Set(storeState.clientDecks[deckCategory || 'all']?.swipedIds || []);
      resetUndoState();
      logger.info('[SwipessSwipeContainer] Synced local state after undo, new index:', newIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      stableFilters.motoTypes?.join(',') || '',
      stableFilters.bicycleTypes?.join(',') || '',
      stableFilters.serviceCategory?.join(',') || '',
      stableFilters.ageRange?.join('-') || '',
      stableFilters.budgetRange?.join('-') || '',
      stableFilters.radiusKm?.toString() || '50',
      stableFilters.userLatitude?.toString() || '0',
      stableFilters.userLongitude?.toString() || '0',
    ].join('|');
  }, [stableFilters]);

  const prevFilterSignatureRef = useRef<string>(filterSignature);
  const filterChangedRef = useRef(false);

  const prevListingIdsRef = useRef<string>('');
  const hasNewListingsRef = useRef(false);
  // Locks the first card shown to the user. Once a card is seeded, nothing
  // is allowed to displace it — not a re-seed, not a deck slice, not a
  // smart-matching re-rank. Cleared only when the user swipes past it or
  // changes filters. This kills the "opens one listing then swaps to
  // another after 1-2 seconds" bug regardless of which subsystem caused it.
  const lockedFirstCardRef = useRef<any | null>(null);

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
      resetClientDeck(deckCategory || 'all');
      queryClient.removeQueries({ queryKey: ['smart-listings'] });
      try {
        sessionStorage.removeItem('swipe-deck-items');
        sessionStorage.removeItem('swipe-deck-client-listings');
      } catch (_err) { logger.warn('session storage error', _err); }
    }

    try { sessionStorage.setItem('swipe-deck-client-user', user.id); } catch (_err) { logger.warn('session storage error', _err); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode, user?.id, resetClientDeck, queryClient]);

  // Clear deck refs before paint when filters change — avoids old card photo flash.
  useLayoutEffect(() => {
    if (filterSignature === prevFilterSignatureRef.current) return;
    prevFilterSignatureRef.current = filterSignature;
    filterChangedRef.current = true;
    deckQueueRef.current = [];
    currentIndexRef.current = 0;
    swipedIdsRef.current.clear();
    prevListingIdsRef.current = '';
    hasNewListingsRef.current = false;
    lockedFirstCardRef.current = null;
  }, [filterSignature]);

  useEffect(() => {
    if (!filterChangedRef.current) return;
    filterChangedRef.current = false;
    isMountSettledRef.current = false;
    setIsMountSettled(false);
    setIsCategoryTransitioning(true);
    const settledTimer = setTimeout(() => { isMountSettledRef.current = true; setIsMountSettled(true); }, 100);

    deckQueueRef.current = [];
    currentIndexRef.current = 0;
    swipedIdsRef.current.clear();
    prevListingIdsRef.current = '';
    hasNewListingsRef.current = false;
    setPage(0);
    resetClientDeck(deckCategory || 'all');
    currentIndexRef.current = 0;
    setCurrentIndex(0);
    setDeckLength(0);

    return () => clearTimeout(settledTimer);
  }, [filterSignature, resetClientDeck, deckCategory]);

  const dataType = useMemo(() => {
    if (['buyers', 'renters', 'leads', 'hire'].includes(deckCategory || '')) return 'people';
    return 'listing';
  }, [deckCategory]);

  const {
    data: smartListings = [],
    isLoading: smartListingsLoading,
    isFetching: smartListingsFetching,
    isPlaceholderData: smartListingsPlaceholder,
    error: smartListingsError,
  } = useSmartListingMatching(user?.id, [], stableFilters, page, 20, isRefreshMode && dataType === 'listing');

  const {
    data: smartClients = [],
    isLoading: smartClientsLoading,
    isFetching: smartClientsFetching,
    isPlaceholderData: smartClientsPlaceholder,
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

  const selectedCategoryDb = useMemo(() => (deckCategory ? normalizeCategoryName(deckCategory) : undefined), [deckCategory]);

  const smartData = useMemo(() => {
    const rawData = dataType === 'people' ? smartClients : smartListings;

    // React Query keeps previous data while fetching. Never let that stale
    // previous category seed the deck after a quick-filter change.
    if (dataType === 'listing' && selectedCategoryDb && selectedCategoryDb !== 'all') {
      return rawData.filter((item: any) => normalizeCategoryName(item?.category) === selectedCategoryDb);
    }

    if (dataType === 'people' && deckCategory && ['buyers', 'renters', 'hire', 'leads'].includes(deckCategory)) {
      const expected = categoryToClientType(deckCategory);
      if (!expected) return rawData;
      return rawData.filter((item: any) =>
        resolveClientType({
          client_type: item?.client_type,
          intentions: item?.intentions,
          occupation: item?.occupation,
        }) === expected
      );
    }

    return rawData;
  }, [dataType, smartClients, smartListings, selectedCategoryDb, deckCategory]);
  const isLoading = dataType === 'people' ? smartClientsLoading : smartListingsLoading;
  const isFetching = dataType === 'people' ? smartClientsFetching : smartListingsFetching;
  const isPlaceholderData = dataType === 'people' ? smartClientsPlaceholder : smartListingsPlaceholder;
  const error = dataType === 'people' ? smartClientsError : smartListingsError;

  // Release the transition guard once the new category's query has settled
  // (or errored). Until then the loader stays up — no exhausted-state flash.
  useEffect(() => {
    if (isCategoryTransitioning && !isLoading && !isFetching) {
      setIsCategoryTransitioning(false);
    }
  }, [isCategoryTransitioning, isLoading, isFetching]);

  const getCardId = (item: any) => item?.id || item?.user_id;

  const listingIdsSignature = useMemo(() => {
    if (smartData.length === 0) return '';
    return `${getCardId(smartData[0]) || ''}_${getCardId(smartData[smartData.length - 1]) || ''}_${smartData.length}`;
  }, [smartData]);

  // React Query keeps the PREVIOUS queryKey's data as placeholder while a
  // new fetch is in flight. When the deck already has cards, we gate by
  // !isPlaceholderData to prevent the "opens one listing then swaps to
  // another" bug. But when the deck is EMPTY (after a category change),
  // we MUST seed even from placeholder data — the smartData memo already
  // filters to the current category, so it's safe. Without this, the
  // deck stays empty and the user sees a blank screen.
  const deckIsEmpty = deckQueueRef.current.length === 0;
  const canSeed = deckIsEmpty
    ? (listingIdsSignature.length > 0 && smartData.length > 0)
    : (!isPlaceholderData && !isFetching && listingIdsSignature !== prevListingIdsRef.current && listingIdsSignature.length > 0);

  if (canSeed) {
    const currentIds = new Set(deckQueueRef.current.map(l => getCardId(l)));
    const newIds = smartData.filter(l => !currentIds.has(getCardId(l)) && !swipedIdsRef.current.has(getCardId(l)));
    hasNewListingsRef.current = newIds.length > 0;
    prevListingIdsRef.current = listingIdsSignature;

    // First-paint seed: fill an empty deck from smartData. Once a card is
    // on screen the deck is owned by the user — new items arrive via the
    // append branch below as they swipe deeper.
    if (deckIsEmpty) {
      deckQueueRef.current = smartData;
      lockedFirstCardRef.current = smartData[0];
      setDeckLength(smartData.length);
    }
  }

  // HARD LOCK: while the user is on the first card (currentIndex 0), force
  // deck[0] to match the locked identity. This catches any other code path
  // that might mutate the deck (slice, re-seed, store sync) and snaps the
  // first card back so the user never sees a swap.
  if (
    lockedFirstCardRef.current &&
    currentIndexRef.current === 0 &&
    deckQueueRef.current.length > 0 &&
    getCardId(deckQueueRef.current[0]) !== getCardId(lockedFirstCardRef.current)
  ) {
    const restCards = deckQueueRef.current.filter(
      (c) => getCardId(c) !== getCardId(lockedFirstCardRef.current)
    );
    deckQueueRef.current = [lockedFirstCardRef.current, ...restCards];
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
    const nextId = getCardId(nextListing);
    if (nextId) {
      prefetchSchedulerRef.current.schedule(() => {
        prefetchListingDetails(nextId);
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

    const existingIds = new Set(deckQueueRef.current.map(l => getCardId(l)));
    const dismissedSet = new Set(dismissedIds);
    const newListings = smartData.filter(l => {
      const lid = getCardId(l);
      return !existingIds.has(lid) && !swipedIdsRef.current.has(lid) && (!isRefreshMode ? !dismissedSet.has(lid) : true);
    });

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
      setClientDeck(deckCategory || 'all', deckQueueRef.current, true);
      persistDeckToSession('client', 'listings', deckQueueRef.current);

      if (!isClientReady(deckCategory || 'all')) {
        markClientReady(deckCategory || 'all');
      }
    }

    isFetchingMore.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingIdsSignature, isLoading, isFetching, smartListings, setClientDeck, isClientReady, markClientReady, dismissedIds]);

  const isFilterChanging = filterSignature !== prevFilterSignatureRef.current;
  const deckQueue = isFilterChanging ? [] : deckQueueRef.current;
  const topCard = currentIndex < deckQueue.length ? deckQueue[currentIndex] : null;
  const topCardIdentity = getCardId(topCard) || '';

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
    // User swiped past the locked first card — release the lock so the deck
    // can now flow naturally.
    lockedFirstCardRef.current = null;

    hasSwipedRef.current = true;
    setCurrentIndex(newIndex);
    const listingId = getCardId(listing);
    markClientSwiped(deckCategory || 'all', listingId);

    recordSwipe(listingId, 'listing', direction);

    swipeMutation.mutate({
      targetId: listingId,
      direction,
      targetType: dataType === 'people' ? 'profile' : 'listing',
    });

    if (direction === 'left') {
      dismissTarget(listingId).catch(() => { });
    }

    queueMicrotask(() => {
      recordProfileView.mutateAsync({
        profileId: listingId,
        viewType: dataType === 'people' ? 'profile' : 'listing',
        action: direction === 'right' ? 'like' : 'pass'
      }).catch(() => { });
    });

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        persistDeckToSession('client', 'listings', deckQueueRef.current);
      }, { timeout: 2000 });
    } else {
      setTimeout(() => {
        persistDeckToSession('client', 'listings', deckQueueRef.current);
      }, 0);
    }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordSwipe, recordProfileView, markClientSwiped, queryClient, dismissTarget, swipeMutation, error, dataType, user?.id]);

  const executeSwipe = useCallback((direction: 'left' | 'right') => {
    if (isSwipeAnimatingRef.current) return;
    const listing = deckQueueRef.current[currentIndexRef.current];
    if (!listing) return;

    const newIndex = currentIndexRef.current + 1;
    
    // Reset motion values when a swipe completes
    topCardX.stop();
    topCardX.set(0);
    topCardY.stop();
    topCardY.set(0);

    isSwipeAnimatingRef.current = true;
    pendingSwipeRef.current = { listing, direction, newIndex };
    currentIndexRef.current = newIndex;
    swipedIdsRef.current.add(getCardId(listing));
    setSwipeDirection(direction);
    swipeDirectionRef.current = direction;

    flushPendingSwipe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [executeSwipe, playSwipeSound]);

  const handleInsights = useCallback(() => {
    setInsightsModalOpen(true);
    triggerHaptic('light');
  }, []);

  const handleShare = useCallback(() => {
    setShareDialogOpen(true);
    triggerHaptic('light');
  }, []);

  const handleSoon = useCallback(() => {
    appToast.success('Saved for later');
    triggerHaptic('light');
  }, []);

  const handleReport = useCallback(() => {
    const listing = deckQueueRef.current[currentIndexRef.current];
    if (listing) {
      setSelectedListing(listing);
      setReportDialogOpen(true);
      triggerHaptic('medium');
    }
  }, []);

  const handleBack = useCallback(() => {
    triggerHaptic('light');
    setActiveCategory(null as any);
    navigate(`/${activeMode}/dashboard`);
  }, [navigate, activeMode, setActiveCategory]);

  const handleMessage = useCallback(() => {
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

    if (!guardNewConversation(canStartNewConversation)) return;

    setSelectedListing(listing);
    setMessageDialogOpen(true);
    triggerHaptic('light');
    if (onMessageClick) onMessageClick();
  }, [activeMode, canNavigate, canStartNewConversation, conversations, navigate, onMessageClick]);

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
    if (!guardNewConversation(canStartNewConversation)) return;

    setIsCreatingConversation(true);
    startNavigation();
    try {
      // Race the create against a timeout so a hung network can never leave the
      // "Sending…" dialog spinning forever with the chat never opening (parity
      // with MessagingDashboard's auto-start path).
      const convo = await Promise.race([
        startConversation.mutateAsync({
          otherUserId: targetUserId,
          listingId: activeMode === 'owner' ? undefined : selectedListing.id,
          initialMessage: message,
          canStartNewConversation,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timed out connecting. Please check your connection and try again.')), 15000)
        ),
      ]);
      if (convo?.conversationId) {
        setMessageDialogOpen(false);
        setDirectMessageDialogOpen(false);
        navigate(`/messages?conversationId=${convo.conversationId}`);
      } else {
        // Resolved without an id — surface an error instead of silently leaving
        // the dialog stuck on its spinner.
        throw new Error('Could not open the conversation. Please try again.');
      }
    } catch (err) {
      handleStartConversationError(err, 'Error');
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

  if (!deckCategory) {
    return (
      <>
        <div className="relative w-full h-full flex flex-col">
          <BentoCategoryDashboard setCategories={(cat) => {
            if (cat === 'clients') {
              switchMode('owner');
              return;
            }
            if (cat === 'rentals') {
              selectDeckCategory('property', 'rent');
              return;
            }
            if (cat === 'property') {
              selectDeckCategory('property', 'sale');
              return;
            }
            if (cat === 'events') {
              navigate(EVENTS_FEED_PATH);
              return;
            }
            selectDeckCategory(cat as Parameters<typeof selectDeckCategory>[0], 'both');
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
    yacht: 'Yachts',
    services: 'Services',
    pros: 'Pros',
    events: 'Events',
    buyers: 'Buyers',
    renters: 'Renters',
    leads: 'Leads',
    hire: 'Workers',
  };
  const currentCategoryName = categoryNames[deckCategory] || deckCategory;

  if (
    deckQueue.length === 0
    && (isLoading || isFetching || isCategoryTransitioning || !isMountSettled)
  ) {
    return <SwipeLoadingSkeleton />;
  }

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
                    {deckQueue.slice(currentIndex, currentIndex + 3).reverse().map((listing, reversedIdx) => {
                      const listingId = getCardId(listing);
                      const isTopCard = listingId === getCardId(topCard);
                      // Stack depth: cards behind the top card appear progressively smaller/offset
                      const totalVisible = Math.min(deckQueue.length - currentIndex, 3);
                      const stackPosition = totalVisible - 1 - reversedIdx; // 0 = top, 1 = second, 2 = third
                      
                      // Base scale/y before any drag
                      const baseScale = 1 - stackPosition * 0.04;
                      const baseY = stackPosition * 8;
                      const baseOpacity = 1 - stackPosition * 0.15;

                      // Next state scale/y (what it will be when top card is gone)
                      const nextScale = 1 - Math.max(0, stackPosition - 1) * 0.04;
                      const nextY = Math.max(0, stackPosition - 1) * 8;
                      const nextOpacity = 1 - Math.max(0, stackPosition - 1) * 0.15;

                      // Interpolate between base and next state based on dragProgress
                      const stackScale = isTopCard ? 1 : useTransform(dragProgress, [0, 1], [baseScale, nextScale]);
                      const stackTranslateY = isTopCard ? 0 : useTransform(dragProgress, [0, 1], [baseY, nextY]);
                      const stackOpacityVal = isTopCard ? 1 : useTransform(dragProgress, [0, 1], [baseOpacity, nextOpacity]);

                      const stackZIndex = 20 - stackPosition * 5;

                      return (
                        <motion.div
                          key={listingId || Math.random().toString()}
                          exit={{ opacity: 0, transition: { duration: 0.15 } }}
                          className={cn("absolute inset-0 w-full h-full")}
                          style={{
                            zIndex: stackZIndex,
                            scale: stackScale,
                            y: stackTranslateY,
                            opacity: stackOpacityVal,
                            transformOrigin: 'center top',
                            pointerEvents: isTopCard ? 'auto' : 'none',
                          }}
                        >
                        {dataType === 'people' ? (
                          <SimpleOwnerSwipeCard
                            ref={isTopCard ? cardRef as any : undefined}
                            externalX={isTopCard ? topCardX : undefined}
                            externalY={isTopCard ? topCardY : undefined}
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
                            renderTopRail={isTopCard ? memoizedTopRail : undefined}
                          />
                        ) : (
                          <SimpleSwipeCard
                            ref={isTopCard ? cardRef : undefined}
                            externalX={isTopCard ? topCardX : undefined}
                            externalY={isTopCard ? topCardY : undefined}
                            listing={listing}
                            isTop={isTopCard}
                            fullScreen={false}
                            onSwipe={isTopCard ? handleSwipe : undefined}
                            onCardTap={isTopCard ? handleInsights : undefined}
                            onInsights={isTopCard ? handleInsights : undefined}
                            onShare={isTopCard ? handleShare : undefined}
                            onSoon={isTopCard ? handleSoon : undefined}
                            onMessage={isTopCard ? handleMessage : undefined}
                            onExit={isTopCard ? handleBack : undefined}
                            onUndo={isTopCard ? undoLastSwipe : undefined}
                            canUndo={canUndo}
                            onReport={isTopCard ? handleReport : undefined}
                            onDragStart={isTopCard ? handleDragStart : undefined}
                            renderTopRail={isTopCard ? memoizedTopRail : undefined}
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
                  <SwipeLoadingSkeleton />
                ) : error && deckQueue.length === 0 ? (
                  <SwipeErrorState
                    isRetrying={isLoading || isFetching}
                    onRetry={() => {
                      const key = dataType === 'people' ? 'smart-clients' : 'smart-listings';
                      queryClient.invalidateQueries({ queryKey: [key] });
                    }}
                  />
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
                  activeCategory={deckCategory}
                  onCategoryChange={(cat) => {
                    triggerHaptic('medium');
                    if (cat === 'events') {
                      navigate(EVENTS_FEED_PATH);
                      return;
                    }
                    setActiveCategory(cat as any);
                    setCategories([cat] as any);
                    // Picking a quick filter is what kicks off the immersive
                    // auto-hide: arm it, then reveal so header + bottom nav fade
                    // at 3.5s and the right rail at 4s (see useChromeReveal).
                    // Before this the chrome stays put.
                    enableChromeAutoHide();
                    revealChrome();
                  }}
                  onOpenFilters={() => {
                    triggerHaptic('medium');
                    navigate(userRole === 'owner' ? '/owner/filters' : '/client/filters');
                  }}
                  onOpenMap={() => {
                    triggerHaptic('heavy');
                    prefetchPassportMapImmediate();
                    useModalStore.getState().openPassportMap();
                  }}
                  onOpenAIWizard={() => {
                    triggerHaptic('heavy');
                    if (userRole === 'owner') {
                      useModalStore.getState().openAIListing();
                    } else {
                      useModalStore.getState().openAIProfile('client');
                    }
                  }}
                  onBack={handleBack}
                  role={userRole === 'owner' ? 'owner' : 'client'}
                />
                )}
              </motion.div>
            )}
          </AnimatePresence>
      </motion.div>
    </div>

          {/* Bottom action bar removed ÔÇö the same actions (Share / Message /
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
            onConnect={handleMessage}
            onReport={() => { setSelectedListing(topCard); setReportDialogOpen(true); }}
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
