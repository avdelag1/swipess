import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, Globe2, LayoutList, Loader2, MapPin, Menu, Navigation, Search, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { useModalStore } from '@/state/modalStore';
import { useFilterStore } from '@/state/filterStore';
import { appToast } from '@/utils/appNotification';
import useAppTheme from '@/hooks/useAppTheme';
import { useTranslation } from 'react-i18next';
import { canGeolocate, getCurrentPosition } from '@/utils/geolocation';
import {
  addCinematic3DBuildings,
  applyCinematicFog,
  CINEMATIC_BEARING,
  CINEMATIC_OPEN_ALTITUDE_ZOOM,
  cinematicEaseTo,
  cinematicFlyTo,
  cinematicMaxPitchForViewport,
  cinematicOpenGlide,
  cinematicPitchForViewport,
  FLY_DURATION_OPEN_MS,
  OPEN_CENTER_MS,
  zoomForRadiusKm,
} from '@/utils/mapCinematicCamera';
import { removeUserGpsDotFromMap, syncUserGpsDotOnMap } from '@/utils/mapUserGpsDot';
import { usePassportMapData } from '@/hooks/usePassportMapData';
import { isMapboxConfigured, resolveMapboxAccessToken } from '@/utils/mapboxConfig';
import { warmMapboxModules } from '@/utils/mapWarmPool';
import { PassportMapPinPreview } from '@/components/passport/PassportMapPinPreview';
import { PassportMapResultsRail } from '@/components/passport/PassportMapResultsRail';
import {
  createListingMarkerEl,
  createProfileMarkerEl,
  type MapLayerFilter,
  type SelectedPin,
  updateListingMarkerEl,
  updateProfileMarkerEl,
} from '@/components/passport/passportMapMarkers';
import {
  bindMapDoubleTapZoom,
  bindMapInteractionTracking,
  bindMapLongPress,
  bindMarkerGestures,
  MAP_DOUBLE_TAP_WINDOW_MS,
} from '@/utils/mapDoubleTapZoom';

import { PassportMapChunkyButton } from '@/components/passport/PassportMapChunkyButton';
import { PASSPORT_GRADIENTS } from '@/components/passport/passportMapTheme';
import { syncRadiusCircleOnMap } from '@/utils/mapRadiusCircle';
import {
  GENIE_FULLSCREEN_EXIT,
  GENIE_FULLSCREEN_OPEN,
  GENIE_FULLSCREEN_VISIBLE,
  GENIE_ORIGIN_BOTTOM,
  GENIE_SPRING_CLOSE,
} from '@/utils/genieMotion';
import { DEFAULT_CITY_PHOTO, PASSPORT_QUICK_CITIES } from '@/data/cityPhotos';
import { LocationRadiusSelector } from '@/components/swipe/LocationRadiusSelector';

/** Default search hub when GPS is still warming up — matches prod listing cluster. */
const MAP_SEARCH_HUB = PASSPORT_QUICK_CITIES.find(c => c.name === 'Tulum') ?? {
  lat: 20.2114,
  lng: -87.4654,
};
import { prefetchCityPhotosImmediate } from '@/utils/prefetchCityPhotos';
import {
  coordsNearFix,
  getCachedGpsFix,
  type GpsFix,
  prefetchUserGps,
  seedGpsCache,
  startGpsWatch,
  stopGpsWatch,
  subscribeGpsFix,
} from '@/utils/mapGpsCache';

type MapboxGL = typeof import('mapbox-gl').default;

type PinPreviewMode = 'anchored' | 'sheet';
const MAP_HUD_BTN = 'w-[34px] h-[34px]';
const MAP_HUD_ICON = 'w-4 h-4';

const FILTER_TABS: { id: MapLayerFilter; labelKey: string; icon: typeof Building2; gradient: string }[] = [
  { id: 'all', labelKey: 'map.filterAll', icon: Globe2, gradient: PASSPORT_GRADIENTS.all },
  { id: 'listings', labelKey: 'map.filterListings', icon: Building2, gradient: PASSPORT_GRADIENTS.listings },
  { id: 'people', labelKey: 'map.filterPeople', icon: Users, gradient: PASSPORT_GRADIENTS.people },
];

