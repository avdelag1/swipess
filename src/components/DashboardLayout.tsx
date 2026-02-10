
import React, { ReactNode, useState, useEffect, useCallback, useMemo, lazy, Suspense, useRef } from 'react'
import { useAuth } from "@/hooks/useAuth"
import { useAnonymousDrafts } from "@/hooks/useAnonymousDrafts"
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
import { useNavigate, useLocation } from 'react-router-dom'
import { useResponsiveContext } from '@/contexts/ResponsiveContext'
import { prefetchRoleRoutes } from '@/utils/routePrefetcher'
import { logger } from '@/utils/prodLogger'
import { useFilterStore } from '@/state/filterStore'
import type { QuickFilterCategory } from '@/types/filters'

// New Mobile Navigation Components
import { TopBar } from '@/components/TopBar'
import { BottomNavigation } from '@/components/BottomNavigation'
import { AdvancedFilters } from '@/components/AdvancedFilters'
// DISABLED: LiveHDBackground was causing performance issues
// import { LiveHDBackground } from '@/components/LiveHDBackground'
import { RadioMiniPlayer } from '@/components/RadioMiniPlayer'

// Lazy-loaded Dialogs (improves bundle size and initial load)
const SubscriptionPackages = lazy(() => import("@/components/SubscriptionPackages").then(m => ({ default: m.SubscriptionPackages })))
const LikedPropertiesDialog = lazy(() => import("@/components/LikedPropertiesDialog").then(m => ({ default: m.LikedPropertiesDialog })))
const LegalDocumentsDialog = lazy(() => import("@/components/LegalDocumentsDialog").then(m => ({ default: m.LegalDocumentsDialog })))
const ClientPreferencesDialog = lazy(() => import("@/components/ClientPreferencesDialog").then(m => ({ default: m.ClientPreferencesDialog })))
const ClientProfileDialog = lazy(() => import("@/components/ClientProfileDialog").then(m => ({ default: m.ClientProfileDialog })))
const PropertyDetails = lazy(() => import("@/components/PropertyDetails").then(m => ({ default: m.PropertyDetails })))
const PropertyInsightsDialog = lazy(() => import("@/components/PropertyInsightsDialog").then(m => ({ default: m.PropertyInsightsDialog })))
const ClientInsightsDialog = lazy(() => import("@/components/ClientInsightsDialog").then(m => ({ default: m.ClientInsightsDialog })))
const OwnerSettingsDialog = lazy(() => import('@/components/OwnerSettingsDialog').then(m => ({ default: m.OwnerSettingsDialog })))
const OwnerProfileDialog = lazy(() => import('@/components/OwnerProfileDialog').then(m => ({ default: m.OwnerProfileDialog })))
const OwnerClientSwipeDialog = lazy(() => import('@/components/OwnerClientSwipeDialog'))
const SupportDialog = lazy(() => import('@/components/SupportDialog').then(m => ({ default: m.SupportDialog })))
// REMOVED: NotificationSystem was causing duplicate subscriptions with useNotifications in App.tsx
// Global notification handling is now done exclusively by NotificationWrapper in App.tsx
const NotificationsDialog = lazy(() => import('@/components/NotificationsDialog').then(m => ({ default: m.NotificationsDialog })))
const OnboardingFlow = lazy(() => import('@/components/OnboardingFlow').then(m => ({ default: m.OnboardingFlow })))
const CategorySelectionDialog = lazy(() => import('@/components/CategorySelectionDialog').then(m => ({ default: m.CategorySelectionDialog })))
const SavedSearchesDialog = lazy(() => import('@/components/SavedSearchesDialog').then(m => ({ default: m.SavedSearchesDialog })))
const MessageActivationPackages = lazy(() => import('@/components/MessageActivationPackages').then(m => ({ default: m.MessageActivationPackages })))
const PushNotificationPrompt = lazy(() => import('@/components/PushNotificationPrompt').then(m => ({ default: m.PushNotificationPrompt })))
const WelcomeNotification = lazy(() => import('@/components/WelcomeNotification').then(m => ({ default: m.WelcomeNotification })))

