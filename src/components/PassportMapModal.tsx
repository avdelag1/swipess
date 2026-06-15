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

type MapboxGL = typeof import('mapbox-gl').default;

const RADIUS_PRESETS = [5, 10, 25, 50] as const;

function zoomForRadiusKm(km: number): number {
  return Math.min(16, Math.max(10, 13.8 - Math.log2(km)));
}
const FILTER_TABS: { id: MapLayerFilter; label: string; icon: typeof Building2; gradient: string }[] = [
  { id: 'all', label: 'All', icon: Globe2, gradient: PASSPORT_GRADIENTS.all },
  { id: 'listings', label: 'Listings', icon: Building2, gradient: PASSPORT_GRADIENTS.listings },
  { id: 'people', label: 'People', icon: Users, gradient: PASSPORT_GRADIENTS.people },
];

export const PassportMapModal = memo(() => {
  const { isLight } = useAppTheme();
  const isOpen = useModalStore(s => s.showPassportMapModal);
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
  const lastTouchTapRef = useRef(0);
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

  const selectedId = selected
    ? (selected.type === 'listing' ? selected.data.id : selected.data.id)
    : null;

  const onClose = useCallback(() => {
    triggerHaptic('light');
    setSelected(null);
    setRadiusPanelOpen(false);
    setModal('showPassportMapModal', false);
  }, [setModal]);

  // Dynamically zoom map to fit the expanding/contracting radius
  useEffect(() => {
    if (!isOpen || !mapReady || !mapRef.current || lat == null || lng == null) return;
    
    // Zoom out slightly more than before to show margin around the circle
    const targetZoom = 12.8 - Math.log2(radiusKm);
    
    mapRef.current.easeTo({
      center: [lng, lat],
      zoom: targetZoom,
      duration: 150, // very fast, instant feeling
      essential: true
    });
  }, [radiusKm, lat, lng, mapReady, isOpen]);

  const flyTo = useCallback((newLat: number, newLng: number, label?: string, zoom = 12) => {
    setPassportLocation(newLat, newLng, label);
    setRadiusKm(50);
    mapRef.current?.flyTo({ 
      center: [newLng, newLat], 
      zoom, 
      duration: 3500,
      pitch: 60,
      bearing: 20,
      essential: true 
    });
    triggerHaptic('heavy');
    if (label) appToast.success(`Exploring ${label}`);
  }, [setPassportLocation, setRadiusKm]);

  const flyToRef = useRef(flyTo);
  flyToRef.current = flyTo;

  const focusPin = useCallback((pin: SelectedPin) => {
    setSelected(pin);
    mapRef.current?.flyTo({
      center: [pin.data.lng, pin.data.lat],
      zoom: 14,
      duration: 1500,
      pitch: 45,
      essential: true
    });
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

        mapRef.current.flyTo({
          center: [fix.lng, fix.lat],
          zoom: opts?.zoom ?? zoomForRadiusKm(radiusKm),
          duration: 900,
          pitch: 50,
          essential: true,
        });
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
    centerOnDeviceGps({ zoom: 16, refresh: true, announce: true });
  }, [centerOnDeviceGps]);

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
    if (!mapReady || autoGpsAttemptedRef.current || passportMode) return;
    if (!canGeolocate()) return;

    autoGpsAttemptedRef.current = true;
    centerOnDeviceGpsRef.current({ zoom: zoomForRadiusKm(radiusKm), refresh: true });
  }, [isOpen, mapReady, passportMode, radiusKm]);

  // Dynamically update Mapbox Standard light preset on theme change
  useEffect(() => {
    if (mapReady && mapRef.current) {
      mapRef.current.setConfigProperty('basemap', 'lightPreset', isLight ? 'day' : 'night');
    }
  }, [isLight, mapReady]);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    resolveMapboxAccessToken().then((token) => {
      if (!cancelled) setTokenReady(token.length > 0);
    });
    return () => { cancelled = true; };
  }, [isOpen]);

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
          style: 'mapbox://styles/mapbox/standard',
          center: [initialLng, initialLat],
          zoom: initialZoom,
          attributionControl: false,
          fadeDuration: 0,
          antialias: true,
          projection: 'globe' as any,
          doubleClickZoom: true,
        });

        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

        map.on('load', () => {
          if (cancelled) return;

          // Mapbox Standard Configuration
          map.setConfigProperty('basemap', 'lightPreset', isLightRef.current ? 'day' : 'night');
          // Hide POI labels to keep map clean for Swipess
          map.setConfigProperty('basemap', 'showPointOfInterestLabels', false);
          map.setConfigProperty('basemap', 'showTransitLabels', false);

          requestAnimationFrame(() => {
            resizeMap();
            requestAnimationFrame(() => {
              resizeMap();
              setMapReady(true);
              setMapLoading(false);
            });
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

        map.on('dblclick', (e) => {
          e.preventDefault();
          if (!useModalStore.getState().showPassportMapModal) return;
          triggerHaptic('medium');
          centerOnDeviceGpsRef.current({ zoom: 16, refresh: true });
        });

        map.on('touchend', () => {
          if (!useModalStore.getState().showPassportMapModal) return;
          const now = Date.now();
          if (now - lastTouchTapRef.current < 320) {
            triggerHaptic('medium');
            centerOnDeviceGpsRef.current({ zoom: 16, refresh: true });
            lastTouchTapRef.current = 0;
            return;
          }
          lastTouchTapRef.current = now;
        });

        mapRef.current = map;

        const geocoder = new MapboxGeocoder({
          accessToken: token,
          mapboxgl: mapboxgl as any,
          marker: false,
          placeholder: 'Search cities worldwide...',
        });
        geocoder.on('result', (ev: any) => {
          const [newLng, newLat] = ev.result.center;
          setSelected(null);
          flyToRef.current(newLat, newLng, ev.result.place_name);
        });
        geocoderRef.current = geocoder;
        if (geocoderContainerRef.current) {
          geocoderContainerRef.current.innerHTML = '';
          geocoderContainerRef.current.appendChild(geocoder.onAdd(map));
        }

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

  // Live FB-style radius circle — updates instantly when radius or center changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || lat == null || lng == null) return;

    const apply = () => syncRadiusCircleOnMap(map, lng, lat, radiusKm, {
      showCenterDot: passportMode,
    });
    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [mapReady, lat, lng, radiusKm, passportMode]);

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

  return (
    <div
      className={cn(
        'fixed inset-0 z-[10025]',
        !isOpen && 'pointer-events-none invisible',
      )}
      role="dialog"
      aria-modal={isOpen}
      aria-hidden={!isOpen}
    >
      <div className="absolute inset-0 w-full h-full bg-[#0a0a12] overflow-hidden">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

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

        <div
          className="absolute inset-x-4 z-30 flex items-center justify-between gap-2 pointer-events-none"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        >
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="pointer-events-auto flex items-center justify-center w-12 h-12 rounded-2xl text-white border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.4)]"
            style={{ background: PASSPORT_GRADIENTS.premium }}
            aria-label="Close map"
          >
            <X className="w-5 h-5" strokeWidth={2.5} />
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
            className="pointer-events-auto flex items-center justify-center w-12 h-12 rounded-2xl text-white border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.4)] disabled:opacity-60"
            style={{ background: PASSPORT_GRADIENTS.tokens }}
            title="My location"
          >
            {gpsLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Navigation className="w-5 h-5" strokeWidth={2.2} />}
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

              <div className="w-8 h-px bg-white/15 my-0.5" />

              <PassportMapChunkyButton
                icon={MapPin}
                label={`${radiusKm}km`}
                gradient={gradientForRadius(radiusKm)}
                active={radiusPanelOpen}
                onClick={() => {
                  triggerHaptic('light');
                  setRadiusPanelOpen((v) => !v);
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {radiusPanelOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[35] bg-black/40 backdrop-blur-[2px]"
                onClick={() => setRadiusPanelOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                className="absolute left-4 right-4 z-[45] mx-auto max-w-sm rounded-[2rem] border border-white/10 bg-[#0d0d0d]/95 backdrop-blur-3xl p-5 shadow-[0_30px_80px_rgba(0,0,0,0.65)] pointer-events-auto"
                style={{ top: 'calc(env(safe-area-inset-top, 0px) + 108px)' }}
              >
                <div className="mb-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">Search Radius</h4>
                  <p className="text-sm font-black italic text-white/90">Live zone around you</p>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  {RADIUS_PRESETS.map((r) => (
                    <motion.button
                      key={r}
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => { triggerHaptic('light'); setRadiusKm(r); }}
                      className={cn(
                        'h-14 rounded-2xl flex flex-col items-center justify-center gap-0.5 border text-white font-black uppercase italic tracking-wider text-[10px] shadow-lg transition-all',
                        radiusKm === r ? 'border-white/30' : 'border-white/10 bg-white/5 text-white/55',
                      )}
                      style={radiusKm === r ? { background: RADIUS_GRADIENTS[r] } : undefined}
                    >
                      <Zap className="w-4 h-4" />
                      {r}km
                    </motion.button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <div
                      className="absolute inset-y-0 left-0 flex items-center pointer-events-none"
                      style={{ width: `${((radiusKm - 5) / 45) * 100}%` }}
                    >
                      <div className="h-2 w-full rounded-full" style={{ background: gradientForRadius(radiusKm) }} />
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={50}
                      step={1}
                      value={radiusKm}
                      onChange={(e) => setRadiusKm(Number(e.target.value))}
                      className="relative w-full h-2 rounded-full appearance-none cursor-pointer z-10
                        [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7
                        [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-white
                        [&::-webkit-slider-thumb]:shadow-[0_2px_12px_rgba(0,0,0,0.4)] [&::-webkit-slider-thumb]:cursor-grab
                        [&::-webkit-slider-thumb]:active:cursor-grabbing
                        [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:h-7
                        [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:border-white
                        [&::-moz-range-thumb]:shadow-[0_2px_12px_rgba(0,0,0,0.4)]"
                      style={{ background: 'rgba(255,255,255,0.12)' }}
                      aria-label="Search radius in kilometers"
                    />
                    <style>{`
                      input[type="range"]::-webkit-slider-thumb {
                        background: ${radiusKm <= 15 ? '#10B981' : radiusKm <= 35 ? '#6366F1' : '#8B5CF6'};
                      }
                      input[type="range"]::-moz-range-thumb {
                        background: ${radiusKm <= 15 ? '#10B981' : radiusKm <= 35 ? '#6366F1' : radiusKm <= 75 ? '#8B5CF6' : radiusKm <= 150 ? '#F59E0B' : '#EF4444'};
                      }
                    `}</style>
                  </div>
                  <span
                    className="text-[11px] font-black text-white px-2.5 py-1.5 rounded-xl min-w-[3.5rem] text-center shadow-lg"
                    style={{ background: gradientForRadius(radiusKm) }}
                  >
                    {radiusKm}km
                  </span>
                </div>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setRadiusPanelOpen(false)}
                  className="w-full mt-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white bg-white/10 hover:bg-white/15 transition-colors"
                >
                  Done
                </motion.button>
              </motion.div>
            </>
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

        {!selected && !radiusPanelOpen && (
          <div
            className="absolute inset-x-0 z-20 flex items-center justify-center gap-3 pointer-events-none px-4"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)' }}
          >
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: PASSPORT_GRADIENTS.listings }} />
              <span className="text-[8px] font-bold uppercase tracking-wider text-white/40">Listings</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: PASSPORT_GRADIENTS.people }} />
              <span className="text-[8px] font-bold uppercase tracking-wider text-white/40">People</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] ring-2 ring-white/60" />
              <span className="text-[8px] font-bold uppercase tracking-wider text-white/40">You</span>
            </div>
            <span className="text-[8px] font-bold uppercase tracking-wider text-white/25">Double-tap to zoom to you</span>
          </div>
        )}
      </div>
    </div>
  );
});
PassportMapModal.displayName = 'PassportMapModal';