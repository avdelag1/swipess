/**
 * DISCOVERY MAP VIEW — Post Quick-Filter, Pre-Swipe
 *
 * Shown after the user taps a poker card category.
 * Displays a full-bleed pannable map with real listing dots,
 * a premium glass slider for km radius, and a back button.
 *
 * The slider follows the bottom nav "Liquid Glass" aesthetic:
 *   - Frosted glass track with a glowing thumb
 *   - Instant haptic on drag
 *   - Category accent color glow
 */

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { ChevronLeft, Navigation, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { triggerHaptic } from '@/utils/haptics';
import { useFilterStore } from '@/state/filterStore';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { SWIPE_CARD_FIELDS } from '@/hooks/smartMatching/useSmartListingMatching';
import { logger } from '@/utils/prodLogger';
import type { QuickFilterCategory } from '@/types/filters';

// ─── Category display config ──────────────────────────────────────────────────
const CATEGORY_META: Record<string, { label: string; accent: string; accentRgb: string }> = {
  property:   { label: 'Properties',  accent: '#3b82f6', accentRgb: '59,130,246' },
  motorcycle: { label: 'Motorcycles', accent: '#f97316', accentRgb: '249,115,22' },
  bicycle:    { label: 'Bicycles',    accent: '#f43f5e', accentRgb: '244,63,94' },
  services:   { label: 'Workers',     accent: '#a855f7', accentRgb: '168,85,247' },
};

// ─── Map Math ──────────────────────────────────────────────────────────────────
const kmToPixels = (km: number, lat: number, zoom: number) => {
  const mpp = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
  return (km * 1000) / mpp;
};

const getZoomForRadius = (km: number, lat: number, containerPx: number) => {
  for (let z = 16; z >= 2; z--) {
    if (kmToPixels(km, lat, z) * 2 < containerPx * 0.8) return z;
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
}

interface DiscoveryMapViewProps {
  category: QuickFilterCategory;
  onBack: () => void;
  onStartSwiping: () => void;
}

// ─── SLIDER CONSTANTS ──────────────────────────────────────────────────────────
const MIN_KM = 1;
const MAX_KM = 100;
const SLIDER_TRACK_H = 6;
const THUMB_SIZE = 28;

export const DiscoveryMapView = memo(({ category, onBack, onStartSwiping }: DiscoveryMapViewProps) => {
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
  const sliderRef = useRef<HTMLDivElement>(null);

  // Pan state
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const velocityRef = useRef({ vx: 0, vy: 0 });
  const lastMoveRef = useRef({ x: 0, y: 0, t: 0 });
  const inertiaRef = useRef<number | null>(null);
  const [mapSize, setMapSize] = useState({ w: 300, h: 400 });

  const meta = CATEGORY_META[category] || CATEGORY_META.property;
  const baseLat = userLatitude ?? 20.2114;
  const baseLng = userLongitude ?? -87.4654;

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
      () => setDetecting(false),
      { timeout: 8000, maximumAge: 60000 },
    );
  }, [setUserLocation]);

  // Auto-detect on mount if no location
  useEffect(() => {
    if (!userLatitude && !userLongitude) detectLocation();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Fetch real listing dots ──────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    const fetchDots = async () => {
      try {
        const categoryDb = category === 'services' ? 'worker' : category;
        const { data, error } = await supabase
          .from('listings')
          .select('id, latitude, longitude')
          .eq('status', 'active')
          .eq('category', categoryDb)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .neq('user_id', user.id)
          .limit(200);

        if (error) { logger.error('[DiscoveryMap] fetch error:', error); return; }
        if (data) {
          setDots(data as ListingDot[]);
        }
      } catch (e) { logger.error('[DiscoveryMap] error:', e); }
    };
    fetchDots();
  }, [user?.id, category]);

  // Count dots within radius
  useEffect(() => {
    if (!baseLat || !baseLng) { setDotCount(dots.length); return; }
    const count = dots.filter(d => haversineKm(baseLat, baseLng, d.latitude, d.longitude) <= localKm).length;
    setDotCount(count);
  }, [dots, localKm, baseLat, baseLng]);

  // Debounce radius update
  useEffect(() => {
    const t = setTimeout(() => { if (localKm !== radiusKm) setRadiusKm(localKm); }, 250);
    return () => clearTimeout(t);
  }, [localKm, radiusKm, setRadiusKm]);

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => setMapSize({ w: entry.contentRect.width, h: entry.contentRect.height }));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ─── Map rendering ───────────────────────────────────────────────────────
  const zoom = useMemo(() => getZoomForRadius(localKm, baseLat, Math.min(mapSize.w, mapSize.h)), [localKm, baseLat, mapSize]);

  const effectiveCenter = useMemo(() => {
    const { dLat, dLng } = pixelToLatLng(panOffset.x, panOffset.y, baseLat, zoom);
    return { lat: baseLat + dLat, lng: baseLng + dLng };
  }, [baseLat, baseLng, panOffset, zoom]);

  const radiusPx = useMemo(() => kmToPixels(localKm, effectiveCenter.lat, zoom), [localKm, effectiveCenter.lat, zoom]);

  // Pan handlers
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
    const now = performance.now();
    const dt = now - lastMoveRef.current.t;
    if (dt > 0) {
      velocityRef.current = {
        vx: (e.clientX - lastMoveRef.current.x) / dt * 16,
        vy: (e.clientY - lastMoveRef.current.y) / dt * 16,
      };
    }
    lastMoveRef.current = { x: e.clientX, y: e.clientY, t: now };
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

  // Draw map + radius + dots
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || mapSize.w < 10 || mapSize.h < 10) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { w, h } = mapSize;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const { x: tileX, y: tileY } = latLngToTile(effectiveCenter.lat, effectiveCenter.lng, zoom);
    const centerTileX = Math.floor(tileX);
    const centerTileY = Math.floor(tileY);
    const offsetX = (tileX - centerTileX) * 256;
    const offsetY = (tileY - centerTileY) * 256;

    ctx.fillStyle = isLight ? '#f1f5f9' : '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    const tilesX = Math.ceil(w / 256) + 2;
    const tilesY = Math.ceil(h / 256) + 2;
    const startDx = -Math.ceil(tilesX / 2);
    const startDy = -Math.ceil(tilesY / 2);
    let loaded = 0;
    const total = tilesX * tilesY;

    for (let dx = startDx; dx < startDx + tilesX; dx++) {
      for (let dy = startDy; dy < startDy + tilesY; dy++) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const drawX = w / 2 - offsetX + dx * 256;
          const drawY = h / 2 - offsetY + dy * 256;
          ctx.drawImage(img, drawX, drawY, 256, 256);
          loaded++;
          if (loaded >= total) {
            // Dark overlay for dark mode
            if (!isLight) {
              ctx.fillStyle = 'rgba(0,0,0,0.55)';
              ctx.fillRect(0, 0, w, h);
            }

            // Radius circle
            const r = Math.min(radiusPx, Math.min(w, h) / 2 - 4);
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${meta.accentRgb},${isLight ? 0.08 : 0.12})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(${meta.accentRgb},${isLight ? 0.4 : 0.5})`;
            ctx.lineWidth = 2;
            ctx.setLineDash([8, 4]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Listing dots
            dots.forEach(dot => {
              const dotTile = latLngToTile(dot.latitude, dot.longitude, zoom);
              const px = w / 2 + (dotTile.x - tileX) * 256;
              const py = h / 2 + (dotTile.y - tileY) * 256;
              if (px < -20 || px > w + 20 || py < -20 || py > h + 20) return;

              const dist = haversineKm(baseLat, baseLng, dot.latitude, dot.longitude);
              const inRadius = dist <= localKm;

              // Glow
              if (inRadius) {
                ctx.beginPath();
                ctx.arc(px, py, 10, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${meta.accentRgb},0.25)`;
                ctx.fill();
              }
              // Dot
              ctx.beginPath();
              ctx.arc(px, py, inRadius ? 5 : 3.5, 0, Math.PI * 2);
              ctx.fillStyle = inRadius ? meta.accent : (isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.2)');
              ctx.fill();
              if (inRadius) {
                ctx.strokeStyle = isLight ? '#fff' : 'rgba(255,255,255,0.6)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
              }
            });

            // Center dot (user location)
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, 7, 0, Math.PI * 2);
            ctx.fillStyle = meta.accent;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Pulsing ring around center
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, 14, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${meta.accentRgb},0.35)`;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        };
        img.onerror = () => { loaded++; };
        img.src = tileUrl(centerTileX + dx, centerTileY + dy, zoom);
      }
    }
  }, [effectiveCenter, zoom, radiusPx, isLight, mapSize, dots, localKm, baseLat, baseLng, meta]);

  // ─── Slider drag logic ────────────────────────────────────────────────────
  const isDraggingSlider = useRef(false);

  const updateSliderFromX = useCallback((clientX: number) => {
    const track = sliderRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const km = Math.round(MIN_KM + ratio * (MAX_KM - MIN_KM));
    setLocalKm(km);
  }, []);

  const handleSliderPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    isDraggingSlider.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    triggerHaptic('light');
    updateSliderFromX(e.clientX);
  }, [updateSliderFromX]);

  const handleSliderPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingSlider.current) return;
    e.stopPropagation();
    updateSliderFromX(e.clientX);
  }, [updateSliderFromX]);

  const handleSliderPointerUp = useCallback((e: React.PointerEvent) => {
    isDraggingSlider.current = false;
    triggerHaptic('light');
  }, []);

  const sliderRatio = (localKm - MIN_KM) / (MAX_KM - MIN_KM);

  return (
    <motion.div
      className="relative w-full h-full flex flex-col overflow-hidden bg-background"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ── Back Button — floating top-left ──────────────────────────────── */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        onClick={() => { triggerHaptic('light'); onBack(); }}
        className={cn(
          "absolute top-4 left-4 z-50 flex items-center gap-1.5 px-3.5 py-2 rounded-2xl",
          "backdrop-blur-xl border active:scale-95 transition-transform",
          isLight
            ? "bg-white/70 border-black/5 text-black/80"
            : "bg-white/8 border-white/10 text-white/90"
        )}
        style={{ boxShadow: isLight ? '0 4px 20px rgba(0,0,0,0.08)' : '0 4px 24px rgba(0,0,0,0.4)' }}
      >
        <ChevronLeft className="w-4.5 h-4.5" />
        <span className="text-[11px] font-black uppercase tracking-[0.2em]">Back</span>
      </motion.button>

      {/* ── Category Badge — top center ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-50"
      >
        <div
          className={cn(
            "px-5 py-2 rounded-2xl border backdrop-blur-xl flex items-center gap-2",
            isLight
              ? "bg-white/70 border-black/5"
              : "bg-black/60 border-white/10"
          )}
          style={{ boxShadow: `0 0 30px rgba(${meta.accentRgb},0.15)` }}
        >
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: meta.accent, boxShadow: `0 0 8px ${meta.accent}` }}
          />
          <span className="text-[11px] font-black uppercase tracking-[0.25em]" style={{ color: meta.accent }}>
            {meta.label}
          </span>
          <span className={cn("text-[10px] font-bold", isLight ? "text-black/40" : "text-white/40")}>
            {dotCount} nearby
          </span>
        </div>
      </motion.div>

      {/* ── GPS Button — top right ────────────────────────────────────── */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        onClick={() => { detectLocation(); }}
        disabled={detecting}
        className={cn(
          "absolute top-4 right-4 z-50 w-11 h-11 rounded-2xl flex items-center justify-center border active:scale-90 transition-all backdrop-blur-xl",
          detected
            ? "bg-white/10 border-white/15 text-white"
            : isLight
              ? "bg-white/70 border-black/5 text-black/60"
              : "bg-white/8 border-white/10 text-white/60"
        )}
        style={detected ? { boxShadow: `0 0 16px ${meta.accent}40` } : {}}
      >
        <Navigation className={cn("w-4.5 h-4.5", detecting && "animate-spin")} style={detected ? { color: meta.accent } : {}} />
      </motion.button>

      {/* ── MAP CANVAS — fills most of the space ─────────────────────── */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={{ touchAction: 'none', cursor: 'grab' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} className="block" />

        {/* Edge fade */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: isLight
              ? 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, transparent 15%, transparent 75%, rgba(255,255,255,0.6) 100%)'
              : 'linear-gradient(180deg, rgba(10,10,11,0.15) 0%, transparent 15%, transparent 75%, rgba(10,10,11,0.7) 100%)',
          }}
        />
      </div>

      {/* ── BOTTOM PANEL: Slider + Start ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "relative z-50 px-5 pt-5 pb-7 flex flex-col gap-5",
          isLight
            ? "bg-white/90 border-t border-black/5"
            : "bg-black/80 backdrop-blur-2xl border-t border-white/8"
        )}
        style={{
          boxShadow: isLight ? '0 -8px 40px rgba(0,0,0,0.06)' : '0 -8px 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* KM Label */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn("text-[10px] font-black uppercase tracking-[0.3em]", isLight ? "text-black/40" : "text-white/40")}>
              Distance
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl font-black tabular-nums" style={{ color: meta.accent }}>
              {localKm}
            </span>
            <span className={cn("text-xs font-bold mt-1", isLight ? "text-black/30" : "text-white/30")}>km</span>
          </div>
        </div>

        {/* ── PREMIUM GLASS SLIDER ────────────────────────────────────── */}
        <div className="relative w-full select-none" style={{ height: THUMB_SIZE + 12 }}>
          {/* Track container — captures the full touch area */}
          <div
            ref={sliderRef}
            className="absolute left-0 right-0 flex items-center"
            style={{
              top: '50%', transform: 'translateY(-50%)',
              height: THUMB_SIZE + 12,
              touchAction: 'none', cursor: 'pointer',
            }}
            onPointerDown={handleSliderPointerDown}
            onPointerMove={handleSliderPointerMove}
            onPointerUp={handleSliderPointerUp}
            onPointerCancel={handleSliderPointerUp}
          >
            {/* Track background — frosted glass */}
            <div
              className="absolute left-0 right-0 rounded-full overflow-hidden"
              style={{
                top: '50%', transform: 'translateY(-50%)',
                height: SLIDER_TRACK_H,
                background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
                border: isLight ? '1px solid rgba(0,0,0,0.04)' : '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {/* Active fill */}
              <div
                className="absolute left-0 top-0 bottom-0 rounded-full"
                style={{
                  width: `${sliderRatio * 100}%`,
                  background: `linear-gradient(90deg, ${meta.accent}60, ${meta.accent})`,
                  boxShadow: `0 0 12px rgba(${meta.accentRgb},0.3)`,
                  transition: isDraggingSlider.current ? 'none' : 'width 0.1s ease-out',
                }}
              />
            </div>

            {/* Thumb — glowing orb */}
            <div
              className="absolute rounded-full"
              style={{
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                top: '50%',
                left: `calc(${sliderRatio * 100}% - ${THUMB_SIZE / 2}px)`,
                transform: 'translateY(-50%)',
                background: isLight
                  ? `radial-gradient(circle at 40% 35%, #fff 0%, ${meta.accent} 100%)`
                  : `radial-gradient(circle at 40% 35%, rgba(255,255,255,0.3) 0%, ${meta.accent} 100%)`,
                boxShadow: `0 2px 12px rgba(${meta.accentRgb},0.5), 0 0 20px rgba(${meta.accentRgb},0.25), inset 0 1px 1px rgba(255,255,255,0.3)`,
                border: `2px solid rgba(255,255,255,${isLight ? 0.8 : 0.2})`,
                transition: isDraggingSlider.current ? 'none' : 'left 0.1s ease-out',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* Min/Max labels */}
          <div className="absolute left-0 right-0 flex justify-between" style={{ bottom: -2, pointerEvents: 'none' }}>
            <span className={cn("text-[9px] font-bold", isLight ? "text-black/25" : "text-white/20")}>{MIN_KM}km</span>
            <span className={cn("text-[9px] font-bold", isLight ? "text-black/25" : "text-white/20")}>{MAX_KM}km</span>
          </div>
        </div>

        {/* ── START SWIPING BUTTON ────────────────────────────────────── */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => { triggerHaptic('medium'); onStartSwiping(); }}
          className={cn(
            "relative w-full h-14 rounded-2xl font-black text-[13px] uppercase tracking-[0.25em] flex items-center justify-center gap-2.5 overflow-hidden",
            "active:scale-[0.97] transition-transform"
          )}
          style={{
            background: `linear-gradient(135deg, ${meta.accent}, ${meta.accent}cc)`,
            color: '#fff',
            boxShadow: `0 4px 24px rgba(${meta.accentRgb},0.35), 0 0 0 1px rgba(255,255,255,0.1) inset`,
          }}
        >
          {/* Shine sweep */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.2) 48%, rgba(255,255,255,0.05) 52%, transparent 70%)',
            }}
            initial={{ x: '-120%' }}
            animate={{ x: ['-120%', '180%', '180%'] }}
            transition={{ duration: 1.8, ease: 'easeInOut', repeat: Infinity, repeatDelay: 4 }}
          />
          <Zap className="w-4.5 h-4.5" style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.5))' }} />
          <span>Start Swiping</span>
          {dotCount > 0 && (
            <span className="text-[10px] opacity-60 font-bold normal-case tracking-normal">
              ({dotCount} found)
            </span>
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
});

DiscoveryMapView.displayName = 'DiscoveryMapView';
