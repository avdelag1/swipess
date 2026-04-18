/**
 * DISCOVERY MAP VIEW — Final Stability & Flagship UI
 *
 * Implements a div-based map tile engine for absolute reliability.
 * Moves filters to the right, implements ultra-rounded corners.
 */

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, RefreshCw, Building2, Bike, ArrowLeft, HardHat, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { triggerHaptic } from '@/utils/haptics';
import { useFilterStore } from '@/state/filterStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';
import type { QuickFilterCategory } from '@/types/filters';

const kmToPixels = (km: number, lat: number, zoom: number) => {
  const mpp = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
  return (km * 1000) / mpp;
};

const getZoomForRadius = (km: number, lat: number, containerPx: number) => {
  // We want the radius to take up about 35% of the screen min-dimension
  for (let z = 16; z >= 2; z--) {
    if (kmToPixels(km, lat, z) * 2 < containerPx * 0.4) return z;
  }
  return 2;
};

const latLngToTile = (lat: number, lng: number, zoom: number) => {
  const n = Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
};

const pixelToLatLng = (dx: number, dy: number, lat: number, zoom: number) => {
  const mpp = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
  return {
    dLat: -(dy * mpp) / 110574,
    dLng: (dx * mpp) / (111320 * Math.cos((lat * Math.PI) / 180)),
  };
};

