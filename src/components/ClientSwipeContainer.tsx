import { useState, useCallback, useRef, useEffect, memo, lazy, Suspense, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { SwipeAllDashboard } from './swipe/SwipeAllDashboard';
import { useModalStore } from '@/state/modalStore';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { triggerHaptic } from '@/utils/haptics';
import { preloadClientImageToCache } from '@/lib/swipe/imageCache';
import { imagePreloadController } from '@/lib/swipe/ImagePreloadController';
import { imageCache } from '@/lib/swipe/cardImageCache';
import { swipeQueue } from '@/lib/swipe/SwipeQueue';
import { PrefetchScheduler } from '@/lib/swipe/PrefetchScheduler';
import { useSmartClientMatching } from '@/hooks/useSmartMatching';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useSwipeWithMatch } from '@/hooks/useSwipeWithMatch';
import { useCanAccessMessaging } from '@/hooks/useMessaging';
import { useSwipeUndo } from '@/hooks/useSwipeUndo';
import { SimpleOwnerSwipeCard, SimpleOwnerSwipeCardRef } from './SimpleOwnerSwipeCard';
import { useRecordProfileView } from '@/hooks/useProfileRecycling';
import { usePrefetchImages } from '@/hooks/usePrefetchImages';
import { usePrefetchManager, useSwipePrefetch } from '@/hooks/usePrefetchManager';
import { useSwipeDeckStore, persistDeckToSession } from '@/state/swipeDeckStore';
import { useFilterStore } from '@/state/filterStore';
import { useShallow } from 'zustand/react/shallow';
import { useSwipeDismissal } from '@/hooks/useSwipeDismissal';
import { useSwipeSounds } from '@/hooks/useSwipeSounds';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, MapPin, Bike, Wrench } from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { appToast } from '@/utils/appNotification';
import { useStartConversation } from '@/hooks/useConversations';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/utils/prodLogger';
import { SwipeExhaustedState } from './swipe/SwipeExhaustedState';
import { SwipeDeckBackButton } from './swipe/SwipeDeckBackButton';
import { usePullDownToDismiss } from './swipe/usePullDownToDismiss';
import { Home, RefreshCw, ChevronLeft, SlidersHorizontal } from 'lucide-react';

import { cn } from '@/lib/utils';
import useAppTheme from "@/hooks/useAppTheme";
import { ConnectingOverlay } from '@/components/ConnectingOverlay';
import { SwipeActionButtonBar } from '@/components/SwipeActionButtonBar';
import { useChromeReveal } from '@/hooks/useChromeReveal';

const ShareDialog = lazy(() => import('./ShareDialog').then(m => ({ default: m.ShareDialog })));
const MessageConfirmationDialog = lazy(() => import('./MessageConfirmationDialog').then(m => ({ default: m.MessageConfirmationDialog })));
const ReportDialog = lazy(() => import('./ReportDialog').then(m => ({ default: m.ReportDialog })));
import { OWNER_INTENT_CARDS } from './swipe/CardData';



interface ClientSwipeContainerProps {
  onClientTap: (clientId: string) => void;
  onInsights?: (clientId: string) => void;
  onMessageClick?: (clientId: string) => void;
  profiles?: any[];
  isLoading?: boolean;
  error?: any;
  insightsOpen?: boolean;
  category?: string;
  filters?: any;
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
  const { user } = useAuth();

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

  useEffect(() => {
    if (storeActiveCategory && storeActiveCategory !== category) {
      console.warn('[ClientSwipeContainer] Store activeCategory differs from component category:', { storeActiveCategory, componentCategory: category });
    }
  }, [storeActiveCategory, category]);

  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [_swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingRecipient, setConnectingRecipient] = useState("");
  const cardRef = useRef<SimpleOwnerSwipeCardRef>(null);

