import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, Globe2, LayoutList, Loader2, MapPin, Navigation, Search, Users, X } from 'lucide-react';
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
  incrementalDoubleTapZoom,
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
} from '@/components/passport/passportMapMarkers';
import { PassportMapChunkyButton } from '@/components/passport/PassportMapChunkyButton';
import { gradientForRadius, PASSPORT_GRADIENTS, RADIUS_GRADIENTS } from '@/components/passport/passportMapTheme';
import { syncRadiusCircleOnMap } from '@/utils/mapRadiusCircle';
import {
  GENIE_FULLSCREEN_EXIT,
  GENIE_FULLSCREEN_OPEN,
  GENIE_FULLSCREEN_VISIBLE,
  GENIE_ORIGIN_BOTTOM,
  GENIE_SPRING_CLOSE,
  GENIE_SPRING_OPEN,
} from '@/utils/genieMotion';
import { DEFAULT_CITY_PHOTO, PASSPORT_QUICK_CITIES } from '@/data/cityPhotos';
import { prefetchCityPhotosImmediate } from '@/utils/prefetchCityPhotos';

type MapboxGL = typeof import('mapbox-gl').default;

const RADIUS_PRESETS = [5, 20, 40, 80] as const;
const DOUBLE_TAP_WINDOW_MS = 300;
const DOUBLE_TAP_SLOP_PX = 40;

const FILTER_TABS: { id: MapLayerFilter; labelKey: string; icon: typeof Building2; gradient: string }[] = [
  { id: 'all', labelKey: 'map.filterAll', icon: Globe2, gradient: PASSPORT_GRADIENTS.all },
  { id: 'listings', labelKey: 'map.filterListings', icon: Building2, gradient: PASSPORT_GRADIENTS.listings },
  { id: 'people', labelKey: 'map.filterPeople', icon: Users, gradient: PASSPORT_GRADIENTS.people },
];

