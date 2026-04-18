/**
 * DISCOVERY MAP VIEW — Post Quick-Filter, Pre-Swipe
 *
 * Shown after the user taps a poker card category.
 * Displays a full-bleed pannable map with real listing dots,
 */

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import { Navigation, Zap, RefreshCw, Building2, Bike, Trophy, Wrench, ArrowLeft, X, HardHat, PersonStanding } from 'lucide-react';
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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [mapSize, setMapSize] = useState({ w: 400, h: 600 });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const renderIdRef = useRef(0);

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

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setMapSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const zoom = useMemo(() => getZoomForRadius(localKm, baseLat, Math.min(mapSize.w, mapSize.h)), [localKm, baseLat, mapSize]);
  const center = useMemo(() => {
    const { dLat, dLng } = pixelToLatLng(panOffset.x, panOffset.y, baseLat, zoom);
    return { lat: baseLat + dLat, lng: baseLng + dLng };
  }, [baseLat, baseLng, panOffset, zoom]);

  const radiusPx = kmToPixels(localKm, center.lat, zoom);

  // MAPPING DRAWING
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || mapSize.w < 10) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rid = ++renderIdRef.current;
    const { w, h } = mapSize;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const { x: tileX, y: tileY } = latLngToTile(center.lat, center.lng, zoom);
    const cTX = Math.floor(tileX); const cTY = Math.floor(tileY);
    const oX = (tileX - cTX) * 256; const oY = (tileY - cTY) * 256;

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    const tilesX = Math.ceil(w / 256) + 2; const tilesY = Math.ceil(h / 256) + 2;
    let loaded = 0;
    const tilesNeeded = tilesX * tilesY;

    const drawMap = () => {
        if (rid !== renderIdRef.current) return;
        // Radar
        ctx.beginPath();
        ctx.arc(w/2, h/2, radiusPx, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.03)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Center Marker
        ctx.beginPath(); ctx.arc(w/2, h/2, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#111'; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    };

    for (let dx = -Math.round(tilesX/2); dx <= Math.round(tilesX/2); dx++) {
        for (let dy = -Math.round(tilesY/2); dy <= Math.round(tilesY/2); dy++) {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                if (rid !== renderIdRef.current) return;
                ctx.drawImage(img, w/2 - oX + dx*256, h/2 - oY + dy*256, 256, 256);
                loaded++;
                if (loaded >= tilesNeeded) drawMap();
            };
            img.onerror = () => {
                loaded++;
                if (loaded >= tilesNeeded) drawMap();
            };
            const tZ = Math.min(zoom, 18);
            const wX = (cTX + dx + (1<<tZ)) % (1<<tZ);
            const wY = cTY + dy;
            if (wY >= 0 && wY < (1<<tZ)) {
                img.src = `https://a.tile.openstreetmap.org/${tZ}/${wX}/${wY}.png`;
            } else {
                loaded++;
                if (loaded >= tilesNeeded) drawMap();
            }
        }
    }
  }, [center, zoom, radiusPx, mapSize]);

  return (
    <motion.div className="flex flex-col h-full w-full bg-[#f8fafc] relative overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      
      {/* HUD: Back & GPS */}
      <div className="absolute top-[calc(env(safe-area-inset-top,0px)+16px)] inset-x-0 px-5 z-[10001] flex items-center justify-between pointer-events-none">
        <button onClick={onBack} className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white shadow-2xl border border-black/5 pointer-events-auto active:scale-90 transition-all">
          <ArrowLeft className="w-6 h-6 text-black" />
        </button>
        <button onClick={detectLocation} className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl border border-black/5 pointer-events-auto active:scale-90 transition-all", detected ? "bg-black text-white" : "bg-white text-black")}>
          <Navigation className={cn("w-6 h-6", detecting && "animate-spin")} />
        </button>
      </div>

      {/* RADIUS PILL: Top Center */}
      <div className="absolute top-[calc(env(safe-area-inset-top,0px)+16px)] left-1/2 -translate-x-1/2 z-[10001] flex flex-col items-center gap-3 pointer-events-none">
        <div className="px-6 py-2.5 rounded-[1.5rem] bg-white shadow-2xl border border-black/5 flex items-center gap-2 pointer-events-auto">
            <span className="text-[10px] font-black tracking-widest uppercase text-black/40">Scan Radius:</span>
            <span className="text-[14px] font-black text-primary">{localKm}KM</span>
        </div>
        <div className="flex items-center gap-1.5 p-1.5 rounded-[1.5rem] bg-white/80 shadow-xl border border-black/5 pointer-events-auto backdrop-blur-md">
            {[1, 5, 10, 25, 50, 100].map(km => (
                <button key={km} onClick={() => setLocalKm(km)} className={cn("px-4 py-2 rounded-xl text-[11px] font-black transition-all", localKm === km ? "bg-black text-white shadow-md scale-105" : "text-black/50")}>{km}</button>
            ))}
        </div>
      </div>

      {/* MAP VIEW */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', filter: 'contrast(1.05) saturate(1.2)' }} />
      </div>

      {/* QUICK FILTERS: Bottom Floating bar */}
      <div className="absolute bottom-[calc(var(--bottom-nav-height,72px)+env(safe-area-inset-bottom,0px)+84px)] inset-x-0 z-[10002] flex justify-center px-5 pointer-events-none">
        <div className="p-3.5 rounded-[2.5rem] flex items-center gap-5 bg-white shadow-[0_32px_64px_rgba(0,0,0,0.2)] border border-black/5 pointer-events-auto">
          {[
            { id: 'property', icon: Building2 }, { id: 'motorcycle', icon: MotorcycleIcon }, { id: 'bicycle', icon: Bike }, { id: 'services', icon: HardHat }
          ].map(cat => (
            <button key={cat.id} onClick={() => onCategoryChange?.(cat.id as any)} className={cn("w-14 h-14 flex items-center justify-center rounded-[1.25rem] transition-all", category === cat.id ? "bg-black text-white scale-110 shadow-xl" : "text-black/30")}>
              <cat.icon className="w-7 h-7" />
            </button>
          ))}
        </div>
      </div>

      {/* REFRESH BAR */}
      <div className="absolute inset-x-0 bottom-0 z-[10002] flex items-center justify-center pb-[calc(var(--bottom-nav-height,72px)+env(safe-area-inset-bottom,0px)+12px)] px-5 pointer-events-none">
        <button onClick={handleRefresh} className="w-full max-w-sm h-14 rounded-3xl text-[12px] font-black uppercase tracking-[0.4em] bg-black text-white shadow-[0_24px_48px_rgba(0,0,0,0.3)] pointer-events-auto active:scale-95 transition-all flex items-center justify-center gap-3">
          <RefreshCw className={cn("w-6 h-6", isRefreshing && "animate-spin")} /> REFRESH RADAR
        </button>
      </div>

      {/* SEPARATION LAYER: Ensures bottom nav bar pops */}
      <div className="absolute bottom-0 inset-x-0 h-[var(--bottom-nav-height,72px)] bg-black/10 backdrop-blur-sm pointer-events-none z-[999]" />
    </motion.div>
  );
});
