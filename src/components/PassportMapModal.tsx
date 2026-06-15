import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Building2, Globe2, Loader2, MapPin, Navigation, Search, Users, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { useModalStore } from '@/state/modalStore';
import { useFilterStore } from '@/state/filterStore';
import { appToast } from '@/utils/appNotification';
import useAppTheme from '@/hooks/useAppTheme';
import { canGeolocate, getCurrentPosition } from '@/utils/geolocation';
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
import { gradientForRadius, PASSPORT_GRADIENTS } from '@/components/passport/passportMapTheme';
import { RADIUS_LAYER_IDS, syncRadiusCircleOnMap } from '@/utils/mapRadiusCircle';

type MapboxGL = typeof import('mapbox-gl').default;

const RADIUS_PRESETS = [10, 25, 50, 100] as const;
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
  const isLightRef = useRef(isLight);
  isLightRef.current = isLight;

  const [selected, setSelected] = useState<SelectedPin | null>(null);
  const [layerFilter, setLayerFilter] = useState<MapLayerFilter>('all');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [tokenReady, setTokenReady] = useState(() => isMapboxConfigured());

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
    setModal('showPassportMapModal', false);
  }, [setModal]);

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

  const handleGPS = useCallback(async () => {
    if (!canGeolocate()) {
      appToast.error('Location not available');
      return;
    }
    setGpsLoading(true);
    try {
      const { latitude, longitude } = await getCurrentPosition({ timeout: 10000 });
      setUserLocation(latitude, longitude);
      mapRef.current?.flyTo({ 
        center: [longitude, latitude], 
        zoom: 12, 
        duration: 2500,
        pitch: 50,
        essential: true 
      });
      appToast.success('Using your current location');
    } catch {
      appToast.error('Could not detect location');
    } finally {
      setGpsLoading(false);
    }
  }, [setUserLocation]);

  const resizeMap = useCallback(() => {
    requestAnimationFrame(() => mapRef.current?.resize());
  }, []);

  // Auto-detect GPS when opening map (unless exploring via passport teleport)
  useEffect(() => {
    if (!isOpen) {
      autoGpsAttemptedRef.current = false;
      return;
    }
    if (!mapReady || autoGpsAttemptedRef.current || passportMode) return;
    if (!canGeolocate()) return;

    autoGpsAttemptedRef.current = true;
    (async () => {
      setGpsLoading(true);
      try {
        const { latitude, longitude } = await getCurrentPosition({ timeout: 12000, maximumAge: 30000 });
        setUserLocation(latitude, longitude);
        mapRef.current?.flyTo({
          center: [longitude, latitude],
          zoom: 12,
          duration: 2000,
          pitch: 45,
          essential: true,
        });
      } catch {
        /* user can tap GPS button manually */
      } finally {
        setGpsLoading(false);
      }
    })();
  }, [isOpen, mapReady, passportMode, setUserLocation]);

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
          style: isLightRef.current ? 'mapbox://styles/mapbox/light-v11' : 'mapbox://styles/mapbox/dark-v11',
          center: [initialLng, initialLat],
          zoom: initialZoom,
          attributionControl: false,
          fadeDuration: 0,
          antialias: true,
          projection: 'globe' as any,
        });

        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

        map.on('load', () => {
          if (cancelled) return;

          // Add Atmosphere (Fog)
          map.setFog({
            color: isLightRef.current ? 'rgb(186, 210, 235)' : 'rgb(20, 20, 30)', // Lower atmosphere
            'high-color': isLightRef.current ? 'rgb(36, 92, 223)' : 'rgb(10, 10, 15)', // Upper atmosphere
            'horizon-blend': 0.02,
            'space-color': isLightRef.current ? 'rgb(240, 245, 250)' : 'rgb(5, 5, 10)', // Background color
            'star-intensity': isLightRef.current ? 0 : 0.6 // Background star brightness
          });

          // Add 3D buildings
          const layers = map.getStyle().layers;
          let labelLayerId;
          if (layers) {
            for (let i = 0; i < layers.length; i++) {
              if (layers[i].type === 'symbol' && layers[i].layout && layers[i].layout['text-field']) {
                labelLayerId = layers[i].id;
                break;
              }
            }
          }

          map.addLayer(
            {
              id: 'add-3d-buildings',
              source: 'composite',
              'source-layer': 'building',
              filter: ['==', 'extrude', 'true'],
              type: 'fill-extrusion',
              minzoom: 14,
              paint: {
                'fill-extrusion-color': isLightRef.current ? '#e5e7eb' : '#262626',
                'fill-extrusion-height': [
                  'interpolate', ['linear'], ['zoom'],
                  14, 0,
                  14.05, ['get', 'height']
                ],
                'fill-extrusion-base': [
                  'interpolate', ['linear'], ['zoom'],
                  14, 0,
                  14.05, ['get', 'min_height']
                ],
                'fill-extrusion-opacity': 0.6
              }
            },
            labelLayerId
          );

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

        map.on('click', (e) => {
          if (!useModalStore.getState().showPassportMapModal) return;
          const layers = RADIUS_LAYER_IDS.filter(id => map.getLayer(id));
          const features = layers.length
            ? map.queryRenderedFeatures(e.point, { layers: layers as string[] })
            : [];
          if (features.length) return;
          setSelected(null);
          flyToRef.current(e.lngLat.lat, e.lngLat.lng, 'Custom location');
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
    mapRef.current?.remove();
    mapRef.current = null;
    mapboxRef.current = null;
    initStartedRef.current = false;
  }, []);

  useEffect(() => {
    if (!isOpen || !mapRef.current) return;
    resizeMap();
    if (lat != null && lng != null) {
      mapRef.current.flyTo({ center: [lng, lat], zoom: 10, duration: 0 });
    }
  }, [isOpen, lat, lng, resizeMap]);

  // Live FB-style radius circle — updates instantly when radius or center changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || lat == null || lng == null) return;

    const apply = () => syncRadiusCircleOnMap(map, lng, lat, radiusKm);
    if (map.isStyleLoaded()) apply();
    else map.once('load', apply);
  }, [mapReady, lat, lng, radiusKm]);

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

  return (
    <div
      className={cn(
        'fixed inset-0 z-[10025] flex flex-col',
        !isOpen && 'pointer-events-none invisible',
      )}
      role="dialog"
      aria-modal={isOpen}
      aria-hidden={!isOpen}
    >
      <div
        className={cn('absolute inset-0', isLight ? 'bg-black/40' : 'bg-black/75')}
        onClick={isOpen ? onClose : undefined}
      />

      <div
        className={cn(
          'relative flex flex-col w-full h-full pointer-events-auto overflow-hidden',
          isLight ? 'bg-[#F5F5F7]' : 'bg-[#0A0A0A]',
        )}
      >
        <div className={cn(
          'shrink-0 px-4 pt-[calc(env(safe-area-inset-top,0px)+12px)] pb-2 flex items-center justify-between gap-3 border-b z-20 glass-dark',
          isLight ? 'border-black/8' : 'border-white/10',
        )}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
              style={{ background: PASSPORT_GRADIENTS.passport }}
            >
              <Globe2 className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className={cn('text-sm font-black uppercase tracking-widest truncate italic', isLight ? 'text-slate-900' : 'text-white')}>
                Live Radar
              </h2>
              <p className={cn('text-[10px] font-bold uppercase tracking-wider truncate', isLight ? 'text-slate-500' : 'text-white/40')}>
                {gpsLoading ? 'Finding you…' : nearbyCount > 0 ? `${nearbyCount} in ${radiusKm}km` : 'Scanning area…'}
                {activePeopleCount > 0 ? ` · ${activePeopleCount} active` : ''}
                {passportMode && passportLabel ? ` · ${passportLabel}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleGPS}
              disabled={gpsLoading}
              className="p-2.5 rounded-2xl text-white shadow-lg active:scale-95 transition-transform"
              style={{ background: PASSPORT_GRADIENTS.tokens }}
              title="My location"
            >
              {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            </button>
            <button onClick={onClose} className="glass-pill p-2.5">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter tabs + live radius */}
        <div className={cn(
          'shrink-0 px-3 py-2.5 flex flex-col gap-2.5 border-b z-20',
          isLight ? 'border-black/6 bg-white/90' : 'border-white/8 bg-black/50',
        )}>
          <div className="flex gap-2">
            {FILTER_TABS.map(({ id, label, icon: Icon, gradient }) => (
              <button
                key={id}
                type="button"
                onClick={() => { triggerHaptic('light'); setLayerFilter(id); setSelected(null); }}
                className={cn(
                  'flex-1 py-2.5 rounded-2xl flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider italic transition-all active:scale-[0.97]',
                  layerFilter === id ? 'text-white shadow-lg' : (isLight ? 'text-slate-500 bg-slate-100' : 'text-white/45 bg-white/8'),
                )}
                style={layerFilter === id ? { background: gradient } : undefined}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {RADIUS_PRESETS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => { triggerHaptic('light'); setRadiusKm(r); }}
                className={cn(
                  'px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all active:scale-95',
                  radiusKm === r ? 'text-white shadow-md' : (isLight ? 'bg-slate-100 text-slate-500' : 'bg-white/8 text-white/45'),
                )}
                style={radiusKm === r ? { background: gradientForRadius(r) } : undefined}
              >
                {r} km
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className={cn('text-[9px] font-black uppercase tracking-widest shrink-0', isLight ? 'text-slate-400' : 'text-white/35')}>
              Range
            </span>
            <input
              type="range"
              min={5}
              max={150}
              step={5}
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="flex-1 h-1.5 accent-indigo-500 cursor-pointer"
              aria-label="Search radius in kilometers"
            />
            <span
              className="text-[10px] font-black text-white px-2 py-1 rounded-lg min-w-[3rem] text-center"
              style={{ background: gradientForRadius(radiusKm) }}
            >
              {radiusKm}km
            </span>
          </div>
        </div>

        <div className="relative flex-1 min-h-0 w-full bg-[#1a1a2e]">
          <div
            ref={geocoderContainerRef}
            className={cn(
              'absolute top-3 left-3 right-3 z-10 [&_.mapboxgl-ctrl-geocoder]:w-full [&_.mapboxgl-ctrl-geocoder]:max-w-none [&_.mapboxgl-ctrl-geocoder]:shadow-xl [&_.mapboxgl-ctrl-geocoder]:rounded-2xl [&_.mapboxgl-ctrl-geocoder]:border-0',
              isLight ? '[&_.mapboxgl-ctrl-geocoder]:bg-white' : '[&_.mapboxgl-ctrl-geocoder]:bg-[#1a1a1a] [&_input]:text-white',
            )}
          />

          {isOpen && !mapboxReady && !mapLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center bg-[#1a1a2e]">
              <Search className="w-10 h-10 text-indigo-400 mb-4" />
              <p className="text-white font-bold mb-2">Map not configured</p>
              <p className="text-white/50 text-sm max-w-xs">
                Set <span className="text-white/70">VITE_MAPBOX_ACCESS_TOKEN</span> in Vercel and redeploy.
              </p>
            </div>
          )}

          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

          {mapboxReady && mapLoading && !mapError && (
            <div className="absolute inset-0 z-[15] flex items-center justify-center pointer-events-none bg-[#1a1a2e]/40">
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
            <div className="absolute top-14 right-3 z-10 glass-pill px-2.5 py-1.5 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Updating</span>
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
        </div>

        <AnimatePresence>
          {selected && (
            <PassportMapPinPreview
              key={`${selected.type}-${selected.data.id}`}
              selected={selected}
              isLight={isLight}
              onClose={() => setSelected(null)}
              onInsights={() => openInsightsFor(selected)}
              onDetails={selected.type === 'listing' ? () => openDetailsFor(selected.data.id) : undefined}
            />
          )}
        </AnimatePresence>

        {!selected && (
          <p className={cn(
            'shrink-0 text-center text-[10px] font-bold uppercase tracking-[0.2em] pb-[calc(env(safe-area-inset-bottom,0px)+8px)] pt-1',
            isLight ? 'text-slate-400' : 'text-white/30',
          )}>
            Purple circle = your search zone · green dot = active members nearby
          </p>
        )}
      </div>
    </div>
  );
});
PassportMapModal.displayName = 'PassportMapModal';