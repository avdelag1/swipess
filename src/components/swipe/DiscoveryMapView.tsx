/**
 * DISCOVERY MAP VIEW — Post Quick-Filter, Pre-Swipe
 *
 * Compact iOS-style module shown after the user taps a poker card category.
 *   · One small square radar module (no full-screen map)
 *   · No self-motion / inertia — pan follows the finger only
 *   · Clear blue center marker with halo + pulse ring
 *   · Back top-left, Refresh + Location in a floating cluster at map top-right
 *   · Compact category icon pills below the map
 *   · Fast KM preset pills as the primary radius control
 *   · Start Swiping CTA at the bottom
 *
 * Fits cleanly between the global TopBar and the bottom navigation.
 */

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { Navigation, Zap, RefreshCw, Building2, Bike, Trophy, Wrench, ArrowLeft } from 'lucide-react';
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
  property:   { label: 'Properties',  accent: '#3b82f6', accentRgb: '59,130,246' },
  motorcycle: { label: 'Motorcycles', accent: '#f97316', accentRgb: '249,115,22' },
  bicycle:    { label: 'Bicycles',    accent: '#f43f5e', accentRgb: '244,63,94' },
  services:   { label: 'Workers',     accent: '#a855f7', accentRgb: '168,85,247' },
  buyers:     { label: 'Buyers',      accent: '#3b82f6', accentRgb: '59,130,246' },
  renters:    { label: 'Renters',     accent: '#10b981', accentRgb: '16,185,129' },
  hire:       { label: 'Services',    accent: '#a855f7', accentRgb: '168,85,247' },
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

