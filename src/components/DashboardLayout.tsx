
import React, { ReactNode, useState, useEffect, useCallback, useMemo, lazy, Suspense, useRef } from 'react'
import { useAuth } from "@/hooks/useAuth"
import { useAnonymousDrafts } from "@/hooks/useAnonymousDrafts"
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
import { useAppNavigate } from "@/hooks/useAppNavigate";
import { useLocation } from "react-router-dom";
import { useResponsiveContext } from '@/contexts/ResponsiveContext'
import { prefetchRoleRoutes } from '@/utils/routePrefetcher'
import { logger } from '@/utils/prodLogger'
import { useFilterStore } from '@/state/filterStore'
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation'
import { cn } from '@/lib/utils'
import type { QuickFilterCategory } from '@/types/filters'
import { useQueryClient } from '@tanstack/react-query'

// New Mobile Navigation Components
import { TopBar } from '@/components/TopBar'
import { BottomNavigation } from '@/components/BottomNavigation'
import { AdvancedFilters } from '@/components/AdvancedFilters'
import { AISearchDialog } from './AISearchDialog';

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
  const [isAISearchOpen, setIsAISearchOpen] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown> | null>(null);

  // NEXT-GEN DESIGN: Mouse tracking for liquid glass effects (throttled to ~30fps)
  // PERF: Disabled on PWA/touch devices to save CPU and battery
  useEffect(() => {
    // Only enable on desktop with mouse
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isTouchDevice) return;

    let rafId = 0;
    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) return; 
      rafId = requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--mouse-x', `${(e.clientX / window.innerWidth) * 100}%`);
        document.documentElement.style.setProperty('--mouse-y', `${(e.clientY / window.innerHeight) * 100}%`);
        rafId = 0;
      });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // ========== UNIFIED FILTER STATE FROM ZUSTAND STORE ==========
  // Single source of truth - no more local quickFilters state
  const categories = useFilterStore((state) => state.categories);
  const listingType = useFilterStore((state) => state.listingType);
  const clientGender = useFilterStore((state) => state.clientGender);
  const clientType = useFilterStore((state) => state.clientType);

  const { navigate } = useAppNavigate();
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

  const queryClient = useQueryClient();

  // PERF: Defer route prefetching until after first paint using requestIdleCallback
  // This ensures dashboard renders instantly without blocking on prefetch
  useEffect(() => {
    if (userRole === 'client' || userRole === 'owner') {
      if ('requestIdleCallback' in window) {
        const idleId = (window as any).requestIdleCallback(() => prefetchRoleRoutes(userRole), { timeout: 800 });
        return () => (window as any).cancelIdleCallback(idleId);
      } else {
        const timeoutId = setTimeout(() => prefetchRoleRoutes(userRole), 300);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [userRole]);

  // PERF: Prefetch secondary page data in the background after dashboard mounts
  // so navigating to liked-properties, matches, or eventos is instant on first visit
  useEffect(() => {
    if (!userId) return;

    const prefetch = () => {
      // Prefetch eventos feed (10-min stale, shared queryKey with EventosFeed)
      queryClient.prefetchQuery({
        queryKey: ['eventos'],
        queryFn: async () => {
          const { data } = await supabase.from('events').select('*').order('event_date', { ascending: true });
          return data || [];
        },
        staleTime: 1000 * 60 * 10,
      });

      // Prefetch liked properties (matches queryKey in useLikedProperties)
      queryClient.prefetchQuery({
        queryKey: ['liked-properties'],
        queryFn: async () => {
          const { data: likes } = await supabase
            .from('likes')
            .select('target_id')
            .eq('user_id', userId)
            .eq('target_type', 'listing')
            .eq('direction', 'right')
            .order('created_at', { ascending: false });
          if (!likes?.length) return [];
          const ids = [...new Set(likes.map((l: any) => l.target_id).filter(Boolean))];
          const { data: listings } = await supabase.from('listings').select('*').in('id', ids).eq('status', 'active');
          return listings || [];
        },
        staleTime: Infinity,
      });
    };

    if ('requestIdleCallback' in window) {
      const idleId = (window as any).requestIdleCallback(prefetch, { timeout: 4000 });
      return () => (window as any).cancelIdleCallback(idleId);
    } else {
      const t = setTimeout(prefetch, 2000);
      return () => clearTimeout(t);
    }
  }, [userId, queryClient]);

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
          .eq('user_id', userId)
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

  // SCROLL-TO-TOP: Delayed reset after exit animation completes (150ms exit duration)
  useEffect(() => {
    const id = setTimeout(() => {
      const el = document.getElementById('dashboard-scroll-container');
      el?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }, 160);
    return () => clearTimeout(id);
  }, [location.pathname]);

  // SWIPE NAVIGATION: Horizontal swipe between bottom-nav pages
  const clientSwipePaths = [
    '/client/dashboard',
    '/client/profile',
    '/client/liked-properties',
    '/messages',
    '/explore/roommates',
    '/client/filters',
  ];
  const ownerSwipePaths = [
    '/owner/dashboard',
    '/owner/profile',
    '/owner/liked-clients',
    '/owner/properties',
    '/messages',
    '/owner/filters',
  ];
  const isDashboardSwipePage = location.pathname === '/client/dashboard' || location.pathname === '/owner/dashboard';
  useSwipeNavigation({
    paths: userRole === 'client' ? clientSwipePaths : userRole === 'owner' ? ownerSwipePaths : [],
    containerSelector: '#dashboard-scroll-container',
    enabled: userRole !== 'admin' && !isDashboardSwipePage,
  });

  // PERFORMANCE FIX: Welcome check now handled by useWelcomeState hook
  // This ensures welcome shows only on first signup, never on subsequent sign-ins
  // (survives localStorage clears from external preview URLs)

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

  const _handlePropertyInsights = useCallback((listingId: string) => {
    setSelectedListingId(listingId)
    setShowPropertyInsights(true)
  }, [])

  const _handleClientInsights = useCallback((profileId: string) => {
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

  const _handleMenuItemClick = useCallback((action: string) => {
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
      propertyType: filters.propertyTypes,
      listingType: filters.listingTypes?.length === 1 ? filters.listingTypes[0] :
        filters.listingTypes?.includes('rent') && filters.listingTypes?.includes('buy') ? 'both' :
          filters.listingTypes?.[0] || 'rent',
      petFriendly: filters.petFriendly === 'yes' || filters.petFriendly === true,
      furnished: filters.furnished === 'yes' || filters.furnished === true,
      verified: filters.verified || false,
      premiumOnly: filters.premiumOnly || false,
    };

    // Unprefix category-specific keys from AdvancedFilters
    // e.g. services_service_categories → serviceCategory, services_work_types → workTypes
    const prefixMap: Record<string, string> = {
      services_service_categories: 'serviceCategory',
      services_work_types: 'workTypes',
      services_schedule_types: 'scheduleTypes',
      services_days_available: 'daysAvailable',
      services_time_slots_available: 'timeSlotsAvailable',
      services_location_types: 'locationTypes',
      services_experience_levels: 'experienceLevel',
      services_skills: 'skills',
      services_required_skills: 'skills',
      services_certifications: 'certifications',
      services_required_certifications: 'certifications',
      services_needs_emergency_service: 'offersEmergencyService',
      services_needs_background_check: 'backgroundCheckVerified',
      services_needs_insurance: 'insuranceVerified',
      services_price_min: '_priceMin',
      services_price_max: '_priceMax',
      property_priceMin: 'priceRange',
      property_priceMax: 'priceRange',
    };

    Object.entries(filters).forEach(([key, value]) => {
      const mapped = prefixMap[key];
      if (mapped && value != null) {
        // Special handling for priceRange pairs
        if (key === 'property_priceMin' || key === 'services_price_min') {
          convertedFilters.priceRange = [value as number, convertedFilters.priceRange?.[1] ?? Infinity];
        } else if (key === 'property_priceMax' || key === 'services_price_max') {
          convertedFilters.priceRange = [convertedFilters.priceRange?.[0] ?? 0, value as number];
        } else {
          convertedFilters[mapped] = value;
        }
      }
    });

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
  const _combinedFilters = useMemo(() => {
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

  // PERF FIX: Do NOT clone children with props — route elements (MyHub, ClientProfile, etc.)
  // get their data from hooks/stores directly, not from cloneElement props.
  // The old cloneElement pattern caused cascading re-renders (React #185) because
  // combinedFilters changed identity on every filter store update, triggering
  // AnimatedOutlet to re-clone the outlet element with new props on every render.
  const enhancedChildren = children;

  // PERF FIX: Detect camera and radio routes to hide TopBar/BottomNav (fullscreen UX)
  // Camera and radio routes are now INSIDE layout to prevent dashboard remount on navigate back
  // IMMERSIVE FULLSCREEN: Routes that take over the entire screen (e.g. Camera, Radio, Stories-style feeds)
  const isCameraRoute = location.pathname.includes('/camera');
  const isRadioRoute = location.pathname.includes('/radio');
  const isRoommatesPage = location.pathname.startsWith('/explore/roommates');
  const isImmersiveFeed = location.pathname.startsWith('/explore/eventos') || isRoommatesPage;

  // IMMERSIVE MODE: Detect swipe dashboard routes for full-bleed card experience
  // On these routes, TopBar becomes transparent and content extends behind it
  const isImmersiveDashboard = useMemo(() => {
    const path = location.pathname;
    // Core routes that should go full-bleed behind the header
    const immersiveRoutes = [
      '/client/dashboard',
      '/owner/dashboard',
      '/client/profile',
      '/owner/profile',
      '/client/liked-properties',
      '/owner/liked-clients',
      '/client/filters',
      '/owner/filters',
      '/owner/properties',
      '/client/services',
      '/messages',
      '/notifications',
    ];

    const isMatch = immersiveRoutes.some(route => path === route || path === route + '/' || path.startsWith(route + '/')) ||
      path.includes('discovery') ||
      path.includes('view-client');
    
    return isMatch;
  }, [location.pathname]);

  // FULLSCREEN MODE: These routes hide the global TopBar and BottomNav entirely
  // and take over the full screen height with 0 padding.
  const isFullScreenRoute = useMemo(() => {
    // Only Camera and Radio remain fully fullscreen (hiding everything)
    // Eventos and Roommates now show TopBar/BottomNav per user request
    // HOWEVER, the Detail page for Eventos should be fullscreen to avoid "double access" X/Back issues
    const isEventoDetail = location.pathname.startsWith('/explore/eventos/') && 
                          location.pathname !== '/explore/eventos' && 
                          location.pathname !== '/explore/eventos/';
    
    // User wants header gone from Events to avoid interference
    const isEventsMain = location.pathname === '/explore/eventos' || location.pathname === '/explore/eventos/';

    return isCameraRoute || isRadioRoute || 
           location.pathname.includes('/client/filters') || 
           location.pathname.includes('/owner/filters') ||
           isEventoDetail || isEventsMain || isRoommatesPage;
  }, [isCameraRoute, isRadioRoute, location.pathname, isRoommatesPage]);

  // Round 8: Page titles removed — bottom nav is sufficient indicator
  const pageTitle = '';

  // Calculate responsive layout values
  const topBarHeight = responsive.isMobile ? 52 : 56;
  const bottomNavHeight = responsive.isMobile ? 68 : 72;

  return (
    <div className="app-root min-h-screen min-h-dvh overflow-hidden relative" style={{ width: '100%', maxWidth: '100vw' }}>

      {/* Top Bar - Fixed with safe-area-top. Hidden on camera, radio and immersive feeds for fullscreen UX */}
      {/* Hides smoothly on scroll down and reappears on scroll up for all routes */}
      {!isFullScreenRoute && (
        <TopBar
          onNotificationsClick={handleNotificationsClick}
          onMessageActivationsClick={handleMessageActivationsClick}
          showFilters={isOnDiscoveryPage}
          userRole={userRole}
          transparent={isImmersiveDashboard || isImmersiveFeed}
          hideOnScroll={true}
          title={pageTitle}
          showBack={!isOnDiscoveryPage}
        />
      )}

      {/* Main Content - Scrollable area with safe area spacing for fixed header/footer */}
      {/* On camera, radio route or immersive dashboard: content extends behind TopBar for full-bleed experience */}
      <main
        id="dashboard-scroll-container"
        className={cn(
          "absolute inset-0 overflow-x-hidden scroll-area-momentum bg-background",
          isFullScreenRoute ? "overflow-y-hidden" : "overflow-y-auto"
        )}
        style={{
          paddingTop: (isFullScreenRoute || isDashboardSwipePage)
            ? '0px'
            : `calc(${topBarHeight}px + var(--safe-top))`,
          paddingBottom: (isFullScreenRoute || isDashboardSwipePage) ? '0px' : `calc(${bottomNavHeight}px + var(--safe-bottom))`,
          paddingLeft: 'max(var(--safe-left), 0px)',
          paddingRight: 'max(var(--safe-right), 0px)',
          width: '100%',
          maxWidth: '100vw',
          boxSizing: 'border-box',
          zIndex: 0,
          transform: 'translateZ(0)',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* PERF FIX: Removed motion.div key={location.pathname} wrapper.
            AnimatedOutlet already handles page transitions with key={location.key}.
            The double wrapper was causing unnecessary unmount/remount cycles. */}
        <div style={{ minHeight: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
          {enhancedChildren}
        </div>
      </main>

      {/* Bottom Navigation - Fixed with safe-area-bottom. Hidden on camera, radio and immersive feeds for fullscreen UX */}
      {/* Roommates page keeps bottom nav visible even in immersive mode */}
      {!isCameraRoute && !isRadioRoute && (!isImmersiveFeed || isRoommatesPage) && (
        <BottomNavigation
          userRole={userRole}
          onFilterClick={handleFilterClick}
          onAddListingClick={handleAddListingClick}
          onListingsClick={handleListingsClick}
          onAISearchClick={() => {
            if (userRole === 'owner') {
              navigate('/owner/listings/new-ai');
            } else {
              setIsAISearchOpen(true);
            }
          }}
        />
      )}

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

      {/* Token Packages */}
      <Suspense fallback={null}>
        <MessageActivationPackages
          isOpen={showMessageActivations}
          onClose={() => setShowMessageActivations(false)}
          userRole={userRole}
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

      {/* AI Search Dialog */}
      <AISearchDialog
        isOpen={isAISearchOpen}
        onClose={() => setIsAISearchOpen(false)}
        userRole={(userRole === 'admin' ? 'client' : userRole) as 'client' | 'owner'}
      />

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
