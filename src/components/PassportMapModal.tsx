import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, Globe2, LayoutList, Loader2, MapPin, Navigation, Search, Users, X, Menu } from 'lucide-react';
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
  FLY_DURATION_OPEN_MS,
  OPEN_CENTER_MS,
  cinematicEaseTo,
  cinematicFlyTo,
  cinematicMaxPitchForViewport,
  cinematicPitchForViewport,
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
  updateListingMarkerEl,
  updateProfileMarkerEl,
  type MapLayerFilter,
  type SelectedPin,
} from '@/components/passport/passportMapMarkers';
import {
  bindMapDoubleTapZoom,
  bindMapInteractionTracking,
  bindMapLongPress,
  bindMarkerGestures,
  MAP_DOUBLE_TAP_WINDOW_MS,
} from '@/utils/mapDoubleTapZoom';

import { computeMapPinPreviewPlacement } from '@/utils/mapPinPreviewPlacement';
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
  prefetchUserGps,
  seedGpsCache,
  startGpsWatch,
  stopGpsWatch,
  subscribeGpsFix,
  type GpsFix,
} from '@/utils/mapGpsCache';

type MapboxGL = typeof import('mapbox-gl').default;

const PIN_PREVIEW_CARD = { width: 280, height: 260 };
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
  const markerSyncRafRef = useRef<number | null>(null);
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
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [tokenReady, setTokenReady] = useState(() => isMapboxConfigured());
  const [activeDrawer, setActiveDrawer] = useState<'cities' | 'results' | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [hudExpanded, setHudExpanded] = useState(false);
  const [radiusHudExpanded, setRadiusHudExpanded] = useState(false);
  const [searchAnchor, setSearchAnchor] = useState<{ lat: number; lng: number } | null>(null);
  const mapHudRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) prefetchCityPhotosImmediate();
    if (!isOpen) {
      setHudExpanded(false);
      setRadiusHudExpanded(false);
    }
  }, [isOpen]);

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

  /** Search zone center — long-press anchor beats GPS for the radius circle. */
  const radiusCenter = useMemo(() => {
    if (passportMode && lat != null && lng != null) return { lat, lng };
    if (searchAnchor) return searchAnchor;
    if (deviceGps) return deviceGps;
    if (lat != null && lng != null) return { lat, lng };
    return null;
  }, [passportMode, lat, lng, deviceGps, searchAnchor]);

  const searchCoords = useMemo(() => {
    if (!isOpen) return null;
    return radiusCenter;
  }, [isOpen, radiusCenter]);

  const usingSearchFallback = isOpen && radiusCenter == null;

  const { data, isFetching, isError, isFetched } = usePassportMapData(
    searchCoords?.lat ?? null,
    searchCoords?.lng ?? null,
    radiusKm,
    isOpen,
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
  const prevRadiusKmRef = useRef(radiusKm);

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
    setSelected(pin);
    setPreviewMode('sheet');
    setPreviewPlacement(computeMapPinPreviewPlacement(
      point.x,
      point.y,
      { width: hudRect.width, height: hudRect.height },
      PIN_PREVIEW_CARD,
    ));
  }, [selected, previewMode]);

  useEffect(() => {
    if (!selected || previewMode !== 'anchored' || !mapReady || !mapRef.current) {
      setPreviewPlacement(null);
      return;
    }

    const map = mapRef.current;
    const sync = () => updatePreviewPlacement();
    sync();
    map.on('move', sync);
    map.on('zoom', sync);
    map.on('resize', sync);
    map.on('pitch', sync);
    map.on('rotate', sync);

    return () => {
      map.off('move', sync);
      map.off('zoom', sync);
      map.off('resize', sync);
      map.off('pitch', sync);
      map.off('rotate', sync);
    };
  }, [selected, previewMode, mapReady, updatePreviewPlacement]);

  const openInsightsFor = useCallback((pin: SelectedPin) => {
    triggerHaptic('medium');
    setModal('showPassportMapModal', false);
    clearPinPreview();
    if (pin.type === 'listing') {
      openPropertyInsights(pin.data.id);
    } else {
      openClientInsights(pin.data.id);
    }
  }, [setModal, openPropertyInsights, openClientInsights, clearPinPreview]);

  const openDetailsFor = useCallback((listingId: string) => {
    triggerHaptic('medium');
    setModal('showPassportMapModal', false);
    clearPinPreview();
    openPropertyDetails(listingId);
  }, [setModal, openPropertyDetails, clearPinPreview]);

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
    setSearchAnchor(null);
    clearPassportLocation();
    userMapInteractedRef.current = false;
    centerOnDeviceGps({ zoom: zoomForRadiusKm(radiusKm), refresh: true, announce: true });
  }, [centerOnDeviceGps, radiusKm, clearPassportLocation]);

  const relocateSearchTo = useCallback((lng: number, lat: number) => {
    triggerHaptic('heavy');
    setSearchAnchor({ lat, lng });
    clearPassportLocation();
    userMapInteractedRef.current = false;
    const map = mapRef.current;
    if (map?.isStyleLoaded()) {
      cinematicEaseTo(
        map,
        [lng, lat],
        zoomForRadiusKm(radiusKm),
        { duration: OPEN_CENTER_MS, pitch: cinematicPitchForViewport() },
      );
    }
    appToast.success('Search area moved here — 1s press anywhere');
  }, [clearPassportLocation, radiusKm]);

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
        duration: duration || FLY_DURATION_OPEN_MS,
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
      initialCenterDoneRef.current = false;
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

  // Auto-center exactly once per open — never re-run when GPS or radius updates.
  useEffect(() => {
    if (!isOpen || !mapReady || initialCenterDoneRef.current) return;

    const session = mapOpenSessionRef.current;
    let cancelled = false;

    const runCenter = (target: { lat: number; lng: number }, duration = OPEN_CENTER_MS) => {
      if (cancelled || session !== mapOpenSessionRef.current) return;
      if (selectedRef.current || userMapInteractedRef.current || initialCenterDoneRef.current) return;
      centerMapOnTargetRef.current(target, session, { duration });
      initialCenterDoneRef.current = true;
    };

    // Map memory — once the user has moved the map (or opened a pin) in any prior
    // session, the persistent Mapbox instance already holds their last view. Don't
    // yank it back to GPS/city on reopen; the GPS button still recenters on demand.
    if (userEverMovedRef.current) {
      initialCenterDoneRef.current = true;
      return () => { cancelled = true; };
    }

    const { passportMode: pm, userLatitude, userLongitude } = useFilterStore.getState();
    if (pm && userLatitude != null && userLongitude != null) {
      if (userMapInteractedRef.current) return undefined;
      centerMapOnTargetRef.current(
        { lat: userLatitude, lng: userLongitude },
        session,
        { fly: true, duration: FLY_DURATION_OPEN_MS },
      );
      initialCenterDoneRef.current = true;
      return () => { cancelled = true; };
    }

    if (!canGeolocate()) return () => { cancelled = true; };

    setGpsLoading(true);
    const cached = getCachedGpsFix();
    const storeFix = userLatitude != null && userLongitude != null
      ? { lat: userLatitude, lng: userLongitude }
      : null;
    const initial = cached ?? storeFix;
    if (initial) runCenter(initial, OPEN_CENTER_MS);

    void prefetchUserGps({ maximumAge: 5_000 }).then((fix) => {
      if (cancelled || !fix || useFilterStore.getState().passportMode) return;
      applyGpsFixRef.current(fix);
      // Never yank the camera once the user is browsing a pin or has taken control.
      if (selectedRef.current || userMapInteractedRef.current || initialCenterDoneRef.current) return;
      runCenter(fix, OPEN_CENTER_MS);
    }).finally(() => {
      if (!cancelled) setGpsLoading(false);
    });

    return () => { cancelled = true; };
  }, [isOpen, mapReady, passportMode]);

  useEffect(() => {
    if (!shouldWarmMap) return;
    let cancelled = false;
    resolveMapboxAccessToken().then((token) => {
      if (!cancelled) setTokenReady(token.length > 0);
    });
    return () => { cancelled = true; };
  }, [shouldWarmMap]);

  // Create Mapbox once the host is mounted. Warm-start on dashboard (hidden) so
  // the first open is instant; still defer if the genie sheet is animating open.
  useEffect(() => {
    if (initStartedRef.current || !mapContainerRef.current) return;

    let cancelled = false;

    const beginInit = () => {
      if (cancelled || initStartedRef.current || !mapContainerRef.current) return;
      if (isOpen) setMapLoading(true);
      setMapError(null);

    (async () => {
      const token = await resolveMapboxAccessToken();
      if (cancelled || !mapContainerRef.current) return;

      if (!token) {
        setMapLoading(false);
        setTokenReady(false);
        return;
      }

      setTokenReady(true);
      initStartedRef.current = true;

      const storeLat = useFilterStore.getState().userLatitude;
      const storeLng = useFilterStore.getState().userLongitude;
      const deviceFix = deviceGpsRef.current;
      const hasUserHub = !!(deviceFix || (storeLat != null && storeLng != null));
      const hub = deviceFix ?? (storeLat != null && storeLng != null
        ? { lat: storeLat, lng: storeLng }
        : MAP_SEARCH_HUB);
      const initialLng = hub.lng;
      const initialLat = hub.lat;
      const storeRadius = useFilterStore.getState().radiusKm;
      const initialZoom = hasUserHub ? zoomForRadiusKm(storeRadius) : 2.2;

      try {
        const { mapboxgl } = await warmMapboxModules();
        if (cancelled || !mapContainerRef.current) return;

        mapboxRef.current = mapboxgl;
        mapboxgl.accessToken = token;

        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        const flyPitch = cinematicPitchForViewport();
        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/outdoors-v12',
          center: [initialLng, initialLat],
          zoom: initialZoom,
          pitch: flyPitch,
          bearing: CINEMATIC_BEARING,
          attributionControl: false,
          fadeDuration: 0,
          antialias: !isMobile,
          projection: 'mercator',
          doubleClickZoom: false,
          maxPitch: cinematicMaxPitchForViewport(),
          refreshExpiredTiles: false,
          trackResize: true,
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
          if (cancelled) return;

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
          });
        });

        map.on('error', (e: { error?: { status?: number; message?: string } }) => {
          const status = e?.error?.status;
          const message = e?.error?.message ?? '';
          if (status === 401 || status === 403 || /unauthorized|forbidden/i.test(message)) {
            if (!cancelled) {
              setMapError('Mapbox token rejected — check URL restrictions in your Mapbox dashboard');
              setMapLoading(false);
            }
          }
        });

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
      } catch {
        if (!cancelled) {
          setMapError('Failed to initialize map — try refreshing the page');
          setMapLoading(false);
          initStartedRef.current = false;
        }
      }
    })();
    };

    // Init immediately when open; defer warm-start so WebGL doesn't crash iOS on boot.
    if (isOpen) {
      beginInit();
    } else {
      const deferMs = 900;
      const handle = setTimeout(beginInit, deferMs);
      return () => {
        cancelled = true;
        clearTimeout(handle);
      };
    }

    return () => { cancelled = true; };
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
      resizeMap();
      requestAnimationFrame(() => {
        resizeMap();
        requestAnimationFrame(resizeMap);
      });
      const t = window.setTimeout(resizeMap, 80);
      return () => window.clearTimeout(t);
    }

    canvas.style.visibility = 'hidden';
    clearPinPreview();
    return undefined;
  }, [isOpen, resizeMap, mapReady]);

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

  // Live radius circle around you (or passport explore target)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !radiusCenter || !isOpen) return;

    const apply = () => {
      if (!map.isStyleLoaded()) return;
      try {
        syncRadiusCircleOnMap(
          map,
          radiusCenter.lng,
          radiusCenter.lat,
          radiusKm,
          { showCenterDot: true },
        );
      } catch {
        // Style can still be loading on first paint
      }
    };
    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [mapReady, radiusCenter, radiusKm, isOpen]);

  const syncMarkers = useCallback(() => {
    if (!mapRef.current || !mapReady || !mapboxRef.current || !isOpen) return;
    if (!mapRef.current.isStyleLoaded()) return;

    const map = mapRef.current;
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
      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([l.lng, l.lat])
        .addTo(map);
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
      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([p.lng, p.lat])
        .addTo(map);
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
  }, [visibleListings, visibleProfiles, mapReady, isOpen, focusPinSheet]);

  useEffect(() => {
    if (!isOpen || !mapReady) return;
    if (markerSyncRafRef.current != null) cancelAnimationFrame(markerSyncRafRef.current);
    markerSyncRafRef.current = requestAnimationFrame(() => {
      markerSyncRafRef.current = null;
      syncMarkers();
    });
    return () => {
      if (markerSyncRafRef.current != null) cancelAnimationFrame(markerSyncRafRef.current);
    };
  }, [syncMarkers, isOpen, mapReady]);

  // Selection highlight only — avoids rebuilding every marker on tap
  useEffect(() => {
    if (!mapReady || !isOpen) return;
    const registry = markersRef.current;
    const listingsById = new Map(visibleListings.map(l => [l.id, l]));
    const profilesById = new Map(visibleProfiles.map(p => [p.id, p]));

    for (const entry of registry.values()) {
      const isSelected = selected?.type === entry.pinType && selected.data.id === entry.pinId;
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
        'fixed inset-0 z-[10025] overflow-hidden will-change-transform gpu-ultra',
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

        {isOpen && (
        <div ref={mapHudRef} data-map-hud data-skip-press-engine className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-36 pointer-events-none z-[5] bg-gradient-to-b from-black/55 via-black/18 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-56 pointer-events-none z-[5] bg-gradient-to-t from-black/72 via-black/22 to-transparent" />

        {/* Status pill — GPS / nearby count */}
        {isOpen && !selected && (
          <div
            className="map-hud-panel absolute left-1/2 -translate-x-1/2 z-30 rounded-full px-4 py-2 flex items-center gap-2 pointer-events-none shadow-lg"
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + 72px)' }}
          >
            {!passportMode && deviceGps && !gpsLoading && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.9)] shrink-0" />
            )}
            {gpsLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00C6FF] shrink-0" />}
            <span className="text-[11px] font-bold text-white tracking-wide whitespace-nowrap">{statusLine}</span>
          </div>
        )}

        {/* Map HUD — collapsed by default for a clean phone view */}
        <AnimatePresence>
          {isOpen && (
            <>
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
                  className={cn('map-hud-btn pointer-events-auto relative flex shrink-0 items-center justify-center rounded-[14px] bg-white/95 border border-black/5 text-slate-700 shadow-lg hover:bg-white transition-all', MAP_HUD_BTN)}
                  aria-label="Close map"
                >
                  <X className={cn(MAP_HUD_ICON, 'relative z-10')} strokeWidth={2.0} />
                </button>

                {hudExpanded && (
                  <motion.div
                    animate={{ width: isSearchOpen ? 200 : 34 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    className="pointer-events-auto relative flex items-center h-[34px] rounded-full border border-white/10 shadow-md overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-[#1A202C]/85 backdrop-blur-[8px] pointer-events-none" />
                    <button
                      type="button"
                      data-no-cinematic
                      onClick={() => setIsSearchOpen(!isSearchOpen)}
                      className="map-hud-btn absolute inset-y-0 left-0 w-[34px] flex items-center justify-center text-white/80 z-20 hover:text-white"
                      aria-label="Search location"
                    >
                      <Search className={cn(MAP_HUD_ICON, 'relative z-10')} strokeWidth={2.0} />
                    </button>
                    <div className={cn('absolute left-0 right-0 top-0 bottom-0 flex items-center transition-opacity duration-200 z-10', isSearchOpen ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
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

                {/* Top City Strip */}
                {hudExpanded && !selected && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-[52px] left-0 right-[-48px] pointer-events-auto"
                  >
                    <div className="w-full overflow-x-auto no-scrollbar scroll-smooth">
                      <div className="flex items-center gap-2 pl-[12px] pr-4 py-1.5">
                        {PASSPORT_QUICK_CITIES.map((city) => {
                          const isActive = passportMode && passportLabel?.includes(city.name);
                          return (
                            <button
                              key={city.name}
                              type="button"
                              onClick={() => {
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
                              }}
                              className={cn(
                                'map-hud-btn tap-highlight-transparent pointer-events-auto shrink-0 flex items-center gap-2 pl-1 pr-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border whitespace-nowrap overflow-hidden focus:outline-none outline-none',
                                isActive
                                  ? 'bg-white/95 border-black/10 text-slate-900 shadow-lg ring-1 ring-black/5'
                                  : 'bg-[#1A202C]/85 backdrop-blur-[8px] border-white/10 text-white/90 hover:bg-white/20',
                              )}
                            >
                              <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 ring-1 ring-white/25">
                                <img
                                  src={city.img}
                                  alt=""
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
                  className={cn('map-hud-btn relative flex items-center justify-center shrink-0 rounded-[14px] bg-white/95 border border-black/5 shadow-lg text-slate-700 hover:bg-white transition-all', MAP_HUD_BTN)}
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
                        className={cn('map-hud-btn relative flex items-center justify-center shrink-0 rounded-[14px] bg-white/95 border border-black/5 shadow-lg transition-all text-slate-700 hover:bg-white disabled:opacity-60', MAP_HUD_BTN)}
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

          {/* Floating km radius pill — left aligned; rides up above any open drawer */}
          {isOpen && !selected && (
            <motion.div layout className="self-start px-3 mb-3 pointer-events-auto">
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
          <AnimatePresence mode="wait">
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
          <div className="absolute inset-0 z-[15] flex items-center justify-center pointer-events-none bg-black/30">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
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