/**
 * DISCOVERY MAP VIEW — 🛸 RADAR NEXUS v14.0
 * 
 * Final Ergonomic Polish:
 * 1. Balanced Center Hud: Shifted KM selects and Category Matrix to the horizontal center axis.
 * 2. Visual Breathing Room: Adjusted z-index and spacing for maximum document momentum.
 * 3. Liquid Glass Command Pill: Unified horizontal category rail at the bottom for thumb-reach ergonomics.
 * 4. REAL-TIME MARKERS: Now fetches and renders live markers for listings & clients.
 */

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  
  const radiusKm = useFilterStore(s => s.radiusKm);
  const setRadiusKm = useFilterStore(s => s.setRadiusKm);
  const setUserLocation = useFilterStore(s => s.setUserLocation);
  const userLatitude = useFilterStore(s => s.userLatitude);
  const userLongitude = useFilterStore(s => s.userLongitude);

  const radarCircle = useRef<L.Circle | null>(null);
  const centerMarker = useRef<L.Marker | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  const [localKm, setLocalKm] = useState(radiusKm || 1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>(isEmbedded ? 'satellite' : 'streets');
  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  const tulumCenter: [number, number] = [20.2114, -87.4654];
  const currentCenter: [number, number] = userLatitude ? [userLatitude, userLongitude] : tulumCenter;

  // 📡 DATA PIPELINE: Fetch nearby entities
  const { data: entities = [] } = useQuery({
    queryKey: ['radar-entities', mode, category, userLatitude, userLongitude, localKm],
    queryFn: async () => {
      if (mode === 'client') {
        const { data, error } = await supabase
          .from('listings')
          .select('id, title, price, images, latitude, longitude, category, created_at')
          .eq('status', 'active')
          .eq('is_active', true)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .eq('category', category)
          .limit(50);
        
        if (error) return [];
        return data.map(item => ({ ...item, type: 'listing' }));
      } else {
        const { data, error } = await supabase
            .from('client_profiles')
            .select('user_id, name, age, gender, profile_images, latitude, longitude, city')
            .not('latitude', 'is', null)
            .not('longitude', 'is', null)
            .limit(50);
        
        if (error) return [];
        return data.map(item => ({ 
            id: item.user_id, 
            title: item.name, 
            images: item.profile_images as string[], 
            latitude: item.latitude, 
            longitude: item.longitude, 
            type: 'client',
            metadata: { age: item.age, gender: item.gender }
        }));
      }
    },
    staleTime: 60000
  });

  const handleRefresh = useCallback(() => {
    triggerHaptic('medium');
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success('Radar Synchronized');
    }, 1200);
  }, []);

  // 🛰️ Engine Mount
  useEffect(() => {
    if (!mapContainerRef.current || mapInstance.current) return;

    try {
        const map = L.map(mapContainerRef.current, {
            zoomControl: false,
            attributionControl: false,
            fadeAnimation: true,
            markerZoomAnimation: true,
            worldCopyJump: true
        }).setView(currentCenter, 15);

        const lightTiles = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
        const darkTiles = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
        const initialTiles = mapStyle === 'satellite' 
            ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            : isLight ? lightTiles : darkTiles;

        L.tileLayer(initialTiles, { maxZoom: 20, crossOrigin: true }).addTo(map);

        radarCircle.current = L.circle(currentCenter, {
            color: '#EB4898',
            fillColor: '#EB4898',
            fillOpacity: 0.1,
            weight: 2,
            radius: localKm * 1000,
            className: 'sentient-radar-circle'
        }).addTo(map);

        const centerIcon = L.divIcon({
            className: 'radar-center',
            html: `
              <div class="relative w-8 h-8 flex items-center justify-center">
                <div class="absolute inset-0 bg-[#EB4898] opacity-30 rounded-full animate-ping"></div>
                <div class="w-2.5 h-2.5 bg-black border-[2px] border-white rounded-full shadow-2xl relative z-10"></div>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });
        centerMarker.current = L.marker(currentCenter, { icon: centerIcon }).addTo(map);
        markersRef.current = L.layerGroup().addTo(map);
        mapInstance.current = map;
        
        setTimeout(() => map.invalidateSize(), 300);
    } catch (e) { console.error("Map Error:", e); }

    return () => {
        if (mapInstance.current) {
            mapInstance.current.remove();
            mapInstance.current = null;
        }
    };
  }, []);

  // 🛰️ marker Sync
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !markersRef.current) return;

    markersRef.current.clearLayers();

    entities.forEach(entity => {
        const iconColor = mode === 'client' ? '#EB4898' : '#3b82f6';
        const iconHtml = `
            <div class="relative group cursor-pointer active:scale-95 transition-transform" id="marker-${entity.id}">
                <div class="absolute -inset-2 bg-black/40 blur-lg rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div class="w-10 h-10 rounded-2xl bg-white border-2 border-white shadow-3xl overflow-hidden relative z-10">
                    <img src="${entity.images?.[0] || '/placeholder.svg'}" class="w-full h-full object-cover" />
                    <div class="absolute inset-0 bg-black/10"></div>
                    <div class="absolute bottom-0 inset-x-0 h-1" style="background: ${iconColor}"></div>
                </div>
                <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white border-2 border-white flex items-center justify-center shadow-lg z-20">
                   <div class="w-1.5 h-1.5 rounded-full" style="background: ${iconColor}"></div>
                </div>
            </div>
        `;

        const marker = L.marker([entity.latitude, entity.longitude], {
            icon: L.divIcon({
                className: 'nexus-marker',
                html: iconHtml,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            })
        });

        marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            triggerHaptic('medium');
            setSelectedEntity(entity);
            map.flyTo([entity.latitude, entity.longitude], 17, { animate: true, duration: 1 });
        });

        marker.addTo(markersRef.current!);
    });
  }, [entities, mode]);

  // 🛰️ Sync Overlays
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !radarCircle.current) return;

    radarCircle.current.setRadius(localKm * 1000);
    radarCircle.current.setLatLng(currentCenter);
    centerMarker.current?.setLatLng(currentCenter);

    map.invalidateSize({ animate: false });
    
    const zoomLevel = localKm === 1 ? 14.5 : localKm === 5 ? 12.8 : localKm === 25 ? 10.8 : 8.8;
    map.flyTo(currentCenter, zoomLevel, { animate: true, duration: 1.4 });
  }, [localKm, currentCenter]);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    triggerHaptic('medium');
    navigator.geolocation.getCurrentPosition(
      pos => { 
        setUserLocation(pos.coords.latitude, pos.coords.longitude); 
        toast.success('GPS Latched'); 
      },
      () => toast.error('Enable GPS'),
      { timeout: 8000 }
    );
  }, []);

  return (
    <motion.div 
      className={cn(
        "flex flex-col h-full w-full relative transition-colors duration-500", 
        isLight ? "bg-white" : "bg-black", 
        isEmbedded && "rounded-[3.5rem]"
      )} 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
    >
      
      {/* 🛸 TOP HUD: CENTERED LOGIC */}
      <div className="absolute top-[calc(env(safe-area-inset-top,0px)+20px)] inset-x-0 z-[2000] px-6 pointer-events-none flex items-center justify-between">
          <button 
            onClick={onBack} 
            className={cn(
               "w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl pointer-events-auto active:scale-90 transition-all border",
               isLight ? "bg-white border-black/5 text-black" : "bg-black border-white/10 text-white"
            )}
          >
              <ArrowLeft className="w-6 h-6" />
          </button>

          <div className={cn(
             "px-6 py-2 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-auto border transition-all backdrop-blur-3xl",
             isLight ? "bg-white/90 border-black/5" : "bg-black/90 border-white/10"
          )}>
              <div className="flex flex-col items-center">
                 <span className="text-[7px] font-black uppercase tracking-[0.4em] text-[#EB4898]">Range</span>
                 <span className={cn("text-[13px] font-black uppercase italic tracking-tighter", isLight ? "text-black" : "text-white")}>{localKm} KM</span>
              </div>
              <div className="w-[1px] h-6 bg-white/10 mx-1" />
              <div className="flex gap-1">
                 {[1, 5, 25, 100].map(km => (
                    <button 
                      key={km} 
                      onClick={() => { triggerHaptic('light'); setLocalKm(km); setRadiusKm(km); }} 
                      className={cn(
                        "w-10 h-8 rounded-xl text-[9px] font-black uppercase transition-all", 
                        localKm === km ? "bg-[#EB4898] text-white" : isLight ? "text-black/30 hover:bg-black/5" : "text-white/20 hover:bg-white/5"
                      )}
                    >
                      {km}K
                    </button>
                 ))}
              </div>
          </div>

          <div className={cn(
             "p-1 rounded-2xl shadow-2xl pointer-events-auto backdrop-blur-3xl border flex gap-1",
             isLight ? "bg-white/95 border-black/5" : "bg-black/95 border-white/10"
          )}>
              <button 
                onClick={() => { triggerHaptic('light'); setMapStyle(prev => prev === 'streets' ? 'satellite' : 'streets'); }} 
                className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", mapStyle === 'satellite' ? "bg-indigo-500 text-white" : isLight ? "bg-black text-white" : "bg-white text-black")}
              >
                  <Layers className="w-5 h-5" />
              </button>
              <button 
                onClick={detectLocation} 
                className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", userLatitude ? "bg-[#EB4898] text-white" : isLight ? "bg-black/5 text-black" : "bg-white/5 text-white")}
              >
                  <Navigation className="w-5 h-5" />
              </button>
          </div>
      </div>

      {/* 🛸 NEXUS MAP WINDOW */}
      <div className="flex-1 w-full relative z-0 p-4 pt-28 pb-32 flex flex-col">
        <div 
          id="map-container" 
          ref={mapContainerRef} 
          className={cn(
            "flex-1 w-full rounded-[3rem] border overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] transition-all duration-700 relative",
            theme === 'nexus-style' ? "border-white/20" : "border-white/5"
          )} 
        />
        
        {/* 🛸 ENTITY OVERLAY GLASS */}
        <AnimatePresence>
          {selectedEntity && (
              <motion.div
                  initial={{ opacity: 0, y: 100, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 100, scale: 0.9 }}
                  className="absolute bottom-40 inset-x-10 z-[3000] flex justify-center pointer-events-none"
              >
                  <div className={cn(
                      "w-full max-w-[360px] p-4 rounded-[2.5rem] border backdrop-blur-3xl shadow-[0_40px_100px_rgba(0,0,0,0.6)] pointer-events-auto flex items-center gap-5",
                      isLight ? "bg-white/95 border-black/5" : "bg-black/95 border-white/10"
                  )}>
                      <div className="w-24 h-24 rounded-[1.8rem] overflow-hidden shadow-2xl flex-shrink-0">
                          <img src={selectedEntity.images?.[0] || '/placeholder.svg'} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#EB4898]">Discovered</span>
                              <button onClick={() => setSelectedEntity(null)} className="p-1 opacity-20 hover:opacity-100 transition-opacity">
                                  <X className="w-4 h-4" />
                              </button>
                          </div>
                          <h4 className={cn("text-[15px] font-black uppercase italic tracking-tighter truncate", isLight ? "text-black" : "text-white")}>
                              {selectedEntity.title}
                          </h4>
                          <div className="flex items-center gap-2">
                             {mode === 'client' ? (
                                 <span className="text-sm font-black text-emerald-500 italic">${selectedEntity.price}</span>
                             ) : (
                                 <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{selectedEntity.metadata?.age} • {selectedEntity.metadata?.gender}</span>
                             )}
                             <span className="w-1 h-1 rounded-full bg-white/10" />
                             <span className={cn("text-[10px] font-bold uppercase tracking-widest opacity-40")}>{selectedEntity.type}</span>
                          </div>
                          <button 
                            onClick={() => { triggerHaptic('heavy'); onStartSwiping?.(); }}
                            className="w-full h-10 mt-2 rounded-2xl bg-[#EB4898]/10 text-[#EB4898] text-[10px] font-black uppercase italic tracking-widest flex items-center justify-center gap-2 transition-all hover:bg-[#EB4898]/20 pointer-events-auto"
                          >
                              View Protocol <ChevronRight className="w-4 h-4" />
                          </button>
                      </div>
                  </div>
              </motion.div>
          )}
        </AnimatePresence>

        {/* 🛸 BOTTOM COMMAND: CATEGORY MATRIX */}
        <div className="absolute bottom-6 inset-x-0 z-[2010] flex justify-center px-10 pointer-events-none">
            {!selectedEntity && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className={cn(
               "p-2 rounded-[2.5rem] flex items-center gap-2 shadow-[0_20px_60px_rgba(0,0,0,0.4)] pointer-events-auto border transition-all backdrop-blur-3xl no-scrollbar",
               isLight ? "bg-white/90 border-black/5" : "bg-black/90 border-white/10"
            )}>
                {[
                    { id: 'property', icon: RealEstateIcon, label: 'Estate' }, 
                    { id: 'motorcycle', icon: VespaIcon, label: 'Moto' }, 
                    { id: 'bicycle', icon: BeachBicycleIcon, label: 'Aqua' }, 
                    { id: 'services', icon: WorkersIcon, label: 'Crew' }
                ].map(cat => (
                    <button 
                        key={cat.id} 
                        onClick={() => { triggerHaptic('light'); onCategoryChange?.(cat.id as any); }} 
                        className={cn(
                            "h-11 px-4 flex items-center gap-2 rounded-[1.8rem] transition-all whitespace-nowrap", 
                            category === cat.id 
                              ? "bg-[#EB4898] text-white shadow-lg shadow-[#EB4898]/20" 
                              : isLight ? "text-black/30 bg-black/5" : "text-white/20 bg-white/5"
                        )}
                    >
                        <cat.icon className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase tracking-widest italic">{cat.label}</span>
                    </button>
                ))}
            </motion.div>
            )}
        </div>
      </div>

      {/* 📡 SCAN TRIGGER */}
      <div className="absolute bottom-[20px] inset-x-0 z-[2000] flex justify-center px-10 pointer-events-none">
        <button 
          onClick={handleRefresh} 
          className={cn(
            "w-full max-w-[300px] h-12 rounded-[2rem] text-[10px] font-black uppercase italic tracking-[0.4em] transition-all flex items-center justify-center gap-4 border-none pointer-events-auto shadow-[0_20px_40px_rgba(235,72,152,0.4)] backdrop-blur-xl",
            isRefreshing ? "bg-black text-white" : "bg-[#EB4898] text-white active:scale-95"
          )}
        >
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} /> 
          <span>{isRefreshing ? 'Optimizing Radar...' : 'Start Radar Scan'}</span>
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .leaflet-container { width: 100%; height: 100%; outline: none; background: ${isLight ? '#f8fafc' : '#0d0d0f'} !important; }
        .leaflet-tile { transition: opacity 0.6s ease; ${isLight ? '' : 'filter: brightness(0.9) contrast(1.2) saturate(0.8) invert(0.9) hue-rotate(180deg);'} } 
        .sentient-radar-circle { 
            animation: radar-pulse-v14 3.5s infinite ease-in-out; 
            transition: all 1.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes radar-pulse-v14 {
          0%, 100% { stroke-opacity: 0.8; stroke-width: 2; fill-opacity: 0.1; }
          50% { stroke-opacity: 0.2; stroke-width: 4; fill-opacity: 0.05; }
        }
        .nexus-marker { 
            transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1); 
        }
        .nexus-marker:hover { transform: scale(1.15) translateY(-5px) !important; z-index: 1000 !important; }
      `}} />
    </motion.div>
  );
});

DiscoveryMapView.displayName = 'DiscoveryMapView';