export const PassportMapModal = memo(() => {
  const { isLight } = useAppTheme();
  const { t } = useTranslation();
  const isOpen = useModalStore(s => s.showPassportMapModal);
  const passportSheetOpen = useModalStore(s => s.showPassportModal);
  const passportMapHandoff = useModalStore(s => s.passportMapHandoff);
  const passportMapShowCities = useModalStore(s => s.passportMapShowCities);
  const clearPassportMapFlags = useModalStore(s => s.clearPassportMapFlags);
  const shouldWarmMap = isOpen || passportSheetOpen;
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
  const markersRef = useRef<import('mapbox-gl').Marker[]>([]);
  const geocoderRef = useRef<{ onRemove: () => void } | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const initStartedRef = useRef(false);
  const autoGpsAttemptedRef = useRef(false);
  const openedOnceRef = useRef(false);
  const lastTouchTapRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const lastDoubleTapZoomAtRef = useRef(0);
  const isLightRef = useRef(isLight);
  isLightRef.current = isLight;

  const [deviceGps, setDeviceGps] = useState<{ lat: number; lng: number } | null>(null);
  const [selected, setSelected] = useState<SelectedPin | null>(null);
  const [layerFilter, setLayerFilter] = useState<MapLayerFilter>('all');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [tokenReady, setTokenReady] = useState(() => isMapboxConfigured());
  const [activeDrawer, setActiveDrawer] = useState<'cities' | 'results' | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    if (isOpen) prefetchCityPhotosImmediate();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (passportMapShowCities) {
      setActiveDrawer('cities');
      clearPassportMapFlags();
    }
  }, [isOpen, passportMapShowCities, clearPassportMapFlags]);

  const { data, isLoading } = usePassportMapData(isOpen ? lat : null, isOpen ? lng : null, radiusKm, isOpen);
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

  /** Search zone center — your GPS when local, passport target when exploring */
  const radiusCenter = useMemo(() => {
    if (passportMode && lat != null && lng != null) return { lat, lng };
    if (deviceGps) return deviceGps;
    if (lat != null && lng != null) return { lat, lng };
    return null;
  }, [passportMode, lat, lng, deviceGps]);

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
      cinematicFlyTo(mapRef.current, [newLng, newLat], zoom, { duration: 900, pitch: 62, bearing: 28 });
    }
    triggerHaptic('heavy');
    if (label) appToast.success(`Exploring ${label}`);
  }, [setPassportLocation]);

  const flyToRef = useRef(flyTo);
  flyToRef.current = flyTo;

  const focusPin = useCallback((pin: SelectedPin) => {
    setSelected(pin);
    if (mapRef.current) {
      cinematicFlyTo(mapRef.current, [pin.data.lng, pin.data.lat], 14.5, { duration: 550, pitch: 52 });
    }
  }, []);

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

        cinematicFlyTo(
          mapRef.current,
          [fix.lng, fix.lat],
          opts?.zoom ?? zoomForRadiusKm(radiusKm),
          { duration: 1100, pitch: CINEMATIC_PITCH },
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
      setDeviceGps({ lat, lng });
    }
  }, [isOpen, lat, lng, passportMode, deviceGps]);

  // Auto-detect GPS when opening map (unless exploring via passport teleport)
  useEffect(() => {
    if (!isOpen) {
      autoGpsAttemptedRef.current = false;
      return;
    }
    if (!mapReady || autoGpsAttemptedRef.current) return;

    autoGpsAttemptedRef.current = true;

    // Passport mode — fly to the teleported city
    if (passportMode && lat != null && lng != null) {
      cinematicFlyTo(
        mapRef.current!,
        [lng, lat],
        zoomForRadiusKm(radiusKm),
        { duration: 1400, pitch: CINEMATIC_PITCH },
      );
      return;
    }

    // Normal mode — center on device GPS
    if (!canGeolocate()) return;
    centerOnDeviceGpsRef.current({ zoom: zoomForRadiusKm(radiusKm), refresh: true });
  }, [isOpen, mapReady, passportMode, radiusKm, lat, lng]);

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
      const initialZoom = useFilterStore.getState().userLatitude != null ? 10 : 3;

      try {
        const { mapboxgl, MapboxGeocoder } = await warmMapboxModules();
        if (cancelled || !mapContainerRef.current) return;

        mapboxRef.current = mapboxgl;
        mapboxgl.accessToken = token;

        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/outdoors-v12',
          center: [initialLng, initialLat],
          zoom: initialZoom,
          pitch: CINEMATIC_PITCH,
          bearing: CINEMATIC_BEARING,
          attributionControl: false,
          fadeDuration: 0,
          antialias: true,
          projection: 'globe' as any,
          doubleClickZoom: false,
        });

        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
        map.touchZoomRotate.enableRotation();
        map.dragRotate.enable();

        const handleDoubleTapZoom = (lngLat: { lng: number; lat: number }) => {
          const now = Date.now();
          if (now - lastDoubleTapZoomAtRef.current < 120) return;
          if (!incrementalDoubleTapZoom(map, [lngLat.lng, lngLat.lat])) return;
          lastDoubleTapZoomAtRef.current = now;
          triggerHaptic('light');
        };

        map.on('load', () => {
          if (cancelled) return;

          applyCinematicFog(map, isLightRef.current);
          addCinematic3DBuildings(map, isLightRef.current);

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

        map.on('click', () => {
          if (!useModalStore.getState().showPassportMapModal) return;
          setSelected(null);
        });

        map.on('dblclick', (e: mapboxgl.MapMouseEvent) => {
          e.preventDefault();
          if (!useModalStore.getState().showPassportMapModal) return;
          handleDoubleTapZoom(e.lngLat);
        });

        map.on('touchend', (e: mapboxgl.MapTouchEvent) => {
          if (!useModalStore.getState().showPassportMapModal) return;
          if (e.originalEvent.touches.length > 0) return;

          const now = Date.now();
          const point = e.point;
          const last = lastTouchTapRef.current;

          if (
            last
            && now - last.time < DOUBLE_TAP_WINDOW_MS
            && Math.hypot(point.x - last.x, point.y - last.y) < DOUBLE_TAP_SLOP_PX
          ) {
            lastTouchTapRef.current = null;
            handleDoubleTapZoom(e.lngLat);
            return;
          }

          lastTouchTapRef.current = { time: now, x: point.x, y: point.y };
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

      const geocoder = new MapboxGeocoder({
        accessToken: token,
        mapboxgl: mapboxRef.current as any,
        marker: false,
        placeholder: 'Search cities worldwide...',
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
  }, [isOpen, mapReady]);

  useEffect(() => () => {
    resizeObserverRef.current?.disconnect();
    markersRef.current.forEach(m => m.remove());
    geocoderRef.current?.onRemove();
    if (mapRef.current) removeUserGpsDotFromMap(mapRef.current);
    mapRef.current?.remove();
    mapRef.current = null;
    mapboxRef.current = null;
    initStartedRef.current = false;
  }, []);

  useEffect(() => {
    if (!isOpen) {
      openedOnceRef.current = false;
      return;
    }
    if (!mapRef.current) return;
    resizeMap();
    requestAnimationFrame(() => {
      resizeMap();
      requestAnimationFrame(resizeMap);
    });
    const t = window.setTimeout(resizeMap, 120);
    if (!openedOnceRef.current) openedOnceRef.current = true;
    return () => window.clearTimeout(t);
  }, [isOpen, resizeMap, mapReady]);

  // Live GPS dot — tracks your real device position
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !deviceGps) return;

    const apply = () => syncUserGpsDotOnMap(map, deviceGps.lng, deviceGps.lat);
    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [mapReady, deviceGps]);

  // Keep GPS fresh while the map is open
  useEffect(() => {
    if (!isOpen || !canGeolocate()) return;

    let cleared = false;
    let webWatchId: number | null = null;
    let nativeWatchId: string | null = null;

    const applyFix = (latitude: number, longitude: number) => {
      if (cleared) return;
      setDeviceGps({ lat: latitude, lng: longitude });
      if (!passportMode) setUserLocation(latitude, longitude);
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
  }, [isOpen, passportMode, setUserLocation]);

  // Live radius circle around you (or passport explore target)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !radiusCenter) return;

    const apply = () => syncRadiusCircleOnMap(
      map,
      radiusCenter.lng,
      radiusCenter.lat,
      radiusKm,
      { showCenterDot: false },
    );
    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [mapReady, radiusCenter, radiusKm]);

  useEffect(() => {
    if (!mapRef.current || !mapReady || !mapboxRef.current || !isOpen) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const mapboxgl = mapboxRef.current;

    visibleListings.forEach((l) => {
      const isSelected = selected?.type === 'listing' && selected.data.id === l.id;
      const el = createListingMarkerEl(l, isSelected);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerHaptic('medium');
        focusPin({ type: 'listing', data: l });
      });
      markersRef.current.push(
        new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([l.lng, l.lat])
          .addTo(mapRef.current!),
      );
    });

    visibleProfiles.forEach((p) => {
      const isSelected = selected?.type === 'profile' && selected.data.id === p.id;
      const el = createProfileMarkerEl(p, isSelected);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerHaptic('medium');
        focusPin({ type: 'profile', data: p });
      });
      markersRef.current.push(
        new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([p.lng, p.lat])
          .addTo(mapRef.current!),
      );
    });
  }, [visibleListings, visibleProfiles, mapReady, isOpen, selected, focusPin]);

  const mapboxReady = tokenReady;

  const statusLine = gpsLoading
    ? 'Finding you…'
    : nearbyCount > 0
      ? `${nearbyCount} in ${radiusKm}km`
      : 'Scanning area…';

  const mapHostVisible = isOpen;
  const instantOpen = isOpen && passportMapHandoff;

  return (
    <motion.div
      className={cn(
        'fixed inset-0 z-[10025] overflow-hidden will-change-transform gpu-ultra',
        !isOpen && 'pointer-events-none',
      )}
      role="dialog"
      aria-modal={isOpen}
      aria-hidden={!isOpen}
      initial={instantOpen ? GENIE_FULLSCREEN_VISIBLE : GENIE_FULLSCREEN_OPEN}
      animate={
        isOpen
          ? GENIE_FULLSCREEN_VISIBLE
          : passportSheetOpen
            ? { ...GENIE_FULLSCREEN_OPEN, opacity: 0, pointerEvents: 'none' as const }
            : { ...GENIE_FULLSCREEN_EXIT, transition: GENIE_SPRING_CLOSE }
      }
      transition={
        instantOpen
          ? { duration: 0 }
          : isOpen
            ? { type: 'tween', duration: 0.1, ease: 'easeOut' }
            : { type: 'tween', duration: 0.1 }
      }
      onAnimationComplete={() => {
        if (isOpen && passportMapHandoff) clearPassportMapFlags();
      }}
      style={{
        ...GENIE_ORIGIN_BOTTOM,
        visibility: mapHostVisible ? 'visible' : 'hidden',
      }}
    >
      <div className="absolute inset-0 w-full h-full bg-[#0a0a12] overflow-hidden">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

        {isOpen && (
        <div data-map-hud data-skip-press-engine className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-36 pointer-events-none z-[5] bg-gradient-to-b from-black/55 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 pointer-events-none z-[5] bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

        {/* SLEEK MAP CONTROLS (Top Left & Top Right) */}
        <AnimatePresence>
          {isOpen && !selected && (
            <>
              {/* Top Left: Close & Search */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute z-40 pointer-events-none flex items-center gap-2"
                style={{ 
                  top: 'calc(env(safe-area-inset-top, 0px) + 16px)',
                  left: '16px' 
                }}
              >
                {/* Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="pointer-events-auto flex shrink-0 items-center justify-center w-[44px] h-[44px] rounded-full text-white/80 border border-white/10 shadow-lg overflow-hidden hover:bg-white/10 transition-all"
                  aria-label="Close map"
                >
                  <div className="absolute inset-0 bg-[#1A202C]/60 backdrop-blur-[10px] pointer-events-none" />
                  <X className="w-5 h-5 relative z-10" strokeWidth={2.0} />
                </button>

                {/* Expandable Search */}
                <motion.div
                  animate={{ 
                    width: isSearchOpen ? 240 : 44,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="pointer-events-auto relative flex items-center h-[44px] rounded-full border border-white/10 shadow-lg overflow-hidden"
                >
                  <div className="absolute inset-0 bg-[#1A202C]/60 backdrop-blur-[10px] pointer-events-none" />
                  {/* The Search Icon that toggles the input */}
                  <button 
                    type="button"
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                    className="absolute left-0 top-0 bottom-0 w-[44px] flex items-center justify-center text-white/80 z-20 hover:text-white"
                  >
                    <Search className="w-5 h-5 relative z-10" strokeWidth={2.0} />
                  </button>

                  {/* Geocoder Container Container */}
                  <div className={cn("absolute left-0 right-0 top-0 bottom-0 transition-opacity duration-200 z-10", isSearchOpen ? "opacity-100" : "opacity-0 pointer-events-none")}>
                    <div
                      ref={geocoderContainerRef}
                      className={cn(
                        'w-full h-full [&_.mapboxgl-ctrl-geocoder]:w-full [&_.mapboxgl-ctrl-geocoder]:h-full [&_.mapboxgl-ctrl-geocoder]:max-w-none [&_.mapboxgl-ctrl-geocoder]:shadow-none [&_.mapboxgl-ctrl-geocoder]:rounded-full [&_.mapboxgl-ctrl-geocoder]:bg-transparent',
                        '[&_.mapboxgl-ctrl-geocoder]:border-0',
                        '[&_input]:text-white [&_input]:placeholder:text-white/60 [&_input]:text-[13px] [&_input]:font-medium [&_input]:h-full [&_input]:pl-[42px] [&_input]:bg-transparent [&_input]:outline-none',
                        '[&_.mapboxgl-ctrl-geocoder--icon-search]:hidden', // hide default search icon
                        '[&_.mapboxgl-ctrl-geocoder--button]:bg-transparent [&_.mapboxgl-ctrl-geocoder--button]:text-white' // make clear button transparent
                      )}
                    />
                  </div>
                </motion.div>
              </motion.div>

              {/* Stacked Controls (Top Right) */}
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-[16px] z-40 flex flex-col gap-[12px] items-center pointer-events-auto"
                style={{ top: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
              >
                <button
                  type="button"
                  onClick={handleGPS}
                  disabled={gpsLoading}
                  className="relative w-[44px] h-[44px] flex items-center justify-center shrink-0 rounded-full border border-white/10 shadow-lg overflow-hidden transition-all duration-200 text-white/80 hover:bg-white/10 disabled:opacity-60"
                  title="My Location"
                >
                  <div className="absolute inset-0 bg-[#1A202C]/60 backdrop-blur-[10px]" />
                  {gpsLoading ? <Loader2 className="w-5 h-5 animate-spin relative z-10" /> : <Navigation className="w-5 h-5 relative z-10" strokeWidth={2.0} />}
                </button>

                {FILTER_TABS.map(({ id, labelKey, icon, gradient }) => (
                  <PassportMapChunkyButton
                    key={id}
                    icon={icon}
                    label={t(labelKey)}
                    gradient={gradient}
                    active={layerFilter === id}
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

                {/* Cities vertical button */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveDrawer(prev => prev === 'cities' ? null : 'cities');
                  }}
                  className={cn(
                    "relative w-[44px] h-[44px] flex items-center justify-center shrink-0 rounded-full border transition-all duration-200 shadow-lg overflow-hidden",
                    activeDrawer === 'cities' 
                      ? "border-white/40 text-white shadow-[0_0_15px_rgba(255,255,255,0.3)]" 
                      : "border-white/10 text-white/80 hover:bg-white/10"
                  )}
                  title="Cities"
                >
                  <div className={cn("absolute inset-0 backdrop-blur-[10px]", activeDrawer === 'cities' ? "bg-white/20" : "bg-[#1A202C]/90")} />
                  <Globe2 className="w-5 h-5 relative z-10" strokeWidth={2.0} />
                </button>

                {/* Results vertical button */}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setActiveDrawer(prev => prev === 'results' ? null : 'results');
                  }}
                  className={cn(
                    "relative w-[44px] h-[44px] flex items-center justify-center shrink-0 rounded-full border transition-all duration-200 shadow-lg overflow-hidden",
                    activeDrawer === 'results' 
                      ? "border-white/40 text-white shadow-[0_0_15px_rgba(255,255,255,0.3)]" 
                      : "border-white/10 text-white/80 hover:bg-white/10"
                  )}
                  title="Results"
                >
                  <div className={cn("absolute inset-0 backdrop-blur-[10px]", activeDrawer === 'results' ? "bg-white/20" : "bg-[#1A202C]/90")} />
                  <LayoutList className="w-5 h-5 relative z-10" strokeWidth={2.0} />
                  <div className="absolute -top-1 -right-1 bg-[#00C6FF] text-black text-[9px] font-black px-1.5 py-0.5 rounded-full z-20 shadow-md min-w-[18px] text-center border border-black/20">
                    {nearbyCount}
                  </div>
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Bottom HUD - Collapsible Drawers & Dock */}
        <div className="absolute inset-x-0 bottom-0 z-40 pointer-events-none flex flex-col justify-end" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}>
          
          {/* Active Drawer Area */}
          <AnimatePresence mode="wait">
            {isOpen && !selected && activeDrawer === 'cities' && (
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
                              cinematicFlyTo(
                                mapRef.current,
                                [city.lng, city.lat],
                                zoomForRadiusKm(20),
                                { duration: 520, pitch: CINEMATIC_PITCH },
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

            {isOpen && !selected && activeDrawer === 'results' && data && (
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
            {isOpen && !selected && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.2 }}
                className="px-4 w-full flex items-center justify-center pointer-events-auto"
              >
                {/* Center Sleek Radius Slider */}
                <div className="w-full max-w-[280px] bg-[#1A202C]/90 backdrop-blur-[10px] border border-white/10 shadow-2xl rounded-full px-5 py-2.5 flex flex-col gap-2 relative">
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

        {isLoading && (
          <div
            className="map-hud-panel absolute left-4 z-20 rounded-full px-2.5 py-1.5 flex items-center gap-1.5 pointer-events-none"
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + 120px)' }}
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white">Updating</span>
          </div>
        )}



        <AnimatePresence>
          {selected && (
            <div className="absolute inset-x-0 bottom-0 z-40 pointer-events-auto">
              <PassportMapPinPreview
                key={`${selected.type}-${selected.data.id}`}
                selected={selected}
                isLight={isLight}
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