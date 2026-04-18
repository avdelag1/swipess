/**
 * DISCOVERY MAP VIEW — Post Quick-Filter, Pre-Swipe
 *
 * Shown after the user taps a poker card category.
 * Displays a full-bleed pannable map with real listing dots,
 * a premium glass slider for km radius, and a back button.
 *
 * v1.0.89: Immersive Full-Screen Sentinel Radar.
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

// ─── Category display config ──────────────────────────────────────────────────
const CATEGORY_META: Record<string, { label: string; accent: string; accentRgb: string }> = {
  property:   { label: 'Properties',  accent: '#ffffff', accentRgb: '255,255,255' },
  motorcycle: { label: 'Motorcycles', accent: '#ffffff', accentRgb: '255,255,255' },
  bicycle:    { label: 'Bicycles',    accent: '#ffffff', accentRgb: '255,255,255' },
  services:   { label: 'Workers',     accent: '#ffffff', accentRgb: '255,255,255' },
  buyers:     { label: 'Buyers',      accent: '#ffffff', accentRgb: '255,255,255' },
  renters:    { label: 'Renters',     accent: '#ffffff', accentRgb: '255,255,255' },
  hire:       { label: 'Services',    accent: '#ffffff', accentRgb: '255,255,255' },
};

// ─── Map Math ──────────────────────────────────────────────────────────────────
const kmToPixels = (km: number, lat: number, zoom: number) => {
  const mpp = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
  return (km * 1000) / mpp;
};

const getZoomForRadius = (km: number, lat: number, containerPx: number) => {
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

const tileUrl = (x: number, y: number, z: number) =>
  `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

// ─── Haversine distance ────────────────────────────────────────────────────────
const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ─── Types ─────────────────────────────────────────────────────────────────────
interface ListingDot {
  id: string;
  latitude: number;
  longitude: number;
  category?: string;
  kind?: 'listing' | 'profile';
  intentions?: string[];
  interest_categories?: string[];
}

interface DiscoveryMapViewProps {
  category: QuickFilterCategory;
  onBack: () => void;
  onStartSwiping: () => void;
  mode?: 'client' | 'owner';
  onCategoryChange?: (cat: QuickFilterCategory) => void;
  isEmbedded?: boolean;
}

const MIN_KM = 1;
const MAX_KM = 100;

export const DiscoveryMapView = memo(({ 
  category, 
  onBack, 
  onStartSwiping, 
  mode = 'client', 
  onCategoryChange,
  isEmbedded = false
}: DiscoveryMapViewProps) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { user } = useAuth();

  const radiusKm = useFilterStore(s => s.radiusKm);
  const setRadiusKm = useFilterStore(s => s.setRadiusKm);
  const setUserLocation = useFilterStore(s => s.setUserLocation);
  const userLatitude = useFilterStore(s => s.userLatitude);
  const userLongitude = useFilterStore(s => s.userLongitude);

  const [localKm, setLocalKm] = useState(radiusKm);
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState(!!userLatitude);
  const [dots, setDots] = useState<ListingDot[]>([]);
  const [dotCount, setDotCount] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Interaction State
  const [selectedDotId, setSelectedDotId] = useState<string | null>(null);
  const selectedDot = useMemo(() => dots.find(d => d.id === selectedDotId), [dots, selectedDotId]);

  // Pan state
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const velocityRef = useRef({ vx: 0, vy: 0 });
  const lastMoveRef = useRef({ x: 0, y: 0, t: 0 });
  const inertiaRef = useRef<number | null>(null);
  const renderIdRef = useRef(0);
  const [mapSize, setMapSize] = useState({ w: 300, h: 400 });

  const meta = CATEGORY_META[category] || CATEGORY_META.property;
  const baseLat = userLatitude ?? 20.2114;
  const baseLng = userLongitude ?? -87.4654;

  const [scanTick, setScanTick] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [scanPulse, setScanPulse] = useState(0);

  const handleRefresh = useCallback(() => {
    triggerHaptic('medium');
    setIsRefreshing(true);
    setScanTick(t => t + 1);
    setScanPulse(p => p + 1);
    setSelectedDotId(null);
    setTimeout(() => setIsRefreshing(false), 2000);
  }, []);

  useEffect(() => {
    handleRefresh();
  }, [category, handleRefresh]);

  // ─── Detect location ─────────────────────────────────────────────────────
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
      () => {
        setDetecting(false);
        toast.error('Enable location permissions to use the radar');
      },
      { timeout: 8000, maximumAge: 60000 },
    );
  }, [setUserLocation]);

  useEffect(() => {
    if (!userLatitude && !userLongitude) detectLocation();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Fetch Dots ─────────────────────────────────────────────────────────
  const [refreshTick, setRefreshTick] = useState(0);
  const [fetchingDots, setFetchingDots] = useState(false);

  const fetchDots = useCallback(async () => {
    if (!user?.id) return;
    setFetchingDots(true);
    try {
      const merged: ListingDot[] = [];
      const { data: listingData, error: listingErr } = await supabase
        .from('listings')
        .select('id, latitude, longitude, category')
        .eq('status', 'active')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .neq('user_id', user.id)
        .limit(500);
      
      if (listingData) {
        listingData.forEach((l: any) =>
          merged.push({ id: `l_${l.id}`, latitude: l.latitude, longitude: l.longitude, category: l.category, kind: 'listing' })
        );
      }

      const { data: profileData, error: profileErr } = await supabase
        .from('client_profiles')
        .select('id, user_id, latitude, longitude, intentions, interest_categories')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .neq('user_id', user.id)
        .limit(500);
      
      if (profileData) {
        profileData.forEach((p: any) =>
          merged.push({
            id: `p_${p.id}`,
            latitude: p.latitude,
            longitude: p.longitude,
            kind: 'profile',
            intentions: Array.isArray(p.intentions) ? p.intentions : [],
            interest_categories: Array.isArray(p.interest_categories) ? p.interest_categories : [],
          })
        );
      }
      setDots(merged);
    } catch (e) {
      logger.error('[DiscoveryMap] error:', e);
    } finally {
      setFetchingDots(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchDots(); }, [fetchDots, refreshTick, scanTick]);

  const isDotMatching = useCallback(
    (d: ListingDot) => {
      const dbCat = (category === 'services' || category === 'worker') ? 'worker' : category;
      if (mode === 'owner') {
        if (d.kind !== 'profile') return false;
        const interests = [...(d.interest_categories || []), ...(d.intentions || [])].map(i => i.toLowerCase());
        return interests.includes(dbCat.toLowerCase()) || interests.includes(category.toLowerCase());
      }
      if (d.kind === 'profile') return false;
      return (d.category || '').toLowerCase() === dbCat.toLowerCase();
    },
    [category, mode]
  );

  useEffect(() => {
    if (!baseLat || !baseLng) { setDotCount(0); return; }
    const count = dots.filter(d =>
      isDotMatching(d) && haversineKm(baseLat, baseLng, d.latitude, d.longitude) <= localKm,
    ).length;
    setDotCount(count);
  }, [dots, localKm, baseLat, baseLng, isDotMatching]);

  useEffect(() => {
    const t = setTimeout(() => { if (localKm !== radiusKm) setRadiusKm(localKm); }, 250);
    return () => clearTimeout(t);
  }, [localKm, radiusKm, setRadiusKm]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => setMapSize({ w: entry.contentRect.width, h: entry.contentRect.height }));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const zoom = useMemo(() => getZoomForRadius(localKm, baseLat, Math.min(mapSize.w, mapSize.h)), [localKm, baseLat, mapSize]);

  const effectiveCenter = useMemo(() => {
    const { dLat, dLng } = pixelToLatLng(panOffset.x, panOffset.y, baseLat, zoom);
    return { lat: baseLat + dLat, lng: baseLng + dLng };
  }, [baseLat, baseLng, panOffset, zoom]);

  const radiusPx = useMemo(() => kmToPixels(localKm, effectiveCenter.lat, zoom), [localKm, effectiveCenter.lat, zoom]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (inertiaRef.current) { cancelAnimationFrame(inertiaRef.current); inertiaRef.current = null; }
    panStartRef.current = { x: e.clientX, y: e.clientY, ox: panOffset.x, oy: panOffset.y };
    lastMoveRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [panOffset]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!panStartRef.current) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    setPanOffset({ x: panStartRef.current.ox - dx, y: panStartRef.current.oy - dy });
    velocityRef.current = { vx: e.clientX - lastMoveRef.current.x, vy: e.clientY - lastMoveRef.current.y };
    lastMoveRef.current = { x: e.clientX, y: e.clientY, t: performance.now() };
  }, []);

  const handlePointerUp = useCallback(() => {
    panStartRef.current = null;
    const { vx, vy } = velocityRef.current;
    if (Math.abs(vx) > 1 || Math.abs(vy) > 1) {
      let cvx = vx, cvy = vy;
      const decay = () => {
        cvx *= 0.92; cvy *= 0.92;
        if (Math.abs(cvx) < 0.5 && Math.abs(cvy) < 0.5) { inertiaRef.current = null; return; }
        setPanOffset(prev => ({ x: prev.x - cvx, y: prev.y - cvy }));
        inertiaRef.current = requestAnimationFrame(decay);
      };
      inertiaRef.current = requestAnimationFrame(decay);
    }
  }, []);

  // ─── Drawing logic ───────────────────────────────────────────────────────
  useEffect(() => {
    const rid = ++renderIdRef.current;

    const canvas = canvasRef.current;
    if (!canvas || mapSize.w < 10 || mapSize.h < 10) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { w, h } = mapSize;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const { x: tileX, y: tileY } = latLngToTile(effectiveCenter.lat, effectiveCenter.lng, zoom);
    const centerTileX = Math.floor(tileX);
    const centerTileY = Math.floor(tileY);
    const offsetX = (tileX - centerTileX) * 256;
    const offsetY = (tileY - centerTileY) * 256;

    // Background fill to prevent transparency issues
    ctx.fillStyle = isLight ? '#f8fafc' : '#111827';
    ctx.fillRect(0, 0, w, h);

    const tilesX = Math.ceil(w / 256) + 2;
    const tilesY = Math.ceil(h / 256) + 2;
    const startDx = -Math.ceil(tilesX / 2);
    const startDy = -Math.ceil(tilesY / 2);

    let loaded = 0;
    const total = tilesX * tilesY;

    const drawOverlay = () => {
      if (rid !== renderIdRef.current) return;

      const visualCenterY = h / 2;
      const visualCenterX = w / 2;

      // Radar Ring
      const r = Math.min(radiusPx, Math.min(w, h) / 2 - 40);
      ctx.beginPath();
      ctx.arc(visualCenterX, visualCenterY, r, 0, Math.PI * 2);
      ctx.fillStyle = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)';
      ctx.fill();
      ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 8]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Dots
      dots.forEach(dot => {
        const dTile = latLngToTile(dot.latitude, dot.longitude, zoom);
        const px = visualCenterX + (dTile.x - tileX) * 256;
        const py = visualCenterY + (dTile.y - tileY) * 256;
        if (px < -20 || px > w + 20 || py < -20 || py > h + 20) return;

        const dist = haversineKm(baseLat, baseLng, dot.latitude, dot.longitude);
        const highlight = dist <= localKm && isDotMatching(dot);
        const isSelected = dot.id === selectedDotId;

        if (highlight || isSelected) {
          ctx.beginPath();
          ctx.arc(px, py, isSelected ? 14 : 10, 0, Math.PI * 2);
          ctx.fillStyle = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.15)';
          ctx.fill();

          if (isSelected) {
            ctx.strokeStyle = isLight ? '#222' : '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }

        ctx.beginPath();
        ctx.arc(px, py, (highlight || isSelected) ? 5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = (highlight || isSelected) ? (isLight ? '#000' : '#fff') : (isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)');
        ctx.fill();
      });

      // Center marker
      ctx.beginPath();
      ctx.arc(visualCenterX, visualCenterY, 8, 0, Math.PI * 2);
      ctx.fillStyle = isLight ? '#000' : '#fff';
      ctx.fill();
      ctx.strokeStyle = isLight ? '#fff' : '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    const onFinish = () => {
      if (rid !== renderIdRef.current) return;
      loaded++;
      if (loaded >= total) drawOverlay();
    };

    for (let dx = startDx; dx < startDx + tilesX; dx++) {
      for (let dy = startDy; dy < startDy + tilesY; dy++) {
        const img = new Image();
        img.crossOrigin = "anonymous"; // Safe for OSM
        const drawX = w / 2 - offsetX + dx * 256;
        const drawY = h / 2 - offsetY + dy * 256;
        img.onload = () => {
          if (rid !== renderIdRef.current) return;
          try {
            ctx.drawImage(img, drawX, drawY, 256, 256);
          } catch {
            ctx.fillStyle = isLight ? '#f1f5f9' : '#1f2937';
            ctx.fillRect(drawX, drawY, 256, 256);
          }
          onFinish();
        };
        img.onerror = () => {
          if (rid !== renderIdRef.current) return;
          ctx.fillStyle = isLight ? '#f1f5f9' : '#1f2937';
          ctx.fillRect(drawX, drawY, 256, 256);
          onFinish();
        };
        const tileZ = Math.min(zoom, 18);
        const wrappedX = (centerTileX + dx + (1 << tileZ)) % (1 << tileZ);
        const wrappedY = centerTileY + dy;

        if (wrappedY >= 0 && wrappedY < (1 << tileZ)) {
          const s = 'abc'[Math.abs(wrappedX + wrappedY) % 3];
          img.src = `https://${s}.tile.openstreetmap.org/${tileZ}/${wrappedX}/${wrappedY}.png`;
        } else {
          onFinish();
        }
      }
    }
  }, [effectiveCenter, zoom, radiusPx, isLight, mapSize, dots, localKm, baseLat, baseLng, meta, isDotMatching, selectedDotId]);

  return (
    <motion.div
      className={cn("flex flex-col h-full w-full bg-[#0d0d0f] relative overflow-hidden")}
      initial={isEmbedded ? false : { opacity: 0 }}
      animate={isEmbedded ? false : { opacity: 1 }}
      exit={isEmbedded ? false : { opacity: 0 }}
    >
      {/* HUD: Header Row */}
      <div className="absolute top-[calc(env(safe-area-inset-top,0px)+12px)] inset-x-0 px-4 z-[10001] flex items-center justify-between pointer-events-none">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => { triggerHaptic('light'); onBack(); }}
          className={cn("w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10 pointer-events-auto", isLight ? "bg-white/80 text-black shadow-md" : "bg-black/60 text-white shadow-2xl")}
        >
          <ArrowLeft className="w-6 h-6" />
        </motion.button>

        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={detectLocation} 
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/10 shadow-2xl transition-all pointer-events-auto", 
            detected ? (isLight ? "bg-black text-white" : "bg-white text-black") : "bg-black/40 text-white/50"
          )} 
        >
          <Navigation className={cn("w-5 h-5", detecting && "animate-spin")} />
        </motion.button>
      </div>

      {/* FLOAT HUD: Top Quick Filters (Moved from center to avoid blocking radar) */}
      <div className="absolute top-[calc(env(safe-area-inset-top,0px)+72px)] inset-x-0 z-[10002] flex justify-center px-5 pointer-events-none">
        <motion.div 
          initial={{ y: -20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }}
          className={cn(
            "p-2 rounded-3xl flex items-center gap-2 backdrop-blur-3xl border border-white/10 shadow-2xl pointer-events-auto", 
            isLight ? "bg-white/90" : "bg-black/60"
          )}
        >
          {[
            { id: 'property', icon: Building2 }, 
            { id: 'motorcycle', icon: MotorcycleIcon }, 
            { id: 'bicycle', icon: Bike }, 
            { id: 'services', icon: HardHat }
          ].map(cat => (
            <button 
              key={cat.id} 
              onClick={() => { triggerHaptic('medium'); onCategoryChange?.(cat.id as QuickFilterCategory); }} 
              className={cn(
                "w-12 h-12 flex items-center justify-center rounded-2xl transition-all", 
                category === cat.id 
                  ? (isLight ? "bg-black text-white shadow-lg" : "bg-white text-black shadow-lg") 
                  : "text-white/40 hover:text-white"
              )}
            >
              <cat.icon className="w-5 h-5" />
            </button>
          ))}
        </motion.div>
      </div>

      {/* HUD: Left Radius (Minimalist KM selector) */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="absolute left-4 z-[10001] flex items-center"
        style={{
          top: 'calc(env(safe-area-inset-top, 0px) + 72px)',
          bottom: 'calc(var(--bottom-nav-height, 72px) + env(safe-area-inset-bottom, 0px) + 100px)',
        }}
      >
         <div className={cn("w-14 p-2 rounded-3xl flex flex-col gap-2 backdrop-blur-3xl border border-white/10 shadow-2xl", isLight ? "bg-white/70" : "bg-black/40")}>
            <div className="flex flex-col items-center py-2">
              <span className="text-[10px] font-black" style={{ color: isLight ? '#000' : '#fff' }}>{localKm}</span>
              <span className="text-[6px] font-bold opacity-40">KM</span>
            </div>
            {[1, 5, 10, 25, 50, 100].map(km => (
              <button 
                key={km} 
                onClick={() => { triggerHaptic('light'); setLocalKm(km); }} 
                className={cn(
                  "w-10 h-10 rounded-xl text-[10px] font-black transition-all", 
                  localKm === km 
                    ? (isLight ? "bg-black text-white shadow-lg" : "bg-white text-black shadow-lg") 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {km}
              </button>
            ))}
         </div>
      </motion.div>

      {/* MAP CANVAS */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden" style={{ touchAction: 'none' }} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%', filter: isLight ? 'none' : 'invert(1) hue-rotate(180deg) brightness(1.1) contrast(1.15) saturate(1.1)' }} />
        
        {/* Radar Pulse Effect */}
        <AnimatePresence>
          {isRefreshing && (
            <motion.div key="pulse" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 pointer-events-none overflow-hidden">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vmax] h-[200vmax]" style={{ background: `conic-gradient(from 0deg, rgba(${isLight ? '0,0,0' : '255,255,255'}, 0.1) 0deg, transparent 90deg)`, animation: 'radar-rotate 2s linear infinite', opacity: 0.4 }} />
               <style>{`@keyframes radar-rotate { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }`}</style>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* BOTTOM ACTION: Refresh Radar - Ultra High Contrast */}
      <div className="absolute inset-x-0 bottom-0 z-[10002] flex flex-col items-center pb-[calc(var(--bottom-nav-height,72px)+env(safe-area-inset-bottom,0px)+12px)] px-5">
        <button 
          onClick={handleRefresh} 
          className={cn(
            "w-full max-w-sm h-14 rounded-3xl text-[12px] font-black uppercase tracking-[0.3em] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(0,0,0,0.5)]",
            isLight ? "bg-black text-white" : "bg-white text-black font-bold border-2 border-white/20"
          )}
        >
          <RefreshCw className={cn("w-5 h-5", fetchingDots && "animate-spin")} />
          REFRESH RADAR ({dotCount})
        </button>
      </div>
    </motion.div>
  );
});

DiscoveryMapView.displayName = 'DiscoveryMapView';
