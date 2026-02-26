import { useState, useCallback, useRef, useEffect, memo, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { triggerHaptic } from '@/utils/haptics';
import { SimpleOwnerSwipeCard } from './SimpleOwnerSwipeCard';
import { preloadClientImageToCache, isClientImageDecodedInCache } from '@/lib/swipe/imageCache';
import { imagePreloadController } from '@/lib/swipe/ImagePreloadController';
import { imageCache } from '@/lib/swipe/cardImageCache';
import { swipeQueue } from '@/lib/swipe/SwipeQueue';

// FIX: Lazy-load modals via portal to prevent re-renders from bleeding into swipe tree
const MatchCelebration = lazy(() => import('./MatchCelebration').then(m => ({ default: m.MatchCelebration })));
const ShareDialog = lazy(() => import('./ShareDialog').then(m => ({ default: m.ShareDialog })));
const MessageConfirmationDialog = lazy(() => import('./MessageConfirmationDialog').then(m => ({ default: m.MessageConfirmationDialog })));

import { useSmartClientMatching } from '@/hooks/useSmartMatching';
import { useAuth } from '@/hooks/useAuth';
import { useSwipe } from '@/hooks/useSwipe';
import { useCanAccessMessaging } from '@/hooks/useMessaging';
import { useSwipeUndo } from '@/hooks/useSwipeUndo';
import { useRecordProfileView } from '@/hooks/useProfileRecycling';
import { usePrefetchImages } from '@/hooks/usePrefetchImages';
import { usePrefetchManager, useSwipePrefetch } from '@/hooks/usePrefetchManager';
import { useSwipeDeckStore, persistDeckToSession, getDeckFromSession } from '@/state/swipeDeckStore';
import { useSwipeDismissal } from '@/hooks/useSwipeDismissal';
import { useSwipeSounds } from '@/hooks/useSwipeSounds';
import { shallow } from 'zustand/shallow';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, Users, MapPin, Bike, CircleDot, Wrench, User } from 'lucide-react';
import { RadarSearchEffect, RadarSearchIcon } from '@/components/ui/RadarSearchEffect';
import { toast as sonnerToast } from 'sonner';
import { useStartConversation } from '@/hooks/useConversations';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { logger } from '@/utils/prodLogger';

/**
 * PrefetchScheduler - Throttles prefetch operations to prevent competition with image decoding
 * Uses requestIdleCallback to defer prefetch until browser is idle
 */
class PrefetchScheduler {
  private scheduled = false;
  private callback: (() => void) | null = null;
  private idleHandle: number | null = null;

  schedule(callback: () => void, delayMs = 300): void {
    // Cancel any pending prefetch
    this.cancel();

    this.callback = callback;
    this.scheduled = true;

    // Wait for a brief delay to let current image decode complete
    setTimeout(() => {
      if (!this.scheduled || !this.callback) return;

      if ('requestIdleCallback' in window) {
        this.idleHandle = (window as any).requestIdleCallback(() => {
          if (this.callback) this.callback();
          this.scheduled = false;
        }, { timeout: 2000 });
      } else {
        this.callback();
        this.scheduled = false;
      }
    }, delayMs);
  }

