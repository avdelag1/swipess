import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Globe2, Loader2, MapPin, Navigation, Search, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { useModalStore } from '@/state/modalStore';
import { useFilterStore } from '@/state/filterStore';
import { appToast } from '@/utils/appNotification';
import useAppTheme from '@/hooks/useAppTheme';
import { canGeolocate, getCurrentPosition } from '@/utils/geolocation';
import { usePassportMapData, type MapListingPin, type MapProfilePin } from '@/hooks/usePassportMapData';
import { isMapboxPlacesReady } from '@/utils/mapboxPlaces';
import { warmMapboxModules } from '@/utils/mapWarmPool';

type SelectedPin =
  | { type: 'listing'; data: MapListingPin }
  | { type: 'profile'; data: MapProfilePin };

type MapboxGL = typeof import('mapbox-gl').default;

function createMarkerEl(color: string, imageUrl?: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'passport-map-marker';
  el.style.cssText = `
    width: 40px; height: 40px; border-radius: 50%;
    border: 3px solid ${color}; background: #111;
    box-shadow: 0 4px 14px rgba(0,0,0,0.45);
    overflow: hidden; cursor: pointer;
    background-size: cover; background-position: center;
  `;
  if (imageUrl) {
    el.style.backgroundImage = `url(${imageUrl})`;
  } else {
    el.style.background = color;
  }
  return el;
}

