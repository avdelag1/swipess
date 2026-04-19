import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import { useSmartListingMatching } from '@/hooks/useSmartMatching';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Map as MapIcon, ChevronLeft, Sparkles } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';
import { POKER_CARDS } from './SwipeConstants';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { QuickFilterCategory } from '@/types/filters';

// 🗝️ OFFICIAL MAPBOX ASSETS — ONE STYLE, ONE KEY
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const MAPBOX_STYLE = 'mapbox/dark-v11';

// FLAGSHIP FALLBACK: If Mapbox is blocked/missing, use a high-contrast dark OSM layer
const TILE_URL = MAPBOX_TOKEN 
  ? `https://api.mapbox.com/styles/v1/${MAPBOX_STYLE}/tiles/{z}/{x}/{y}?access_token=${MAPBOX_TOKEN}`
  : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

// 📏 GEODESIC MATH FOR ONE-STYLE RADIUS PARITY
const getGeodesicRadius = (radiusKm: number, lat: number) => {
  if (!lat) return radiusKm * 1000;
  // Simple adjustment for Mercator projection distortion
  const metersPerPixel = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, 13);
  return (radiusKm * 1000) / metersPerPixel;
};

// 📍 CUSTOM NEXUS MARKER — EXACT MOBILE PARITY
const createCustomIcon = (color: string) => L.divIcon({
  className: 'nexus-marker',
  html: `
    <div style="position: relative; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;">
      <div style="position: absolute; width: 300%; height: 300%; background: ${color}; opacity: 0.15; border-radius: 50%; top: -100%; left: -100%; animation: pulse 2s infinite;"></div>
      <div style="width: 14px; height: 14px; background: ${color}; border: 3px solid white; border-radius: 50%; box-shadow: 0 4px 15px rgba(0,0,0,0.5);"></div>
    </div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

interface MapControllerProps {
  center: [number, number];
  zoom: number;
}

const MapController = ({ center, zoom }: MapControllerProps) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom, { duration: 1.5, easeLinearity: 0.25 });
    }
  }, [center, zoom, map]);
  return null;
};

interface DiscoveryMapViewProps {
  onBack?: () => void;
  onStartSwiping?: () => void;
  isEmbedded?: boolean;
  category?: QuickFilterCategory | string;
  mode?: 'client' | 'owner';
}

/**
 * 🛰️ RADAR NEXUS ENGINE (UNIFIED v3.0)
 * One Map, One Style. The final source of truth for discovery.
 */
export const DiscoveryMapView = ({ 
  onBack, 
  onStartSwiping,
  isEmbedded = false,
  category: _passedCategory,
  mode = 'client'
}: DiscoveryMapViewProps) => {
  const { user } = useAuth();
  const { data: roleFromDb } = useUserRole(user?.id);
  const activeRole = mode || (roleFromDb as any) || 'client';

  const { radiusKm, userLatitude, userLongitude, activeCategory: storeCategory } = useFilterStore();
  const { setActiveCategory, setRadiusKm } = useFilterActions();
  const getListingFilters = useFilterStore(s => s.getListingFilters);
  const getClientFilters = useFilterStore(s => s.getClientFilters);
  
  const [isScanning, setIsScanning] = useState(false);
  const activeCategory = (_passedCategory || storeCategory || 'property') as QuickFilterCategory;

  const filters = useMemo(() => {
    return activeRole === 'owner' ? getClientFilters() : getListingFilters();
  }, [activeRole, getListingFilters, getClientFilters]);

  // 🛰️ DUAL-MODE MATCHING ENGINE
  const { data: listingsRaw = [] } = useSmartListingMatching(user?.id, [], filters, activeRole === 'client');
  const { data: clientsRaw = [] } = useSmartClientMatching(user?.id, activeCategory, 0, 50, activeRole === 'owner', filters as any);
  
  const rawNodes = activeRole === 'owner' ? clientsRaw : listingsRaw;

  // SANITIZATION: Filter out items with missing coordinates to prevent Leaflet crashes
  const nodes = useMemo(() => {
    return (rawNodes || []).filter(item => {
      const lat = item.latitude || item.lat;
      const lng = item.longitude || item.lng;
      return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
    }).map(item => ({
      id: item.id || item.user_id,
      lat: item.latitude || item.lat,
      lng: item.longitude || item.lng,
      title: item.title || item.full_name || 'Active User',
      price: item.price || (item.budget_min ? `$${item.budget_min}-$${item.budget_max}` : 'Seeking'),
      image: item.images?.[0] || item.avatar_url || null
    }));
  }, [rawNodes]);

  const defaultCenterCenter: [number, number] = [20.2114, -87.4654];
  const mapCenter: [number, number] = (userLatitude && userLongitude) ? [userLatitude, userLongitude] : defaultCenterCenter;

  const accentColor = activeRole === 'owner' ? '#3b82f6' : '#EB4898';

  const zoom = useMemo(() => {
    if (radiusKm <= 2) return 14;
    if (radiusKm <= 8) return 13;
    if (radiusKm <= 20) return 11;
    return 10;
  }, [radiusKm]);

  const handleIgnite = () => {
    triggerHaptic('heavy');
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      onStartSwiping?.();
    }, 1200);
  };

  // Safe fail-render if critical data is missing (though defaults are set)
  if (!mapCenter || !mapCenter[0]) return <div className="w-full h-full bg-black flex items-center justify-center text-white/20 uppercase font-black text-[10px] tracking-widest">Awaiting Nexus Link...</div>;

  return (
    <motion.div 
      className="w-full h-full relative overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <MapContainer 
        center={mapCenter} 
        zoom={zoom} 
        zoomControl={false}
        attributionControl={false}
        className="w-full h-full z-0 pointer-events-auto"
      >
        <TileLayer 
          url={TILE_URL} 
          tileSize={MAPBOX_TOKEN ? 512 : 256} 
          zoomOffset={MAPBOX_TOKEN ? -1 : 0} 
        />
        <MapController center={mapCenter} zoom={zoom} />

        {/* 🆘 NEXUS CORE */}
        <CircleMarker
          center={mapCenter}
          radius={8}
          pathOptions={{ 
            fillColor: accentColor, 
            fillOpacity: 1, 
            color: 'white', 
            weight: 3.5 
          }}
        />

        {/* 🎯 RADAR FIELD */}
        <CircleMarker
          center={mapCenter}
          radius={getGeodesicRadius(radiusKm, mapCenter[0])}
          pathOptions={{ 
            fillColor: accentColor, 
            fillOpacity: 0.08, 
            color: accentColor, 
            dashArray: '15, 12',
            weight: 2 
          }}
        />

        {/* 📍 NODES */}
        {nodes.map((node: any) => {
          return (
            <Marker 
              key={node.id} 
              position={[node.lat, node.lng]}
              icon={createCustomIcon(accentColor)}
            >
              <Popup className="nexus-popup">
                <div className="p-3 min-w-[150px] bg-black/60 backdrop-blur-3xl rounded-2xl border border-white/10 shadow-3xl">
                  {node.image && (
                    <img src={node.image} className="w-full h-32 object-cover rounded-xl mb-3 shadow-inner" alt="" />
                  )}
                  <p className="text-white font-black uppercase text-[10px] tracking-widest leading-tight mb-1">{node.title}</p>
                  <div className="flex justify-between items-center">
                    <p className="text-primary text-[10px] font-black italic">{node.price}</p>
                    <p className="text-white/20 text-[8px] font-black tracking-widest uppercase">{activeRole === 'owner' ? 'CLIENT' : 'NODE'}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* 🧭 INTELLIGENT HUD CONTROLS */}
      {!isEmbedded && (
        <>
          {/* Top Bar: Nav & Info */}
          <div className="absolute top-8 left-6 right-6 z-10 flex flex-col gap-4 pointer-events-none">
            <div className="w-full flex items-center justify-between pointer-events-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { triggerHaptic('light'); onBack?.(); }}
                className="w-12 h-12 rounded-2xl bg-black/60 backdrop-blur-3xl border border-white/10 text-white/40 hover:text-white"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              
              <div className="bg-black/60 backdrop-blur-3xl border border-white/10 px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3">
                 <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-[0.35em] text-white">
                    RADAR: <span className="text-primary italic">{nodes.length} {activeRole === 'owner' ? 'CLIENTS' : 'NODES'}</span>
                 </span>
              </div>
            </div>

            {/* Quick Category Chips */}
            <div className="flex justify-center gap-2 pointer-events-auto">
              {POKER_CARDS.filter(c => ['property','motorcycle','services'].includes(c.id)).map(cat => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { triggerHaptic('medium'); setActiveCategory(cat.id as any); }}
                    className={cn(
                      "h-10 px-4 rounded-xl flex items-center gap-2 transition-all border shadow-xl backdrop-blur-3xl",
                      isActive 
                        ? "bg-white border-white text-black underline-offset-4" 
                        : "bg-black/40 border-white/10 text-white/40"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[9px] font-black uppercase tracking-widest">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Bar: Action & Radius */}
          <div className="absolute bottom-10 left-8 right-8 z-10 flex flex-col gap-6 items-center pointer-events-none">
             
             {/* Igniter Button */}
             <motion.button
               whileTap={{ scale: 0.92 }}
               onClick={handleIgnite}
               disabled={isScanning}
               className={cn(
                 "group relative w-full max-w-[280px] h-18 rounded-[2.5rem] border-2 border-primary/30 flex items-center justify-center overflow-hidden transition-all duration-500 shadow-[0_30px_60px_rgba(var(--color-brand-primary-rgb),0.3)] pointer-events-auto",
                 isScanning ? "bg-primary/20" : "bg-black/40 backdrop-blur-3xl hover:bg-primary/10"
               )}
             >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-white/5 to-primary/10 opacity-50 skew-x-12 animate-shimmer" />
                <AnimatePresence mode="wait">
                  {isScanning ? (
                    <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3">
                      <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                      <span className="text-xs font-black uppercase tracking-[0.4em] italic text-primary">Engaging...</span>
                    </motion.div>
                  ) : (
                    <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <span className="text-xs font-black uppercase tracking-[0.4em] italic text-white group-hover:text-primary transition-colors">Start Swiping</span>
                    </motion.div>
                  )}
                </AnimatePresence>
             </motion.button>

             {/* Radius Micro-Control */}
             <div className="w-full max-w-[240px] flex items-center gap-4 bg-black/60 backdrop-blur-3xl px-6 py-3 rounded-[2rem] border border-white/10 pointer-events-auto shadow-2xl">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest min-w-[40px]">{radiusKm}KM</span>
                <input 
                  type="range"
                  min="1" max="100"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(parseInt(e.target.value))}
                  className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary"
                />
             </div>
          </div>
        </>
      )}

      {/* Flagship Animation Keyframes */}
      <style>{`
        .nexus-popup .leaflet-popup-content-wrapper { background: transparent !important; box-shadow: none !important; padding: 0 !important; }
        .nexus-popup .leaflet-popup-tip-container { display: none; }
        @keyframes pulse {
          0% { transform: scale(0.9); opacity: 1; }
          70% { transform: scale(1.1); opacity: 0.1; }
          100% { transform: scale(0.9); opacity: 1; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-200%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        .animate-shimmer { animation: shimmer 3s infinite linear; }
      `}</style>
    </motion.div>
  );
};

export default DiscoveryMapView;