  const [canClickBack, setCanClickBack] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setCanClickBack(true), 1500);
    return () => clearTimeout(timer);
  }, []);

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

  const [currentIndex, setCurrentIndex] = useState(0);
  const [_deckLength, setDeckLength] = useState(0);

  const radiusKm = useFilterStore(s => s.radiusKm);
  const setRadiusKm = useFilterStore(s => s.setRadiusKm);
  const userLatitude = useFilterStore(s => s.userLatitude);
  const userLongitude = useFilterStore(s => s.userLongitude);
  const setUserLocation = useFilterStore(s => s.setUserLocation);
  
  const [locationDetecting, setLocationDetecting] = useState(false);
  const [locationDetected, setLocationDetected] = useState(false);

  const handleCycleCategory = useCallback(() => {
    triggerHaptic('heavy');
    const cycle: string[] = ['buyers', 'renters', 'hire'];
    const currentIdx = cycle.indexOf(storeActiveCategory as any);
    const nextIdx = (currentIdx + 1) % cycle.length;
    setActiveCategory(cycle[nextIdx] as any);
  }, [storeActiveCategory, setActiveCategory]);

  const radarNodes = useMemo(() => (externalProfiles || []).map(p => ({
    id: p.user_id || p.id,
    lat: p.latitude || 0,
    lng: p.longitude || 0,
    label: p.name || 'Found'
  })), [externalProfiles]);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocationDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation(pos.coords.latitude, pos.coords.longitude);
        setRadiusKm(5);
        setLocationDetected(true);
        setLocationDetecting(false);
      },
      () => {
        setLocationDetecting(false);
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  }, [setUserLocation, setRadiusKm]);

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

  const getInitialDeck = () => [];

  const deckQueueRef = useRef<any[]>(getInitialDeck());
  const currentDeckState = useSwipeDeckStore.getState().ownerDecks[category];
  const currentIndexRef = useRef(currentDeckState?.currentIndex || 0);
  const swipedIdsRef = useRef<Set<string>>(new Set(currentDeckState?.swipedIds || []));
  const _initializedRef = useRef(deckQueueRef.current.length > 0);

  useEffect(() => {
    setCurrentIndex(currentIndexRef.current);
  }, []);

  const isMountSettledRef = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => { isMountSettledRef.current = true; }, 400);
    return () => clearTimeout(t);
  }, []);

  const filterSignature = (() => {
    if (!filters) return 'default';
    return [
      filters.category || '',
      Array.isArray(filters.categories) ? filters.categories.join(',') : '',
      filters.listingType || '',
      filters.clientGender || '',
      filters.clientType || '',
    ].join('|');
  })();

  const prevFilterSignatureRef = useRef<string>(filterSignature);
  const filterChangedRef = useRef(false);

  if (filterSignature !== prevFilterSignatureRef.current) {
    filterChangedRef.current = true;
    prevFilterSignatureRef.current = filterSignature;
    deckQueueRef.current = [];
    currentIndexRef.current = 0;
    swipedIdsRef.current.clear();
  }

  useEffect(() => {
    if (!filterChangedRef.current) return;
    filterChangedRef.current = false;
    logger.info('[ClientSwipeContainer] Filters changed, resetting deck');
    currentIndexRef.current = 0;
    setCurrentIndex(0);
    setDeckLength(0);
    deckQueueRef.current = [];
    swipedIdsRef.current.clear();
    setPage(0);
    resetOwnerDeck(category);
  }, [filterSignature, category, resetOwnerDeck]);

  const isReturningRef = useRef(
    deckQueueRef.current.length > 0 && useSwipeDeckStore.getState().ownerDecks[category]?.isReady
  );
  const _hasAnimatedOnceRef = useRef(isReturningRef.current);

  const eagerPreloadInitiatedRef = useRef(false);
  if (!eagerPreloadInitiatedRef.current && deckQueueRef.current.length > 0) {
    eagerPreloadInitiatedRef.current = true;
    const currentIdx = currentIndexRef.current;
    const imagesToPreload: string[] = [];
    [0, 1, 2, 3, 4].forEach((offset) => {
      const profile = deckQueueRef.current[currentIdx + offset];
      if (profile?.profile_images && Array.isArray(profile.profile_images)) {
        profile.profile_images.forEach((imgUrl: string) => {
          if (imgUrl) {
            imagesToPreload.push(imgUrl);
            preloadClientImageToCache(imgUrl);
            imageCache.set(imgUrl, true);
          }
        });
      } else if (profile?.avatar_url) {
        imagesToPreload.push(profile.avatar_url);
        preloadClientImageToCache(profile.avatar_url);
        imageCache.set(profile.avatar_url, true);
      }
    });
    if (imagesToPreload.length > 0) {
      imagePreloadController.preloadBatch(imagesToPreload);
    }
  }

  const [isRefreshMode, setIsRefreshMode] = useState(false);
  const [page, setPage] = useState(0);
  const isFetchingMore = useRef(false);
  const prefetchSchedulerRef = useRef(new PrefetchScheduler());

  const topCardX = useMotionValue(0);
  const topCardY = useMotionValue(0);

  const nextCardScale = useTransform(
    [topCardX, topCardY] as any,
    ([cx, cy]: any) => {
      const a = Math.min(1, Math.abs(cx) / 280);
      const b = Math.min(1, Math.abs(cy) / 240);
      const t = Math.max(a, b);
      return 0.97 + 0.03 * t;
    }
  );
  const nextCardOpacity = useTransform(
    [topCardX, topCardY] as any,
    ([cx, cy]: any) => {
      const a = Math.min(1, Math.abs(cx) / 280);
      const b = Math.min(1, Math.abs(cy) / 240);
      const t = Math.max(a, b);
      return 0.72 + 0.26 * t;
    }
  );

  useEffect(() => {
    try { sessionStorage.removeItem('swipe-deck-items'); } catch (_err) { }
  }, [category]);

  const filterCategory = filters?.categories?.[0] || filters?.category || undefined;
  const { 
    data: internalProfiles = [], 
    isLoading: internalIsLoading, 
    refetch, 
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
    !!externalProfiles
  );

  const clientProfiles = externalProfiles || internalProfiles;
  const isLoading = externalIsLoading !== undefined ? externalIsLoading : internalIsLoading;
  const error = externalError !== undefined ? externalError : internalError;

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
  const recordProfileView = useRecordProfileView();
  const { playSwipeSound } = useSwipeSounds();

  const { dismissedIds, dismissTarget, filterDismissed: _filterDismissed } = useSwipeDismissal('client');
  const { prefetchClientProfileDetails } = usePrefetchManager();

  useEffect(() => {
    if (undoSuccess) {
      const storeState = useSwipeDeckStore.getState();
      const ownerDeck = storeState.ownerDecks[category];
      const newIndex = ownerDeck?.currentIndex ?? 0;
      currentIndexRef.current = newIndex;
      setCurrentIndex(newIndex);
      swipedIdsRef.current = new Set(ownerDeck?.swipedIds || []);
      resetUndoState();
      logger.info('[ClientSwipeContainer] Synced local state after undo, new index:', newIndex);
    }
  }, [undoSuccess, resetUndoState, category]);

  usePrefetchImages({
    currentIndex: currentIndex,
    profiles: deckQueueRef.current,
    prefetchCount: 3,
    trigger: currentIndex
  });

  useSwipePrefetch(
    user?.id,
    currentIndexRef.current,
    page,
    deckQueueRef.current.length
  );

  useEffect(() => {
    if (user?.id) {
      swipeQueue.setUserId(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    const scheduler = prefetchSchedulerRef.current;
    return () => {
      scheduler.cancel();
    };
  }, []);

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

  useEffect(() => {
    if (clientProfiles.length > 0 && !isLoading) {
      const existingIds = new Set(deckQueueRef.current.map(p => p.user_id));
      const dismissedSet = new Set(dismissedIds);
      const newProfiles = clientProfiles.filter(p => {
        if (user?.id && p.user_id === user.id) {
          logger.warn('[ClientSwipeContainer] Filtering out own profile from deck:', p.user_id);
          return false;
        }
        return !existingIds.has(p.user_id) && !swipedIdsRef.current.has(p.user_id) && !dismissedSet.has(p.user_id);
      });

      if (newProfiles.length > 0) {
        deckQueueRef.current = [...deckQueueRef.current, ...newProfiles];
        if (deckQueueRef.current.length > 50) {
          const offset = deckQueueRef.current.length - 50;
          deckQueueRef.current = deckQueueRef.current.slice(offset);
          const newIndex = Math.max(0, currentIndexRef.current - offset);
          currentIndexRef.current = newIndex;
          setCurrentIndex(newIndex);
        }
        setDeckLength(deckQueueRef.current.length);
        setOwnerDeck(category, deckQueueRef.current, true);
        persistDeckToSession('owner', category, deckQueueRef.current);
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

  const executeSwipe = useCallback((direction: 'left' | 'right') => {
    const profile = deckQueueRef.current[currentIndexRef.current];
    if (!profile || !profile.user_id) {
      logger.warn('[ClientSwipeContainer] Cannot swipe - no valid profile at current index');
      return;
    }
    if (user?.id && profile.user_id === user.id) {
      logger.error('[ClientSwipeContainer] BLOCKED: Attempted to swipe on own profile!', { userId: user.id });
      appToast.error('Oops!', 'You cannot swipe on your own profile');
      return;
    }

    const newIndex = currentIndexRef.current + 1;
    topCardX.stop(); topCardX.set(0);
    topCardY.stop(); topCardY.set(0);
    setSwipeDirection(direction);
    currentIndexRef.current = newIndex;
    setCurrentIndex(newIndex);
    swipedIdsRef.current.add(profile.user_id);

    Promise.all([
      Promise.resolve(markOwnerSwiped(category, profile.user_id)),
      recordProfileView.mutateAsync({
        profileId: profile.user_id,
        viewType: 'profile',
        action: direction === 'left' ? 'pass' : 'like'
      }).catch((err) => {
        logger.error('[ClientSwipeContainer] Failed to record profile view:', err);
      }),
      swipeMutation.mutateAsync({
          targetId: profile.user_id,
          direction,
          targetType: 'profile'
        }).then(() => {
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
              if (!oldData) return [likedClient];
              const exists = oldData.some((item: any) => item.id === likedClient.id || item.user_id === likedClient.user_id);
              if (exists) return oldData;
              return [likedClient, ...oldData];
            });
          }
        }).catch((err: any) => {
          logger.error('[ClientSwipeContainer] Swipe save error:', err);
          const errorMessage = err?.message?.toLowerCase() || '';
          const errorCode = err?.code || '';
          const isExpectedError =
            errorMessage.includes('cannot like your own') ||
            errorMessage.includes('your own profile') ||
            errorMessage.includes('duplicate') ||
            errorMessage.includes('already exists') ||
            errorMessage.includes('violates unique constraint') ||
            errorMessage.includes('profile not found') ||
            errorMessage.includes('skipped') ||
            errorCode === '23505' ||
            errorCode === '42501' ||
            errorCode === '23503';
          if (errorMessage.includes('cannot like your own') || errorMessage.includes('your own profile')) {
            appToast.error('Oops!', 'You cannot swipe on your own profile');
          } else if (errorMessage.includes('no longer available') || errorMessage.includes('no longer active') || errorMessage.includes('unable to save like')) {
            appToast.error('Unable to save like', err?.message || 'This profile is no longer available');
          } else if (!isExpectedError) {
            appToast.error('Failed to save your like', 'Your swipe was not saved. Please try again or check your connection.');
          }
        }),
      direction === 'left' ? dismissTarget(profile.user_id).catch(() => {}) : Promise.resolve(),
      Promise.resolve(recordSwipe(profile.user_id, 'profile', direction, category))
    ]).catch(err => {
      logger.error('[ClientSwipeContainer] Background swipe tasks failed:', err);
    });

    setTimeout(() => setSwipeDirection(null), 300);

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
    if (!profile || !profile.user_id) {
      logger.warn('[ClientSwipeContainer] Cannot swipe - no valid profile at current index');
      return;
    }
    triggerHaptic(direction === 'right' ? 'success' : 'light');
    playSwipeSound(direction);
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

  const handleSkip = useCallback(() => {
    const profile = deckQueueRef.current[currentIndexRef.current];
    if (!profile?.user_id) return;
    triggerHaptic('light');
    const newIndex = currentIndexRef.current + 1;
    topCardX.stop(); topCardX.set(0);
    topCardY.stop(); topCardY.set(0);
    currentIndexRef.current = newIndex;
    setCurrentIndex(newIndex);
    [1, 2, 3].forEach((offset) => {
      const future = deckQueueRef.current[newIndex + offset];
      if (future?.profile_images?.[0]) preloadClientImageToCache(future.profile_images[0]);
    });
  }, [topCardX, topCardY]);

  const handleSkipBack = useCallback(() => {
    if (currentIndexRef.current <= 0) return;
    triggerHaptic('light');
    topCardX.stop(); topCardX.set(0);
    topCardY.stop(); topCardY.set(0);
    const newIndex = Math.max(0, currentIndexRef.current - 1);
    currentIndexRef.current = newIndex;
    setCurrentIndex(newIndex);
  }, [topCardX, topCardY]);

  const handleButtonLike = useCallback(() => {
    if (cardRef.current) cardRef.current.triggerSwipe('right');
    else handleSwipe('right');
  }, [handleSwipe]);

  const handleButtonDislike = useCallback(() => {
    if (cardRef.current) cardRef.current.triggerSwipe('left');
    else handleSwipe('left');
  }, [handleSwipe]);

  const handleInsights = useCallback((clientId: string) => {
    navigate(`/owner/view-client/${clientId}`);
  }, [navigate]);

  const handleShare = useCallback(() => {
    setShareDialogOpen(true);
    triggerHaptic('light');
  }, []);

  const handleConnect = useCallback((clientId: string) => {
    triggerHaptic('light');
    navigate(`/messages?startConversation=${clientId}`);
  }, [navigate]);

  const handleSendMessage = useCallback(async (message: string) => {
    if (isCreatingConversation || !selectedClientId) return;
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

  const deckQueue = deckQueueRef.current;
  const topCard = currentIndex < deckQueue.length ? deckQueue[currentIndex] : null;
  const pullDown = usePullDownToDismiss();
  const { isChromeVisible } = useChromeReveal();
  const _nextCard = currentIndex + 1 < deckQueue.length ? deckQueue[currentIndex + 1] : null;

  const hasHydratedData = isOwnerHydrated(category) || isOwnerReady(category) || deckQueue.length > 0;
  const showLoadingSkeleton = !hasHydratedData && (isLoading || !isMountSettledRef.current);
  const _isDeckFinished = !showLoadingSkeleton && topCard === null && (hasHydratedData || !isLoading || isMountSettledRef.current);
  const _showInitialError = !hasHydratedData && error && deckQueue.length === 0;
  const _showEmptyState = !isLoading && deckQueue.length === 0 && !error && isMountSettledRef.current;

  if (showLoadingSkeleton) {
    return (
      <div className="relative w-full h-full flex-1 flex flex-col">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-0 rounded-3xl overflow-hidden bg-white/8 animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-white/10">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"
                style={{ animationDuration: '1.5s', backgroundSize: '200% 100%' }} />
            </div>
            <div className="absolute top-3 left-0 right-0 z-30 flex justify-center gap-1 px-4">
              {[1, 2, 3, 4].map((num) => (
                <div key={`skeleton-dot-${num}`} className="flex-1 h-1 rounded-full bg-white/20" />
              ))}
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-xl rounded-t-[24px] p-4 pt-6">
              <div className="flex justify-center mb-2">
                <div className="w-10 h-1.5 bg-white/30 rounded-full" />
              </div>
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4 bg-white/20" />
                  <Skeleton className="h-4 w-1/2 bg-white/15" />
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="h-6 w-20 bg-white/20" />
                  <Skeleton className="h-3 w-12 bg-white/15 ml-auto" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-4 w-12 bg-white/15" />
                <Skeleton className="h-4 w-12 bg-white/15" />
                <Skeleton className="h-4 w-16 bg-white/15" />
              </div>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0 flex justify-center items-center py-3 px-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-14 h-14 rounded-full bg-muted/40" />
            <Skeleton className="w-11 h-11 rounded-full bg-muted/30" />
            <Skeleton className="w-11 h-11 rounded-full bg-muted/30" />
            <Skeleton className="w-14 h-14 rounded-full bg-muted/40" />
          </div>
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

        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10" />

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
          <AnimatePresence mode="sync" initial={true}>
            {topCard ? (
              <motion.div 
                key={`deck-${category}`}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-0 mx-auto transform-gpu"
              >
                {deckQueue.slice(currentIndex, currentIndex + 2).reverse().map((profile) => {
                  const isTopCard = profile.user_id === topCard.user_id;
                  return (
                    <motion.div
                      key={profile.user_id}
                      className={cn("absolute inset-0 w-full h-full", isTopCard ? "z-20" : "z-10")}
                      style={!isTopCard ? {
                        scale: nextCardScale,
                        opacity: nextCardOpacity,
                        willChange: 'transform, opacity',
                      } : undefined}
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
                        onReport={isTopCard ? () => { triggerHaptic('medium'); setReportDialogOpen(true); } : undefined}
                        onUndo={isTopCard ? undoLastSwipe : undefined}
                        onLike={isTopCard ? handleButtonLike : undefined}
                        onDislike={isTopCard ? handleButtonDislike : undefined}
                        canUndo={canUndo}
                        isTop={isTopCard}
                        fullScreen={true}
                        externalX={isTopCard ? topCardX : undefined}
                        externalY={isTopCard ? topCardY : undefined}
                      />
                    </motion.div>
                  );
                })}
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
                  onRadiusChange={((km: number) => {
                    setRadiusKm(km);
                    if (!userLatitude || !userLongitude) detectLocation();
                  }) as any}
                  onDetectLocation={detectLocation}
                  detecting={locationDetecting}
                  detected={locationDetected}
                  categoryName={labels.plural}
                  isLoading={isLoading || !isMountSettledRef.current}
                  activeCategory={storeActiveCategory || category}
                  onCategoryChange={(cat) => {
                    setActiveCategory(cat as any);
                  }}
                  onOpenFilters={() => {
                    navigate('/owner/filters');
                  }}
                  role="owner"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        </div>


        {/* 🛸 ACTION BAR: Tied to chrome visibility (shows/hides with TopBar+BottomNav) */}
        {topCard && (
          <motion.div
            className="absolute bottom-[calc(var(--bottom-nav-height,64px)+8px)] left-0 right-0 z-[60] flex justify-center"
            animate={{ opacity: isChromeVisible ? 1 : 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ y: pullDown.y, pointerEvents: isChromeVisible ? 'auto' : 'none' }}
          >
            <SwipeActionButtonBar
              onShare={handleShare}
              onInsights={() => handleInsights(topCard.user_id)}
              onMessage={() => handleConnect(topCard.user_id)}
              onReport={() => { triggerHaptic('medium'); setReportDialogOpen(true); }}
            />
          </motion.div>
        )}
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

export default ClientSwipeContainer;