export const DiscoveryMapView = memo(({ 
  category, 
  onBack, 
  onStartSwiping, 
  onCategoryChange 
}: {
  category: QuickFilterCategory;
  onBack: () => void;
  onStartSwiping: () => void;
  onCategoryChange?: (cat: QuickFilterCategory) => void;
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { user } = useAuth();

  const radiusKm = useFilterStore(s => s.radiusKm);
  const setRadiusKm = useFilterStore(s => s.setRadiusKm);
  const setUserLocation = useFilterStore(s => s.setUserLocation);
  const userLatitude = useFilterStore(s => s.userLatitude);
  const userLongitude = useFilterStore(s => s.userLongitude);

  const [localKm, setLocalKm] = useState(radiusKm);
  const [dots, setDots] = useState<any[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState(!!userLatitude);

  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [mapSize, setMapSize] = useState({ w: 400, h: 600 });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const baseLat = userLatitude ?? 20.2114;
  const baseLng = userLongitude ?? -87.4654;

  const handleRefresh = useCallback(() => {
    triggerHaptic('medium');
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1200);
  }, []);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    triggerHaptic('medium');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserLocation(pos.coords.latitude, pos.coords.longitude);
        setDetected(true);
        setDetecting(false);
        setPanOffset({ x: 0, y: 0 });
      },
      () => { setDetecting(false); toast.error('Check GPS settings'); },
      { timeout: 8000 }
    );
  }, [setUserLocation]);

  useEffect(() => { if (!userLatitude) detectLocation(); }, []);

  const zoom = useMemo(() => getZoomForRadius(localKm, baseLat, Math.min(mapSize.w, mapSize.h)), [localKm, baseLat, mapSize]);
  const centerLat = useMemo(() => baseLat + pixelToLatLng(panOffset.x, panOffset.y, baseLat, zoom).dLat, [baseLat, panOffset, zoom]);
  const centerLng = useMemo(() => baseLng + pixelToLatLng(panOffset.x, panOffset.y, baseLat, zoom).dLng, [baseLng, panOffset, zoom]);

  const tileCenter = useMemo(() => latLngToTile(centerLat, centerLng, zoom), [centerLat, centerLng, zoom]);
  const radiusPx = kmToPixels(localKm, centerLat, zoom);

  // ── Pan Handlers ───────────────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent) => {
    panStartRef.current = { x: e.clientX, y: e.clientY, ox: panOffset.x, oy: panOffset.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!panStartRef.current) return;
    setPanOffset({ 
        x: panStartRef.current.ox - (e.clientX - panStartRef.current.x), 
        y: panStartRef.current.oy - (e.clientY - panStartRef.current.y) 
    });
  };
  const onPointerUp = () => { panStartRef.current = null; };

  // ── Rendering Grid ──────────────────────────────────────────────────────────
  const tilesX = Math.ceil(mapSize.w / 256) + 2;
  const tilesY = Math.ceil(mapSize.h / 256) + 2;
  const tileIndices = useMemo(() => {
    const indices = [];
    const minX = -Math.floor(tilesX/2);
    const maxX = Math.ceil(tilesX/2);
    const minY = -Math.floor(tilesY/2);
    const maxY = Math.ceil(tilesY/2);

    for (let dx = minX; dx <= maxX; dx++) {
      for (let dy = minY; dy <= maxY; dy++) {
        indices.push({ dx, dy });
      }
    }
    return indices;
  }, [tilesX, tilesY]);

  return (
    <motion.div className="flex flex-col h-full w-full bg-[#f1f5f9] relative overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      
      {/* HUD: Main Header */}
      <div className="absolute top-[calc(env(safe-area-inset-top,0px)+16px)] inset-x-0 px-5 z-[10001] flex items-center justify-between pointer-events-none">
        <button onClick={onBack} className="w-13 h-13 rounded-3xl flex items-center justify-center bg-white shadow-2xl border border-black/5 pointer-events-auto active:scale-90 transition-all">
          <ArrowLeft className="w-7 h-7 text-black" />
        </button>
        
        {/* CENTER RADIUS PILL */}
        <div className="flex flex-col items-center gap-2 pointer-events-none">
            <div className="px-6 py-2.5 rounded-full bg-white shadow-2xl border border-black/5 flex items-center gap-2 pointer-events-auto">
                <span className="text-[10px] font-black tracking-widest uppercase text-black/50">Radius:</span>
                <span className="text-[16px] font-black text-primary">{localKm}KM</span>
            </div>
            <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/95 shadow-xl border border-black/5 pointer-events-auto backdrop-blur-xl">
                {[1, 5, 10, 25, 50, 100].map(km => (
                    <button key={km} onClick={() => { triggerHaptic('light'); setLocalKm(km); }} className={cn("px-4 py-2 rounded-full text-[12px] font-black transition-all", localKm === km ? "bg-black text-white shadow-md scale-110" : "text-black/50 hover:bg-black/5")}>{km}</button>
                ))}
            </div>
        </div>

        <button onClick={detectLocation} className={cn("w-13 h-13 rounded-3xl flex items-center justify-center shadow-2xl border border-black/5 pointer-events-auto active:scale-90 transition-all", detected ? "bg-black text-white" : "bg-white text-black")}>
          <Navigation className={cn("w-6 h-6", detecting && "animate-spin")} />
        </button>
      </div>

      {/* RIGHT SIDE FILTERS: Vertical Column */}
      <div className="absolute top-1/2 -translate-y-1/2 right-4 z-[10001] flex flex-col gap-3 pointer-events-none">
        <div className="p-3 rounded-[2.5rem] flex flex-col items-center gap-4 bg-white/95 shadow-2xl border border-black/5 pointer-events-auto">
          {[
            { id: 'property', icon: Building2 }, { id: 'motorcycle', icon: MotorcycleIcon }, { id: 'bicycle', icon: Bike }, { id: 'services', icon: HardHat }
          ].map(cat => (
            <button key={cat.id} onClick={() => onCategoryChange?.(cat.id as any)} className={cn("w-15 h-15 flex items-center justify-center rounded-[1.5rem] transition-all", category === cat.id ? "bg-black text-white scale-110 shadow-xl" : "text-black/30 hover:bg-black/5")}>
              <cat.icon className="w-7 h-7" />
            </button>
          ))}
        </div>
      </div>

      {/* MAP ENGINE: ROUNDED CONTAINER */}
      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-[#e5e7eb] rounded-[3.5rem] m-2 shadow-inner group"
        onPointerDown={onPointerDown} 
        onPointerMove={onPointerMove} 
        onPointerUp={onPointerUp}
        style={{ touchAction: 'none' }}
      >
        {/* TILE GRID LAYER */}
        <div className="absolute inset-0 pointer-events-none scale-105" style={{ filter: 'contrast(1.05) saturate(1.1)' }}>
            {tileIndices.map(({ dx, dy }) => {
                const sub = 'abcd'[Math.abs((Math.floor(tileCenter.x) + dx) + (Math.floor(tileCenter.y) + dy)) % 4];
                const x = (Math.floor(tileCenter.x) + dx + (1 << zoom)) % (1 << zoom);
                const y = Math.floor(tileCenter.y) + dy;
                if (y < 0 || y >= (1 << zoom)) return null;

                const left = mapSize.w/2 - (tileCenter.x % 1) * 256 + dx * 256;
                const top = mapSize.h/2 - (tileCenter.y % 1) * 256 + dy * 256;

                return (
                    <img
                        key={`${zoom}-${x}-${y}`}
                        src={`https://${sub}.basemaps.cartocdn.com/light_all/${zoom}/${x}/${y}.png`}
                        className="absolute w-[256px] h-[256px] object-cover"
                        style={{ left, top }}
                        alt=""
                    />
                );
            })}
        </div>

        {/* RADAR OVERLAY */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
             {/* THE BIG RADAR CIRCLE */}
             <div 
               className="rounded-full border-2 border-dashed border-black/20 bg-black/5 flex items-center justify-center transition-all duration-300"
               style={{ width: radiusPx*2, height: radiusPx*2 }}
             >
                {/* CENTER DOT */}
                <div className="w-4 h-4 rounded-full bg-black border-2 border-white shadow-xl" />
             </div>
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="relative pb-[calc(var(--bottom-nav-height,72px)+env(safe-area-inset-bottom,0px)+12px)] pt-4 px-5 flex justify-center">
        <button onClick={handleRefresh} className="w-full max-w-[340px] h-16 rounded-[2rem] text-[13px] font-black uppercase tracking-[0.4em] bg-black text-white shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3">
          <RefreshCw className={cn("w-6 h-6", isRefreshing && "animate-spin")} /> REFRESH RADAR
        </button>
      </div>
      
      {/* SEPARATION GRADIENT */}
      <div className="absolute bottom-0 inset-x-0 h-[calc(var(--bottom-nav-height,72px)+40px)] bg-gradient-to-t from-black/10 to-transparent pointer-events-none z-[999]" />
    </motion.div>
  );
});

DiscoveryMapView.displayName = 'DiscoveryMapView';