// Module-level tile cache so repeated renders don't re-fetch tiles.
const TILE_CACHE: Record<string, HTMLImageElement> = {};

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
const KM_PRESETS = [1, 5, 10, 25, 50, 100];

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

  // Pan state — NO inertia. Pan follows the finger only.
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [mapSize, setMapSize] = useState({ w: 300, h: 300 });

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

  useEffect(() => {
    if (!userLatitude && !userLongitude) detectLocation();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Fetch all discoverable dots (listings + profiles) ───────────────────
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
      if (listingErr) {
        logger.error('[DiscoveryMap] listing fetch error:', listingErr);
      } else if (listingData) {
        listingData.forEach((l: any) =>
          merged.push({
            id: `l_${l.id}`,
            latitude: l.latitude,
            longitude: l.longitude,
            category: l.category,
            kind: 'listing',
          }),
        );
      }

      const { data: profileData, error: profileErr } = await supabase
        .from('client_profiles')
        .select('id, user_id, latitude, longitude, intentions, interest_categories')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .neq('user_id', user.id)
        .limit(500);
      if (profileErr) {
        logger.error('[DiscoveryMap] profile fetch error:', profileErr);
      } else if (profileData) {
        profileData.forEach((p: any) =>
          merged.push({
            id: `p_${p.id}`,
            latitude: p.latitude,
            longitude: p.longitude,
            kind: 'profile',
            intentions: Array.isArray(p.intentions) ? p.intentions : [],
            interest_categories: Array.isArray(p.interest_categories) ? p.interest_categories : [],
          }),
        );
      }

      setDots(merged);
    } catch (e) {
      logger.error('[DiscoveryMap] error:', e);
    } finally {
      setFetchingDots(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDots();
  }, [fetchDots, refreshTick]);

  const handleRefresh = useCallback(() => {
    triggerHaptic('medium');
    setRefreshTick(t => t + 1);
  }, []);

  const isDotMatching = useCallback(
    (d: ListingDot) => {
      const dbCat = category === 'services' ? 'worker' : category;
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

  // Commit radius to store instantly — pill taps are the primary input now.
  useEffect(() => {
    if (localKm !== radiusKm) setRadiusKm(localKm);
  }, [localKm, radiusKm, setRadiusKm]);

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) =>
      setMapSize({ w: entry.contentRect.width, h: entry.contentRect.height }),
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ─── Map rendering ───────────────────────────────────────────────────────
  const zoom = useMemo(
    () => getZoomForRadius(localKm, baseLat, Math.min(mapSize.w, mapSize.h)),
    [localKm, baseLat, mapSize],
  );

  const effectiveCenter = useMemo(() => {
    const { dLat, dLng } = pixelToLatLng(panOffset.x, panOffset.y, baseLat, zoom);
    return { lat: baseLat + dLat, lng: baseLng + dLng };
  }, [baseLat, baseLng, panOffset, zoom]);

  const radiusPx = useMemo(
    () => kmToPixels(localKm, effectiveCenter.lat, zoom),
    [localKm, effectiveCenter.lat, zoom],
  );

  // Pan handlers — finger-only. No velocity, no decay, no drift.
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    panStartRef.current = { x: e.clientX, y: e.clientY, ox: panOffset.x, oy: panOffset.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [panOffset]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!panStartRef.current) return;
    const dx = e.clientX - panStartRef.current.x;
    const dy = e.clientY - panStartRef.current.y;
    setPanOffset({ x: panStartRef.current.ox - dx, y: panStartRef.current.oy - dy });
  }, []);

  const handlePointerUp = useCallback(() => {
    panStartRef.current = null;
  }, []);

  // Draw map + radius + dots
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || mapSize.w < 10 || mapSize.h < 10) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const { w, h } = mapSize;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    const { x: tileX, y: tileY } = latLngToTile(effectiveCenter.lat, effectiveCenter.lng, zoom);
    const centerTileX = Math.floor(tileX);
    const centerTileY = Math.floor(tileY);
    const offsetX = (tileX - centerTileX) * 256;
    const offsetY = (tileY - centerTileY) * 256;

    const drawOverlay = () => {
      // Soft dim only *outside* the radar circle so the center stays clear.
      if (!isLight) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.rect(0, 0, w, h);
        ctx.arc(w / 2, h / 2, Math.min(radiusPx, Math.min(w, h) / 2 - 4), 0, Math.PI * 2, true);
        ctx.fill('evenodd');
        ctx.restore();
      }

      const r = Math.min(radiusPx, Math.min(w, h) / 2 - 4);

      // Radius disc + dashed border
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${meta.accentRgb},${isLight ? 0.08 : 0.14})`;
      ctx.fill();
      ctx.strokeStyle = `rgba(${meta.accentRgb},${isLight ? 0.45 : 0.6})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Dots
      dots.forEach(dot => {
        const dTile = latLngToTile(dot.latitude, dot.longitude, zoom);
        const px = w / 2 + (dTile.x - tileX) * 256;
        const py = h / 2 + (dTile.y - tileY) * 256;
        if (px < -20 || px > w + 20 || py < -20 || py > h + 20) return;

        const dist = haversineKm(baseLat, baseLng, dot.latitude, dot.longitude);
        const inRadius = dist <= localKm;
        const matching = isDotMatching(dot);
        const highlight = inRadius && matching;

        if (highlight) {
          ctx.beginPath();
          ctx.arc(px, py, 10, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${meta.accentRgb},0.25)`;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(px, py, highlight ? 5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = highlight
          ? meta.accent
          : inRadius
            ? (isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.55)')
            : (isLight ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.28)');
        ctx.fill();
        if (highlight) {
          ctx.strokeStyle = isLight ? '#fff' : 'rgba(255,255,255,0.7)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      // ── Radar center stack (high contrast) ────────────────────────────
      // Outer pulse ring
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 18, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${meta.accentRgb},0.45)`;
      ctx.lineWidth = 3;
      ctx.stroke();

      // White halo
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 12, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.fill();

      // Blue dot
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 7, 0, Math.PI * 2);
      ctx.fillStyle = meta.accent;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    };

    // Background
    ctx.fillStyle = isLight ? '#f1f5f9' : '#0a0a0b';
    ctx.fillRect(0, 0, w, h);

    if (!isLight) {
      ctx.strokeStyle = 'rgba(59,130,246,0.08)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < w; i += 40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
      for (let j = 0; j < h; j += 40) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(w, j); ctx.stroke(); }
    }

    const tilesX = Math.ceil(w / 256) + 2;
    const tilesY = Math.ceil(h / 256) + 2;
    const startDx = -Math.ceil(tilesX / 2);
    const startDy = -Math.ceil(tilesY / 2);

    for (let dx = startDx; dx < startDx + tilesX; dx++) {
      for (let dy = startDy; dy < startDy + tilesY; dy++) {
        const tx = centerTileX + dx;
        const ty = centerTileY + dy;
        const key = `${tx}-${ty}-${zoom}`;

        const drawSingleTile = (img: HTMLImageElement) => {
          const drawX = w / 2 - offsetX + dx * 256;
          const drawY = h / 2 - offsetY + dy * 256;
          ctx.drawImage(img, drawX, drawY, 256, 256);
          drawOverlay();
        };

        if (TILE_CACHE[key]) {
          drawSingleTile(TILE_CACHE[key]);
        } else {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            TILE_CACHE[key] = img;
            drawSingleTile(img);
          };
          img.onerror = () => { /* keep going — other tiles still draw */ };
          const wrappedX = (tx + (1 << zoom)) % (1 << zoom);
          if (ty >= 0 && ty < (1 << zoom)) {
            img.src = tileUrl(wrappedX, ty, zoom);
          }
        }
      }
    }

    // Always draw overlay once up front so center is visible even while tiles load
    drawOverlay();
  }, [effectiveCenter, zoom, radiusPx, isLight, mapSize, dots, localKm, baseLat, baseLng, meta, isDotMatching]);

  const handleKmSelect = useCallback((km: number) => {
    triggerHaptic('light');
    setLocalKm(km);
  }, []);

  // ─── Render ──────────────────────────────────────────────────────────────
  const categoryButtons = useMemo(() => [
    { id: 'property' as const, icon: Building2, label: 'Properties' },
    { id: 'motorcycle' as const, icon: Bike, label: 'Motorcycles' },
    { id: 'bicycle' as const, icon: Trophy, label: 'Bicycles' },
    { id: 'services' as const, icon: Wrench, label: mode === 'owner' ? 'People' : 'Workers' },
  ], [mode]);

  return (
    <motion.div
      className={cn(
        "relative w-full h-full flex flex-col bg-background overflow-hidden",
      )}
      initial={isEmbedded ? false : { opacity: 0 }}
      animate={isEmbedded ? undefined : { opacity: 1 }}
      exit={isEmbedded ? undefined : { opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      style={{ contain: 'layout paint' }}
    >
      {/* ── Top utility row: Back (left) + Refresh (right). Location lives inside the map. ── */}
      {!isEmbedded && (
        <div className="shrink-0 w-full flex items-center justify-between px-4 pt-2 pb-1 gap-2">
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => { triggerHaptic('light'); onBack(); }}
            aria-label="Go back"
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center border backdrop-blur-xl transition-colors duration-150",
              isLight
                ? "bg-white/80 border-black/10 text-foreground shadow-sm"
                : "bg-white/10 border-white/15 text-white shadow-lg"
            )}
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={2.25} />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleRefresh}
            disabled={fetchingDots}
            aria-label="Refresh nearby"
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center border backdrop-blur-xl transition-colors duration-150",
              isLight
                ? "bg-white/80 border-black/10 text-foreground shadow-sm"
                : "bg-white/10 border-white/15 text-white shadow-lg"
            )}
          >
            <RefreshCw className={cn("w-4.5 h-4.5", fetchingDots && "animate-spin")} />
          </motion.button>
        </div>
      )}

      {/* ── Square radar module ─────────────────────────────────────────── */}
      <div className="shrink-0 w-full flex justify-center px-4 pt-1">
        <div
          className="relative w-full"
          style={{
            maxWidth: 'min(92vw, 360px)',
            maxHeight: '46svh',
            aspectRatio: '1 / 1',
          }}
        >
          <div
            ref={containerRef}
            className={cn(
              "absolute inset-0 rounded-[2rem] overflow-hidden border shadow-xl",
              isLight ? "border-black/10 bg-white" : "border-white/10 bg-[#0a0a0b]"
            )}
            style={{ touchAction: 'none', cursor: 'grab' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} className="block" />

            {/* Floating location-detect button (bottom-right of map) */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.stopPropagation(); detectLocation(); }}
              disabled={detecting}
              aria-label="Detect my location"
              className={cn(
                "absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center border backdrop-blur-xl transition-colors duration-150 shadow-lg",
                detected
                  ? "text-white"
                  : isLight ? "bg-white/85 border-black/10 text-foreground/70" : "bg-black/55 border-white/15 text-white/70"
              )}
              style={detected ? { background: meta.accent, borderColor: 'rgba(255,255,255,0.25)' } : undefined}
            >
              <Navigation className={cn("w-4 h-4", detecting && "animate-spin")} />
            </motion.button>

            {/* Empty-state toast */}
            {!fetchingDots && dots.length === 0 && (
              <div
                className={cn(
                  "absolute left-1/2 -translate-x-1/2 bottom-3 px-3 py-1.5 rounded-full text-[10px] font-semibold backdrop-blur-xl",
                  isLight ? "bg-white/85 text-black/70 border border-black/10" : "bg-black/60 text-white/90 border border-white/10",
                )}
              >
                No one nearby — tap ↻ to refresh
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Compact category icon pills ─────────────────────────────────── */}
      <div className="shrink-0 w-full flex justify-center px-4 pt-3">
        <div
          className={cn(
            "flex items-center gap-1.5 p-1 rounded-full border backdrop-blur-xl",
            isLight ? "bg-white/70 border-black/5" : "bg-white/5 border-white/10"
          )}
        >
          {categoryButtons.map(cat => {
            const isActive = category === cat.id;
            const catMeta = CATEGORY_META[cat.id] || CATEGORY_META.property;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  triggerHaptic('light');
                  onCategoryChange?.(cat.id as QuickFilterCategory);
                }}
                aria-label={cat.label}
                title={cat.label}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-150",
                  !isActive && (isLight ? "text-foreground/60 hover:bg-black/5" : "text-white/55 hover:bg-white/10"),
                )}
                style={isActive ? {
                  background: catMeta.accent,
                  color: '#fff',
                  boxShadow: `0 4px 14px rgba(${catMeta.accentRgb},0.35)`,
                } : undefined}
              >
                <cat.icon className="w-4.5 h-4.5" strokeWidth={2.25} />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Fast KM preset pills ────────────────────────────────────────── */}
      <div className="shrink-0 w-full flex justify-center px-4 pt-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full">
          {KM_PRESETS.map(km => {
            const isActive = localKm === km;
            return (
              <button
                key={km}
                onClick={() => handleKmSelect(km)}
                className={cn(
                  "shrink-0 h-9 px-3.5 rounded-full text-xs font-semibold tabular-nums transition-colors duration-150 border",
                  isActive
                    ? "text-white border-transparent"
                    : isLight
                      ? "bg-white/70 border-black/10 text-foreground/70 hover:bg-white"
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10",
                )}
                style={isActive ? {
                  background: meta.accent,
                  boxShadow: `0 3px 12px rgba(${meta.accentRgb},0.35)`,
                } : undefined}
              >
                {km} km
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Start Swiping CTA ───────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex items-end justify-center px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { triggerHaptic('medium'); onStartSwiping(); }}
          className="relative w-full max-w-[360px] h-[52px] rounded-2xl font-semibold text-sm uppercase tracking-wider flex items-center justify-center gap-2 overflow-hidden transition-all active:scale-[0.98]"
          style={{
            background: `linear-gradient(135deg, ${meta.accent}, ${meta.accent}dd)`,
            color: '#fff',
            boxShadow: `0 6px 22px rgba(${meta.accentRgb},0.35), inset 0 1px 0 rgba(255,255,255,0.2)`,
          }}
        >
          <Zap className="w-4 h-4" style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.5))' }} />
          <span>Start Swiping</span>
          {dotCount > 0 && (
            <span className="text-[11px] opacity-80 font-medium normal-case tracking-normal">
              · {dotCount} nearby
            </span>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
});

DiscoveryMapView.displayName = 'DiscoveryMapView';