  cancel(): void {
    this.scheduled = false;
    this.callback = null;
    if (this.idleHandle !== null && 'cancelIdleCallback' in window) {
      (window as any).cancelIdleCallback(this.idleHandle);
      this.idleHandle = null;
    }
  }
}

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
  onInsights,
  onMessageClick,
  profiles: externalProfiles,
  isLoading: externalIsLoading,
  error: externalError,
  insightsOpen = false,
  category = 'default',
  filters
}: ClientSwipeContainerProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // PERF: Get userId from auth to pass to query (avoids getUser() inside queryFn)
  const { user } = useAuth();

  // Dynamic labels based on category
  const getCategoryLabel = () => {
    switch (category) {
      case 'property': return { singular: 'Property', plural: 'Properties', searchText: 'Searching for Properties', icon: <MapPin className="w-6 h-6 opacity-80" strokeWidth={3} /> };
      case 'bicycle': return { singular: 'Bicycle', plural: 'Bicycles', searchText: 'Searching for Bicycles', icon: <Bike className="w-6 h-6 opacity-80" strokeWidth={3} /> };
      case 'motorcycle': return { singular: 'Motorcycle', plural: 'Motorcycles', searchText: 'Searching for Motorcycles', icon: <CircleDot className="w-6 h-6 opacity-80" strokeWidth={3} /> };
      case 'worker': return { singular: 'Job', plural: 'Jobs', searchText: 'Searching for Jobs', icon: <Wrench className="w-6 h-6 opacity-80" strokeWidth={3} /> };
      default: return { singular: 'Client', plural: 'Clients', searchText: 'Searching for Listings', icon: <User className="w-6 h-6 opacity-80" strokeWidth={3} /> };
    }
  };

  const labels = getCategoryLabel();
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [matchCelebration, setMatchCelebration] = useState<{
    isOpen: boolean;
    clientProfile?: any;
    ownerProfile?: any;
  }>({ isOpen: false });

  // PERF: Use selective subscriptions to prevent re-renders on unrelated store changes
  // Only subscribe to actions (stable references) - NOT to ownerDecks object
  // This is the key fix for "double render" feeling when navigating back to dashboard
  const setOwnerDeck = useSwipeDeckStore((state) => state.setOwnerDeck);
  const markOwnerSwiped = useSwipeDeckStore((state) => state.markOwnerSwiped);
  const resetOwnerDeck = useSwipeDeckStore((state) => state.resetOwnerDeck);
  const isOwnerHydrated = useSwipeDeckStore((state) => state.isOwnerHydrated);
  const isOwnerReady = useSwipeDeckStore((state) => state.isOwnerReady);
  const markOwnerReady = useSwipeDeckStore((state) => state.markOwnerReady);

  // Local state for immediate UI updates - drives the swipe animation
  const [currentIndex, setCurrentIndex] = useState(0);

  // FIX: Track deck length in state to force re-render when profiles are appended
  // Without this, the "No Clients Found" empty state persists because
  // appending to deckQueueRef alone doesn't trigger a React re-render
  const [deckLength, setDeckLength] = useState(0);

  // PERF: Get initial state ONCE using getState() - no subscription
  // This is synchronous and doesn't cause re-renders when store updates
  // CRITICAL: Filter out own profile from cached deck items
  const filterOwnProfile = useCallback((items: any[], userId: string | undefined) => {
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
  const initializedRef = useRef(deckQueueRef.current.length > 0);

  // Sync state with ref on mount
  useEffect(() => {
    setCurrentIndex(currentIndexRef.current);
  }, []);

  // PERF FIX: Create stable filter signature for deck versioning
  // This detects when filters actually changed vs just navigation return
  // More precise than array comparison - handles all filter types
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

  // Track previous filter signature to detect filter changes
  const prevFilterSignatureRef = useRef<string>(filterSignature);
  const filterChangedRef = useRef(false);

  // Detect filter changes synchronously during render (not in useEffect)
  if (filterSignature !== prevFilterSignatureRef.current) {
    filterChangedRef.current = true;
    prevFilterSignatureRef.current = filterSignature;
  }

  // PERF FIX: Reset deck ONLY when filters actually change (not on navigation return)
  useEffect(() => {
    // Skip on initial mount
    if (!filterChangedRef.current) return;

    // Reset the filter changed flag
    filterChangedRef.current = false;

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
  const hasAnimatedOnceRef = useRef(isReturningRef.current);

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
  const [isRefreshMode, setIsRefreshMode] = useState(false);
  const [page, setPage] = useState(0);
  const isFetchingMore = useRef(false);
  const prefetchSchedulerRef = useRef(new PrefetchScheduler());

  // FIX: Hydration sync disabled — DB query is the single source of truth
  // The query with refetchOnMount:'always' ensures fresh data on every mount
  // No need to restore stale cached decks that may contain already-swiped items
  useEffect(() => {
    // Clear any stale session storage on mount
    try { sessionStorage.removeItem(`swipe-deck-owner-${category}`); } catch (err) { /* Ignore session storage errors */ }
  }, [category]);

  // ========================================
  // 🔥 CRITICAL: ALL HOOKS MUST BE AT TOP
  // ========================================
  // React requires hooks to be called in the SAME ORDER on EVERY render.
  // NO early returns before all hooks execute!

  // PERF: pass userId to avoid getUser() inside queryFn
  // Extract category from filters if available (for filtering client profiles by their interests)
  const filterCategory = filters?.categories?.[0] || filters?.category || undefined;
  const { data: internalProfiles = [], isLoading: internalIsLoading, refetch, isRefetching, error: internalError } = useSmartClientMatching(user?.id, filterCategory, page, 50, isRefreshMode, filters);

  const clientProfiles = externalProfiles || internalProfiles;
  const isLoading = externalIsLoading !== undefined ? externalIsLoading : internalIsLoading;
  const error = externalError !== undefined ? externalError : internalError;

  const swipeMutation = useSwipe();
  const { canAccess: hasPremiumMessaging, needsUpgrade } = useCanAccessMessaging();
  const { recordSwipe, undoLastSwipe, canUndo, isUndoing, undoSuccess, resetUndoState } = useSwipeUndo();
  const startConversation = useStartConversation();
  const recordProfileView = useRecordProfileView();
  const { playSwipeSound } = useSwipeSounds();

  // Swipe dismissal tracking for client profiles
  const { dismissedIds, dismissTarget, filterDismissed } = useSwipeDismissal('client');

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
    return () => {
      prefetchSchedulerRef.current.cancel();
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

    return () => {
      prefetchSchedulerRef.current.cancel();
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
      sonnerToast.error('Oops!', { description: 'You cannot swipe on your own profile' });
      return;
    }

    const newIndex = currentIndexRef.current + 1;

    // 1. UPDATE UI STATE FIRST (INSTANT)
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
      }).catch((err) => {
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
          sonnerToast.error('Oops!', {
            description: 'You cannot swipe on your own profile'
          });
        }
        // Show specific error messages for profile issues (not available, inactive, etc.)
        else if (
          errorMessage.includes('no longer available') ||
          errorMessage.includes('no longer active') ||
          errorMessage.includes('unable to save like')
        ) {
          sonnerToast.error('Unable to save like', {
            description: err?.message || 'This profile is no longer available'
          });
        }
        // Show error for unexpected failures (network, auth, server errors)
        // These need user attention as the like was NOT saved
        else if (!isExpectedError) {
          sonnerToast.error('Failed to save your like', {
            description: 'Your swipe was not saved. Please try again or check your connection.'
          });
        }
        // For expected errors (duplicates, stale data), silently ignore
        // The user experience is not affected as these are edge cases
      }),

      // Track dismissal on left swipe (dislike)
      direction === 'left' ? dismissTarget(profile.user_id).catch(() => { }) : Promise.resolve(),

      // Record for undo - pass category so deck can be properly restored
      Promise.resolve(recordSwipe(profile.user_id, 'profile', direction, category))
    ]).catch(err => {
      logger.error('[ClientSwipeContainer] Background swipe tasks failed:', err);
    });

    // Clear direction for next swipe
    setTimeout(() => setSwipeDirection(null), 300);

    // FIX: Prevent pagination trigger after final card
    // Check: 1) Not past end, 2) Near end (3 cards away), 3) Has cards, 4) Not already fetching, 5) No error
    if (
      newIndex < deckQueueRef.current.length &&       // Still within deck
      newIndex >= deckQueueRef.current.length - 3 &&  // Near the end (trigger prefetch)
      deckQueueRef.current.length > 0 &&              // Deck has cards
      !isFetchingMore.current &&                       // Not already fetching
      !error                                           // Don't fetch if previous fetch errored
    ) {
      isFetchingMore.current = true;
      setPage(p => p + 1);
    }

    // Note: Image preloading is handled in handleSwipe (next 5 cards)
  }, [swipeMutation, recordSwipe, recordProfileView, markOwnerSwiped, category, dismissTarget]);

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

    // AGGRESSIVE PREFETCH: Preload ALL images of next 3 profiles to prevent blink
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
  }, [executeSwipe, playSwipeSound]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setIsRefreshMode(false);
    triggerHaptic('medium');

    // Reset local state and refs
    currentIndexRef.current = 0;
    setCurrentIndex(0);
    deckQueueRef.current = [];
    swipedIdsRef.current.clear();
    setPage(0);

    // Reset store
    resetOwnerDeck(category);

    try {
      await refetch();
    } catch (err) {
      sonnerToast.error('Refresh failed', { description: 'Please try again.' });
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, resetOwnerDeck, category]);

  const handleInsights = useCallback((clientId: string) => {
    if (onInsights) {
      onInsights(clientId);
    } else {
      sonnerToast.success('Client Insights', {
        description: 'Viewing detailed insights for this client.',
      });
    }
  }, [onInsights]);

  const handleShare = useCallback(() => {
    setShareDialogOpen(true);
    triggerHaptic('light');
  }, []);

  const handleConnect = useCallback((clientId: string) => {
    logger.info('[ClientSwipeContainer] Message icon clicked, opening confirmation dialog');
    setSelectedClientId(clientId);
    setMessageDialogOpen(true);
    triggerHaptic('light');
  }, []);

  const handleSendMessage = useCallback(async (message: string) => {
    if (isCreatingConversation || !selectedClientId) return;

    setIsCreatingConversation(true);

    try {
      sonnerToast.loading('Creating conversation...', { id: 'start-conv' });

      const result = await startConversation.mutateAsync({
        otherUserId: selectedClientId,
        initialMessage: message,
        canStartNewConversation: true,
      });

      if (result?.conversationId) {
        sonnerToast.success('Opening chat...', { id: 'start-conv' });
        setMessageDialogOpen(false);
        await new Promise(resolve => setTimeout(resolve, 300));
        navigate(`/messages?conversationId=${result.conversationId}`);
      }
    } catch (error) {
      sonnerToast.error('Could not start conversation', {
        id: 'start-conv',
        description: error instanceof Error ? error.message : 'Try again'
      });
    } finally {
      setIsCreatingConversation(false);
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
  const nextCard = currentIndex + 1 < deckQueue.length ? deckQueue[currentIndex + 1] : null;

  // Check if we have hydrated data (from store/session) - prevents blank deck flash
  // isReady means we've fully initialized at least once - skip loading UI on return
  const hasHydratedData = isOwnerHydrated(category) || isOwnerReady(category) || deckQueue.length > 0;

  // UI state flags - determine what to render
  const isDeckFinished = currentIndex >= deckQueue.length && deckQueue.length > 0;
  const showInitialError = error && currentIndex === 0 && deckQueue.length === 0;
  const showEmptyState = deckQueue.length === 0 && !isLoading && !hasHydratedData;
  const showLoadingSkeleton = !hasHydratedData && isLoading;

  // ========================================
  // 🔥 SINGLE RETURN BLOCK - SAFE ORDER
  // ========================================
  // All conditions use derived flags - NO hooks called after this point

  // Loading skeleton - initial load only
  if (showLoadingSkeleton) {
    return (
      <div className="relative w-full h-full flex-1 flex flex-col">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-0 rounded-3xl overflow-hidden bg-muted/30 animate-pulse">
            <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-muted/30 to-muted/50">
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

  // "All Caught Up" - finished swiping through all cards
  if (isDeckFinished) {
    return (
      <div className="relative w-full h-full flex-1 flex flex-col items-center justify-center px-4 bg-background pt-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="text-center space-y-8 p-8"
        >
          {/* DISCOVERY HUB EFFECT - Premium thick pulse */}
          <RadarSearchEffect
            size={140}
            color="#E4007C"
            isActive={isRefreshing}
            icon={labels.icon}
          />

          <div className="space-y-4">
            <h3 className="text-3xl font-black text-foreground uppercase tracking-tighter italic">All Caught Up!</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto font-bold tracking-tight opacity-70">
              You've seen all available {labels.plural.toLowerCase()}. Check back soon for fresh opportunities.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="gap-3 rounded-2xl px-10 py-7 bg-gradient-to-br from-orange-500 to-pink-600 text-white shadow-[0_10px_30px_rgba(228,0,124,0.3)] text-base font-black uppercase tracking-widest"
              >
                {isRefreshing ? (
                  <RadarSearchIcon size={20} isActive={true} />
                ) : (
                  <RefreshCw className="w-5 h-5 stroke-[3px]" />
                )}
                {String(isRefreshing ? 'Scanning...' : 'Discover More')}
              </Button>
            </motion.div>
            <p className="text-xs text-muted-foreground">New {labels.plural.toLowerCase()} are added daily</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Error state - ONLY show if we have NO cards at all (not when deck is exhausted)
  if (showInitialError) {
    return (
      <div className="relative w-full h-full flex-1 flex items-center justify-center bg-background">
        <div className="text-center bg-muted/30 border border-border rounded-xl p-8">
          <div className="text-6xl mb-4">😞</div>
          <h3 className="text-xl font-bold text-foreground mb-2">Error</h3>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="gap-2"
            size="lg"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  // Empty state (no cards fetched yet)
  if (showEmptyState || !topCard) {
    return (
      <div className="relative w-full h-full flex-1 flex flex-col items-center justify-center px-4 bg-background pt-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="text-center space-y-8 p-8"
        >
          {/* DISCOVERY HUB EFFECT - Premium thick pulse */}
          <RadarSearchEffect
            size={140}
            color="#E4007C"
            isActive={isRefreshing}
            icon={labels.icon}
          />

          <div className="space-y-4">
            <h3 className="text-3xl font-black text-foreground uppercase tracking-tighter italic">No {labels.plural} Found</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto font-bold tracking-tight opacity-70">
              Try adjusting your filters or refresh to discover new {labels.plural.toLowerCase()} in your area.
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-3 rounded-2xl px-10 py-7 bg-gradient-to-br from-orange-500 to-pink-600 text-white shadow-[0_10px_30px_rgba(228,0,124,0.3)] text-base font-black uppercase tracking-widest"
            >
              {isRefreshing ? (
                <RadarSearchIcon size={18} isActive={true} />
              ) : (
                <RefreshCw className="w-5 h-5 stroke-[3px]" />
              )}
              {isRefreshing ? 'Scanning...' : `Refresh ${labels.plural}`}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Main swipe view - edge-to-edge cards with next card visible behind
  return (
    <div className="relative w-full h-full flex-1 flex flex-col bg-black">
      <div className="relative flex-1 w-full">
        {/* Next card visible behind - creates depth and anticipation */}
        {nextCard && (
          <div
            key={`next-${nextCard.user_id}`}
            className="w-full h-full absolute inset-0"
            style={{
              zIndex: 5,
              transform: 'scale(0.95)',
              opacity: 0.7,
              pointerEvents: 'none',
            }}
          >
            <SimpleOwnerSwipeCard
              profile={nextCard}
              onSwipe={() => { }}
              isTop={false}
              hideActions={true}
            />
          </div>
        )}

        {/* Current card on top - fully interactive */}
        <div
          key={topCard.user_id}
          className="w-full h-full absolute inset-0"
          style={{ zIndex: 10 }}
        >
          <SimpleOwnerSwipeCard
            profile={topCard}
            onSwipe={handleSwipe}
            onTap={() => onClientTap(topCard.user_id)}
            onInsights={() => handleInsights(topCard.user_id)}
            onMessage={() => handleConnect(topCard.user_id)}
            onShare={handleShare}
            onUndo={undoLastSwipe}
            canUndo={canUndo}
            isTop={true}
            hideActions={insightsOpen}
          />
        </div>
      </div>

      {/* FIX: Render modals via portal OUTSIDE the swipe React tree
          This prevents modal state changes from causing swipe re-renders,
          matching the "Tinder-level" fluidity of the client side */}
      {createPortal(
        <Suspense fallback={null}>
          <MatchCelebration
            isOpen={matchCelebration.isOpen}
            onClose={() => setMatchCelebration({ isOpen: false })}
            matchedUser={{
              name: String(matchCelebration.clientProfile?.name || 'User'),
              avatar: matchCelebration.clientProfile?.images?.[0],
              role: 'client'
            }}
            onMessage={() => topCard.user_id && handleConnect(topCard.user_id)}
          />

          <MessageConfirmationDialog
            open={messageDialogOpen}
            onOpenChange={setMessageDialogOpen}
            onConfirm={handleSendMessage}
            recipientName={selectedClientId ? deckQueueRef.current.find(p => p.user_id === selectedClientId)?.name || 'this person' : 'this person'}
            isLoading={isCreatingConversation}
          />

          <ShareDialog
            open={shareDialogOpen}
            onOpenChange={setShareDialogOpen}
            profileId={topCard.user_id}
            title={topCard.name ? `Check out ${String(topCard.name)}'s profile` : 'Check out this profile'}
            description={`Budget: $${topCard.budget_max?.toLocaleString() || 'N/A'} - Looking for: ${Array.isArray(topCard.preferred_listing_types) ? topCard.preferred_listing_types.join(', ') : 'Various properties'}`}
          />
        </Suspense>,
        document.body
      )}
    </div>
  );
};

export const ClientSwipeContainer = memo(ClientSwipeContainerComponent);

// Also export default for backwards compatibility
export default ClientSwipeContainer;
