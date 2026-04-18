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

const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
};

interface ListingDot {
  id: string;
  latitude: number;
  longitude: number;
  category?: string;
  kind?: 'listing' | 'profile';
}

export const DiscoveryMapView = memo(({ 
  category, 
  onBack, 
  onStartSwiping, 
  mode = 'client', 
  onCategoryChange,
  isEmbedded = false
}: {
  category: QuickFilterCategory;
  onBack: () => void;
  onStartSwiping: () => void;
  mode?: 'client' | 'owner';
  onCategoryChange?: (cat: QuickFilterCategory) => void;
  isEmbedded?: boolean;
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
  const [dotCount, setDotCount] = useState(0);
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
    setTimeout(() => setIsRefreshing(false), 1500);
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
      () => { setDetecting(false); toast.error('Enable location permissions'); },
      { timeout: 8000 }
    );
  }, [setUserLocation]);

  useEffect(() => { if (!userLatitude) detectLocation(); }, []);

  const fetchDots = useCallback(async () => {
    if (!user?.id) return;
    try {
      const merged: ListingDot[] = [];
      const { data } = await supabase.from('listings').select('id, latitude, longitude, category').eq('status', 'active');
      if (data) data.forEach((l: any) => merged.push({ id: l.id, latitude: l.latitude, longitude: l.longitude, category: l.category, kind: 'listing' }));
      setDots(merged);
    } catch (e) { logger.error(e); }
  }, [user?.id]);

  useEffect(() => { fetchDots(); }, [fetchDots, category]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => setMapSize({ w: entry.contentRect.width, h: entry.contentRect.height }));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const zoom = useMemo(() => getZoomForRadius(localKm, baseLat, Math.min(mapSize.w, mapSize.h)), [localKm, baseLat, mapSize]);
  const { lat: centerLat, lng: centerLng } = useMemo(() => {
    const { dLat, dLng } = pixelToLatLng(panOffset.x, panOffset.y, baseLat, zoom);
    return { lat: baseLat + dLat, lng: baseLng + dLng };
  }, [baseLat, baseLng, panOffset, zoom]);

  const radiusPx = useMemo(() => kmToPixels(localKm, centerLat, zoom), [localKm, centerLat, zoom]);

  const handlePointerDown = (e: React.PointerEvent) => {
    panStartRef.current = { x: e.clientX, y: e.clientY, ox: panOffset.x, oy: panOffset.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!panStartRef.current) return;
    setPanOffset({ x: panStartRef.current.ox - (e.clientX - panStartRef.current.x), y: panStartRef.current.oy - (e.clientY - panStartRef.current.y) });
  };
  const handlePointerUp = () => { panStartRef.current = null; };

  useEffect(() => {
    const rid = ++renderIdRef.current;
    const canvas = canvasRef.current;
    if (!canvas || mapSize.w < 10) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { w, h } = mapSize;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const { x: tileX, y: tileY } = latLngToTile(centerLat, centerLng, zoom);
    const cTX = Math.floor(tileX); const cTY = Math.floor(tileY);
    const oX = (tileX - cTX) * 256; const oY = (tileY - cTY) * 256;

    // ALWAYS DRAW AS IF LIGHT MODE - CSS FILTER HANDLES INVERSION
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    const tilesX = Math.ceil(w / 256) + 2; const tilesY = Math.ceil(h / 256) + 2;
    let loadedCount = 0; const total = tilesX * tilesY;

    const drawOverlay = () => {
      if (rid !== renderIdRef.current) return;
      ctx.beginPath();
      ctx.arc(w/2, h/2, radiusPx, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.04)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);

      // Center
      ctx.beginPath(); ctx.arc(w/2, h/2, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#000'; ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
    };

    const drawTiles = () => {
        for (let dx = -Math.ceil(tilesX/2); dx < Math.ceil(tilesX/2); dx++) {
            for (let dy = -Math.ceil(tilesY/2); dy < Math.ceil(tilesY/2); dy++) {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => {
                    if (rid !== renderIdRef.current) return;
                    ctx.drawImage(img, w/2 - oX + dx*256, h/2 - oY + dy*256, 256, 256);
                    loadedCount++; if (loadedCount === total) drawOverlay();
                };
                img.onerror = () => { loadedCount++; if (loadedCount === total) drawOverlay(); };
                const tZ = Math.min(zoom, 18);
                const wX = (cTX + dx + (1<<tZ)) % (1<<tZ);
                const wY = cTY + dy;
                if (wY >= 0 && wY < (1<<tZ)) img.src = `https://tile.openstreetmap.org/${tZ}/${wX}/${wY}.png`;
                else { loadedCount++; if (loadedCount === total) drawOverlay(); }
            }
        }
    };
    drawTiles();
  }, [centerLat, centerLng, zoom, radiusPx, dots, isLight, mapSize]);

  return (
    <motion.div className="flex flex-col h-full w-full bg-[#0d0d0f] relative overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* HEADER: Back & GPS */}
      <div className="absolute top-[calc(env(safe-area-inset-top,0px)+12px)] inset-x-0 px-4 z-[10001] flex items-center justify-between">
        <button onClick={onBack} className={cn("w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-2xl transition-all", isLight ? "bg-white/80 text-black" : "bg-black/60 text-white")}>
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button onClick={detectLocation} className={cn("w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-2xl transition-all", detected ? (isLight ? "bg-black text-white" : "bg-white text-black") : "bg-black/40 text-white")}>
          <Navigation className={cn("w-5 h-5", detecting && "animate-spin")} />
        </button>
      </div>

      {/* RADIUS SELECTOR: Center Top Horizontal */}
      <div className="absolute top-[calc(env(safe-area-inset-top,0px)+12px)] left-1/2 -translate-x-1/2 z-[10001] flex flex-col items-center gap-2">
        <div className={cn("px-5 py-2 rounded-2xl flex items-center gap-1.5 backdrop-blur-xl border border-white/10 shadow-2xl transition-all", isLight ? "bg-white/90" : "bg-black/80")}>
            <span className="text-[11px] font-black tracking-tighter uppercase opacity-50">Scan Radius:</span>
            <span className={cn("text-[13px] font-black", isLight ? "text-primary" : "text-white")}>{localKm}KM</span>
        </div>
        <div className={cn("flex items-center gap-1 p-1 rounded-2xl backdrop-blur-xl border border-white/10 shadow-lg", isLight ? "bg-white/70" : "bg-black/50")}>
            {[1, 5, 10, 25, 50, 100].map(km => (
                <button key={km} onClick={() => setLocalKm(km)} className={cn("px-3.5 py-1.5 rounded-xl text-[10px] font-black transition-all", localKm === km ? (isLight ? "bg-black text-white" : "bg-white text-black scale-105") : "text-muted-foreground opacity-50")}>{km}</button>
            ))}
        </div>
      </div>

      {/* MAP CANVAS */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', filter: isLight ? 'none' : 'invert(1) hue-rotate(180deg) brightness(1.1) contrast(1.1)' }} />
      </div>

      {/* QUICK FILTERS: Bottom Floating Bar */}
      <div className="absolute bottom-[calc(var(--bottom-nav-height,72px)+env(safe-area-inset-bottom,0px)+72px)] inset-x-0 z-[10002] flex justify-center px-5">
        <motion.div 
          initial={{ y: 20 }} animate={{ y: 0 }}
          className={cn("p-2 rounded-3xl flex items-center gap-2 backdrop-blur-3xl border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.5)]", isLight ? "bg-white/90" : "bg-black/70")}
        >
          {[
            { id: 'property', icon: Building2 }, { id: 'motorcycle', icon: MotorcycleIcon }, { id: 'bicycle', icon: Bike }, { id: 'services', icon: HardHat }
          ].map(cat => (
            <button key={cat.id} onClick={() => onCategoryChange?.(cat.id as any)} className={cn("w-13 h-13 flex items-center justify-center rounded-2xl transition-all", category === cat.id ? (isLight ? "bg-black text-white" : "bg-white text-black shadow-xl") : "opacity-30")}>
              <cat.icon className="w-6 h-6" />
            </button>
          ))}
        </motion.div>
      </div>

      {/* REFRESH BAR */}
      <div className="absolute inset-x-0 bottom-0 z-[10002] flex items-center justify-center pb-[calc(var(--bottom-nav-height,72px)+env(safe-area-inset-bottom,0px)+12px)] px-5">
        <button onClick={handleRefresh} className={cn("w-full max-w-sm h-14 rounded-3xl text-[12px] font-black uppercase tracking-[0.3em] transition-all shadow-2xl flex items-center justify-center gap-3", isLight ? "bg-black text-white" : "bg-white text-black border-4 border-black/10")}>
          <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} /> REFRESH RADAR
        </button>
      </div>
    </motion.div>
  );
});