export const PassportMapModal = memo(() => {
  const { isLight } = useAppTheme();
  const { t } = useTranslation();
  const isOpen = useModalStore(s => s.showPassportMapModal);
  const passportMapShowCities = useModalStore(s => s.passportMapShowCities);
  const clearPassportMapFlags = useModalStore(s => s.clearPassportMapFlags);
  // Mounted only when AppLayout wants a warm map — resolve token + init early.
  const shouldWarmMap = true;
  const setModal = useModalStore(s => s.setModal);
  const openPropertyDetails = useModalStore(s => s.openPropertyDetails);
  const openPropertyInsights = useModalStore(s => s.openPropertyInsights);
  const openClientInsights = useModalStore(s => s.openClientInsights);
  const lat = useFilterStore(s => s.userLatitude);
  const lng = useFilterStore(s => s.userLongitude);
  const radiusKm = useFilterStore(s => s.radiusKm);
  const passportLabel = useFilterStore(s => s.passportLabel);
  const passportMode = useFilterStore(s => s.passportMode);
  const setPassportLocation = useFilterStore(s => s.setPassportLocation);
  const clearPassportLocation = useFilterStore(s => s.clearPassportLocation);
  const setUserLocation = useFilterStore(s => s.setUserLocation);
  const setRadiusKm = useFilterStore(s => s.setRadiusKm);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const geocoderContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('mapbox-gl').Map | null>(null);
  const mapboxRef = useRef<MapboxGL | null>(null);
  const markersRef = useRef<Map<string, {
    marker: import('mapbox-gl').Marker;
    el: HTMLDivElement;
    cleanup: () => void;
    pinType: 'listing' | 'profile';
    pinId: string;
  }>>(new Map());
  const unbindMapDoubleTapRef = useRef<(() => void) | null>(null);
  const geocoderRef = useRef<{ onRemove: () => void } | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const initStartedRef = useRef(false);
  const mapOpenSessionRef = useRef(0);
  const framedOpenSessionRef = useRef(0);
  // Map init runs once and must survive isOpen toggles — see init effect below.
  const beginInitRef = useRef<(() => void) | null>(null);
  const mapUnmountedRef = useRef(false);
  const userMapInteractedRef = useRef(false);
  const suppressMapInteractionRef = useRef(false);
  const initialCenterDoneRef = useRef(false);
  // Camera memory — once the user has panned/zoomed/picked a pin, the persistent
  // Mapbox instance already holds their last view, so we stop auto-centering on reopen.
  const userEverMovedRef = useRef(false);
  const prevMapOpenRef = useRef(false);
  const prevPassportModeRef = useRef(passportMode);
  const unbindLongPressRef = useRef<(() => void) | null>(null);
  const unbindInteractionRef = useRef<(() => void) | null>(null);
  const lastDoubleTapZoomAtRef = useRef(0);
  const lastMapPointerUpAtRef = useRef(0);
  // Timestamp of the last marker tap — the map's click handler checks this so a
  // pin tap doesn't immediately clear the selection it just opened (mobile race).
  const markerTapGuardRef = useRef(0);
  const markerSyncRafRef = useRef<number | null>(null);
  const syncMarkersRef = useRef<() => void>(() => {});
  const refreshMapVisualsRef = useRef<() => void>(() => {});
  const deviceGpsRef = useRef<{ lat: number; lng: number } | null>(null);
  const isLightRef = useRef(isLight);
  isLightRef.current = isLight;

  const [deviceGps, setDeviceGps] = useState<{ lat: number; lng: number } | null>(null);
  const [selected, setSelected] = useState<SelectedPin | null>(null);
  const [previewMode, setPreviewMode] = useState<PinPreviewMode | null>(null);
  const selectedRef = useRef<SelectedPin | null>(null);
  selectedRef.current = selected;
  const [layerFilter, setLayerFilter] = useState<MapLayerFilter>('all');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  /** Prefetch pins while the map warms in the background — show instantly on open. */
  const shouldLoadMapPins = isOpen || mapReady;
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [tokenReady, setTokenReady] = useState(() => isMapboxConfigured());
  const [activeDrawer, setActiveDrawer] = useState<'cities' | 'results' | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hudExpanded, setHudExpanded] = useState(false);
  const [radiusHudExpanded, setRadiusHudExpanded] = useState(false);
  const [searchAnchor, setSearchAnchor] = useState<{ lat: number; lng: number } | null>(null);
  /** First open: search the listing cluster hub — not stale profile GPS thousands of km away. */
  const [hubSearchOnOpen, setHubSearchOnOpen] = useState(true);
  const mapHudRef = useRef<HTMLDivElement>(null);
  /** City-chip tap tracking — fire on pointerup with a move guard so the first tap
   *  always lands (the horizontal scroller was swallowing the synthetic click). */
  const cityTapRef = useRef<{ x: number; y: number; name: string } | null>(null);

  useEffect(() => {
    if (isOpen) prefetchCityPhotosImmediate();
    if (!isOpen) {
      setHudExpanded(false);
      setRadiusHudExpanded(false);
    }
  }, [isOpen]);

  // Show all layers by default — user filters via the HUD menu.
  useEffect(() => {
    if (isOpen) {
      setLayerFilter('all');
      if (!passportMode && !searchAnchor) setHubSearchOnOpen(true);
    }
  }, [isOpen, passportMode, searchAnchor]);

  useEffect(() => {
    if (activeDrawer === 'cities') {
      setRadiusHudExpanded(false);
    }
  }, [activeDrawer]);

  useEffect(() => {
    if (!isOpen) return;
    if (passportMapShowCities) {
      setActiveDrawer('cities');
      clearPassportMapFlags();
    }
  }, [isOpen, passportMapShowCities, clearPassportMapFlags]);

  /** Map circle + camera center — long-press anchor beats GPS for the radius ring. */
  const radiusCenter = useMemo(() => {
    if (passportMode && lat != null && lng != null) return { lat, lng };
    if (searchAnchor) return searchAnchor;
    if (hubSearchOnOpen) return MAP_SEARCH_HUB;
    if (deviceGps) return deviceGps;
    if (lat != null && lng != null) return { lat, lng };
    return MAP_SEARCH_HUB;
  }, [passportMode, lat, lng, deviceGps, searchAnchor, hubSearchOnOpen]);

  const searchCoords = useMemo(() => {
    if (!shouldLoadMapPins) return null;
    return radiusCenter;
  }, [shouldLoadMapPins, radiusCenter]);

  const usingSearchFallback = isOpen && radiusCenter == null;

  const { data, isFetching, isError, isFetched } = usePassportMapData(
    searchCoords?.lat ?? null,
    searchCoords?.lng ?? null,
    radiusKm,
    shouldLoadMapPins,
  );
  const activePeopleCount = data?.activePeopleCount ?? 0;

  const visibleListings = useMemo(() => {
    if (!data || layerFilter === 'people') return [];
    return data.listings;
  }, [data, layerFilter]);

  const visibleProfiles = useMemo(() => {
    if (!data || layerFilter === 'listings') return [];
    return data.profiles;
  }, [data, layerFilter]);

  const nearbyCount = (visibleListings.length + visibleProfiles.length);
  const showInitialDataLoad = isFetching && !data;

  const selectedId = selected
    ? (selected.type === 'listing' ? selected.data.id : selected.data.id)
    : null;

  const clearPinPreview = useCallback(() => {
    setSelected(null);
    setPreviewMode(null);
  }, []);

  const onClose = useCallback(() => {
    triggerHaptic('light');
    clearPinPreview();
    setActiveDrawer(null);
    setModal('showPassportMapModal', false);
  }, [setModal, clearPinPreview]);

  const radiusCenterRef = useRef(radiusCenter);
  radiusCenterRef.current = radiusCenter;
  const radiusKmRef = useRef(radiusKm);
  radiusKmRef.current = radiusKm;
  const prevRadiusKmRef = useRef(radiusKm);

  const applyRadiusCircleNow = useCallback(() => {
    const map = mapRef.current;
    const center = radiusCenterRef.current;
    if (!map || !center) return;

    const paint = () => {
      if (!map.isStyleLoaded()) return;
      try {
        syncRadiusCircleOnMap(
          map,
          center.lng,
          center.lat,
          radiusKm,
          { showCenterDot: true },
        );
      } catch {
        // Style can still be loading on first paint
      }
    };

    if (map.isStyleLoaded()) {
      paint();
      return;
    }
    const onReady = () => paint();
    map.once('load', onReady);
    map.once('style.load', onReady);
    map.once('idle', onReady);
  }, [radiusKm]);

  // Frame circle when user changes radius slider — preserve their pan if they moved the map.
  useEffect(() => {
    if (!isOpen || !mapReady || !mapRef.current) return;
    if (prevRadiusKmRef.current === radiusKm) return;
    prevRadiusKmRef.current = radiusKm;
    const map = mapRef.current;
    suppressMapInteractionRef.current = true;
    const releaseSuppress = () => { suppressMapInteractionRef.current = false; };
    map.once('moveend', releaseSuppress);
    window.setTimeout(releaseSuppress, 320);
    if (userMapInteractedRef.current) {
      const c = map.getCenter();
      cinematicEaseTo(map, [c.lng, c.lat], zoomForRadiusKm(radiusKm), { duration: 200 });
      return;
    }
    const center = radiusCenterRef.current;
    if (!center) return;
    cinematicEaseTo(map, [center.lng, center.lat], zoomForRadiusKm(radiusKm), { duration: 200 });
  }, [radiusKm, isOpen, mapReady]);

  const flyTo = useCallback((newLat: number, newLng: number, label?: string, zoom = 11) => {
    setHubSearchOnOpen(false);
    setPassportLocation(newLat, newLng, label);
    if (mapRef.current) {
      cinematicEaseTo(
        mapRef.current,
        [newLng, newLat],
        zoom,
        { duration: 300, pitch: cinematicPitchForViewport(), bearing: CINEMATIC_BEARING },
      );
    }
    triggerHaptic('heavy');
    if (label) appToast.success(`Exploring ${label}`);
  }, [setPassportLocation]);

  const flyToRef = useRef(flyTo);
  flyToRef.current = flyTo;



  const focusPinSheet = useCallback((pin: SelectedPin) => {
    initialCenterDoneRef.current = true;
    userEverMovedRef.current = true;
    // Guard the map 'click' that fires right after this tap from clearing it.
    markerTapGuardRef.current = Date.now();
    setSelected(pin);
    setPreviewMode('sheet');
    setRadiusHudExpanded(false); // Close the km slider when a pin is clicked
  }, []);

  // Anchored preview was removed in favor of sheet preview

  const openInsightsFor = useCallback((pin: SelectedPin) => {
    triggerHaptic('medium');
    clearPinPreview();
    if (pin.type === 'listing') {
      openPropertyInsights(pin.data.id);
    } else {
      openClientInsights(pin.data.id);
    }
  }, [openPropertyInsights, openClientInsights, clearPinPreview]);

  const openDetailsFor = useCallback((listingId: string) => {
    triggerHaptic('medium');
    clearPinPreview();
    openPropertyDetails(listingId);
  }, [openPropertyDetails, clearPinPreview]);

  const centerOnDeviceGps = useCallback((opts?: { zoom?: number; refresh?: boolean; announce?: boolean }) => {
    const run = async () => {
      if (!canGeolocate()) {
        appToast.error('Location not available');
        return;
      }
      setGpsLoading(true);
      try {
        let fix = deviceGps;
        if (opts?.refresh !== false) {
          const { latitude, longitude } = await getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          });
          fix = { lat: latitude, lng: longitude };
          setDeviceGps(fix);
          setUserLocation(latitude, longitude);
        } else if (!fix) {
          const { latitude, longitude } = await getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          });
          fix = { lat: latitude, lng: longitude };
          setDeviceGps(fix);
          setUserLocation(latitude, longitude);
        }

        if (!fix || !mapRef.current) return;

        cinematicEaseTo(
          mapRef.current,
          [fix.lng, fix.lat],
          opts?.zoom ?? zoomForRadiusKm(radiusKm),
          { duration: 320, pitch: cinematicPitchForViewport() },
        );
        if (opts?.announce) appToast.success('Centered on your location');
      } catch {
        appToast.error('Could not detect location');
      } finally {
        setGpsLoading(false);
      }
    };
    void run();
  }, [deviceGps, radiusKm, setUserLocation]);

  const centerOnDeviceGpsRef = useRef(centerOnDeviceGps);
  centerOnDeviceGpsRef.current = centerOnDeviceGps;

  const handleGPS = useCallback(() => {
    triggerHaptic('medium');
    setHubSearchOnOpen(false);
    setSearchAnchor(null);
    clearPassportLocation();
    userMapInteractedRef.current = false;
    centerOnDeviceGps({ zoom: zoomForRadiusKm(radiusKm), refresh: true, announce: true });
  }, [centerOnDeviceGps, radiusKm, clearPassportLocation]);

  const relocateSearchTo = useCallback((lng: number, lat: number) => {
    triggerHaptic('heavy');
    setHubSearchOnOpen(false);
    setSearchAnchor({ lat, lng });
    clearPassportLocation();
    setUserLocation(lat, lng);
    seedGpsCache(lat, lng);
    deviceGpsRef.current = { lat, lng };
    setDeviceGps({ lat, lng });
    userMapInteractedRef.current = true;
    initialCenterDoneRef.current = true;
    userEverMovedRef.current = true;
    const map = mapRef.current;
    if (map?.isStyleLoaded()) {
      cinematicEaseTo(
        map,
        [lng, lat],
        zoomForRadiusKm(radiusKm),
        { duration: OPEN_CENTER_MS, pitch: cinematicPitchForViewport() },
      );
    }
    appToast.success('Search area moved here — hold 1s on empty map');
  }, [clearPassportLocation, radiusKm, setUserLocation]);

  const relocateSearchRef = useRef(relocateSearchTo);
  relocateSearchRef.current = relocateSearchTo;

  const resizeMap = useCallback(() => {
    requestAnimationFrame(() => mapRef.current?.resize());
  }, []);

  const applyGpsFix = useCallback((fix: GpsFix | { lat: number; lng: number }) => {
    const next = { lat: fix.lat, lng: fix.lng };
    if (coordsNearFix(deviceGpsRef.current, next)) return;
    deviceGpsRef.current = next;
    setDeviceGps(next);
    if (!passportMode) setUserLocation(next.lat, next.lng);
  }, [passportMode, setUserLocation]);

  // Seed + subscribe once — never depend on lat/lng (that caused infinite re-render loops).
  useEffect(() => {
    if (passportMode) return undefined;

    const cached = getCachedGpsFix();
    if (cached) applyGpsFix(cached);
    else {
      const { userLatitude, userLongitude } = useFilterStore.getState();
      if (userLatitude != null && userLongitude != null) seedGpsCache(userLatitude, userLongitude);
    }

    return subscribeGpsFix((fix) => {
      if (useFilterStore.getState().passportMode) return;
      applyGpsFix(fix);
    });
  }, [passportMode, applyGpsFix]);

  const markUserMapControl = useCallback(() => {
    userMapInteractedRef.current = true;
    initialCenterDoneRef.current = true;
    userEverMovedRef.current = true;
  }, []);
  const markUserMapControlRef = useRef(markUserMapControl);
  markUserMapControlRef.current = markUserMapControl;

  const centerMapOnTarget = useCallback((
    target: { lat: number; lng: number },
    session: number,
    opts?: { duration?: number; fly?: boolean },
  ) => {
    if (session !== mapOpenSessionRef.current) return;
    if (userMapInteractedRef.current || selectedRef.current) return;
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const center: [number, number] = [target.lng, target.lat];
    const zoom = zoomForRadiusKm(radiusKm);
    const pitch = cinematicPitchForViewport();

    const duration = opts?.duration ?? OPEN_CENTER_MS;

    suppressMapInteractionRef.current = true;
    const releaseSuppress = () => { suppressMapInteractionRef.current = false; };
    map.once('moveend', releaseSuppress);
    window.setTimeout(releaseSuppress, (duration || FLY_DURATION_OPEN_MS) + 120);

    if (opts?.fly) {
      cinematicFlyTo(map, center, zoom, {
        pitch,
      });
      return;
    }

    if (duration <= 0) {
      map.jumpTo({ center, zoom, pitch, bearing: map.getBearing() });
      releaseSuppress();
      return;
    }

    cinematicEaseTo(map, center, zoom, { duration, pitch });
  }, [mapReady, radiusKm]);

  const centerMapOnTargetRef = useRef(centerMapOnTarget);
  centerMapOnTargetRef.current = centerMapOnTarget;
  const applyGpsFixRef = useRef(applyGpsFix);
  applyGpsFixRef.current = applyGpsFix;

  // New open session — reset interaction flags once per open (not on GPS/radius churn).
  useEffect(() => {
    if (isOpen && !prevMapOpenRef.current) {
      mapOpenSessionRef.current += 1;
      userMapInteractedRef.current = false;
      userEverMovedRef.current = false;
      initialCenterDoneRef.current = false;
      framedOpenSessionRef.current = 0;
    }
    if (!isOpen) {
      initialCenterDoneRef.current = false;
    }
    prevMapOpenRef.current = isOpen;
  }, [isOpen]);

  // Re-allow auto-center when switching passport explore ↔ GPS while map stays open.
  useEffect(() => {
    if (isOpen && prevPassportModeRef.current !== passportMode) {
      initialCenterDoneRef.current = false;
    }
    prevPassportModeRef.current = passportMode;
  }, [isOpen, passportMode]);

  // Warm GPS dot on open — updates the blue location dot without moving the camera.
  useEffect(() => {
    if (!isOpen || !mapReady) return;

    let cancelled = false;
    if (!canGeolocate()) return undefined;

    setGpsLoading(true);
    void prefetchUserGps({ maximumAge: 5_000 }).then((fix) => {
      if (cancelled || !fix || useFilterStore.getState().passportMode) return;
      applyGpsFixRef.current(fix);
    }).finally(() => {
      if (!cancelled) setGpsLoading(false);
    });

    return () => { cancelled = true; };
  }, [isOpen, mapReady]);

  // Detect Apple WebKit (Safari desktop + iOS Safari + Capacitor WKWebView).
  // Capacitor's UA often omits the word "Safari", so Chrome-style sniffing fails.
  const isAppleWebKitEnv = () => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const cap = (window as unknown as { Capacitor?: { getPlatform?: () => string; isNativePlatform?: () => boolean } }).Capacitor;
    if (cap?.getPlatform?.() === 'ios' || (cap?.isNativePlatform?.() && /iPhone|iPad|iPod/i.test(ua))) return true;
    // Safari / WebKit without Chromium or Firefox iOS
    if (/AppleWebKit/i.test(ua) && !/Chrome|CriOS|Chromium|Edg|FxiOS|OPR|Android/i.test(ua)) return true;
    return /^((?!chrome|android).)*safari/i.test(ua);
  };

  useEffect(() => {
    if (!shouldWarmMap) return;
    let cancelled = false;
    // Prefetch token + Mapbox JS/CSS only — do NOT create a WebGL map while closed.
    // Safari/WKWebView fail WebGL when the host is visibility:hidden or scaled by
    // the genie open animation (scale ~0.05). Chrome is more tolerant, which is
    // why the map "only works in Chrome / PWA Chrome".
    void resolveMapboxAccessToken().then((token) => {
      if (!cancelled) setTokenReady(token.length > 0);
    });
    void warmMapboxModules().catch(() => { /* retry on open */ });
    return () => { cancelled = true; };
  }, [shouldWarmMap]);

  // Create Mapbox ONLY when the modal is open (visible, unscaled). Warm modules
  // separately. Re-init is allowed if a previous attempt failed.
  useEffect(() => {
    if (!mapContainerRef.current) return undefined;
    // Effect (re)mounted — the map is alive again.
    mapUnmountedRef.current = false;

    let deferHandle: ReturnType<typeof setTimeout> | null = null;

    const beginInit = () => {
      // Never create WebGL while closed — container is hidden + genie-scaled.
      if (!useModalStore.getState().showPassportMapModal) return;
      if (mapUnmountedRef.current || initStartedRef.current || mapRef.current || !mapContainerRef.current) return;
      // Synchronous lock: a pending defer-timer and the open-kick effect must
      // never both create a Mapbox instance. Reset on any early-out below.
      initStartedRef.current = true;
      setMapLoading(true);
      setMapError(null);

    (async () => {
      const token = await resolveMapboxAccessToken();
      if (mapUnmountedRef.current || !mapContainerRef.current || !useModalStore.getState().showPassportMapModal) {
        initStartedRef.current = false;
        setMapLoading(false);
        return;
      }

      if (!token) {
        setMapLoading(false);
        setTokenReady(false);
        setMapError('Mapbox token missing — set VITE_MAPBOX_ACCESS_TOKEN and redeploy');
        initStartedRef.current = false;
        return;
      }

      setTokenReady(true);

      const { passportMode: pm, userLatitude, userLongitude } = useFilterStore.getState();
      const hub = pm && userLatitude != null && userLongitude != null
        ? { lat: userLatitude, lng: userLongitude }
        : MAP_SEARCH_HUB;
      const initialLng = hub.lng;
      const initialLat = hub.lat;
      const initialZoom = CINEMATIC_OPEN_ALTITUDE_ZOOM;

      try {
        const { mapboxgl } = await warmMapboxModules();
        if (mapUnmountedRef.current || !mapContainerRef.current || !useModalStore.getState().showPassportMapModal) {
          initStartedRef.current = false;
          setMapLoading(false);
          return;
        }

        // Ensure container has real layout size (genie scale must be ~1).
        const rect = mapContainerRef.current.getBoundingClientRect();
        if (rect.width < 8 || rect.height < 8) {
          initStartedRef.current = false;
          deferHandle = setTimeout(beginInit, 80);
          return;
        }

        mapboxRef.current = mapboxgl;
        mapboxgl.accessToken = token;

        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        const onWebKit = isAppleWebKitEnv();
        const flyPitch = cinematicPitchForViewport();
        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/outdoors-v12',
          center: [initialLng, initialLat],
          zoom: initialZoom,
          // Lower pitch on Apple WebKit — high pitch + WebGL is flaky on some GPUs
          pitch: onWebKit ? Math.min(flyPitch, 45) : flyPitch,
          bearing: CINEMATIC_BEARING,
          attributionControl: false,
          fadeDuration: 0,
          antialias: false,
          projection: 'mercator',
          doubleClickZoom: false,
          maxPitch: cinematicMaxPitchForViewport(),
          refreshExpiredTiles: false,
          trackResize: true,
          preserveDrawingBuffer: false,
          // 'low-power' breaks WebGL on some Safari / iOS devices → blank map
          powerPreference: onWebKit ? 'default' : 'low-power',
          pixelRatio: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1,
          // Render CJK labels with a local font instead of downloading huge glyph
          // ranges from the network — meaningfully faster first paint on mobile.
          localIdeographFontFamily: "'Noto Sans', 'Inter', sans-serif",
        });

        map.touchZoomRotate.enableRotation();
        map.dragRotate.enable();

        // Mapbox sets tabindex=0 on the canvas — global [tabindex]:active CSS was
        // scaling the full-screen canvas on every tap (felt like the whole page
        // was one giant button). Keep it out of the tab order and press-engine.
        const canvas = map.getCanvas();
        canvas.setAttribute('tabindex', '-1');
        canvas.setAttribute('data-map-canvas', '');
        canvas.style.touchAction = 'none';

        map.on('load', () => {
          if (mapUnmountedRef.current) return;

          try {
            applyCinematicFog(map, isLightRef.current);
            if (!isMobile) {
              addCinematic3DBuildings(map, isLightRef.current);
            }
          } catch {
            // Style layers can race on slow devices — map still usable without extras
          }

          requestAnimationFrame(() => {
            resizeMap();
            const fix = deviceGpsRef.current ?? getCachedGpsFix();
            const mapOpen = useModalStore.getState().showPassportMapModal;
            const { passportMode: pm } = useFilterStore.getState();
            if (fix && mapOpen && !pm) {
              try {
                syncUserGpsDotOnMap(map, fix.lng, fix.lat);
              } catch {
                // Style layers can race on slow devices
              }
            }
            setMapReady(true);
            setMapLoading(false);
            refreshMapVisualsRef.current();
          });
        });

        map.on('error', (e: { error?: { status?: number; message?: string } }) => {
          const status = e?.error?.status;
          const message = e?.error?.message ?? '';
          if (status === 401 || status === 403 || /unauthorized|forbidden/i.test(message)) {
            if (!mapUnmountedRef.current) {
              setMapError('Mapbox token rejected — check URL restrictions in your Mapbox dashboard');
              setMapLoading(false);
            }
          }
        });

        // ═══════════════════════════════════════════════════════════════════
        // DOUBLE-TAP ZOOM — DO NOT REMOVE OR RELOCATE THESE LINES
        // Uses pointerup on the canvas (not touchend on the container) so it
        // fires reliably on iOS/Android regardless of touchAction or overlay
        // elements. Replacing with touchend or dblclick breaks mobile zoom.
        // ═══════════════════════════════════════════════════════════════════
        unbindMapDoubleTapRef.current?.();
        unbindMapDoubleTapRef.current = bindMapDoubleTapZoom(map, {
          isActive: () => useModalStore.getState().showPassportMapModal,
          lastZoomAtRef: lastDoubleTapZoomAtRef,
          lastPointerUpAtRef: lastMapPointerUpAtRef,
          onZoom: () => {
            markUserMapControlRef.current();
            triggerHaptic('light');
          },
        });

        // ═══════════════════════════════════════════════════════════════════
        // LONG-PRESS RELOCATE — DO NOT REMOVE OR RELOCATE THESE LINES
        // 1-second hold on any empty map area moves the radar search circle
        // to that point. Bound on the canvas so it works under all overlays.
        // ═══════════════════════════════════════════════════════════════════
        unbindLongPressRef.current?.();
        unbindLongPressRef.current = bindMapLongPress(map, {
          isActive: () => useModalStore.getState().showPassportMapModal,
          onLongPress: (lng, lat) => relocateSearchRef.current(lng, lat),
        });

        unbindInteractionRef.current?.();
        unbindInteractionRef.current = bindMapInteractionTracking(
          map,
          () => markUserMapControlRef.current(),
          (ev) => !ev.originalEvent,
        );

        map.scrollZoom.enable();
        map.dragPan.enable();
        map.touchZoomRotate.enable();
        map.touchPitch.enable();

        map.on('click', () => {
          if (!useModalStore.getState().showPassportMapModal) return;
          const now = Date.now();
          // Ignore the click that fires right after tapping a pin — otherwise it
          // clears the selection the tap just opened (sheet flashed open/closed).
          if (now - markerTapGuardRef.current < 500) return;
          // Ignore clicks while a double-tap sequence may still be in progress.
          if (now - lastMapPointerUpAtRef.current < MAP_DOUBLE_TAP_WINDOW_MS) return;
          // Ignore the stray click Mapbox emits right after our double-tap zoom.
          if (now - lastDoubleTapZoomAtRef.current < 500) return;
          clearPinPreview();
        });

        mapRef.current = map;

        if (mapContainerRef.current && typeof ResizeObserver !== 'undefined') {
          resizeObserverRef.current = new ResizeObserver(() => resizeMap());
          resizeObserverRef.current.observe(mapContainerRef.current);
        }
      } catch (err) {
        if (!mapUnmountedRef.current) {
          console.error('[PassportMap] init failed', err);
          setMapError('Failed to initialize map — close and try again');
          setMapLoading(false);
          initStartedRef.current = false;
        }
      }
    })();
    };

    // Expose so the open-kick effect can start init when the user opens the map.
    beginInitRef.current = beginInit;

    // Only start WebGL when the modal is open. Defer past the genie tween
    // (~100ms) so the host is at scale 1 / visible — required on Safari & iOS.
    if (useModalStore.getState().showPassportMapModal) {
      const delay = isAppleWebKitEnv() ? 160 : 40;
      deferHandle = setTimeout(beginInit, delay);
    }

    // Only clears the pending defer timer — never cancels a committed init.
    // True teardown is handled by the unmount effect (sets mapUnmountedRef).
    return () => {
      if (deferHandle) clearTimeout(deferHandle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resizeMap]);

  // Open kick: when the user opens the map, init (or re-init after a failed try).
  // Guarded by initStartedRef + mapRef so we never double-create Mapbox.
  useEffect(() => {
    if (!isOpen) return;
    if (mapRef.current) {
      // Already have a live map — force layout after genie expand.
      const t1 = window.setTimeout(() => resizeMap(), 50);
      const t2 = window.setTimeout(() => resizeMap(), 200);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }
    if (!initStartedRef.current) {
      const delay = isAppleWebKitEnv() ? 160 : 40;
      const t = window.setTimeout(() => beginInitRef.current?.(), delay);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [isOpen, resizeMap]);

  // Geocoder mounts after map is ready — keeps first paint fast
  useEffect(() => {
    if (!isOpen || !mapReady || !mapRef.current || !mapboxRef.current) return;
    if (geocoderRef.current) return;

    let cancelled = false;
    (async () => {
      const token = await resolveMapboxAccessToken();
      if (cancelled || !mapRef.current || !mapboxRef.current || !geocoderContainerRef.current) return;

      const { MapboxGeocoder } = await warmMapboxModules();
      if (cancelled || !mapRef.current) return;

      const proximity = deviceGps
        ? [deviceGps.lng, deviceGps.lat] as [number, number]
        : lat != null && lng != null
          ? [lng, lat] as [number, number]
          : undefined;

      const geocoder = new MapboxGeocoder({
        accessToken: token,
        mapboxgl: mapboxRef.current as any,
        marker: false,
        placeholder: 'Search near you or worldwide…',
        ...(proximity ? { proximity } : {}),
      });
      geocoder.on('result', (ev: any) => {
        const [newLng, newLat] = ev.result.center;
        clearPinPreview();
        flyToRef.current(newLat, newLng, ev.result.place_name);
      });
      geocoderRef.current = geocoder;
      geocoderContainerRef.current.innerHTML = '';
      geocoderContainerRef.current.appendChild(geocoder.onAdd(mapRef.current));
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mapReady, deviceGps, lat, lng]);

  // Keep geocoder proximity near user as GPS warms up after mount.
  useEffect(() => {
    const geocoder = geocoderRef.current as { setProximity?: (p: { longitude: number; latitude: number }) => void } | null;
    if (!geocoder?.setProximity || !mapReady) return;
    const proximity = deviceGps
      ? { longitude: deviceGps.lng, latitude: deviceGps.lat }
      : lat != null && lng != null
        ? { longitude: lng, latitude: lat }
        : null;
    if (proximity) geocoder.setProximity(proximity);
  }, [mapReady, deviceGps, lat, lng]);

  useEffect(() => () => {
    mapUnmountedRef.current = true;
    unbindLongPressRef.current?.();
    unbindLongPressRef.current = null;
    unbindInteractionRef.current?.();
    unbindInteractionRef.current = null;
    unbindMapDoubleTapRef.current?.();
    unbindMapDoubleTapRef.current = null;
    resizeObserverRef.current?.disconnect();
    markersRef.current.forEach(entry => {
      entry.cleanup();
      entry.marker.remove();
    });
    markersRef.current.clear();
    geocoderRef.current?.onRemove();
    if (mapRef.current) removeUserGpsDotFromMap(mapRef.current);
    mapRef.current?.remove();
    mapRef.current = null;
    mapboxRef.current = null;
    initStartedRef.current = false;
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const canvas = map.getCanvas();
    if (isOpen) {
      canvas.style.visibility = 'visible';
      // Safari often leaves a blank WebGL buffer until an explicit resize after show
      try {
        map.resize();
        map.triggerRepaint?.();
      } catch { /* map mid-destroy */ }
      refreshMapVisualsRef.current();
      requestAnimationFrame(() => {
        try { map.resize(); } catch { /* empty */ }
        refreshMapVisualsRef.current();
        requestAnimationFrame(refreshMapVisualsRef.current);
      });
      const t = window.setTimeout(() => {
        try { map.resize(); map.triggerRepaint?.(); } catch { /* empty */ }
        refreshMapVisualsRef.current();
      }, 120);
      return () => window.clearTimeout(t);
    }

    canvas.style.visibility = 'hidden';
    clearPinPreview();
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mapReady]);

  const applyDeviceGpsToMap = useCallback((fix: { lat: number; lng: number }) => {
    const map = mapRef.current;
    if (!map || !mapReady || !map.isStyleLoaded()) return;
    try {
      syncUserGpsDotOnMap(map, fix.lng, fix.lat);
    } catch {
      // Map can be mid-style-load during rapid open/close
    }
  }, [mapReady]);

  // Live GPS dot — tracks your real device position (ref-driven for smooth updates)
  useEffect(() => {
    if (!deviceGps) return;
    deviceGpsRef.current = deviceGps;
    applyDeviceGpsToMap(deviceGps);
  }, [deviceGps, applyDeviceGpsToMap]);

  // GPS watch only while map is visible — never on app boot.
  useEffect(() => {
    if (!isOpen || !canGeolocate()) {
      stopGpsWatch();
      return undefined;
    }
    startGpsWatch();
    return () => stopGpsWatch();
  }, [isOpen]);

  // Live radius circle — paint immediately on warm-start and every hub/radius change.
  useEffect(() => {
    if (!shouldLoadMapPins) return;
    applyRadiusCircleNow();
  }, [shouldLoadMapPins, applyRadiusCircleNow, radiusCenter, radiusKm]);

  const syncMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !mapboxRef.current || !shouldLoadMapPins) return;
    if (!map.isStyleLoaded()) {
      map.once('idle', () => syncMarkersRef.current());
      return;
    }
    const mapboxgl = mapboxRef.current;
    const registry = markersRef.current;
    const nextKeys = new Set<string>();
    const sel = selectedRef.current;

    const upsertListing = (l: (typeof visibleListings)[number]) => {
      const key = `listing:${l.id}`;
      nextKeys.add(key);
      const isSelected = sel?.type === 'listing' && sel.data.id === l.id;
      const existing = registry.get(key);

      if (existing) {
        existing.marker.setLngLat([l.lng, l.lat]);
        updateListingMarkerEl(existing.el, l, isSelected);
        return;
      }

      const el = createListingMarkerEl(l, isSelected);
      const cleanup = bindMarkerGestures(
        el,
        () => {
          triggerHaptic('light');
          focusPinSheet({ type: 'listing', data: l });
        },
        () => {
          triggerHaptic('medium');
          focusPinSheet({ type: 'listing', data: l });
        },
        () => useModalStore.getState().showPassportMapModal,
      );
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.25s ease-out';
      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([l.lng, l.lat])
        .addTo(map);
      requestAnimationFrame(() => { el.style.opacity = '1'; });
      registry.set(key, { marker, el, cleanup, pinType: 'listing', pinId: l.id });
    };

    const upsertProfile = (p: (typeof visibleProfiles)[number]) => {
      const key = `profile:${p.id}`;
      nextKeys.add(key);
      const isSelected = sel?.type === 'profile' && sel.data.id === p.id;
      const existing = registry.get(key);

      if (existing) {
        existing.marker.setLngLat([p.lng, p.lat]);
        updateProfileMarkerEl(existing.el, p, isSelected);
        return;
      }

      const el = createProfileMarkerEl(p, isSelected);
      const cleanup = bindMarkerGestures(
        el,
        () => {
          triggerHaptic('light');
          focusPinSheet({ type: 'profile', data: p });
        },
        () => {
          triggerHaptic('medium');
          focusPinSheet({ type: 'profile', data: p });
        },
        () => useModalStore.getState().showPassportMapModal,
      );
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.25s ease-out';
      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([p.lng, p.lat])
        .addTo(map);
      requestAnimationFrame(() => { el.style.opacity = '1'; });
      registry.set(key, { marker, el, cleanup, pinType: 'profile', pinId: p.id });
    };

    visibleListings.forEach(upsertListing);
    visibleProfiles.forEach(upsertProfile);

    for (const [key, entry] of registry) {
      if (!nextKeys.has(key)) {
        entry.cleanup();
        entry.marker.remove();
        registry.delete(key);
      }
    }
  }, [visibleListings, visibleProfiles, shouldLoadMapPins, focusPinSheet]);

  syncMarkersRef.current = syncMarkers;

  const refreshMapVisuals = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    resizeMap();
    applyRadiusCircleNow();
    syncMarkersRef.current();
  }, [resizeMap, applyRadiusCircleNow]);

  refreshMapVisualsRef.current = refreshMapVisuals;

  useEffect(() => {
    if (!shouldLoadMapPins || !mapReady) return;
    if (markerSyncRafRef.current != null) cancelAnimationFrame(markerSyncRafRef.current);
    markerSyncRafRef.current = requestAnimationFrame(() => {
      markerSyncRafRef.current = null;
      syncMarkers();
    });
    return () => {
      if (markerSyncRafRef.current != null) cancelAnimationFrame(markerSyncRafRef.current);
    };
  }, [syncMarkers, shouldLoadMapPins, mapReady]);

  // Re-sync when prefetched data lands while the sheet is still closed.
  useEffect(() => {
    if (!data || !shouldLoadMapPins || !mapReady) return;
    refreshMapVisuals();
  }, [data, shouldLoadMapPins, mapReady, refreshMapVisuals]);

  // First paint each open session — hub center, circle, pins (no async GPS yank).
  useEffect(() => {
    if (!isOpen || !mapReady) return;
    const session = mapOpenSessionRef.current;
    if (framedOpenSessionRef.current === session) return;
    framedOpenSessionRef.current = session;

    const map = mapRef.current;
    const center = radiusCenterRef.current;
    if (map && center && !userMapInteractedRef.current) {
      const zoom = zoomForRadiusKm(useFilterStore.getState().radiusKm);
      const pitch = cinematicPitchForViewport();
      cinematicOpenGlide(map, [center.lng, center.lat], zoom, { pitch, bearing: CINEMATIC_BEARING });
      applyRadiusCircleNow();
      initialCenterDoneRef.current = true;
    }
    refreshMapVisuals();
    const t1 = window.setTimeout(refreshMapVisuals, 50);
    const t2 = window.setTimeout(refreshMapVisuals, 250);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [isOpen, mapReady, refreshMapVisuals, applyRadiusCircleNow]);

  // Selection highlight only — avoids rebuilding every marker on tap
  useEffect(() => {
    if (!mapReady || !isOpen) return;
    const registry = markersRef.current;
    const listingsById = new Map(visibleListings.map(l => [l.id, l]));
    const profilesById = new Map(visibleProfiles.map(p => [p.id, p]));

    for (const entry of registry.values()) {
      const isSelected = selected?.type === entry.pinType && selected.data.id === entry.pinId;
      const isHiddenBySelection = selected != null && !isSelected;
      
      entry.el.style.opacity = isHiddenBySelection ? '0' : '1';
      entry.el.style.pointerEvents = isHiddenBySelection ? 'none' : 'auto';
      // Use standard CSS transition for a clean fade effect
      entry.el.style.transition = 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)';

      if (entry.pinType === 'listing') {
        const listing = listingsById.get(entry.pinId);
        if (listing) updateListingMarkerEl(entry.el, listing, isSelected);
      } else {
        const profile = profilesById.get(entry.pinId);
        if (profile) updateProfileMarkerEl(entry.el, profile, isSelected);
      }
    }
  }, [selected, mapReady, isOpen, visibleListings, visibleProfiles]);

  const mapboxReady = tokenReady;

  const statusLine = isError
    ? t('map.loadError')
    : gpsLoading && !radiusCenter
      ? t('map.findingYou')
      : showInitialDataLoad
        ? t('map.scanningArea')
        : !passportMode && deviceGps && !gpsLoading
          ? t('map.youAreHere')
          : nearbyCount > 0
            ? `${nearbyCount} in ${radiusKm}km`
            : isFetched
              ? t('map.noResults', { radius: radiusKm })
              : usingSearchFallback
                ? (canGeolocate() ? t('map.enableLocationHint', { defaultValue: 'Tap GPS or enable location' }) : t('map.scanningArea'))
                : t('map.scanningArea');

  const mapHostVisible = isOpen;

  return (
    <motion.div
      className={cn(
        'force-white fixed inset-0 z-[10025] overflow-hidden',
        !isOpen && 'pointer-events-none',
      )}
      role="dialog"
      aria-modal={isOpen}
      aria-hidden={!isOpen}
      initial={GENIE_FULLSCREEN_OPEN}
      animate={
        isOpen
          ? GENIE_FULLSCREEN_VISIBLE
          : { ...GENIE_FULLSCREEN_EXIT, transition: GENIE_SPRING_CLOSE }
      }
      transition={
        isOpen
          ? { type: 'tween', duration: 0.1, ease: 'easeOut' }
          : { type: 'tween', duration: 0.1 }
      }
      style={{
        ...GENIE_ORIGIN_BOTTOM,
        visibility: mapHostVisible ? 'visible' : 'hidden',
      }}
    >
      <div
        data-map-surface
        className="absolute inset-0 w-full h-full bg-[#0a0a12] overflow-hidden select-none"
        style={{ overscrollBehavior: 'none' }}
      >
        <div
          ref={mapContainerRef}
          data-map-surface
          className="absolute inset-0 w-full h-full select-none"
          style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
        />

        {/* Instant Map Skeleton — Visible while Mapbox GL initializes */}
        <AnimatePresence>
          {isOpen && !mapReady && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 w-full h-full pointer-events-none z-[1]"
            >
              {/* Map grid pattern background */}
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
                  backgroundSize: '40px 40px'
                }}
              />
              {/* Center crosshair pulse */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-white/10 flex items-center justify-center skeleton-pulse">
                <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center">
                  <div className="w-2 h-2 bg-brand-primary rounded-full animate-ping" />
                </div>
              </div>
              {/* Floating skeleton pins */}
              {[
                { top: '30%', left: '20%' },
                { top: '60%', left: '75%' },
                { top: '40%', left: '60%' },
                { top: '75%', left: '30%' },
                { top: '20%', left: '80%' },
              ].map((pos, i) => (
                <div 
                  key={i} 
                  className="absolute w-8 h-8 rounded-full bg-white/[0.03] border border-white/[0.05] backdrop-blur-md skeleton-pulse"
                  style={{ top: pos.top, left: pos.left, animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {isOpen && (
        <div ref={mapHudRef} data-map-hud data-skip-press-engine className="absolute inset-0 z-10 pointer-events-none">
        {/* Gradients removed for a cleaner map view as requested */}
        {/* Status pill moved to bottom left */}

        {/* Map HUD — collapsed by default for a clean phone view */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Top City Strip — Visible only when menu is expanded */}
              {hudExpanded && !selected && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-40 left-0 right-[64px] pointer-events-none"
                  style={{ top: 'calc(env(safe-area-inset-top, 0px) + 64px)' }}
                >
                  <div
                    className="w-full overflow-x-auto no-scrollbar scroll-smooth pointer-events-auto"
                    style={{ touchAction: 'pan-x' }}
                  >
                    <div className="flex items-center gap-2 px-3 py-1.5">
                      {PASSPORT_QUICK_CITIES.map((city) => {
                        const isActive = passportMode && passportLabel?.includes(city.name);
                        const flyToCity = () => {
                          triggerHaptic('medium');
                          setPassportLocation(city.lat, city.lng, `${city.name}`);
                          setRadiusKm(20);
                          if (mapRef.current) {
                            cinematicEaseTo(
                              mapRef.current,
                              [city.lng, city.lat],
                              zoomForRadiusKm(20),
                              { duration: 280, pitch: cinematicPitchForViewport() },
                            );
                          }
                          appToast.success(`Flying to ${city.name}`);
                        };
                        return (
                          <button
                            key={city.name}
                            type="button"
                            // Tap handled on pointerup (not onClick): the horizontal
                            // scroller was eating the first synthetic click, so cities
                            // needed two taps. Move guard keeps real swipes as scrolls.
                            onPointerDown={(e) => {
                              cityTapRef.current = { x: e.clientX, y: e.clientY, name: city.name };
                            }}
                            onPointerUp={(e) => {
                              const start = cityTapRef.current;
                              cityTapRef.current = null;
                              if (!start || start.name !== city.name) return;
                              if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > 12) return;
                              flyToCity();
                            }}
                            className={cn(
                              'map-hud-btn tap-highlight-transparent pointer-events-auto shrink-0 flex items-center gap-2 pl-1 pr-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border whitespace-nowrap overflow-hidden focus:outline-none outline-none transition-all duration-300',
                              isActive
                                ? 'bg-white border-white text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.6)] ring-2 ring-white/50 scale-105'
                                : 'bg-black/60 backdrop-blur-2xl border-white/30 text-white shadow-[0_8px_32px_rgba(0,0,0,0.8)] hover:bg-black/80 hover:scale-105',
                            )}
                            style={{ 
                              textShadow: isActive ? 'none' : '0 2px 8px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,1)',
                              boxShadow: isActive ? undefined : 'inset 0 1px 1px rgba(255,255,255,0.2)'
                            }}
                          >
                            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 ring-1 ring-white/25">
                              <img
                                src={city.img}
                                alt={city.name}
                                loading="lazy"
                                className="w-full h-full object-cover"
                                onError={(e) => { e.currentTarget.src = DEFAULT_CITY_PHOTO; }}
                              />
                            </div>
                            {city.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute z-40 pointer-events-none flex items-center gap-2"
                style={{
                  top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
                  left: '12px',
                }}
              >
                <button
                  type="button"
                  data-no-cinematic
                  onClick={onClose}
                  className={cn('map-hud-btn pointer-events-auto relative flex shrink-0 items-center justify-center rounded-full bg-black/30 backdrop-blur-xl border border-white/10 text-white shadow-lg hover:bg-black/50 hover:border-white/20 transition-all', MAP_HUD_BTN)}
                  aria-label="Close map"
                >
                  <X className={cn(MAP_HUD_ICON, 'relative z-10')} strokeWidth={2.0} />
                </button>

                {hudExpanded && (
                  <motion.div
                    animate={{ width: isSearchOpen ? 200 : 34 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    className="pointer-events-auto relative flex items-center h-[34px] rounded-full border border-white/10 shadow-lg overflow-hidden bg-black/30 backdrop-blur-xl"
                  >
                    <button
                      type="button"
                      data-no-cinematic
                      onClick={() => setIsSearchOpen(!isSearchOpen)}
                      className="map-hud-btn shrink-0 w-[32px] h-[32px] flex items-center justify-center text-white z-20 hover:text-white transition-all"
                      aria-label="Search location"
                    >
                      <Search className={cn(MAP_HUD_ICON, 'relative z-10')} strokeWidth={2.5} />
                    </button>
                    <div className={cn('flex-1 h-full relative flex items-center transition-opacity duration-200 z-10', isSearchOpen ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
                      <div
                        ref={geocoderContainerRef}
                        className={cn(
                          'w-full h-full flex items-center [&_.mapboxgl-ctrl-geocoder]:w-full [&_.mapboxgl-ctrl-geocoder]:h-full [&_.mapboxgl-ctrl-geocoder]:min-h-0 [&_.mapboxgl-ctrl-geocoder]:max-w-none [&_.mapboxgl-ctrl-geocoder]:shadow-none [&_.mapboxgl-ctrl-geocoder]:rounded-full [&_.mapboxgl-ctrl-geocoder]:bg-transparent [&_.mapboxgl-ctrl-geocoder]:flex [&_.mapboxgl-ctrl-geocoder]:items-center',
                          '[&_.mapboxgl-ctrl-geocoder]:border-0',
                          '[&_input]:text-white [&_input]:placeholder:text-white/60 [&_input]:text-[12px] [&_input]:font-medium [&_input]:h-[34px] [&_input]:leading-[34px] [&_input]:pl-[36px] [&_input]:bg-transparent [&_input]:outline-none',
                          '[&_.mapboxgl-ctrl-geocoder--icon-search]:hidden',
                          '[&_.mapboxgl-ctrl-geocoder--button]:bg-transparent [&_.mapboxgl-ctrl-geocoder--button]:text-white',
                        )}
                      />
                    </div>
                  </motion.div>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="absolute right-[12px] z-40 flex flex-col gap-2 items-center pointer-events-auto"
                style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
              >
                <button
                  type="button"
                  data-no-cinematic
                  onClick={() => {
                    triggerHaptic('light');
                    setHudExpanded(prev => !prev);
                    if (hudExpanded) {
                      setActiveDrawer(null);
                      setIsSearchOpen(false);
                    }
                  }}
                  className={cn('map-hud-btn relative flex items-center justify-center shrink-0 rounded-full bg-black/30 backdrop-blur-xl border border-white/10 shadow-lg text-white hover:bg-black/50 hover:border-white/20 transition-all', MAP_HUD_BTN)}
                  aria-label={hudExpanded ? t('map.collapseControls') : t('map.expandControls')}
                  title={hudExpanded ? t('map.collapseControls') : t('map.expandControls')}
                >
                  {hudExpanded
                    ? <X className={cn(MAP_HUD_ICON, 'relative z-10')} strokeWidth={2.0} />
                    : <Menu className={cn(MAP_HUD_ICON, 'relative z-10')} strokeWidth={2.0} />}
                </button>

                {hudExpanded && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex flex-col gap-2 items-center"
                  >
                    <div className="relative">
                      <button
                        type="button"
                        data-no-cinematic
                        onClick={handleGPS}
                        disabled={gpsLoading}
                        className={cn('map-hud-btn relative flex items-center justify-center shrink-0 rounded-full bg-black/30 backdrop-blur-xl border border-white/10 shadow-lg transition-all text-white hover:bg-black/50 hover:border-white/20 disabled:opacity-60', MAP_HUD_BTN)}
                        aria-label={t('map.myLocation')}
                        title={t('map.myLocation')}
                      >
                        {gpsLoading
                          ? <Loader2 className={cn(MAP_HUD_ICON, 'animate-spin relative z-10')} />
                          : <Navigation className={cn(MAP_HUD_ICON, 'relative z-10')} strokeWidth={2.0} />}
                      </button>
                      {!passportMode && deviceGps && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0a0a12] z-30" aria-hidden />
                      )}
                    </div>

                    {FILTER_TABS.map(({ id, labelKey, icon, gradient }) => (
                      <PassportMapChunkyButton
                        key={id}
                        icon={icon}
                        label={t(labelKey)}
                        gradient={gradient}
                        active={layerFilter === id}
                        compact
                        showLabel={false}
                        badge={
                          id === 'listings' ? visibleListings.length
                            : id === 'people' ? visibleProfiles.length
                              : nearbyCount
                        }
                        onClick={() => {
                          triggerHaptic('light');
                          setLayerFilter(id);
                          clearPinPreview();
                        }}
                      />
                    ))}

                    {/* Removed Cities button because they are now on top */}
                    <PassportMapChunkyButton
                      icon={LayoutList}
                      label={t('map.results')}
                      gradient={PASSPORT_GRADIENTS.listings}
                      active={activeDrawer === 'results'}
                      compact
                      showLabel={false}
                      badge={nearbyCount}
                      onClick={() => {
                        triggerHaptic('light');
                        setActiveDrawer(prev => prev === 'results' ? null : 'results');
                      }}
                    />
                  </motion.div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Bottom HUD — km radius pill + collapsible drawers in ONE bottom-anchored
            column. When the city strip or results carousel mounts, the km selector is
            pushed up automatically (flex flow + layout animation) so they never overlap. */}
        <div className="absolute inset-x-0 bottom-0 z-40 pointer-events-none flex flex-col justify-end" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>

          {/* Floating km radius pill & status — left aligned; rides up above any open drawer */}
          {isOpen && !selected && (
            <motion.div layout className="self-start flex flex-col items-start gap-2 px-3 mb-3 pointer-events-auto">
              {/* Status pill — GPS / nearby count */}
              <div className="map-hud-panel rounded-full px-4 py-2 flex items-center gap-2 shadow-lg bg-[#161b27]/95 border border-white/12">
                {!passportMode && deviceGps && !gpsLoading && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)] shrink-0" />
                )}
                {gpsLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00C6FF] shrink-0" />}
                <span className="text-[11px] font-bold text-white tracking-wide whitespace-nowrap">{statusLine}</span>
              </div>

              <LocationRadiusSelector
                surface="map"
                radiusKm={radiusKm}
                onRadiusChange={setRadiusKm}
                onDetectLocation={handleGPS}
                detecting={gpsLoading}
                detected={!passportMode && !!deviceGps}
                lat={radiusCenter?.lat}
                lng={radiusCenter?.lng}
                title={passportLabel ?? undefined}
                expanded={radiusHudExpanded}
                onExpandedChange={(v) => {
                  setRadiusHudExpanded(v);
                  if (v) setActiveDrawer(null);
                }}
              />
            </motion.div>
          )}

          {/* Active Drawer Area (city strip / results carousel) */}
          <AnimatePresence mode="sync">
            {/* Cities drawer removed because they are now on top */}
            {isOpen && hudExpanded && !selected && activeDrawer === 'results' && data && (
              <motion.div
                key="results-drawer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="w-full pointer-events-auto"
              >
                <PassportMapResultsRail
                  listings={visibleListings}
                  profiles={visibleProfiles}
                  filter={layerFilter}
                  selectedId={selectedId}
                  activePeopleCount={activePeopleCount}
                  onSelect={focusPinSheet}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Double-tap hint — pinned bottom-center, hidden while a drawer is docked */}
        <AnimatePresence>
          {isOpen && hudExpanded && !selected && !activeDrawer && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute inset-x-0 z-[39] text-center text-[9px] font-semibold text-white/45 tracking-wide pointer-events-none"
              style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 4px)' }}
            >
              {t('map.doubleTapHint')}
            </motion.p>
          )}
        </AnimatePresence>

        {isOpen && !mapboxReady && !mapLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center bg-[#1a1a2e]">
            <Search className="w-10 h-10 text-indigo-400 mb-4" />
            <p className="text-white font-bold mb-2">Map not configured</p>
            <p className="text-white/50 text-sm max-w-xs">
              Set <span className="text-white/70">VITE_MAPBOX_ACCESS_TOKEN</span> in Vercel and redeploy.
            </p>
          </div>
        )}

        {mapboxReady && mapLoading && !mapError && (
          <div className="absolute inset-0 z-[15] pointer-events-none bg-black/40">
            <div className="absolute inset-0 animate-pulse bg-gradient-to-b from-[#1a1a2e]/60 to-[#0a0a12]/80" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#00C6FF]/60 shadow-[0_0_20px_#00C6FF]" />
          </div>
        )}

        {isOpen && mapError && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center bg-[#1a1a2e]">
            <MapPin className="w-10 h-10 text-red-400 mb-4" />
            <p className="text-white font-bold">{mapError}</p>
          </div>
        )}


        <AnimatePresence>
          {selected && previewMode === 'sheet' && (
            <motion.div
              key={`sheet-${selected.type}-${selected.data.id}`}
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ type: 'spring', damping: 26, stiffness: 340 }}
              className="absolute inset-x-0 bottom-0 md:inset-auto md:left-4 md:top-[88px] md:bottom-4 z-50 pointer-events-auto flex justify-center md:justify-start"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <PassportMapPinPreview
                selected={selected}
                isLight={isLight}
                variant="sheet"
                onClose={clearPinPreview}
                onInsights={() => openInsightsFor(selected)}
                onDetails={selected.type === 'listing' ? () => openDetailsFor(selected.data.id) : undefined}
              />
            </motion.div>
          )}
        </AnimatePresence>
        </div>
        )}

      </div>
    </motion.div>
  );
});
PassportMapModal.displayName = 'PassportMapModal';