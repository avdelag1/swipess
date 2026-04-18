/**
 * DISCOVERY MAP VIEW — Final Stability & Flagship UI
 * 
 * v3.2: Absolute Reality Fix. 
 * Implements a div-based map tile engine for absolute reliability.
 * No square backgrounds. Ultra-rounded map window.
 */

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, RefreshCw, Building2, Bike, ArrowLeft, HardHat } from 'lucide-react';
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
  for (let z = 16; z >= 2; z--) {
    if (kmToPixels(km, lat, z) * 2 < containerPx * 0.45) return z;
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

interface ListingDot {
  id: string;
  latitude: number;
  longitude: number;
}

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
  const [dots, setDots] = useState<ListingDot[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState(!!userLatitude);

  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [mapSize, setMapSize] = useState({ w: 400, h: 600 });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

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
      () => { setDetecting(false); toast.error('Enable GPS'); },
      { timeout: 8000 }
    );
  }, [setUserLocation]);

  useEffect(() => { if (!userLatitude) detectLocation(); }, []);

  // Fetch users/listings to show as dots
  useEffect(() => {
    const fetchDots = async () => {
      const { data } = await supabase.from('listings').select('id, latitude, longitude').eq('status', 'active');
      if (data) setDots(data.map(d => ({ id: d.id, latitude: d.latitude, longitude: d.longitude })));
    };
    fetchDots();
  }, [category]);

  useEffect(() => {
    const el = mapRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setMapSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const zoom = useMemo(() => getZoomForRadius(localKm, baseLat, Math.min(mapSize.w, mapSize.h)), [localKm, baseLat, mapSize]);
  const currentCenter = useMemo(() => {
    const { dLat, dLng } = pixelToLatLng(panOffset.x, panOffset.y, baseLat, zoom);
    return { lat: baseLat + dLat, lng: baseLng + dLng };
  }, [baseLat, baseLng, panOffset, zoom]);

  const tileCenter = useMemo(() => latLngToTile(currentCenter.lat, currentCenter.lng, zoom), [currentCenter, zoom]);
  const radiusPx = kmToPixels(localKm, currentCenter.lat, zoom);

  const onPointerDown = (e: React.PointerEvent) => {
    panStartRef.current = { x: e.clientX, y: e.clientY, ox: panOffset.x, oy: panOffset.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!panStartRef.current) return;
    setPanOffset({ 
        x: panStartRef.current.ox - (e.clientX - panStartRef.current.x), 
        y: panStartRef.current.oy - (e.clientY - panStartRef.current.y) 
    });
  };
  const onPointerUp = () => { panStartRef.current = null; };

  const tiles = useMemo(() => {
    const res = [];
    const cols = Math.ceil(mapSize.w / 256) + 4;
    const rows = Math.ceil(mapSize.h / 256) + 4;
    const startX = Math.floor(tileCenter.x) - Math.floor(cols / 2);
    const startY = Math.floor(tileCenter.y) - Math.floor(rows / 2);

    for (let x = startX; x < startX + cols; x++) {
      for (let y = startY; y < startY + rows; y++) {
        const wrappedX = (x + (1 << zoom)) % (1 << zoom);
        if (y >= 0 && y < (1 << zoom)) res.push({ x: wrappedX, y, origX: x, origY: y });
      }
    }
    return res;
  }, [tileCenter, zoom, mapSize]);

  return (
    <motion.div className="flex flex-col h-full w-full bg-[#f8fafc] relative overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      
      {/* HUD: Header */}
      <div className="absolute top-[calc(env(safe-area-inset-top,0px)+12px)] inset-x-0 px-4 z-[10001] flex items-center justify-between pointer-events-none">
        <button onClick={onBack} className="w-12 h-12 rounded-3xl flex items-center justify-center bg-white shadow-2xl border border-black/5 pointer-events-auto active:scale-95 transition-all">
          <ArrowLeft className="w-6 h-6 text-black" />
        </button>
        
        <div className="flex flex-col items-center gap-2 pointer-events-none">
            <div className="px-5 py-2 rounded-full bg-white shadow-2xl border border-black/5 flex items-center gap-2 pointer-events-auto">
                <span className="text-[10px] font-black uppercase text-black/40">Radius:</span>
                <span className="text-[16px] font-black text-primary">{localKm}KM</span>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-full bg-white shadow-xl border border-black/5 pointer-events-auto backdrop-blur-xl">
                {[1, 5, 25, 50, 100].map(km => (
                    <button key={km} onClick={() => setLocalKm(km)} className={cn("px-4 py-2 rounded-full text-[11px] font-black transition-all", localKm === km ? "bg-black text-white" : "text-black/50")}>{km}</button>
                ))}
            </div>
        </div>

        <button onClick={detectLocation} className={cn("w-12 h-12 rounded-3xl flex items-center justify-center shadow-2xl border border-black/5 pointer-events-auto", detected ? "bg-black text-white" : "bg-white text-black")}>
          <Navigation className={cn("w-6 h-6", detecting && "animate-spin")} />
        </button>
      </div>

      {/* RIGHT SIDE FILTERS */}
      <div className="absolute top-1/2 -translate-y-1/2 right-4 z-[10001] flex items-center">
        <div className="p-3 rounded-[3rem] flex flex-col items-center gap-4 bg-white shadow-2xl border border-black/10">
          {[
            { id: 'property', icon: Building2 }, { id: 'motorcycle', icon: MotorcycleIcon }, { id: 'bicycle', icon: Bike }, { id: 'services', icon: HardHat }
          ].map(cat => (
            <button key={cat.id} onClick={() => onCategoryChange?.(cat.id as any)} className={cn("w-14 h-14 flex items-center justify-center rounded-[1.5rem] transition-all", category === cat.id ? "bg-primary text-white scale-110 shadow-xl" : "text-black/30")}>
              <cat.icon className="w-7 h-7" />
            </button>
          ))}
        </div>
      </div>

      {/* MAP ENGINE: NO SQUARE BACKGROUND */}
      <div 
        ref={mapRef}
        className="flex-1 relative overflow-hidden bg-[#e5e7eb] rounded-[3.5rem] m-2 shadow-inner"
        onPointerDown={onPointerDown} 
        onPointerMove={onPointerMove} 
        onPointerUp={onPointerUp}
        style={{ touchAction: 'none' }}
      >
        <div className="absolute inset-0 pointer-events-none" style={{ filter: 'contrast(1.05) saturate(1.1)' }}>
            {tiles.map(t => (
                <img 
                    key={`${t.origX}-${t.origY}`}
                    src={`https://tile.openstreetmap.org/${zoom}/${t.x}/${t.y}.png`}
                    className="absolute w-[256px] h-[256px] select-none pointer-events-none"
                    style={{
                        left: mapSize.w/2 - (tileCenter.x % 1) * 256 + (t.origX - Math.floor(tileCenter.x)) * 256,
                        top: mapSize.h/2 - (tileCenter.y % 1) * 256 + (t.origY - Math.floor(tileCenter.y)) * 256,
                    }}
                    onDragStart={e => e.preventDefault()}
                />
            ))}
        </div>

        {/* DOTS LAYER (NOT CLICKABLE) */}
        <div className="absolute inset-0 pointer-events-none">
            {dots.map(dot => {
                const dotTile = latLngToTile(dot.latitude, dot.longitude, zoom);
                const px = mapSize.w/2 + (dotTile.x - tileCenter.x) * 256;
                const py = mapSize.h/2 + (dotTile.y - tileCenter.y) * 256;
                if (px < -10 || px > mapSize.w + 10 || py < -10 || py > mapSize.h + 10) return null;
                return (
                    <div 
                        key={dot.id}
                        className="absolute w-2 h-2 rounded-full bg-black border border-white shadow-xl"
                        style={{ left: px, top: py, transform: 'translate(-50%, -50%)' }}
                    />
                );
            })}
        </div>

        {/* RADAR OVERLAY */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
             <div className="rounded-full border-2 border-dashed border-black/20 bg-black/5 flex items-center justify-center" style={{ width: radiusPx*2, height: radiusPx*2 }}>
                <div className="w-4 h-4 rounded-full bg-black border-2 border-white shadow-xl" />
             </div>
        </div>
      </div>

      {/* REFRESH RADAR */}
      <div className="absolute bottom-[calc(var(--bottom-nav-height,72px)+env(safe-area-inset-bottom,0px)+12px)] inset-x-0 z-[10002] flex justify-center px-5 pointer-events-none">
        <button onClick={handleRefresh} className="w-full max-w-[340px] h-15 rounded-[2rem] text-[13px] font-black uppercase tracking-[0.4em] bg-black text-white shadow-2xl flex items-center justify-center gap-3 pointer-events-auto active:scale-95 transition-all">
          <RefreshCw className={cn("w-6 h-6", isRefreshing && "animate-spin")} /> REFRESH RADAR
        </button>
      </div>

      <div className="absolute bottom-0 inset-x-0 h-[calc(var(--bottom-nav-height,72px)+40px)] bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-[999]" />
    </motion.div>
  );
});

DiscoveryMapView.displayName = 'DiscoveryMapView';
