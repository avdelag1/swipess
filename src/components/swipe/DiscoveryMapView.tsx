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

const CATEGORY_META: Record<string, { label: string; accent: string; accentRgb: string }> = {
  property:   { label: 'Properties',  accent: '#ffffff', accentRgb: '255,255,255' },
  motorcycle: { label: 'Motorcycles', accent: '#ffffff', accentRgb: '255,255,255' },
  bicycle:    { label: 'Bicycles',    accent: '#ffffff', accentRgb: '255,255,255' },
  services:   { label: 'Workers',     accent: '#ffffff', accentRgb: '255,255,255' },
  buyers:     { label: 'Buyers',      accent: '#ffffff', accentRgb: '255,255,255' },
  renters:    { label: 'Renters',     accent: '#ffffff', accentRgb: '255,255,255' },
  hire:       { label: 'Services',    accent: '#ffffff', accentRgb: '255,255,255' },
};

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
  intentions?: string[];
  interest_categories?: string[];
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
  const [selectedDotId, setSelectedDotId] = useState<string | null>(null);
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
    setSelectedDotId(null);
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

    ctx.fillStyle = isLight ? '#f8fafc' : '#1a1f2c';
    ctx.fillRect(0, 0, w, h);

    const tilesX = Math.ceil(w / 256) + 2; const tilesY = Math.ceil(h / 256) + 2;
    let loaded = 0; const total = tilesX * tilesY;

    const drawOverlay = () => {
      if (rid !== renderIdRef.current) return;
      // Radar Ring
      ctx.beginPath();
      ctx.arc(w/2, h/2, radiusPx, 0, Math.PI * 2);
      ctx.fillStyle = isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.06)';
      ctx.fill();
      ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1; ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);

      // Dots
      dots.forEach(d => {
        const dTile = latLngToTile(d.latitude, d.longitude, zoom);
        const px = w/2 + (dTile.x - tileX) * 256; const py = h/2 + (dTile.y - tileY) * 256;
        if (px < -10 || px > w+10 || py < -10 || py > h+10) return;
        ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2);
        ctx.fillStyle = isLight ? '#000' : '#fff'; ctx.fill();
      });

      // Center
      ctx.beginPath(); ctx.arc(w/2, h/2, 6, 0, Math.PI * 2);
      ctx.fillStyle = isLight ? '#000' : '#fff'; ctx.fill();
      ctx.strokeStyle = isLight ? '#fff' : '#000'; ctx.lineWidth = 2; ctx.stroke();
    };

    const drawTiles = () => {
        for (let dx = -Math.ceil(tilesX/2); dx < Math.ceil(tilesX/2); dx++) {
            for (let dy = -Math.ceil(tilesY/2); dy < Math.ceil(tilesY/2); dy++) {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => {
                    if (rid !== renderIdRef.current) return;
                    ctx.drawImage(img, w/2 - oX + dx*256, h/2 - oY + dy*256, 256, 256);
                    loaded++; if (loaded === total) drawOverlay();
                };
                img.onerror = () => { loaded++; if (loaded === total) drawOverlay(); };
                const tZ = Math.min(zoom, 18);
                const wX = (cTX + dx + (1<<tZ)) % (1<<tZ);
                const wY = cTY + dy;
                if (wY >= 0 && wY < (1<<tZ)) img.src = `https://tile.openstreetmap.org/${tZ}/${wX}/${wY}.png`;
                else { loaded++; if (loaded === total) drawOverlay(); }
            }
        }
    };
    drawTiles();
  }, [centerLat, centerLng, zoom, radiusPx, dots, isLight, mapSize]);

  return (
    <motion.div className="flex flex-col h-full w-full bg-[#0d0d0f] relative overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* HEADER: Back & GPS */}
      <div className="absolute top-[calc(env(safe-area-inset-top,0px)+12px)] inset-x-0 px-4 z-[10001] flex items-center justify-between">
        <button onClick={onBack} className={cn("w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-xl border border-white/10", isLight ? "bg-white/80" : "bg-black/60")}>
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button onClick={detectLocation} className={cn("w-10 h-10 rounded-xl flex items-center justify-center backdrop-blur-xl border border-white/10", detected ? "bg-white text-black" : "bg-black/40 text-white")}>
          <Navigation className={cn("w-5 h-5", detecting && "animate-spin")} />
        </button>
      </div>

      {/* RADIUS SELECTOR: Top Horizontal Pill */}
      <div className="absolute top-[calc(env(safe-area-inset-top,0px)+12px)] left-1/2 -translate-x-1/2 z-[10001] flex flex-col items-center gap-2">
        <div className={cn("px-4 py-2 rounded-2xl flex items-center gap-1 backdrop-blur-xl border border-white/10 shadow-2xl", isLight ? "bg-white/80" : "bg-black/60")}>
            <span className="text-[10px] font-black tracking-tighter uppercase opacity-60">Scan Radius:</span>
            <span className="text-[12px] font-black text-primary">{localKm}KM</span>
        </div>
        <div className={cn("flex items-center gap-1 p-1 rounded-2xl backdrop-blur-xl border border-white/10", isLight ? "bg-white/60" : "bg-black/40")}>
            {[1, 5, 10, 25, 50, 100].map(km => (
                <button key={km} onClick={() => setLocalKm(km)} className={cn("px-3 py-1 rounded-xl text-[10px] font-black transition-all", localKm === km ? (isLight ? "bg-black text-white" : "bg-white text-black") : "text-muted-foreground")}>{km}</button>
            ))}
        </div>
      </div>

      {/* MAP CANVAS */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', filter: isLight ? 'none' : 'invert(1) hue-rotate(180deg) brightness(1.2) contrast(1.2) grayscale(0.2)' }} />
      </div>

      {/* QUICK FILTERS: Bottom Floating Bar */}
      <div className="absolute bottom-[calc(var(--bottom-nav-height,72px)+env(safe-area-inset-bottom,0px)+72px)] inset-x-0 z-[10002] flex justify-center px-5">
        <div className={cn("p-2 rounded-3xl flex items-center gap-2 backdrop-blur-3xl border border-white/10 shadow-2xl", isLight ? "bg-white/90" : "bg-black/60")}>
          {[
            { id: 'property', icon: Building2 }, { id: 'motorcycle', icon: MotorcycleIcon }, { id: 'bicycle', icon: Bike }, { id: 'services', icon: HardHat }
          ].map(cat => (
            <button key={cat.id} onClick={() => onCategoryChange?.(cat.id as any)} className={cn("w-12 h-12 flex items-center justify-center rounded-2xl transition-all", category === cat.id ? "bg-primary text-black" : "text-white/40")}>
              <cat.icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      </div>

      {/* REFRESH BAR */}
      <div className="absolute inset-x-0 bottom-0 z-[10002] flex items-center justify-center pb-[calc(var(--bottom-nav-height,72px)+env(safe-area-inset-bottom,0px)+12px)] px-5">
        <button onClick={handleRefresh} className={cn("w-full max-w-sm h-14 rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all shadow-2xl flex items-center justify-center gap-3", isLight ? "bg-black text-white" : "bg-white text-black border-4 border-black/10")}>
          <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} /> REFRESH RADAR
        </button>
      </div>
    </motion.div>
  );
});
