import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useFilterStore, useFilterActions } from '@/state/filterStore';
import { useSmartListingMatching, useSmartClientMatching } from '@/hooks/useSmartMatching';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Map as MapIcon, ChevronLeft, Sparkles } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';
import { POKER_CARDS, OWNER_INTENT_CARDS } from './SwipeConstants';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { LeafletAutoResize } from './useLeafletAutoResize';
import type { QuickFilterCategory } from '@/types/filters';

// 🗝️ OFFICIAL MAPBOX ASSETS — ONE STYLE, ONE KEY
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const MAPBOX_STYLE = 'mapbox/navigation-night-v1';

// FLAGSHIP FALLBACK: If Mapbox is blocked/missing, use a high-contrast dark OSM layer
// We ENFORCE a dark baseline for the Radar because light-theme maps often hide the streets
// when HUD overlays are present.
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
  variant?: 'mini' | 'radar' | 'full';
  showHUD?: boolean;
  onCategoryChange?: (cat: any) => void;
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
  const { theme } = useTheme();
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

  const listingFilters = useMemo(() => {
    return activeRole === 'owner' ? undefined : (filters as any);
  }, [activeRole, filters]);

  // 🛰️ DUAL-MODE MATCHING ENGINE: Ensure page 0 is targeted correctly
  const { data: listingsRaw = [], isLoading: isListingsLoading } = useSmartListingMatching(user?.id, [], listingFilters, 0, 50, false);
  const { data: clientsRaw = [], isLoading: isClientsLoading } = useSmartClientMatching(user?.id, activeCategory, 0, 50, false, filters as any);
  
  const rawNodes = activeRole === 'owner' ? clientsRaw : listingsRaw;
  const isLoading = activeRole === 'owner' ? isClientsLoading : isListingsLoading;

  // Role-Aware Categories for HUD
  const availableCategories = useMemo(() => {
    if (activeRole === 'owner') {
      return OWNER_INTENT_CARDS.filter((c: any) => ['seekers', 'buyers', 'renters', 'hire'].includes(c.id));
    }
    return POKER_CARDS.filter(c => ['property', 'motorcycle', 'services'].includes(c.id));
  }, [activeRole]);

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
    if (radiusKm <= 2) return 16; // Even closer for 1-2km
    if (radiusKm <= 8) return 15;
    if (radiusKm <= 20) return 13;
    return 11;
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
  if (!mapCenter || !mapCenter[0]) return (
    <div className="w-full h-full bg-black flex flex-col items-center justify-center p-12 text-center">
       <RefreshCw className="w-12 h-12 text-primary animate-spin mb-6" />
       <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">Nexus Link Awaiting Coordinate Sync...</p>
    </div>
  );

  return (
    <motion.div
      className={cn(
        'w-full h-full relative overflow-hidden flex flex-col',
        isEmbedded ? 'bg-[#0a0a0b]' : 'bg-black',
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* 📡 COMPONENT ALIVE INDICATOR (Failsafe Visibility) */}
      {!isEmbedded && (
        <div className="absolute inset-0 bg-[#0a0a0b] pointer-events-none" />
      )}

      <MapContainer
        center={mapCenter}
        zoom={zoom}
        zoomControl={false}
        attributionControl={false}
        className="w-full flex-1 z-[1] pointer-events-auto"
        style={{ height: '100%', minHeight: '300px' }}
      >
        <LeafletAutoResize />
        <TileLayer
          url={TILE_URL}
          tileSize={MAPBOX_TOKEN ? 512 : 256}
          zoomOffset={MAPBOX_TOKEN ? -1 : 0}
          className="nexus-tiles"
        />
        {/* FALLBACK LAYER: Always active with low opacity to ensure grid visibility */}
        {!MAPBOX_TOKEN && (
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            opacity={0.3}
          />
        )}
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
      <div className={cn(
        "absolute left-6 right-6 z-20 flex flex-col gap-4 pointer-events-none",
        isEmbedded ? "top-24" : "top-32"
      )}>
        <div className="w-full flex items-center justify-between pointer-events-auto">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { triggerHaptic('light'); onBack(); }}
              className="w-12 h-12 rounded-2xl backdrop-blur-3xl border bg-black/80 border-white/10 text-white hover:text-primary transition-all shadow-2xl"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
          )}
          
          {!onBack && <div className="w-12 h-12" />}
          
          <div className="backdrop-blur-3xl border bg-black/80 border-white/10 px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3">
             <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-[0.35em] text-white">
                RADAR: <span className="text-primary italic">{nodes.length} {activeRole === 'owner' ? 'CLIENTS' : 'NODES'}</span>
             </span>
          </div>
        </div>

        {/* Quick Category Chips */}
        <div className="flex justify-center gap-2 pointer-events-auto overflow-x-auto no-scrollbar pb-1">
          {availableCategories.map((cat: any) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id || (activeRole === 'owner' && (filters as any).clientType === cat.clientType);
            return (
              <button
                key={cat.id}
                onClick={() => { 
                  triggerHaptic('medium'); 
                  if (activeRole === 'owner' && cat.clientType) {
                    useFilterStore.getState().setClientType(cat.clientType);
                  } else {
                    setActiveCategory(cat.id as any); 
                  }
                }}
                className={cn(
                  "h-11 px-5 rounded-2xl flex items-center gap-2 transition-all border shadow-2xl backdrop-blur-3xl flex-shrink-0",
                  isActive 
                    ? "bg-primary text-white border-primary shadow-[0_15px_35px_rgba(235,72,152,0.5)] scale-105" 
                    : "bg-slate-900/90 text-white border-white/10 hover:text-white hover:bg-slate-800"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[11px] font-black uppercase tracking-[0.1em]">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {!isEmbedded && (
        <>
          {/* Bottom Bar: Action & Radius */}
          <div className="absolute bottom-10 left-8 right-8 z-10 flex flex-col gap-6 items-center pointer-events-none">
             
             {/* Igniter Button */}
             <motion.button
               whileTap={{ scale: 0.92 }}
               onClick={handleIgnite}
               disabled={isScanning}
               className={cn(
                 "group relative w-full max-w-[280px] h-18 rounded-[2.5rem] border-2 border-primary/30 flex items-center justify-center overflow-hidden transition-all duration-500 shadow-[0_30px_60px_rgba(var(--color-brand-primary-rgb),0.3)] pointer-events-auto",
                 isScanning ? "bg-primary text-white" : "bg-black/80 backdrop-blur-3xl hover:bg-black"
               )}
             >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-white/10 to-primary/20 opacity-30 skew-x-12 animate-shimmer" />
                <AnimatePresence mode="wait">
                  {isScanning ? (
                    <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 relative z-10">
                      <RefreshCw className="w-5 h-5 text-white animate-spin" />
                      <span className="text-xs font-black uppercase tracking-[0.4em] italic text-white">Engaging...</span>
                    </motion.div>
                  ) : (
                    <motion.div key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 relative z-10">
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

      {/* 🎯 EMBEDDED HUD — slim floating pill anchored inside the card */}
      {isEmbedded && (
        <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col gap-3 items-center pointer-events-none">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleIgnite}
            disabled={isScanning}
            className={cn(
              'relative w-full max-w-[280px] h-14 rounded-full flex items-center justify-center overflow-hidden transition-all shadow-2xl pointer-events-auto',
              theme === 'light'
                ? 'bg-black text-white border border-black/20'
                : 'bg-primary text-white border border-primary/60',
              isScanning && 'opacity-80',
            )}
          >
            <AnimatePresence mode="wait">
              {isScanning ? (
                <motion.div key="scan-emb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">Engaging</span>
                </motion.div>
              ) : (
                <motion.div key="ready-emb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">Start Swiping</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          <div
            className={cn(
              'w-full max-w-[260px] flex items-center gap-3 px-5 py-2 rounded-full border pointer-events-auto shadow-lg backdrop-blur-xl',
              theme === 'light'
                ? 'bg-white/90 border-black/10'
                : 'bg-black/60 border-white/10',
            )}
          >
            <span
              className={cn(
                'text-[10px] font-black uppercase tracking-widest min-w-[36px]',
                theme === 'light' ? 'text-black/60' : 'text-white/60',
              )}
            >
              {radiusKm}km
            </span>
            <input
              type="range"
              min="1"
              max="100"
              value={radiusKm}
              onChange={(e) => setRadiusKm(parseInt(e.target.value))}
              className={cn(
                'flex-1 h-1 rounded-full appearance-none cursor-pointer accent-primary',
                theme === 'light' ? 'bg-black/10' : 'bg-white/10',
              )}
            />
          </div>
        </div>
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