export const PassportMapModal = memo(() => {
  const { isLight } = useAppTheme();
  const isOpen = useModalStore(s => s.showPassportMapModal);
  const setModal = useModalStore(s => s.setModal);
  const openPropertyDetails = useModalStore(s => s.openPropertyDetails);
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
  const [selected, setSelected] = useState<SelectedPin | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  const centerLat = lat ?? 25.7617;
  const centerLng = lng ?? -80.1918;

  const { data, isLoading } = usePassportMapData(isOpen ? lat : null, isOpen ? lng : null, radiusKm);

  const onClose = useCallback(() => {
    triggerHaptic('light');
    setSelected(null);
    setModal('showPassportMapModal', false);
  }, [setModal]);

  const flyTo = useCallback((newLat: number, newLng: number, label?: string) => {
    setPassportLocation(newLat, newLng, label);
    setRadiusKm(50);
    mapRef.current?.flyTo({ center: [newLng, newLat], zoom: 11, duration: 900 });
    triggerHaptic('heavy');
    appToast.success(label ? `Exploring ${label}` : 'Location updated');
  }, [setPassportLocation, setRadiusKm]);

  const handleGPS = useCallback(async () => {
    if (!canGeolocate()) {
      appToast.error('Location not available');
      return;
    }
    setGpsLoading(true);
    try {
      const { latitude, longitude } = await getCurrentPosition({ timeout: 10000 });
      setUserLocation(latitude, longitude);
      mapRef.current?.flyTo({ center: [longitude, latitude], zoom: 12, duration: 900 });
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

  // Init map once — stays alive between opens
  useEffect(() => {
    if (initStartedRef.current || !mapContainerRef.current) return;

    const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (!token) {
      setMapError('Mapbox token missing');
      setMapLoading(false);
      return;
    }

    initStartedRef.current = true;
    let cancelled = false;

    (async () => {
      try {
        const { mapboxgl, MapboxGeocoder } = await warmMapboxModules();
        if (cancelled || !mapContainerRef.current) return;

        mapboxRef.current = mapboxgl;
        mapboxgl.accessToken = token;

        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: isLight ? 'mapbox://styles/mapbox/light-v11' : 'mapbox://styles/mapbox/dark-v11',
          center: [centerLng, centerLat],
          zoom: lat != null ? 10 : 3,
          attributionControl: false,
          fadeDuration: 0,
        });

        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

        map.on('load', () => {
          if (cancelled) return;
          resizeMap();
          setMapReady(true);
          setMapLoading(false);
        });

        map.on('error', () => {
          if (!cancelled) {
            setMapError('Could not load map tiles');
            setMapLoading(false);
          }
        });

        map.on('click', (e) => {
          if (!useModalStore.getState().showPassportMapModal) return;
          const features = map.queryRenderedFeatures(e.point, { layers: ['search-radius-circle'] });
          if (features.length) return;
          flyTo(e.lngLat.lat, e.lngLat.lng, 'Custom location');
        });

        mapRef.current = map;

        const geocoder = new MapboxGeocoder({
          accessToken: token,
          mapboxgl: mapboxgl as any,
          marker: false,
          placeholder: 'Search any city worldwide...',
        });
        geocoder.on('result', (ev: any) => {
          const [newLng, newLat] = ev.result.center;
          flyTo(newLat, newLng, ev.result.place_name);
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
          setMapError('Failed to initialize map');
          setMapLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      resizeObserverRef.current?.disconnect();
      markersRef.current.forEach(m => m.remove());
      geocoderRef.current?.onRemove();
      mapRef.current?.remove();
      mapRef.current = null;
      mapboxRef.current = null;
      initStartedRef.current = false;
    };
  }, []);

  // Resize + restyle when opened
  useEffect(() => {
    if (!isOpen || !mapRef.current) return;
    resizeMap();
    if (lat != null && lng != null) {
      mapRef.current.flyTo({ center: [lng, lat], zoom: 10, duration: 0 });
    }
  }, [isOpen, lat, lng, resizeMap]);

  // Radius circle layer
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || lat == null || lng == null) return;

    const addRadius = () => {
      if (map.getSource('search-radius')) {
        (map.getSource('search-radius') as any).setData({
          type: 'Feature',
          properties: {},
          geometry: { type: 'Point', coordinates: [lng, lat] },
        });
        return;
      }
      map.addSource('search-radius', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'Point', coordinates: [lng, lat] },
        },
      });
      map.addLayer({
        id: 'search-radius-circle',
        type: 'circle',
        source: 'search-radius',
        paint: {
          'circle-radius': { stops: [[0, 0], [20, radiusKm * 1000 * 0.075]], base: 2 },
          'circle-color': '#8B5CF6',
          'circle-opacity': 0.12,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#8B5CF6',
          'circle-stroke-opacity': 0.5,
        },
      });
    };

    if (map.isStyleLoaded()) addRadius();
    else map.once('load', addRadius);
  }, [mapReady, lat, lng, radiusKm]);

  useEffect(() => {
    if (!mapRef.current || !mapReady || !data || !mapboxRef.current || !isOpen) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const mapboxgl = mapboxRef.current;
    const addMarker = (lngV: number, latV: number, color: string, imageUrl: string | undefined, pin: SelectedPin) => {
      const el = createMarkerEl(color, imageUrl);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        triggerHaptic('medium');
        setSelected(pin);
      });
      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([lngV, latV])
        .addTo(mapRef.current!);
      markersRef.current.push(marker);
    };

    data.listings.forEach((l) => {
      addMarker(l.lng, l.lat, '#EC4899', l.imageUrl, { type: 'listing', data: l });
    });
    data.profiles.forEach((p) => {
      addMarker(p.lng, p.lat, '#6366F1', p.imageUrl, { type: 'profile', data: p });
    });
  }, [data, mapReady, isOpen]);

  const mapboxReady = isMapboxPlacesReady();

  return (
    <div
      className={cn(
        'fixed inset-0 z-[10025] flex flex-col transition-opacity duration-150',
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none invisible',
      )}
      aria-hidden={!isOpen}
    >
      <div
        className={cn('absolute inset-0', isLight ? 'bg-black/40' : 'bg-black/75')}
        onClick={onClose}
      />

      <div
        className={cn(
          'relative flex flex-col w-full h-full pointer-events-auto overflow-hidden transition-transform duration-200 ease-out',
          isLight ? 'bg-[#F5F5F7]' : 'bg-[#0A0A0A]',
          isOpen ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <div className={cn(
          'shrink-0 px-4 pt-[calc(env(safe-area-inset-top,0px)+12px)] pb-3 flex items-center justify-between gap-3 border-b z-20 glass-dark',
          isLight ? 'border-black/8' : 'border-white/10',
        )}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg">
              <Globe2 className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className={cn('text-sm font-black uppercase tracking-widest truncate', isLight ? 'text-slate-900' : 'text-white')}>
                Live Map
              </h2>
              <p className={cn('text-[10px] font-bold uppercase tracking-wider truncate', isLight ? 'text-slate-500' : 'text-white/40')}>
                {passportMode && passportLabel ? passportLabel : lat != null ? `${radiusKm}km radius` : 'Tap map or search a city'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleGPS}
              disabled={gpsLoading}
              className="glass-pill p-2.5"
              title="My location"
            >
              {gpsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
            </button>
            <button onClick={onClose} className="glass-pill p-2.5">
              <X className="w-4 h-4" />
            </button>
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

          {!mapboxReady && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center bg-[#1a1a2e]">
              <Search className="w-10 h-10 text-indigo-400 mb-4" />
              <p className="text-white font-bold mb-2">Mapbox token required</p>
              <p className="text-white/50 text-sm">Add VITE_MAPBOX_ACCESS_TOKEN to your .env file</p>
            </div>
          )}

          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

          {mapboxReady && mapLoading && !mapError && (
            <div className="absolute inset-0 z-[15] flex items-center justify-center pointer-events-none bg-[#1a1a2e]/40">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            </div>
          )}

          {mapError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center bg-[#1a1a2e]">
              <MapPin className="w-10 h-10 text-red-400 mb-4" />
              <p className="text-white font-bold">{mapError}</p>
            </div>
          )}

          <div className="absolute bottom-24 left-3 z-10 glass-pill px-3 py-2 text-[10px] font-bold uppercase tracking-wider flex gap-3">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pink-500" /> Listings</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> People</span>
            {isLoading && <Loader2 className="w-3 h-3 animate-spin ml-1" />}
          </div>
        </div>

        {selected && (
          <div
            onClick={() => {
              if (selected.type === 'listing') openPropertyDetails(selected.data.id);
              else openClientInsights(selected.data.id);
            }}
            className={cn(
              'shrink-0 mx-4 mb-[calc(env(safe-area-inset-bottom,0px)+16px)] p-4 rounded-2xl flex gap-3 items-center z-20 cursor-pointer glass-surface glass-dark',
            )}
          >
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-800 shrink-0 flex items-center justify-center">
              {selected.data.imageUrl ? (
                <img src={selected.data.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : selected.type === 'listing' ? (
                <MapPin className="w-6 h-6 text-pink-400" />
              ) : (
                <User className="w-6 h-6 text-indigo-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn('font-black text-sm truncate', isLight ? 'text-slate-900' : 'text-white')}>
                {selected.type === 'listing' ? selected.data.title : selected.data.name}
              </p>
              <p className={cn('text-xs truncate', isLight ? 'text-slate-500' : 'text-white/50')}>
                {selected.type === 'listing'
                  ? [selected.data.city, selected.data.price ? `$${selected.data.price}` : null].filter(Boolean).join(' · ')
                  : selected.data.city}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setSelected(null); }}
              className="glass-pill p-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {!selected && (
          <p className={cn(
            'shrink-0 text-center text-[10px] font-bold uppercase tracking-[0.2em] pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pt-2',
            isLight ? 'text-slate-400' : 'text-white/30',
          )}>
            Tap anywhere on the map to teleport your feed
          </p>
        )}
      </div>
    </div>
  );
});
PassportMapModal.displayName = 'PassportMapModal';