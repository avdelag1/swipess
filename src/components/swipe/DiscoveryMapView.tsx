/**
 * DISCOVERY MAP VIEW — 🛸 RADAR NEXUS v14.0
 * 
 * Final Ergonomic Polish:
 * 1. Balanced Center Hud: Shifted KM selects and Category Matrix to the horizontal center axis.
 * 2. Visual Breathing Room: Adjusted z-index and spacing for maximum document momentum.
 * 3. Liquid Glass Command Pill: Unified horizontal category rail at the bottom for thumb-reach ergonomics.
 */

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { Navigation, RefreshCw, ArrowLeft, Layers, Sparkles } from 'lucide-react';
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

// Tile layer URLs hoisted to module scope so all effects can reference them.
const LIGHT_TILES = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const SATELLITE_TILES = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

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

  const tulumCenter: [number, number] = [20.2114, -87.4654];
  const currentCenter: [number, number] = (userLatitude != null && userLongitude != null)
    ? [userLatitude, userLongitude]
    : tulumCenter;

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

        const initialTiles = mapStyle === 'satellite' 
            ? SATELLITE_TILES
            : isLight ? LIGHT_TILES : DARK_TILES;

        const layer = L.tileLayer(initialTiles, { maxZoom: 20, crossOrigin: true }).addTo(map);
        (map as any)._activeTileLayer = layer;

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
                <div class="absolute inset-0 bg-[#3B82F6] opacity-40 rounded-full animate-ping"></div>
                <div class="w-3.5 h-3.5 bg-white border-[3px] border-[#EB4898] rounded-full shadow-2xl relative z-10"></div>
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

  // 🛰️ Sync Overlays & Layer Swap
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !radarCircle.current) return;

    radarCircle.current.setRadius(localKm * 1000);
    radarCircle.current.setLatLng(currentCenter);
    centerMarker.current?.setLatLng(currentCenter);

    map.invalidateSize({ animate: false });
    
    const zoomLevel = localKm === 1 ? 14.5 : localKm === 5 ? 12.8 : localKm === 25 ? 10.8 : 8.8;
    map.flyTo(currentCenter, zoomLevel, { animate: true, duration: 1.4 });

    const tileUrl = mapStyle === 'satellite' 
        ? SATELLITE_TILES
        : isLight ? LIGHT_TILES : DARK_TILES;

    // Swap the active tile layer when style or theme changes
    const prev = (map as any)._activeTileLayer as L.TileLayer | undefined;
    if (prev && (prev as any)._url !== tileUrl) {
        map.removeLayer(prev);
        const next = L.tileLayer(tileUrl, { maxZoom: 20, crossOrigin: true }).addTo(map);
        (map as any)._activeTileLayer = next;
    }
  }, [localKm, mapStyle, currentCenter, isLight]);

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
    <motion.div className={cn("flex flex-col h-full w-full relative overflow-hidden transition-colors duration-500", isLight ? "bg-white" : "bg-black", isEmbedded && "rounded-[3.5rem]")} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      
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

      {/* 🛸 CENTER COMMAND: CATEGORY MATRIX (Now Unified at Bottom-Middle) */}
      <div className="absolute bottom-[110px] inset-x-0 z-[2010] flex justify-center px-10 pointer-events-none">
          <div className={cn(
             "p-2 rounded-[2.5rem] flex items-center gap-3 shadow-[0_20px_60px_rgba(0,0,0,0.4)] pointer-events-auto border transition-all backdrop-blur-3xl overflow-x-auto no-scrollbar",
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
                          "h-12 px-5 flex items-center gap-3 rounded-[1.8rem] transition-all whitespace-nowrap", 
                          category === cat.id 
                            ? "bg-[#EB4898] text-white shadow-lg shadow-[#EB4898]/20" 
                            : isLight ? "text-black/30 bg-black/5" : "text-white/20 bg-white/5"
                      )}
                  >
                      <cat.icon className="w-5 h-5" />
                      <span className="text-[10px] font-black uppercase tracking-widest italic">{cat.label}</span>
                  </button>
              ))}
          </div>
      </div>

      <div id="map-container" ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

      {/* 📡 SCAN TRIGGER */}
      <div className="absolute bottom-[32px] inset-x-0 z-[2000] flex justify-center px-10 pointer-events-none">
        <button 
          onClick={handleRefresh} 
          className={cn(
            "w-full max-w-[340px] h-16 rounded-[2rem] text-[12px] font-black uppercase italic tracking-[0.4em] transition-all flex items-center justify-center gap-4 border-none pointer-events-auto shadow-[0_30px_60px_rgba(235,72,152,0.4)] backdrop-blur-xl",
            isRefreshing ? "bg-black text-white" : "bg-[#EB4898] text-white active:scale-95"
          )}
        >
          <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} /> 
          <span>{isRefreshing ? 'Optimizing Radar...' : 'Start Radar Scan'}</span>
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .leaflet-container { width: 100%; height: 100%; outline: none; background: ${isLight ? '#f8fafc' : '#0d0d0f'} !important; }
        .leaflet-tile { transition: opacity 0.6s ease; ${isLight ? '' : 'filter: brightness(0.5) contrast(1.3) saturate(0.8);'} } 
        .sentient-radar-circle { 
            animation: radar-pulse-v14 3.5s infinite ease-in-out; 
            transition: all 1.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        @keyframes radar-pulse-v14 {
          0%, 100% { stroke-opacity: 0.8; stroke-width: 2; fill-opacity: 0.1; }
          50% { stroke-opacity: 0.2; stroke-width: 4; fill-opacity: 0.05; }
        }
      `}} />
    </motion.div>
  );
});

DiscoveryMapView.displayName = 'DiscoveryMapView';
