import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, Globe2, Layers, LayoutList, Loader2, MapPin, Minimize2, Navigation, Search, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { useModalStore } from '@/state/modalStore';
import { useFilterStore } from '@/state/filterStore';
import { appToast } from '@/utils/appNotification';
import useAppTheme from '@/hooks/useAppTheme';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { canGeolocate, getCurrentPosition } from '@/utils/geolocation';
import {
  addCinematic3DBuildings,
  applyCinematicFog,
  CINEMATIC_BEARING,
  CINEMATIC_PITCH,
  cinematicEaseTo,
  cinematicFlyTo,
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
import { bindMapDoubleTapZoom, bindMarkerGestures } from '@/utils/mapDoubleTapZoom';
import { computeMapPinPreviewPlacement, type MapPinPreviewPlacement } from '@/utils/mapPinPreviewPlacement';
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

/** Default search hub when GPS is still warming up — matches prod listing cluster. */
const MAP_SEARCH_HUB = PASSPORT_QUICK_CITIES.find(c => c.name === 'Tulum') ?? {
  lat: 20.2114,
  lng: -87.4654,
};
import { prefetchCityPhotosImmediate } from '@/utils/prefetchCityPhotos';

type MapboxGL = typeof import('mapbox-gl').default;

const PIN_PREVIEW_CARD = { width: 280, height: 260 };
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
  const shouldWarmMap = isOpen;
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
  const autoGpsAttemptedRef = useRef(false);
  const initialFlyDoneRef = useRef(false);
  const openedOnceRef = useRef(false);
  const lastDoubleTapZoomAtRef = useRef(0);
  const markerSyncRafRef = useRef<number | null>(null);
  const deviceGpsRef = useRef<{ lat: number; lng: number } | null>(null);
  const lastGpsStateAtRef = useRef(0);
  const isLightRef = useRef(isLight);
  isLightRef.current = isLight;

  const [deviceGps, setDeviceGps] = useState<{ lat: number; lng: number } | null>(null);
  const [selected, setSelected] = useState<SelectedPin | null>(null);
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
  const [previewPlacement, setPreviewPlacement] = useState<MapPinPreviewPlacement | null>(null);
  const mapHudRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) prefetchCityPhotosImmediate();
    if (!isOpen) setHudExpanded(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (passportMapShowCities) {
      setActiveDrawer('cities');
      clearPassportMapFlags();
    }
  }, [isOpen, passportMapShowCities, clearPassportMapFlags]);

  /** Search zone center — your GPS when local, passport target when exploring */
  const radiusCenter = useMemo(() => {
    if (passportMode && lat != null && lng != null) return { lat, lng };
    if (deviceGps) return deviceGps;
    if (lat != null && lng != null) return { lat, lng };
    return null;
  }, [passportMode, lat, lng, deviceGps]);

  const searchCoords = useMemo(() => {
    if (!isOpen) return null;
    return radiusCenter ?? MAP_SEARCH_HUB;
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

  const onClose = useCallback(() => {
    triggerHaptic('light');
    setSelected(null);
    setActiveDrawer(null);
    setModal('showPassportMapModal', false);
  }, [setModal]);

  const radiusCenterRef = useRef(radiusCenter);
  radiusCenterRef.current = radiusCenter;
  const prevRadiusKmRef = useRef(radiusKm);

  // Frame circle only when user changes radius — keeps 3D pitch, never fights GPS pan/zoom
  useEffect(() => {
    if (!isOpen || !mapReady || !mapRef.current) return;
    if (prevRadiusKmRef.current === radiusKm) return;
    prevRadiusKmRef.current = radiusKm;
    const center = radiusCenterRef.current;
    if (!center) return;
    cinematicEaseTo(
      mapRef.current,
      [center.lng, center.lat],
      zoomForRadiusKm(radiusKm),
      { duration: 200 },
    );
  }, [radiusKm, isOpen, mapReady]);

  const flyTo = useCallback((newLat: number, newLng: number, label?: string, zoom = 11) => {
    setPassportLocation(newLat, newLng, label);
    if (mapRef.current) {
      cinematicEaseTo(mapRef.current, [newLng, newLat], zoom, { duration: 300, pitch: 62, bearing: 28 });
    }
    triggerHaptic('heavy');
    if (label) appToast.success(`Exploring ${label}`);
  }, [setPassportLocation]);

  const flyToRef = useRef(flyTo);
  flyToRef.current = flyTo;

  const focusPin = useCallback((pin: SelectedPin) => {
    setSelected(pin);
  }, []);

  const updatePreviewPlacement = useCallback(() => {
    const map = mapRef.current;
    const hud = mapHudRef.current;
    if (!map || !hud || !selected) {
      setPreviewPlacement(null);
      return;
    }

    const point = map.project([selected.data.lng, selected.data.lat]);
    const hudRect = hud.getBoundingClientRect();
    setPreviewPlacement(computeMapPinPreviewPlacement(
      point.x,
      point.y,
      { width: hudRect.width, height: hudRect.height },
      PIN_PREVIEW_CARD,
    ));
  }, [selected]);

  useEffect(() => {
    if (!selected || !mapReady || !mapRef.current) {
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
  }, [selected, mapReady, updatePreviewPlacement]);

  const openInsightsFor = useCallback((pin: SelectedPin) => {
    triggerHaptic('medium');
    setModal('showPassportMapModal', false);
    setSelected(null);
    if (pin.type === 'listing') {
      openPropertyInsights(pin.data.id);
    } else {
      openClientInsights(pin.data.id);
    }
  }, [setModal, openPropertyInsights, openClientInsights]);

  const openDetailsFor = useCallback((listingId: string) => {
    triggerHaptic('medium');
    setModal('showPassportMapModal', false);
    setSelected(null);
    openPropertyDetails(listingId);
  }, [setModal, openPropertyDetails]);

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
          { duration: 320, pitch: CINEMATIC_PITCH },
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
    clearPassportLocation();
    centerOnDeviceGps({ zoom: zoomForRadiusKm(radiusKm), refresh: true, announce: true });
  }, [centerOnDeviceGps, radiusKm, clearPassportLocation]);

  const resizeMap = useCallback(() => {
    requestAnimationFrame(() => mapRef.current?.resize());
  }, []);

  // Seed GPS dot from store while watchPosition warms up
  useEffect(() => {
    if (!isOpen || deviceGps) return;
    if (lat != null && lng != null && !passportMode) {
      const fix = { lat, lng };
      deviceGpsRef.current = fix;
      setDeviceGps(fix);
    }
  }, [isOpen, lat, lng, passportMode, deviceGps]);

  // Request device GPS as soon as the map opens (before Mapbox finishes loading).
  useEffect(() => {
    if (!isOpen) {
      autoGpsAttemptedRef.current = false;
      return;
    }
    if (passportMode || autoGpsAttemptedRef.current || !canGeolocate()) return;

    autoGpsAttemptedRef.current = true;
    let cancelled = false;
    setGpsLoading(true);

    void (async () => {
      try {
        const { latitude, longitude } = await getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000,
        });
        if (cancelled) return;
        const fix = { lat: latitude, lng: longitude };
        deviceGpsRef.current = fix;
        setDeviceGps(fix);
        setUserLocation(latitude, longitude);
      } catch {
        if (!cancelled) {
          appToast.info('Enable location', 'Allow location access to see where you are on the map.');
        }
      } finally {
        if (!cancelled) setGpsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isOpen, passportMode, setUserLocation]);

  // Snap camera once on first open — reopen is instant (map stays warm).
  useEffect(() => {
    if (!isOpen || !mapReady || !mapRef.current) return;
    if (initialFlyDoneRef.current) {
      resizeMap();
      return;
    }

    const map = mapRef.current;
    const zoom = zoomForRadiusKm(radiusKm);

    if (passportMode && lat != null && lng != null) {
      cinematicFlyTo(
        map,
        [lng, lat],
        zoom,
        { duration: 4000, pitch: CINEMATIC_PITCH },
      );
      initialFlyDoneRef.current = true;
      return;
    }

    const target = deviceGpsRef.current ?? deviceGps
      ?? (lat != null && lng != null ? { lat, lng } : null);
    if (!target) return;

    cinematicFlyTo(
      map,
      [target.lng, target.lat],
      zoom,
      { duration: 4000, pitch: CINEMATIC_PITCH },
    );
    initialFlyDoneRef.current = true;
  }, [isOpen, mapReady, passportMode, radiusKm, lat, lng, deviceGps, resizeMap]);

  useEffect(() => {
    if (!shouldWarmMap) return;
    let cancelled = false;
    resolveMapboxAccessToken().then((token) => {
      if (!cancelled) setTokenReady(token.length > 0);
    });
    return () => { cancelled = true; };
  }, [shouldWarmMap]);

  // Create the Mapbox instance only when the live map is visible — initializing
  // while the genie sheet scales the host to ~0.35× (passport warm-behind) yields
  // a blank/broken canvas that never recovers on some devices.
  useEffect(() => {
    if (!isOpen || initStartedRef.current || !mapContainerRef.current) return;

    let cancelled = false;
    setMapLoading(true);
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

      const initialLng = useFilterStore.getState().userLongitude ?? -80.1918;
      const initialLat = useFilterStore.getState().userLatitude ?? 25.7617;
      const initialZoom = 1.5;

      try {
        const { mapboxgl } = await warmMapboxModules();
        if (cancelled || !mapContainerRef.current) return;

        mapboxRef.current = mapboxgl;
        mapboxgl.accessToken = token;

        const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/outdoors-v12',
          center: [initialLng, initialLat],
          zoom: initialZoom,
          pitch: isMobile ? 0 : CINEMATIC_PITCH,
          bearing: isMobile ? 0 : CINEMATIC_BEARING,
          attributionControl: false,
          fadeDuration: 0,
          antialias: !isMobile,
          projection: 'mercator',
          doubleClickZoom: true,
          maxPitch: isMobile ? 50 : 65,
          refreshExpiredTiles: false,
          trackResize: true,
        });

        map.touchZoomRotate.enableRotation();
        map.dragRotate.enable();

        map.on('load', () => {
          if (cancelled) return;

          try {
            applyCinematicFog(map, isLightRef.current);
            if (!isMobile) addCinematic3DBuildings(map, isLightRef.current);
          } catch {
            // Style layers can race on slow devices — map still usable without extras
          }

          requestAnimationFrame(() => {
            resizeMap();
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
          onZoom: () => triggerHaptic('light'),
        });

        map.on('click', () => {
          if (!useModalStore.getState().showPassportMapModal) return;
          setSelected(null);
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
        setSelected(null);
        flyToRef.current(newLat, newLng, ev.result.place_name);
      });
      geocoderRef.current = geocoder;
      geocoderContainerRef.current.innerHTML = '';
      geocoderContainerRef.current.appendChild(geocoder.onAdd(mapRef.current));
    })();

    return () => { cancelled = true; };
  }, [isOpen, mapReady, deviceGps, lat, lng]);

  useEffect(() => () => {
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
      if (!openedOnceRef.current) openedOnceRef.current = true;
      return () => window.clearTimeout(t);
    }

    canvas.style.visibility = 'hidden';
    setSelected(null);
    openedOnceRef.current = false;
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

  // Keep GPS fresh while the map is open
  useEffect(() => {
    if (!isOpen || !canGeolocate()) return;

    let cleared = false;
    let webWatchId: number | null = null;
    let nativeWatchId: string | null = null;

    const applyFix = (latitude: number, longitude: number) => {
      if (cleared) return;
      const fix = { lat: latitude, lng: longitude };
      deviceGpsRef.current = fix;
      applyDeviceGpsToMap(fix);

      const now = Date.now();
      if (now - lastGpsStateAtRef.current > 2500) {
        lastGpsStateAtRef.current = now;
        setDeviceGps(fix);
        if (!passportMode) setUserLocation(latitude, longitude);
      }
    };

    if (Capacitor.isNativePlatform()) {
      void Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 },
        (pos, err) => {
          if (err || !pos) return;
          applyFix(pos.coords.latitude, pos.coords.longitude);
        },
      ).then((id) => { nativeWatchId = id; });
    } else if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      webWatchId = navigator.geolocation.watchPosition(
        (pos) => applyFix(pos.coords.latitude, pos.coords.longitude),
        () => undefined,
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 },
      );
    }

    return () => {
      cleared = true;
      if (webWatchId != null) navigator.geolocation.clearWatch(webWatchId);
      if (nativeWatchId != null) void Geolocation.clearWatch({ id: nativeWatchId });
    };
  }, [isOpen, passportMode, setUserLocation, applyDeviceGpsToMap]);

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
          { showCenterDot: false },
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
        () => [l.lng, l.lat],
        mapRef,
        lastDoubleTapZoomAtRef,
        () => {
          triggerHaptic('light');
          openInsightsFor({ type: 'listing', data: l });
        },
        () => {
          triggerHaptic('medium');
          focusPin({ type: 'listing', data: l });
        },
        () => useModalStore.getState().showPassportMapModal,
        () => triggerHaptic('light'),
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
        () => [p.lng, p.lat],
        mapRef,
        lastDoubleTapZoomAtRef,
        () => {
          triggerHaptic('light');
          openInsightsFor({ type: 'profile', data: p });
        },
        () => {
          triggerHaptic('medium');
          focusPin({ type: 'profile', data: p });
        },
        () => useModalStore.getState().showPassportMapModal,
        () => triggerHaptic('light'),
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
  }, [visibleListings, visibleProfiles, mapReady, isOpen, focusPin]);

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
                ? t('map.scanningArea')
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
      <div className="absolute inset-0 w-full h-full bg-[#0a0a12] overflow-hidden select-none touch-none">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full select-none touch-none" style={{ touchAction: 'none', WebkitUserSelect: 'none', userSelect: 'none' }} />

        {isOpen && (
        <div ref={mapHudRef} data-map-hud data-skip-press-engine className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-36 pointer-events-none z-[5] bg-gradient-to-b from-black/55 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 pointer-events-none z-[5] bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

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
                  onClick={onClose}
                  className={cn('pointer-events-auto relative flex shrink-0 items-center justify-center rounded-full text-white/80 border border-white/10 shadow-md hover:bg-white/10 transition-all', MAP_HUD_BTN)}
                  aria-label="Close map"
                >
                  <div className="absolute inset-0 rounded-full bg-[#1A202C]/70 backdrop-blur-[8px] pointer-events-none" />
                  <X className={cn(MAP_HUD_ICON, 'relative z-10')} strokeWidth={2.0} />
                </button>

                {hudExpanded && (
                  <motion.div
                    animate={{ width: isSearchOpen ? 200 : 34 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    className="pointer-events-auto relative flex items-center h-[34px] rounded-full border border-white/10 shadow-md overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-[#1A202C]/70 backdrop-blur-[8px] pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setIsSearchOpen(!isSearchOpen)}
                      className={cn('absolute left-0 top-0 bottom-0 flex items-center justify-center text-white/80 z-20 hover:text-white', MAP_HUD_BTN)}
                    >
                      <Search className={cn(MAP_HUD_ICON, 'relative z-10')} strokeWidth={2.0} />
                    </button>
                    <div className={cn('absolute left-0 right-0 top-0 bottom-0 transition-opacity duration-200 z-10', isSearchOpen ? 'opacity-100' : 'opacity-0 pointer-events-none')}>
                      <div
                        ref={geocoderContainerRef}
                        className={cn(
                          'w-full h-full [&_.mapboxgl-ctrl-geocoder]:w-full [&_.mapboxgl-ctrl-geocoder]:h-full [&_.mapboxgl-ctrl-geocoder]:max-w-none [&_.mapboxgl-ctrl-geocoder]:shadow-none [&_.mapboxgl-ctrl-geocoder]:rounded-full [&_.mapboxgl-ctrl-geocoder]:bg-transparent',
                          '[&_.mapboxgl-ctrl-geocoder]:border-0',
                          '[&_input]:text-white [&_input]:placeholder:text-white/60 [&_input]:text-[12px] [&_input]:font-medium [&_input]:h-full [&_input]:pl-[36px] [&_input]:bg-transparent [&_input]:outline-none',
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
                  onClick={() => {
                    triggerHaptic('light');
                    setHudExpanded(prev => !prev);
                    if (hudExpanded) {
                      setActiveDrawer(null);
                      setIsSearchOpen(false);
                    }
                  }}
                  className={cn('relative flex items-center justify-center shrink-0 rounded-full border border-white/10 shadow-md text-white/90 hover:bg-white/10 transition-all', MAP_HUD_BTN)}
                  aria-label={hudExpanded ? t('map.collapseControls') : t('map.expandControls')}
                  title={hudExpanded ? t('map.collapseControls') : t('map.expandControls')}
                >
                  <div className="absolute inset-0 rounded-full bg-[#1A202C]/75 backdrop-blur-[8px]" />
                  {hudExpanded
                    ? <Minimize2 className={cn(MAP_HUD_ICON, 'relative z-10')} strokeWidth={2.0} />
                    : <Layers className={cn(MAP_HUD_ICON, 'relative z-10')} strokeWidth={2.0} />}
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
                        onClick={handleGPS}
                        disabled={gpsLoading}
                        className={cn('relative flex items-center justify-center shrink-0 rounded-full border border-white/10 shadow-md transition-all text-white/80 hover:bg-white/10 disabled:opacity-60', MAP_HUD_BTN)}
                        aria-label={t('map.myLocation')}
                        title={t('map.myLocation')}
                      >
                        <div className="absolute inset-0 rounded-full bg-[#1A202C]/70 backdrop-blur-[8px]" />
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
                          setSelected(null);
                        }}
                      />
                    ))}

                    <PassportMapChunkyButton
                      icon={Globe2}
                      label={t('map.cities')}
                      gradient={PASSPORT_GRADIENTS.all}
                      active={activeDrawer === 'cities'}
                      compact
                      showLabel={false}
                      onClick={() => {
                        triggerHaptic('light');
                        setActiveDrawer(prev => prev === 'cities' ? null : 'cities');
                      }}
                    />

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

        {/* Bottom HUD - Collapsible Drawers & Dock */}
        <div className="absolute inset-x-0 bottom-0 z-40 pointer-events-none flex flex-col justify-end" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
          
          {/* Active Drawer Area */}
          <AnimatePresence mode="wait">
            {isOpen && hudExpanded && !selected && activeDrawer === 'cities' && (
              <motion.div
                key="cities-drawer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="w-full pointer-events-auto mb-4"
              >
                {/* City quick-filter strip */}
                <div className="w-full overflow-x-auto no-scrollbar scroll-smooth">
                  <div className="flex items-center gap-2.5 px-4 py-1.5">
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
                                { duration: 280, pitch: CINEMATIC_PITCH },
                              );
                            }
                            appToast.success(`Flying to ${city.name}`);
                          }}
                          className={cn(
                            'map-hud-btn tap-highlight-transparent pointer-events-auto shrink-0 flex items-center gap-2 pl-1 pr-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border whitespace-nowrap overflow-hidden focus:outline-none outline-none',
                            isActive
                              ? 'bg-white/22 border-white/40 text-white shadow-lg ring-1 ring-white/20'
                              : 'map-hud-panel border-white/10 text-white/80 hover:bg-black/60',
                          )}
                        >
                          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-1 ring-white/25">
                            <img
                              src={city.img}
                              alt=""
                              loading="eager"
                              decoding="async"
                              fetchPriority="high"
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

            {isOpen && hudExpanded && !selected && activeDrawer === 'results' && data && (
              <motion.div
                key="results-drawer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="w-full pointer-events-auto mb-4"
              >
                <PassportMapResultsRail
                  listings={visibleListings}
                  profiles={visibleProfiles}
                  filter={layerFilter}
                  selectedId={selectedId}
                  activePeopleCount={activePeopleCount}
                  onSelect={focusPin}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Dock Control Bar */}
          <AnimatePresence>
            {isOpen && hudExpanded && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'px-4 w-full flex flex-col items-center justify-center pointer-events-auto gap-1.5',
                  selected && 'opacity-90',
                )}
              >
                <p className="text-[9px] font-semibold text-white/40 tracking-wide pointer-events-none">
                  {t('map.doubleTapHint')}
                </p>
                <div className="w-full max-w-[240px] bg-[#1A202C]/85 backdrop-blur-[8px] border border-white/10 shadow-xl rounded-full px-4 py-2 flex flex-col gap-1.5 relative">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-wider text-white/50 px-1">
                    <span>5km</span>
                    <span className="text-[#00C6FF]">{radiusKm}km Radius</span>
                    <span>80km</span>
                  </div>
                  <div className="relative w-full flex items-center h-[14px]">
                    <div className="absolute inset-x-0 h-1.5 rounded-full bg-white/10" />
                    <div
                      className="absolute left-0 h-1.5 rounded-full transition-all duration-100 ease-out"
                      style={{ 
                        width: `${((radiusKm - 5) / 75) * 100}%`,
                        background: 'linear-gradient(135deg, #00C6FF, #0072FF)' 
                      }}
                    />
                    <input
                      type="range"
                      min={5}
                      max={80}
                      step={1}
                      value={radiusKm}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val % 5 === 0) triggerHaptic('light');
                        setRadiusKm(val);
                      }}
                      className="absolute inset-0 w-full opacity-0 cursor-grab active:cursor-grabbing z-20"
                    />
                    <div 
                      className="absolute w-4 h-4 rounded-full bg-[#00C6FF] border-2 border-[#0B0E14] shadow-md z-10 pointer-events-none transition-transform duration-100 ease-out"
                      style={{
                        left: `calc(${((radiusKm - 5) / 75) * 100}% - 8px)`
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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

        {showInitialDataLoad && (
          <div
            className="map-hud-panel absolute left-4 z-20 rounded-full px-2.5 py-1.5 flex items-center gap-1.5 pointer-events-none"
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + 120px)' }}
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white">{t('map.scanningArea')}</span>
          </div>
        )}



        <AnimatePresence>
          {selected && previewPlacement && (
            <div
              key={`${selected.type}-${selected.data.id}`}
              className="absolute z-50 pointer-events-auto"
              style={{
                left: previewPlacement.left,
                top: previewPlacement.top,
                transform: previewPlacement.transform,
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <PassportMapPinPreview
                selected={selected}
                isLight={isLight}
                variant="anchored"
                onClose={() => setSelected(null)}
                onInsights={() => openInsightsFor(selected)}
                onDetails={selected.type === 'listing' ? () => openDetailsFor(selected.data.id) : undefined}
              />
            </div>
          )}
        </AnimatePresence>
        </div>
        )}

      </div>
    </motion.div>
  );
});
PassportMapModal.displayName = 'PassportMapModal';