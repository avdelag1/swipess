import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, Globe2, Loader2, MapPin, Navigation, Radar, Search, Users, X, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { useModalStore } from '@/state/modalStore';
import { useFilterStore } from '@/state/filterStore';
import { appToast } from '@/utils/appNotification';
import useAppTheme from '@/hooks/useAppTheme';
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

type MapboxGL = typeof import('mapbox-gl').default;

const RADIUS_PRESETS = [5, 20, 40, 80] as const;
const DOUBLE_TAP_WINDOW_MS = 300;
const DOUBLE_TAP_SLOP_PX = 40;

const FILTER_TABS: { id: MapLayerFilter; label: string; icon: typeof Building2; gradient: string }[] = [
  { id: 'all', label: 'All', icon: Globe2, gradient: PASSPORT_GRADIENTS.all },
  { id: 'listings', label: 'Listings', icon: Building2, gradient: PASSPORT_GRADIENTS.listings },
  { id: 'people', label: 'People', icon: Users, gradient: PASSPORT_GRADIENTS.people },
];

export const PassportMapModal = memo(() => {
  const { isLight } = useAppTheme();
  const isOpen = useModalStore(s => s.showPassportMapModal);
  const passportSheetOpen = useModalStore(s => s.showPassportModal);
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
  const [radiusPanelOpen, setRadiusPanelOpen] = useState(false);

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
    setRadiusPanelOpen(false);
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
      cinematicFlyTo(mapRef.current, [newLng, newLat], zoom, { duration: 3200, pitch: 62, bearing: 28 });
    }
    triggerHaptic('heavy');
    if (label) appToast.success(`Exploring ${label}`);
  }, [setPassportLocation]);

  const flyToRef = useRef(flyTo);
  flyToRef.current = flyTo;

  const focusPin = useCallback((pin: SelectedPin) => {
    setSelected(pin);
    if (mapRef.current) {
      cinematicFlyTo(mapRef.current, [pin.data.lng, pin.data.lat], 14.5, { duration: 1500, pitch: 52 });
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

  useEffect(() => {
    if (!shouldWarmMap || initStartedRef.current || !mapContainerRef.current) return;

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
  }, [shouldWarmMap, resizeMap]);

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
    if (!openedOnceRef.current) openedOnceRef.current = true;
  }, [isOpen, resizeMap]);

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

  const mapHostVisible = isOpen || passportSheetOpen;

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
          : passportSheetOpen
            ? { ...GENIE_FULLSCREEN_OPEN, opacity: 0 }
            : { ...GENIE_FULLSCREEN_EXIT, transition: GENIE_SPRING_CLOSE }
      }
      transition={isOpen ? GENIE_SPRING_OPEN : GENIE_SPRING_CLOSE}
      style={{
        ...GENIE_ORIGIN_BOTTOM,
        visibility: mapHostVisible ? 'visible' : 'hidden',
      }}
    >
      <div className="absolute inset-0 w-full h-full bg-[#0a0a12] overflow-hidden">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

        {isOpen && (
        <>
        <div className="absolute inset-x-0 top-0 h-36 pointer-events-none z-[5] bg-gradient-to-b from-black/55 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 pointer-events-none z-[5] bg-gradient-to-t from-black/70 via-black/25 to-transparent" />

        <div
          ref={geocoderContainerRef}
          className={cn(
            'absolute left-4 right-[5.5rem] z-20 [&_.mapboxgl-ctrl-geocoder]:w-full [&_.mapboxgl-ctrl-geocoder]:max-w-none [&_.mapboxgl-ctrl-geocoder]:shadow-xl [&_.mapboxgl-ctrl-geocoder]:rounded-2xl [&_.mapboxgl-ctrl-geocoder]:border-0',
            '[&_.mapboxgl-ctrl-geocoder]:bg-black/35 [&_.mapboxgl-ctrl-geocoder]:backdrop-blur-md [&_.mapboxgl-ctrl-geocoder]:border [&_.mapboxgl-ctrl-geocoder]:border-white/15',
            '[&_input]:text-white [&_input]:placeholder:text-white/45',
          )}
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 64px)' }}
        />

        {/* City quick-filter strip */}
        <div
          className="absolute left-0 right-0 z-20 pointer-events-auto overflow-x-auto no-scrollbar scroll-smooth"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 110px)' }}
        >
          <div className="flex items-center gap-1.5 px-4 py-1">
            {PASSPORT_QUICK_CITIES.map((city) => {
              const isActive = passportMode && passportLabel?.includes(city.name);
              return (
                <motion.button
                  key={city.name}
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  onClick={() => {
                    triggerHaptic('medium');
                    setPassportLocation(city.lat, city.lng, `${city.name}`);
                    setRadiusKm(20);
                    if (mapRef.current) {
                      cinematicFlyTo(
                        mapRef.current,
                        [city.lng, city.lat],
                        zoomForRadiusKm(20),
                        { duration: 1400, pitch: CINEMATIC_PITCH },
                      );
                    }
                    appToast.success(`Flying to ${city.name}`);
                  }}
                  className={cn(
                    'shrink-0 flex items-center gap-2 pl-1 pr-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border whitespace-nowrap overflow-hidden',
                    isActive
                      ? 'bg-white/25 border-white/40 text-white backdrop-blur-md shadow-lg ring-1 ring-white/20'
                      : 'bg-black/45 border-white/10 text-white/75 backdrop-blur-sm hover:bg-black/55 hover:text-white',
                  )}
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 ring-1 ring-white/25">
                    <img
                      src={city.img}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.currentTarget.src = DEFAULT_CITY_PHOTO; }}
                    />
                  </div>
                  {city.name}
                </motion.button>
              );
            })}
          </div>
        </div>
        <div
          className="absolute inset-x-4 z-30 flex items-center justify-between gap-2 pointer-events-none"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        >
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="pointer-events-auto flex items-center justify-center w-10 h-10 rounded-full text-white border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.4)] bg-black/40 backdrop-blur-md"
            aria-label="Close map"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </motion.button>

          <div className="pointer-events-none flex-1 min-w-0 flex justify-center px-2">
            <div className="glass-pill px-3 py-2 flex items-center gap-2 max-w-full">
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: PASSPORT_GRADIENTS.passport }}
              >
                <Radar className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-[10px] font-black uppercase italic tracking-widest text-white truncate">
                  Live Radar
                </p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-white/50 truncate">
                  {statusLine}
                  {activePeopleCount > 0 ? ` · ${activePeopleCount} active` : ''}
                  {passportMode && passportLabel ? ` · ${passportLabel}` : ''}
                </p>
              </div>
            </div>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={handleGPS}
            disabled={gpsLoading}
            className="pointer-events-auto flex items-center justify-center gap-2 h-10 px-4 rounded-full text-white border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.4)] disabled:opacity-60"
            style={{ background: PASSPORT_GRADIENTS.tokens }}
          >
            {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" strokeWidth={2.5} />}
            <span className="text-[10px] font-black uppercase tracking-wider">My Location</span>
          </motion.button>
        </div>

        <AnimatePresence>
          {isOpen && !selected && (
            <motion.div
              initial={{ opacity: 0, x: 18, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 12, scale: 0.94 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="absolute right-3 z-40 flex flex-col gap-2.5 items-center pointer-events-auto"
              style={{ top: 'calc(env(safe-area-inset-top, 0px) + 120px)' }}
            >
              {FILTER_TABS.map(({ id, label, icon, gradient }) => (
                <PassportMapChunkyButton
                  key={id}
                  icon={icon}
                  label={label}
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


            </motion.div>
          )}
        </AnimatePresence>

        {/* Inline radius quick-select — floating bottom bar, always visible */}
        <AnimatePresence>
          {isOpen && !selected && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute left-4 right-4 z-40 pointer-events-auto"
              style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)' }}
            >
              <div className="mx-auto max-w-md rounded-2xl border border-white/12 bg-black/60 backdrop-blur-xl p-3 shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
                {/* Preset buttons row */}
                <div className="flex items-center gap-1.5 mb-2.5">
                  {RADIUS_PRESETS.map((r) => (
                    <motion.button
                      key={r}
                      type="button"
                      whileTap={{ scale: 0.92 }}
                      onClick={() => { triggerHaptic('light'); setRadiusKm(r); }}
                      className={cn(
                        'flex-1 h-8 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-150',
                        radiusKm === r
                          ? 'text-white shadow-lg'
                          : 'text-white/50 bg-white/6 hover:bg-white/10 active:bg-white/14',
                      )}
                      style={radiusKm === r ? { background: gradientForRadius(r) } : undefined}
                    >
                      {r}km
                    </motion.button>
                  ))}
                </div>

                {/* Slider row */}
                <div className="flex items-center gap-2.5">
                  <div className="relative flex-1">
                    <div
                      className="absolute inset-y-0 left-0 flex items-center pointer-events-none"
                      style={{ width: `${((radiusKm - 5) / 75) * 100}%` }}
                    >
                      <div className="h-1.5 w-full rounded-full" style={{ background: gradientForRadius(radiusKm) }} />
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={80}
                      step={1}
                      value={radiusKm}
                      onChange={(e) => setRadiusKm(Number(e.target.value))}
                      className="relative w-full h-1.5 rounded-full appearance-none cursor-pointer z-10
                        [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[2px] [&::-webkit-slider-thumb]:border-white
                        [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(0,0,0,0.4)] [&::-webkit-slider-thumb]:cursor-grab
                        [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:-mt-[7px]
                        [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5
                        [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[2px] [&::-moz-range-thumb]:border-white
                        [&::-moz-range-thumb]:shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
                      style={{ background: 'rgba(255,255,255,0.08)' }}
                      aria-label="Search radius in kilometers"
                    />
                    <style>{`
                      input[type="range"]::-webkit-slider-thumb {
                        background: ${radiusKm <= 12 ? '#10B981' : radiusKm <= 30 ? '#6366F1' : radiusKm <= 55 ? '#8B5CF6' : '#F59E0B'};
                      }
                      input[type="range"]::-moz-range-thumb {
                        background: ${radiusKm <= 12 ? '#10B981' : radiusKm <= 30 ? '#6366F1' : radiusKm <= 55 ? '#8B5CF6' : '#F59E0B'};
                      }
                    `}</style>
                  </div>
                  <span
                    className="text-[10px] font-black text-white px-2 py-1 rounded-lg min-w-[2.8rem] text-center"
                    style={{ background: gradientForRadius(radiusKm) }}
                  >
                    {radiusKm}km
                  </span>
                </div>
              </div>
            </motion.div>
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

        {isLoading && (
          <div
            className="absolute left-4 z-20 glass-pill px-2.5 py-1.5 flex items-center gap-1.5 pointer-events-none"
            style={{ top: 'calc(env(safe-area-inset-top, 0px) + 120px)' }}
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white">Updating</span>
          </div>
        )}

        {!selected && data && (
          <PassportMapResultsRail
            listings={visibleListings}
            profiles={visibleProfiles}
            filter={layerFilter}
            selectedId={selectedId}
            activePeopleCount={activePeopleCount}
            onSelect={focusPin}
          />
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
        </>
        )}

      </div>
    </motion.div>
  );
});
PassportMapModal.displayName = 'PassportMapModal';