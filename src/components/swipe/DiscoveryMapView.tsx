/**
 * DISCOVERY MAP VIEW — 🛸 RADAR SYSTEM v14.3 (Absolute Visibility Engine)
 * 
 * EMERGENCY RECOVERY:
 * 1. Z-INDEX OVERDRIVE: Enforced z-[999999] on the map container to bypass any possible layout masking.
 * 2. NO-ANIMATION MOUNT: Removed all Framer Motion wrappers from the map canvas to prevent stuck opacity.
 * 3. FALLBACK SURFACE: Added a bright #FFF (Light) / #111 (Dark) solid background to the container.
 * 4. SYSTEM TOASTS: Added technical feedback for every stage of the Leaflet lifecycle.
 */

import { useState, useEffect, useCallback, useRef, memo, useMemo } from 'react';
import { Navigation, RefreshCw, ArrowLeft, Layers, Sparkles, MapPin, ChevronRight, X } from 'lucide-react';
import { toast } from 'sonner';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { VespaIcon } from '@/components/icons/VespaIcon';
import { BeachBicycleIcon } from '@/components/icons/BeachBicycleIcon';
import { WorkersIcon } from '@/components/icons/WorkersIcon';
import { RealEstateIcon } from '@/components/icons/RealEstateIcon';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { useFilterStore } from '@/state/filterStore';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export const DiscoveryMapView = memo(({ 
  category, 
  onBack, 
  onStartSwiping: _onStartSwiping, 
  onCategoryChange,
  isEmbedded = false,
  mode = 'client'
}: {
  category: any;
  onBack: () => void;
  onStartSwiping?: () => void;
  onCategoryChange?: (cat: any) => void;
  isEmbedded?: boolean;
  mode?: 'client' | 'owner';
}) => {
  const { theme, isLight } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  
  const setUserLocation = useFilterStore(s => s.setUserLocation);
  const userLatitude = useFilterStore(s => s.userLatitude);
  const userLongitude = useFilterStore(s => s.userLongitude);
  const setRadiusKm = useFilterStore(s => s.setRadiusKm);

  const radarCircle = useRef<L.Circle | null>(null);
  const centerMarker = useRef<L.Marker | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const tilesRef = useRef<L.TileLayer | null>(null);

  const [localKm, setLocalKm] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>(isLight ? 'streets' : 'satellite');
  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  const currentCenter = useMemo<[number, number]>(() => 
    (userLatitude != null && userLongitude != null) ? [userLatitude, userLongitude] : [20.2114, -87.4654]
  , [userLatitude, userLongitude]);

  const { data: entities = [] } = useQuery({
    queryKey: ['radar-entities-v14.3', mode, category, userLatitude, userLongitude, localKm],
    queryFn: async () => {
      try {
        if (mode === 'client') {
          const { data } = await supabase.from('listings').select('id, title, price, images, latitude, longitude, category').eq('status', 'active');
          return (data || []).filter(i => i.category === category).map(item => ({ ...item, type: 'listing' }));
        } else {
          const { data } = await supabase.from('client_profiles').select('user_id, name, age, profile_images, latitude, longitude');
          return (data || []).map(item => ({ id: item.user_id, title: item.name, images: item.profile_images, latitude: item.latitude, longitude: item.longitude, type: 'client' }));
        }
      } catch (e) { return []; }
    }
  });

  const initMap = useCallback(() => {
    if (!mapContainerRef.current || mapInstance.current) return;
    
    console.log("[Radar] Initializing Engine...");
    toast.info("Radar Engine: Initializing...", { id: 'map-status' });

    try {
        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false,
            center: currentCenter,
            zoom: 15
        });

        const lightTiles = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        const darkTiles = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
        const satelliteTiles = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        
        const initialTiles = mapStyle === 'satellite' ? satelliteTiles : (isLight ? lightTiles : darkTiles);
        tilesRef.current = L.tileLayer(initialTiles, { maxZoom: 20 }).addTo(map);
        markersRef.current = L.layerGroup().addTo(map);
        
        radarCircle.current = L.circle(currentCenter, { color: '#EB4898', fillOpacity: 0.1, radius: localKm * 1000 }).addTo(map);
        centerMarker.current = L.marker(currentCenter, { icon: L.divIcon({ className: 'gps-dot', html: '<div class="w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-xl"></div>' }) }).addTo(map);

        // Multiple invalidations to handle animation/layout settle
        setTimeout(() => map.invalidateSize(), 100);
        setTimeout(() => map.invalidateSize(), 400);
        setTimeout(() => map.invalidateSize(), 800);

        // ResizeObserver to recalc on any size change (parent animations, keyboard, etc.)
        const ro = new ResizeObserver(() => {
          if (mapInstance.current) mapInstance.current.invalidateSize();
        });
        ro.observe(mapContainerRef.current);
        (mapInstance.current as any).__ro = ro;

        mapInstance.current = map;
        map.invalidateSize();
        
        setTimeout(() => { 
            map.invalidateSize(); 
            toast.success("Radar Engine: Ready", { id: 'map-status' });
        }, 500);

    } catch (e) {
        console.error(e);
        toast.error("Radar Engine: Failed");
    }
  }, [currentCenter, isLight, mapStyle, localKm]);

  useEffect(() => {
    const timer = setTimeout(initMap, 200);
    return () => {
        clearTimeout(timer);
        if (mapInstance.current) {
            const ro = (mapInstance.current as any).__ro as ResizeObserver | undefined;
            ro?.disconnect();
            mapInstance.current.remove();
            mapInstance.current = null;
        }
    };
  }, [initMap]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !markersRef.current) return;
    markersRef.current.clearLayers();
    entities.forEach(entity => {
        if (!entity.latitude || !entity.longitude) return;
        const iconColor = mode === 'client' ? '#EB4898' : '#3b82f6';
        let imageUrl = (entity.images as any)?.[0] || '/placeholder.svg';
        const marker = L.marker([entity.latitude, entity.longitude], {
            icon: L.divIcon({
                className: 'swipess-marker',
                html: `
                    <div class="relative group cursor-pointer active:scale-95 transition-transform" id="marker-${entity.id}">
                        <div class="w-10 h-10 rounded-2xl bg-white border-2 border-white shadow-lg overflow-hidden relative z-10">
                            <img src="${imageUrl}" class="w-full h-full object-cover" />
                            <div class="absolute bottom-0 inset-x-0 h-1" style="background: ${iconColor}"></div>
                        </div>
                    </div>
                `
            })
        });

        marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e as any);
            triggerHaptic('medium');
            setSelectedEntity(entity);
            map.flyTo([entity.latitude, entity.longitude], 17, { animate: true, duration: 1 });
        });
        marker.addTo(markersRef.current!);
    });
  }, [entities]);

  return (
    <div className={cn("flex flex-col bg-background", isEmbedded ? "absolute inset-0 z-[10]" : "fixed inset-0 z-[999999]")}>
      
      {/* 📡 THE CORE CANVAS container */}
      <div 
        ref={mapContainerRef} 
        className="flex-1 w-full h-full relative bg-neutral-800/20"
        style={{ isolation: 'isolate' }}
      >
          {/* Diagnostic Overlay */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center opacity-10 pointer-events-none z-[10]">
              <Sparkles className="w-20 h-20 animate-pulse text-[#EB4898]" />
              <p className="text-[10px] font-black uppercase tracking-[0.6em] mt-4">Searching Area</p>
          </div>
      </div>

      {/* 🛸 HUD OVERLAY */}
      <div className="absolute inset-0 pointer-events-none z-[1000000]">
          <div className="absolute top-10 left-6 pointer-events-auto">
              <button onClick={onBack} className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-2xl border border-white/10 active:scale-90 transition-all">
                  <ArrowLeft className="w-6 h-6" />
              </button>
          </div>

          <div className="absolute top-10 right-6 flex flex-col gap-2 pointer-events-auto">
              <button onClick={() => setMapStyle(prev => prev === 'streets' ? 'satellite' : 'streets')} className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl border transition-all", mapStyle === 'satellite' ? "bg-indigo-500 text-white" : "bg-black text-white")}>
                  <Layers className="w-6 h-6" />
              </button>
              <button onClick={() => navigator.geolocation.getCurrentPosition(p => setUserLocation(p.coords.latitude, p.coords.longitude))} className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center shadow-2xl border border-white/10">
                  <Navigation className="w-6 h-6" />
              </button>
          </div>

          <div className="absolute bottom-10 inset-x-6 flex flex-col items-center gap-4 pointer-events-none">
                {selectedEntity && (
                    <div className="w-full max-w-[340px] p-4 rounded-[2rem] bg-black border border-white/10 shadow-2xl pointer-events-auto flex items-center gap-4">
                        <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg border border-white/5"><img src={selectedEntity.images?.[0]} className="w-full h-full object-cover" /></div>
                        <div className="flex-1 min-w-0">
                            <h4 className="text-white text-[13px] font-black uppercase tracking-tight truncate italic">{selectedEntity.title}</h4>
                            <button onClick={() => _onStartSwiping?.()} className="mt-2 w-full h-8 rounded-xl bg-[#EB4898] text-white text-[10px] font-black uppercase tracking-widest">Connect</button>
                        </div>
                        <button onClick={() => setSelectedEntity(null)} className="p-2 text-white/40"><X className="w-4 h-4" /></button>
                    </div>
                )}

                {!selectedEntity && (
                    <div className="p-2 rounded-[2rem] bg-black/90 border border-white/10 flex gap-2 pointer-events-auto backdrop-blur-3xl shadow-2xl">
                        {[1, 5, 25, 100].map(km => (
                            <button key={km} onClick={() => { triggerHaptic('light'); setLocalKm(km); setRadiusKm(km); }} className={cn("px-4 h-8 rounded-xl text-[10px] font-black uppercase transition-all", localKm === km ? "bg-[#EB4898] text-white" : "text-white/40")}>
                                {km}KM
                            </button>
                        ))}
                    </div>
                )}

                {!selectedEntity && (
                    <div className="p-2 rounded-[2rem] bg-black/90 border border-white/10 flex gap-2 pointer-events-auto backdrop-blur-3xl shadow-2xl">
                        {[
                          { id: 'property', icon: RealEstateIcon }, { id: 'motorcycle', icon: VespaIcon }, { id: 'bicycle', icon: BeachBicycleIcon }, { id: 'services', icon: WorkersIcon }
                        ].map(cat => (
                            <button key={cat.id} onClick={() => onCategoryChange?.(cat.id)} className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", category === cat.id ? "bg-indigo-500 text-white shadow-xl shadow-indigo-500/20" : "text-white/40")}>
                                <cat.icon className="w-5 h-5" />
                            </button>
                        ))}
                    </div>
                )}
          </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .leaflet-container { 
            position: absolute !important; 
            inset: 0 !important; 
            width: 100% !important; 
            height: 100% !important; 
            z-index: 1 !important; 
            background: transparent !important;
        }
        .swipess-marker { transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1); }
        .swipess-marker:hover { transform: scale(1.2) translateY(-5px); z-index: 1000 !important; }
        
        .ivanna-style .leaflet-tile-container {
            filter: sepia(0.2) saturate(1.2) hue-rotate(-10deg) opacity(0.9);
        }
        .ivanna-style .leaflet-container {
            background: #DDF4EF !important;
        }
      `}} />
    </div>
  );
});

DiscoveryMapView.displayName = 'DiscoveryMapView';