// Hooks
import { useListings } from "@/hooks/useListings"
import { useClientProfiles } from "@/hooks/useClientProfiles"
import { useWelcomeState } from "@/hooks/useWelcomeState"

// =============================================================================
// PERFORMANCE FIX: SessionStorage caching for dashboard checks
// Prevents visible state changes when returning to dashboard
// =============================================================================

const ONBOARDING_CACHE_KEY = 'dashboard_onboarding_check';
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

interface OnboardingCacheEntry {
  userId: string;
  needsOnboarding: boolean;
  checkedAt: number;
}

function getOnboardingCache(userId: string): OnboardingCacheEntry | null {
  try {
    const cached = sessionStorage.getItem(ONBOARDING_CACHE_KEY);
    if (!cached) return null;

    const entry: OnboardingCacheEntry = JSON.parse(cached);

    // Validate cache: same user and not expired
    if (entry.userId !== userId) return null;
    if (Date.now() - entry.checkedAt > CACHE_EXPIRY_MS) return null;

    return entry;
  } catch {
    return null;
  }
}

function setOnboardingCache(userId: string, needsOnboarding: boolean): void {
  try {
    const entry: OnboardingCacheEntry = {
      userId,
      needsOnboarding,
      checkedAt: Date.now(),
    };
    sessionStorage.setItem(ONBOARDING_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // sessionStorage full or unavailable
  }
}

function clearOnboardingCache(): void {
  try {
    sessionStorage.removeItem(ONBOARDING_CACHE_KEY);
  } catch {
    // Ignore
  }
}

// =============================================================================

interface DashboardLayoutProps {
  children: ReactNode
  userRole: 'client' | 'owner' | 'admin'
}

export function DashboardLayout({ children, userRole }: DashboardLayoutProps) {
  const [showSubscriptionPackages, setShowSubscriptionPackages] = useState(false)
  const [showLikedProperties, setShowLikedProperties] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null)
  const [showPropertyDetails, setShowPropertyDetails] = useState(false)
  const [showPropertyInsights, setShowPropertyInsights] = useState(false)
  const [showClientInsights, setShowClientInsights] = useState(false)
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null)
  const [subscriptionReason, setSubscriptionReason] = useState<string>('')

  // Owner dialogs
  const [showOwnerSettings, setShowOwnerSettings] = useState(false)
  const [showOwnerProfile, setShowOwnerProfile] = useState(false)
  const [showOwnerSwipe, setShowOwnerSwipe] = useState(false)

  // Other dialogs
  const [showLegalDocuments, setShowLegalDocuments] = useState(false)
  const [showSupport, setShowSupport] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingChecked, setOnboardingChecked] = useState(false)
  const [showCategoryDialog, setShowCategoryDialog] = useState(false)
  const [showSavedSearches, setShowSavedSearches] = useState(false)
  const [showMessageActivations, setShowMessageActivations] = useState(false)

  const [appliedFilters, setAppliedFilters] = useState<any>(null);

  // ========== UNIFIED FILTER STATE FROM ZUSTAND STORE ==========
  // Single source of truth - no more local quickFilters state
  const categories = useFilterStore((state) => state.categories);
  const listingType = useFilterStore((state) => state.listingType);
  const clientGender = useFilterStore((state) => state.clientGender);
  const clientType = useFilterStore((state) => state.clientType);

  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { restoreDrafts } = useAnonymousDrafts()
  const responsive = useResponsiveContext()

  // PERF: Extract stable userId to prevent re-renders when user object reference changes
  // User object may get new reference on token refresh, but ID stays the same
  const userId = user?.id

  // Track if we've checked cache synchronously on mount
  const cacheCheckedRef = useRef(false);

  // PERFORMANCE FIX: Welcome state with DB-backed persistence
  // Shows welcome only on first signup, not every login (survives localStorage clears)
  const { shouldShowWelcome, dismissWelcome } = useWelcomeState(userId)

  // PERF: Defer route prefetching until after first paint using requestIdleCallback
  // This ensures dashboard renders instantly without blocking on prefetch
  useEffect(() => {
    if (userRole === 'client' || userRole === 'owner') {
      if ('requestIdleCallback' in window) {
        const idleId = (window as any).requestIdleCallback(() => prefetchRoleRoutes(userRole), { timeout: 2000 });
        return () => (window as any).cancelIdleCallback(idleId);
      } else {
        const timeoutId = setTimeout(() => prefetchRoleRoutes(userRole), 1000);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [userRole]);

  // Lazy load listings and profiles only when insights dialogs are opened
  // This prevents unnecessary API calls on every page load
  const { data: listings = [], error: listingsError } = useListings([], {
    enabled: showPropertyInsights || showClientInsights
  });
  const { data: profiles = [], error: profilesError } = useClientProfiles([], {
    enabled: showClientInsights
  });

  if (import.meta.env.DEV) {
    if (listingsError && (showPropertyInsights || showClientInsights)) {
      logger.error('DashboardLayout - Listings error:', listingsError);
    }
    if (profilesError && showClientInsights) {
      logger.error('DashboardLayout - Profiles error:', profilesError);
    }
  }

  // ==========================================================================
  // PERF FIX: Onboarding check with sessionStorage caching
  // 1. Check cache SYNCHRONOUSLY on mount - no state change if cached
  // 2. Only do async DB check if no valid cache exists
  // 3. Cache result for 5 minutes to prevent re-checks on navigation
  // ==========================================================================
  useEffect(() => {
    if (!userId || onboardingChecked) return;

    // SYNCHRONOUS CACHE CHECK - prevents visible state change on return
    if (!cacheCheckedRef.current) {
      cacheCheckedRef.current = true;
      const cached = getOnboardingCache(userId);
      if (cached) {
        setOnboardingChecked(true);
        if (cached.needsOnboarding) {
          setShowOnboarding(true);
        }
        return; // Skip DB check entirely
      }
    }

    const checkOnboardingStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('onboarding_completed, full_name, city, age')
          .eq('id', userId)
          .maybeSingle();

        if (error) {
          if (import.meta.env.DEV) {
            logger.error('Error checking onboarding status:', error);
          }
          // Cache as "no onboarding needed" to prevent repeated failed checks
          setOnboardingCache(userId, false);
          return;
        }

        if (!data) {
          setOnboardingCache(userId, false);
          return;
        }

        setOnboardingChecked(true);

        // Show onboarding ONLY if:
        // 1. onboarding_completed is explicitly false, AND
        // 2. User has minimal profile data (likely a new user)
        const hasMinimalData = !data?.full_name && !data?.city && !data?.age;
        const needsOnboarding = data?.onboarding_completed === false && hasMinimalData;

        // CACHE THE RESULT - prevents re-check on dashboard return
        setOnboardingCache(userId, needsOnboarding);

        if (needsOnboarding) {
          setShowOnboarding(true);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          logger.error('Error in onboarding check:', error);
        }
        // Cache as "no onboarding needed" on error
        setOnboardingCache(userId, false);
      }
    };

    // PERF: Defer DB check until browser is idle (2-5 second timeout)
    // This ensures dashboard renders instantly, onboarding check happens later
    if ('requestIdleCallback' in window) {
      const idleId = (window as any).requestIdleCallback(checkOnboardingStatus, { timeout: 3000 });
      return () => (window as any).cancelIdleCallback(idleId);
    } else {
      // Fallback for browsers without requestIdleCallback
      const timeoutId = setTimeout(checkOnboardingStatus, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [userId, onboardingChecked]);

  // Restore anonymous drafts after signup/login
  useEffect(() => {
    if (userId) {
      // Check if there's a pending auth action
      const pendingAction = sessionStorage.getItem('pending_auth_action');
      if (pendingAction) {
        try {
          const action = JSON.parse(pendingAction);
          const age = Date.now() - action.timestamp;
          // Only restore if action is recent (within 24 hours)
          if (age < 24 * 60 * 60 * 1000) {
            restoreDrafts();
          }
          sessionStorage.removeItem('pending_auth_action');
        } catch {
          sessionStorage.removeItem('pending_auth_action');
        }
      }
    }
  }, [userId, restoreDrafts]);

  // PERFORMANCE FIX: Welcome check now handled by useWelcomeState hook
  // This ensures welcome shows only on first signup, never on subsequent sign-ins
  // (survives localStorage clears from Lovable preview URLs)

  const selectedListing = selectedListingId ? listings.find(l => l.id === selectedListingId) : null;
  const selectedProfile = selectedProfileId ? profiles.find(p => p.user_id === selectedProfileId) : null;

  // FIX: Memoize all handler functions to prevent infinite re-renders
  const handleLikedPropertySelect = useCallback((listingId: string) => {
    setSelectedListingId(listingId)
    setShowPropertyDetails(true)
  }, [])

  const handleMessageClick = useCallback(() => {
    const roleText = userRole === 'owner' ? 'clients' : 'owners'
    setSubscriptionReason(`Unlock messaging to connect with ${roleText}!`)
    setShowSubscriptionPackages(true)
  }, [userRole])

  const handlePropertyInsights = useCallback((listingId: string) => {
    setSelectedListingId(listingId)
    setShowPropertyInsights(true)
  }, [])

  const handleClientInsights = useCallback((profileId: string) => {
    setSelectedProfileId(profileId)
    setShowClientInsights(true)
  }, [])

  const handleFilterClick = useCallback(() => {
    if (userRole === 'owner') {
      navigate('/owner/filters-explore')
    } else {
      setShowFilters(true)
    }
  }, [userRole, navigate])

  const handleAddListingClick = useCallback(() => {
    setShowCategoryDialog(true)
  }, [])

  const handleListingsClick = useCallback(() => {
    navigate('/owner/properties');
  }, [navigate])

  const handleNotificationsClick = useCallback(() => {
    setShowNotifications(true)
  }, [])

  const handleMessageActivationsClick = useCallback(() => {
    setShowMessageActivations(true)
  }, [])

  const handleMenuItemClick = useCallback((action: string) => {
    switch (action) {
      case 'add-listing':
        setShowCategoryDialog(true)
        break
      case 'saved-searches':
        setShowSavedSearches(true)
        break
      case 'legal-documents':
        setShowLegalDocuments(true)
        break
      case 'premium-packages':
        setSubscriptionReason('Choose the perfect plan for your needs!')
        setShowSubscriptionPackages(true)
        break
      case 'support':
        setShowSupport(true)
        break
      default:
        break
    }
  }, [])

  const handleApplyFilters = useCallback((filters: any) => {
    // Convert AdvancedFilters format to ListingFilters format
    const convertedFilters: any = {
      ...filters,
      propertyType: filters.propertyTypes, // propertyTypes -> propertyType
      listingType: filters.listingTypes?.length === 1 ? filters.listingTypes[0] :
                   filters.listingTypes?.includes('rent') && filters.listingTypes?.includes('buy') ? 'both' :
                   filters.listingTypes?.[0] || 'rent',
      petFriendly: filters.petFriendly === 'yes' || filters.petFriendly === true,
      furnished: filters.furnished === 'yes' || filters.furnished === true,
      verified: filters.verified || false,
      premiumOnly: filters.premiumOnly || false,
    };

    setAppliedFilters(convertedFilters);

    // Count active filters for user feedback
    let activeFilterCount = 0;
    if (convertedFilters.propertyType?.length) activeFilterCount += convertedFilters.propertyType.length;
    if (convertedFilters.bedrooms?.length) activeFilterCount += convertedFilters.bedrooms.length;
    if (convertedFilters.bathrooms?.length) activeFilterCount += convertedFilters.bathrooms.length;
    if (convertedFilters.amenities?.length) activeFilterCount += convertedFilters.amenities.length;
    if (convertedFilters.priceRange) activeFilterCount += 1;

    toast({
      title: 'Filters Applied',
      description: activeFilterCount > 0
        ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active`
        : 'Showing all listings',
    });
  }, [])

  // Quick filters are now handled directly by QuickFilterDropdown dispatching to the store
  // No more local handler needed - store is single source of truth

  // Map quick filter category names to database category names
  const mapCategoryToDatabase = useCallback((category: QuickFilterCategory): string => {
    const mapping: Record<QuickFilterCategory, string> = {
      'motorcycle': 'motorcycle',
      'property': 'property',
      'bicycle': 'bicycle',
      'services': 'worker',  // UI 'services' -> DB 'worker'
    };
    return mapping[category] || category;
  }, []);

  // Get the original UI category (before mapping) for display purposes
  const activeUiCategory = categories.length === 1 ? categories[0] : null;

  // Combine quick filters with applied filters - MEMOIZED to prevent identity changes
  // Now reads directly from Zustand store values instead of local state
  const combinedFilters = useMemo(() => {
    const base = appliedFilters || {};

    // Check if any quick filters are active (from store)
    const hasClientQuickFilters = categories.length > 0 || listingType !== 'both';
    const hasOwnerQuickFilters = clientGender !== 'any' || clientType !== 'all';

    // If no quick filters active, return base filters
    if (!hasClientQuickFilters && !hasOwnerQuickFilters) {
      return base;
    }

    // Check if services category is selected
    const hasServicesCategory = categories.includes('services');

    // Map quick filter categories to database categories
    const mappedCategories = categories.length > 0
      ? categories.map(mapCategoryToDatabase)
      : undefined;

    return {
      ...base,
      // Client quick filter categories take precedence if set
      category: categories.length === 0 ? base.category : undefined,
      categories: mappedCategories,
      // Original UI category for display (empty states, titles, etc.)
      activeUiCategory: activeUiCategory,
      // Quick filter listing type takes precedence if not 'both'
      listingType: listingType !== 'both' ? listingType : base.listingType,
      // Services filter - derived from categories
      showHireServices: hasServicesCategory || undefined,
      // Owner quick filters
      clientGender: clientGender !== 'any' ? clientGender : undefined,
      clientType: clientType !== 'all' ? clientType : undefined,
    };
  }, [appliedFilters, categories, listingType, clientGender, clientType, mapCategoryToDatabase, activeUiCategory]);

  // Check if we're on a discovery page where filters should be shown
  // MUST be declared BEFORE enhancedChildren useMemo that references it
  const isOnDiscoveryPage = (userRole === 'client' && location.pathname === '/client/dashboard') ||
                            (userRole === 'owner' && location.pathname === '/owner/dashboard');

  // FIX: Memoize cloned children to prevent infinite re-renders
  const enhancedChildren = useMemo(() => {
    return React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        return React.cloneElement(child as React.ReactElement, {
          onPropertyInsights: handlePropertyInsights,
          onClientInsights: handleClientInsights,
          onMessageClick: handleMessageClick,
          filters: combinedFilters,
        } as any);
      }
      return child;
    });
  }, [children, handlePropertyInsights, handleClientInsights, handleMessageClick, combinedFilters]);

  // PERF FIX: Detect camera routes to hide TopBar/BottomNav (fullscreen camera UX)
  // Camera routes are now INSIDE layout to prevent dashboard remount on navigate back
  const isCameraRoute = location.pathname.includes('/camera');

  // IMMERSIVE MODE: Detect swipe dashboard routes for full-bleed card experience
  // On these routes, TopBar becomes transparent and content extends behind it
  const isImmersiveDashboard = useMemo(() => {
    const path = location.pathname;
    return path === '/client/dashboard' ||
           path === '/owner/dashboard' ||
           path.includes('discovery');
  }, [location.pathname]);

  // Get page title based on location for TopBar display
  const pageTitle = useMemo(() => {
    const path = location.pathname;

    // Dashboard/discovery pages show swipes/listings count or title
    if (path === '/client/dashboard') return 'Browsing';
    if (path === '/owner/dashboard') return 'Your Matches';
    if (path.includes('discovery')) return 'Discover';

    // Other pages show section names
    if (path.includes('/profile')) return 'Profile';
    if (path.includes('/settings')) return 'Settings';
    if (path.includes('/messages')) return 'Messages';
    if (path.includes('/notifications')) return 'Notifications';
    if (path.includes('/liked')) return 'Liked';
    if (path.includes('/properties')) return 'Properties';
    if (path.includes('/listings')) return 'Listings';
    if (path.includes('/filters')) return 'Filters';
    if (path.includes('/contracts')) return 'Contracts';

    return '';
  }, [location.pathname]);

  // Calculate responsive layout values
  const topBarHeight = responsive.isMobile ? 52 : 56;
  const bottomNavHeight = responsive.isMobile ? 68 : 72;

  return (
    <div className="app-root min-h-screen min-h-dvh overflow-hidden relative" style={{ width: '100%', maxWidth: '100vw' }}>
      {/* DISABLED: LiveHDBackground was causing performance issues on mobile
          - Animated orbs and CSS animations were slowing down page transitions
          - Removed for snappier navigation */}
      {/* <LiveHDBackground theme="default" showOrbs={true} intensity={0.7} /> */}

      {/* REMOVED: NotificationSystem was causing duplicate realtime subscriptions.
          Global notification handling is now done exclusively by NotificationWrapper (useNotifications)
          in App.tsx. This prevents race conditions and UI flickers from multiple handlers
          firing on the same conversation_messages INSERT event. */}

      {/* Top Bar - Fixed with safe-area-top. Hidden on camera routes for fullscreen UX */}
      {/* Hides smoothly on scroll down and reappears on scroll up for all routes */}
      {!isCameraRoute && (
        <TopBar
          onNotificationsClick={handleNotificationsClick}
          onMessageActivationsClick={handleMessageActivationsClick}
          showFilters={isOnDiscoveryPage}
          userRole={userRole === 'admin' ? 'client' : userRole}
          transparent={isImmersiveDashboard}
          hideOnScroll={true}
          title={pageTitle}
        />
      )}

      {/* Main Content - Scrollable area with safe area spacing for fixed header/footer */}
      {/* On camera route or immersive dashboard: content extends behind TopBar for full-bleed experience */}
      <main
        id="dashboard-scroll-container"
        className="absolute inset-0 overflow-y-auto overflow-x-hidden scroll-area-momentum"
        style={{
          paddingTop: (isCameraRoute || isImmersiveDashboard) 
            ? 'var(--safe-top)' 
            : `calc(${topBarHeight}px + var(--safe-top))`,
          paddingBottom: isCameraRoute ? 'var(--safe-bottom)' : `calc(${bottomNavHeight}px + var(--safe-bottom))`,
          paddingLeft: 'max(var(--safe-left), 0px)',
          paddingRight: 'max(var(--safe-right), 0px)',
          width: '100%',
          maxWidth: '100vw',
          boxSizing: 'border-box',
          zIndex: 0,
          transform: 'translateZ(0)',
          WebkitOverflowScrolling: 'touch',
          willChange: 'contents',
        }}
      >
        {enhancedChildren}
      </main>

      {/* Bottom Navigation - Fixed with safe-area-bottom. Hidden on camera routes for fullscreen UX */}
      {!isCameraRoute && (
        <BottomNavigation
          userRole={userRole}
          onFilterClick={handleFilterClick}
          onAddListingClick={handleAddListingClick}
          onListingsClick={handleListingsClick}
        />
      )}

      {/* Radio Mini Player */}
      <RadioMiniPlayer />

      {/* Advanced Filters Dialog */}
      <AdvancedFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApplyFilters={handleApplyFilters}
        userRole={userRole}
        currentFilters={appliedFilters ?? {}}
      />

      {/* All Dialogs/Modals */}
      <Suspense fallback={null}>
        <SubscriptionPackages
          isOpen={showSubscriptionPackages}
          onClose={() => setShowSubscriptionPackages(false)}
          reason={subscriptionReason}
          userRole={userRole}
        />
      </Suspense>

      {/* Message Activations Packages */}
      <Suspense fallback={null}>
        <MessageActivationPackages
          isOpen={showMessageActivations}
          onClose={() => setShowMessageActivations(false)}
          userRole={userRole === 'admin' ? 'client' : userRole}
        />
      </Suspense>

      {userRole === 'client' && (
        <Suspense fallback={null}>
          <>
            <LikedPropertiesDialog
              isOpen={showLikedProperties}
              onClose={() => setShowLikedProperties(false)}
              onPropertySelect={handleLikedPropertySelect}
            />

            <ClientPreferencesDialog
              open={showPreferences}
              onOpenChange={setShowPreferences}
            />

            <ClientProfileDialog
              open={showProfile}
              onOpenChange={setShowProfile}
            />

            <PropertyDetails
              listingId={selectedListingId}
              isOpen={showPropertyDetails}
              onClose={() => {
                setShowPropertyDetails(false)
                setSelectedListingId(null)
              }}
              onMessageClick={handleMessageClick}
            />

            <PropertyInsightsDialog
              open={showPropertyInsights}
              onOpenChange={(open) => {
                setShowPropertyInsights(open)
                if (!open) setSelectedListingId(null)
              }}
              listing={selectedListing || null}
            />

            <SavedSearchesDialog
              open={showSavedSearches}
              onOpenChange={setShowSavedSearches}
            />
          </>
        </Suspense>
      )}

      {userRole === 'owner' && (
        <Suspense fallback={null}>
          <>
            <ClientInsightsDialog
              open={showClientInsights}
              onOpenChange={(open) => {
                setShowClientInsights(open)
                if (!open) setSelectedProfileId(null)
              }}
              profile={selectedProfile || null}
            />

            <OwnerSettingsDialog
              open={showOwnerSettings}
              onOpenChange={setShowOwnerSettings}
            />

            <OwnerProfileDialog
              open={showOwnerProfile}
              onOpenChange={setShowOwnerProfile}
            />

            <OwnerClientSwipeDialog
              open={showOwnerSwipe}
              onOpenChange={setShowOwnerSwipe}
            />

            <LegalDocumentsDialog
              open={showLegalDocuments}
              onOpenChange={setShowLegalDocuments}
            />

            <CategorySelectionDialog
              open={showCategoryDialog}
              onOpenChange={setShowCategoryDialog}
              onCategorySelect={(category, mode) => {
                setShowCategoryDialog(false);
                navigate(`/owner/properties?category=${category}&mode=${mode}`);
              }}
            />
          </>
        </Suspense>
      )}

      <Suspense fallback={null}>
        <SupportDialog
          isOpen={showSupport}
          onClose={() => setShowSupport(false)}
          userRole={userRole}
        />
      </Suspense>

      <Suspense fallback={null}>
        <NotificationsDialog
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />
      </Suspense>

      <Suspense fallback={null}>
        <OnboardingFlow
          open={showOnboarding}
            onComplete={() => {
              setShowOnboarding(false);
              // Clear cache so we don't show onboarding again
              clearOnboardingCache();
              toast({
                title: 'Profile Complete!',
                description: 'Start exploring and find your perfect match!',
              });
          }}
        />
      </Suspense>

      {/* Push Notification Permission Prompt */}
      <Suspense fallback={null}>
        <PushNotificationPrompt />
      </Suspense>

      {/* Welcome Notification Banner for First-Time Users */}
      <Suspense fallback={null}>
        <WelcomeNotification
          isOpen={shouldShowWelcome}
          onClose={dismissWelcome}
        />
      </Suspense>
    </div>
  )
}
