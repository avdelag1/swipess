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
import { ChevronLeft, Navigation, Zap, RefreshCw, Building2, Bike, Trophy, Wrench, ArrowLeft, X } from 'lucide-react';
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

// ─── SLIDER CONSTANTS ──────────────────────────────────────────────────────────
const MIN_KM = 1;
const MAX_KM = 100;
const SLIDER_TRACK_H = 6;
const THUMB_SIZE = 28;

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
  const sliderRef = useRef<HTMLDivElement>(null);

  // Interaction State
  const [selectedDotId, setSelectedDotId] = useState<string | null>(null);
  const selectedDot = useMemo(() => dots.find(d => d.id === selectedDotId), [dots, selectedDotId]);

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

  const [scanTick, setScanTick] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(() => {
    triggerHaptic('medium');
    setIsRefreshing(true);
    setScanTick(t => t + 1);
    setRefreshTick(t => t + 1);
    setScanPulse(p => p + 1);
    setSelectedDotId(null);
    setTimeout(() => setIsRefreshing(false), 2000);
  }, []);

  useEffect(() => {
     handleRefresh();
  }, [category]);

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

  // ─── Fetch ALL discoverable dots (listings + profiles) ───────────────────
  // User intent: show EVERY listing / user in the app on the map regardless of
  // the currently selected category. Dots matching the active category are
  // drawn with the category accent; everything else renders as a neutral dot
  // so the user can still see the density of available users nearby.
  const [refreshTick, setRefreshTick] = useState(0);
  const [fetchingDots, setFetchingDots] = useState(false);

  const fetchDots = useCallback(async () => {
    if (!user?.id) return;
    setFetchingDots(true);
    try {
      const merged: ListingDot[] = [];

      // Demo/Ghost dots for empty state (centers around Tulum)
      const GHOST_DOTS: ListingDot[] = [
        { id: 'ghost_1', latitude: 20.2114 + 0.005, longitude: -87.4654 + 0.003, category: 'property', kind: 'listing' },
        { id: 'ghost_2', latitude: 20.2114 - 0.008, longitude: -87.4654 - 0.004, category: 'motorcycle', kind: 'listing' },
        { id: 'ghost_3', latitude: 20.2114 + 0.012, longitude: -87.4654 - 0.009, category: 'bicycle', kind: 'listing' },
        { id: 'ghost_4', latitude: 20.2114 - 0.003, longitude: -87.4654 + 0.011, category: 'services', kind: 'listing' },
        { id: 'ghost_5', latitude: 20.2114 + 0.015, longitude: -87.4654 + 0.012, category: 'property', kind: 'listing' },
      ];

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

      // Merge ghost dots if results are thin
      if (merged.length < 5) {
        merged.push(...GHOST_DOTS);
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

  const [scanPulse, setScanPulse] = useState(0);


  // Trigger scan animation when category changes
  useEffect(() => {
    setScanPulse(p => p + 1);
    setSelectedDotId(null);
  }, [category]);

  // Normalize the selected category once (DB uses "worker" instead of "services")
  const selectedCategoryDb = (category === 'services' || category === 'worker') ? 'worker' : category;

  // A dot is considered a "match" if it's within the current km radius AND
  // (in client mode) its listing category matches the active filter, OR (in
  // owner mode) it's a profile. Profiles always count as a match since the
  // owner is surfacing people regardless of intent.
  const isDotMatching = useCallback(
    (d: ListingDot) => {
      const dbCat = (category === 'services' || category === 'worker') ? 'worker' : category;
      if (mode === 'owner') {
        if (d.kind !== 'profile') return false;
        // In owner mode, we match if the client has the selected category in their interests or intentions
        const interests = [...(d.interest_categories || []), ...(d.intentions || [])].map(i => i.toLowerCase());
        return interests.includes(dbCat.toLowerCase()) || interests.includes(category.toLowerCase());
      }
      if (d.kind === 'profile') return false;
      return (d.category || '').toLowerCase() === dbCat.toLowerCase();
    },
    [category, mode]
  );

  // Count matching dots within the current radius — used for the badge and
  // the "N found" label on the Start Swiping button.
  useEffect(() => {
    if (!baseLat || !baseLng) { setDotCount(0); return; }
    const count = dots.filter(d =>
      isDotMatching(d) && haversineKm(baseLat, baseLng, d.latitude, d.longitude) <= localKm,
    ).length;
    setDotCount(count);
  }, [dots, localKm, baseLat, baseLng, isDotMatching]);

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

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    // Check if it was a tap instead of a pan
    if (panStartRef.current) {
      const dx = Math.abs(e.clientX - panStartRef.current.x);
      const dy = Math.abs(e.clientY - panStartRef.current.y);
      if (dx < 5 && dy < 5) {
        // It's a tap! Look for a dot.
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const px = e.clientX - rect.left;
          const py = e.clientY - rect.top;
          
          // Find closest matching dot within 24px hit area
          let closestDist = 24;
          let foundId = null;
          
          const { x: curTileX, y: curTileY } = latLngToTile(effectiveCenter.lat, effectiveCenter.lng, zoom);

          dots.forEach(dot => {
            if (!isDotMatching(dot)) return;
            const distKm = haversineKm(baseLat, baseLng, dot.latitude, dot.longitude);
            if (distKm > localKm) return;

            const dTile = latLngToTile(dot.latitude, dot.longitude, zoom);
            const dpx = mapSize.w / 2 + (dTile.x - curTileX) * 256;
            const dpy = mapSize.h / 2 + (dTile.y - curTileY) * 256;
            
            const tapDist = Math.sqrt((px - dpx)**2 + (py - dpy)**2);
            if (tapDist < closestDist) {
              closestDist = tapDist;
              foundId = dot.id;
            }
          });
          
          if (foundId) {
            triggerHaptic('medium');
            setSelectedDotId(foundId);
          } else {
            setSelectedDotId(null);
          }
        }
      }
    }

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
        
        const onFinish = () => {
          loaded++;
          if (loaded >= total) {
            if (!isLight) {
              ctx.fillStyle = 'rgba(0,0,0,0.55)';
              ctx.fillRect(0, 0, w, h);
            }

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

            dots.forEach(dot => {
              const dTile = latLngToTile(dot.latitude, dot.longitude, zoom);
              const px = w / 2 + (dTile.x - tileX) * 256;
              const py = h / 2 + (dTile.y - tileY) * 256;
              if (px < -20 || px > w + 20 || py < -20 || py > h + 20) return;

              const dist = haversineKm(baseLat, baseLng, dot.latitude, dot.longitude);
              const inRadius = dist <= localKm;
              const matching = isDotMatching(dot);
              const isSelected = dot.id === selectedDotId;
              const highlight = inRadius && matching;

              if (highlight || isSelected) {
                ctx.beginPath();
                ctx.arc(px, py, isSelected ? 14 : 10, 0, Math.PI * 2);
                ctx.fillStyle = isSelected ? `rgba(${meta.accentRgb},0.4)` : `rgba(${meta.accentRgb},0.25)`;
                ctx.fill();
                if (isSelected) {
                   ctx.strokeStyle = meta.accent;
                   ctx.lineWidth = 2;
                   ctx.stroke();
                }
              }
              ctx.beginPath();
              ctx.arc(px, py, (highlight || isSelected) ? 5 : 3, 0, Math.PI * 2);
              ctx.fillStyle = (highlight || isSelected)
                ? meta.accent
                : inRadius
                  ? (isLight ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.45)')
                  : (isLight ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.2)');
              ctx.fill();
              if (highlight || isSelected) {
                ctx.strokeStyle = isLight ? '#fff' : 'rgba(255,255,255,0.6)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
              }
            });

            ctx.beginPath();
            ctx.arc(w / 2, h / 2, 7, 0, Math.PI * 2);
            ctx.fillStyle = meta.accent;
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(w / 2, h / 2, 14, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(${meta.accentRgb},0.35)`;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        };

        img.onload = () => {
          const drawX = w / 2 - offsetX + dx * 256;
          const drawY = h / 2 - offsetY + dy * 256;
          ctx.drawImage(img, drawX, drawY, 256, 256);
          onFinish();
        };
        img.onerror = onFinish;

        const wrappedX = (centerTileX + dx + (1 << zoom)) % (1 << zoom);
        const wrappedY = centerTileY + dy;
        if (wrappedY >= 0 && wrappedY < (1 << zoom)) {
          img.src = tileUrl(wrappedX, wrappedY, zoom);
        } else {
          onFinish();
        }
      }
    }
  }, [effectiveCenter, zoom, radiusPx, isLight, mapSize, dots, localKm, baseLat, baseLng, meta, isDotMatching]);

  // ─── Bubble drag logic ───────────────
  const isDraggingBubble = useRef(false);
  const bubbleStartRef = useRef<{ clientX: number; startKm: number } | null>(null);

  const handleBubblePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    isDraggingBubble.current = true;
    bubbleStartRef.current = { clientX: e.clientX, startKm: localKm };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    triggerHaptic('light');
  }, [localKm]);

  const handleBubblePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDraggingBubble.current || !bubbleStartRef.current) return;
    e.stopPropagation();
    const mpp = (156543.03392 * Math.cos((effectiveCenter.lat * Math.PI) / 180)) / Math.pow(2, zoom);
    const dxPx = e.clientX - bubbleStartRef.current.clientX;
    const dxKm = (dxPx * mpp) / 1000;
    const nextKm = Math.max(MIN_KM, Math.min(MAX_KM, Math.round(bubbleStartRef.current.startKm + dxKm)));
    if (nextKm !== localKm) setLocalKm(nextKm);
  }, [effectiveCenter.lat, zoom, localKm]);

  const handleBubblePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDraggingBubble.current) return;
    isDraggingBubble.current = false;
    bubbleStartRef.current = null;
    e.stopPropagation();
    triggerHaptic('light');
  }, []);

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
      className={cn(
        "flex flex-col overflow-hidden bg-background relative",
        isEmbedded ? "w-full h-full" : "fixed inset-0 z-[10000]"
      )}
      initial={isEmbedded ? false : { opacity: 0, scale: 0.95 }}
      animate={isEmbedded ? false : { opacity: 1, scale: 1 }}
      exit={isEmbedded ? false : { opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* 📡 SENTINEL RADAR SWEEP EFFECT */}
      <AnimatePresence>
        {isRefreshing && (
          <motion.div
            key="radar-sweep"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 pointer-events-none overflow-hidden"
          >
             <div 
               className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vmax] h-[200vmax]"
               style={{
                 background: `conic-gradient(from 0deg, rgba(${meta.accentRgb}, 0.2) 0deg, transparent 90deg)`,
                 animation: 'radar-rotate 2s linear infinite',
                 opacity: 0.4,
               }}
             />
             <style>{`
               @keyframes radar-rotate {
                 from { transform: translate(-50%, -50%) rotate(0deg); }
                 to { transform: translate(-50%, -50%) rotate(360deg); }
               }
             `}</style>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header: Back Button + Quick Categories ───────────────────── */}
      {!isEmbedded && (
        <div className="absolute top-[calc(env(safe-area-inset-top,0px)+12px)] left-4 right-4 z-[10001] flex items-center gap-3">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => { triggerHaptic('light'); onBack(); }}
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center active:scale-95 transition-all backdrop-blur-xl border border-white/10",
            isLight ? "bg-white/80 text-black/80 shadow-md" : "bg-black/60 text-white shadow-2xl",
          )}
        >
          <ArrowLeft className="w-6 h-6" strokeWidth={2.5} />
        </motion.button>

        <div className={cn(
          "flex-1 flex bg-muted/20 p-1 rounded-[1.4rem] backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden",
          isLight ? "bg-white/70" : "bg-black/40"
        )}>
           {[
             { id: 'property', icon: Building2, label: 'Properties' },
             { id: 'motorcycle', icon: Bike, label: 'Motorcycles' },
             { id: 'bicycle', icon: Trophy, label: 'Bicycles' },
             { id: 'services', icon: Wrench, label: 'Workers' }
           ].map((cat) => {
             const isActive = category === cat.id;
             const catMeta = CATEGORY_META[cat.id] || CATEGORY_META['property'];
             
             return (
               <button
                 key={cat.id}
                 onClick={() => { 
                   triggerHaptic('medium'); 
                   if (onCategoryChange) onCategoryChange(cat.id as QuickFilterCategory);
                 }}
                 title={`Switch to ${cat.label} radar`}
                 className={cn(
                   "flex-1 h-10 flex items-center justify-center rounded-xl transition-all relative overflow-hidden",
                   isActive ? "" : "text-muted-foreground hover:bg-muted/40"
                 )}
                 style={isActive ? {
                   background: catMeta.accent,
                   color: '#fff',
                   boxShadow: `0 4px 12px rgba(${catMeta.accentRgb},0.4)`
                 } : {}}
               >
                 <cat.icon className="w-5 h-5" />
                 {isActive && (
                   <motion.div 
                     layoutId="map-cat-active"
                     className="absolute inset-0 bg-white/10"
                     initial={false}
                   />
                 )}
               </button>
             );
           })}
        </div>

        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          onClick={handleDetectLocation}
          disabled={detecting}
          className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center active:scale-95 transition-all backdrop-blur-xl border border-white/10 ml-auto",
            detected
              ? "bg-white/10 text-white shadow-lg"
              : isLight
                ? "bg-white/80 text-black/60 shadow-md"
                : "bg-black/60 text-white/60 shadow-2xl"
          )}
          style={detected ? { backgroundColor: meta.accent, borderColor: 'rgba(255,255,255,0.2)', color: '#fff' } : {}}
        >
          <Navigation className={cn("w-6 h-6", detecting && "animate-spin")} />
        </motion.button>
      </div>
      )}

      {/* ── LEFT HUD: Radius Selector ───────────────────────────────── */}
      <motion.div
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-[10001] flex flex-col gap-3"
      >
        <div className={cn(
          "w-14 p-2 rounded-3xl flex flex-col gap-2 backdrop-blur-2xl border border-white/10 shadow-2xl",
          isLight ? "bg-white/70" : "bg-black/40"
        )}>
           <div className="flex flex-col items-center py-2 mb-1">
             <span className="text-[10px] font-black" style={{ color: meta.accent }}>{localKm}</span>
             <span className="text-[6px] font-bold opacity-40 uppercase">KM</span>
           </div>
           {[1, 5, 10, 25, 50, 100].map((km) => (
              <button
                key={km}
                onClick={() => {
                  triggerHaptic('light');
                  setLocalKm(km);
                }}
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black transition-all",
                  localKm === km 
                    ? "bg-primary text-white shadow-lg" 
                    : "text-muted-foreground hover:bg-muted/40"
                )}
                style={localKm === km ? { backgroundColor: meta.accent } : {}}
              >
                {km}
              </button>
            ))}
        </div>
      </motion.div>

      {/* ── RIGHT HUD: Category Selector ────────────────────────────── */}
      <motion.div
        initial={{ x: 60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-[10001] flex flex-col gap-3"
      >
        <div className={cn(
          "w-14 p-2 rounded-3xl flex flex-col gap-2 backdrop-blur-2xl border border-white/10 shadow-2xl",
          isLight ? "bg-white/70" : "bg-black/40"
        )}>
           {[
             { id: 'property', icon: Building2 },
             { id: 'motorcycle', icon: Bike },
             { id: 'bicycle', icon: Trophy },
             { id: 'services', icon: Wrench }
           ].map((cat) => {
             const isActive = category === cat.id;
             const catMeta = CATEGORY_META[cat.id] || CATEGORY_META['property'];
             
             return (
               <button
                 key={cat.id}
                 onClick={() => { 
                   triggerHaptic('medium'); 
                   if (onCategoryChange) onCategoryChange(cat.id as QuickFilterCategory);
                 }}
                 className={cn(
                   "w-10 h-10 flex items-center justify-center rounded-xl transition-all relative overflow-hidden",
                   isActive ? "text-white shadow-lg" : "text-muted-foreground hover:bg-muted/40"
                 )}
                 style={isActive ? { background: catMeta.accent } : {}}
               >
                 <cat.icon className="w-5 h-5" />
               </button>
             );
           })}
        </div>
      </motion.div>

      {/* ── Refresh/GPS Buttons for Embedded mode ─────────────────────── */}
      {isEmbedded && (
        <div className="absolute top-4 right-4 z-[10001] flex flex-col gap-3">
          <motion.button
            onClick={handleRefresh}
            disabled={fetchingDots}
            className={cn(
              "w-11 h-11 rounded-[1.25rem] flex items-center justify-center active:scale-90 transition-all backdrop-blur-xl border border-white/10",
              isLight ? "bg-white/80 text-black/70 shadow-md" : "bg-black/60 text-white shadow-lg",
            )}
          >
            <RefreshCw className={cn("w-4.5 h-4.5", fetchingDots && "animate-spin")} />
          </motion.button>
          <motion.button
            onClick={handleDetectLocation}
            disabled={detecting}
            className={cn(
              "w-11 h-11 rounded-[1.25rem] flex items-center justify-center active:scale-95 transition-all backdrop-blur-xl border border-white/10",
              detected ? "bg-primary text-white" : (isLight ? "bg-white/80 text-black/60" : "bg-black/60 text-white/60"),
            )}
            style={detected ? { backgroundColor: meta.accent } : {}}
          >
            <Navigation className={cn("w-5 h-5", detecting && "animate-spin")} />
          </motion.button>
        </div>
      )}

      {/* ── Refresh Button — sits below GPS, re-fetches every dot (Only if NOT embedded) ───── */}
      {!isEmbedded && (
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          onClick={handleRefresh}
          disabled={fetchingDots}
          aria-label="Refresh nearby users"
          className={cn(
            "absolute top-[calc(env(safe-area-inset-top,0px)+72px)] right-4 z-[10001] w-12 h-12 rounded-2xl flex items-center justify-center active:scale-90 transition-all backdrop-blur-xl border border-white/10",
            isLight ? "bg-white/80 text-black/70 shadow-md" : "bg-black/60 text-white shadow-lg",
          )}
          style={{ boxShadow: `0 0 18px rgba(${meta.accentRgb},0.3)` }}
        >
          <RefreshCw className={cn("w-5 h-5", fetchingDots && "animate-spin")} />
        </motion.button>
      )}


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

        {/* Draggable bubble handle — drag to expand/shrink the km radius. */}
        <div
          role="slider"
          aria-label="Radius in km"
          aria-valuemin={MIN_KM}
          aria-valuemax={MAX_KM}
          aria-valuenow={localKm}
          onPointerDown={handleBubblePointerDown}
          onPointerMove={handleBubblePointerMove}
          onPointerUp={handleBubblePointerUp}
          onPointerCancel={handleBubblePointerUp}
          className="absolute flex items-center justify-center rounded-full select-none touch-none"
          style={{
            width: 36,
            height: 36,
            left: mapSize.w / 2 + Math.min(radiusPx, Math.min(mapSize.w, mapSize.h) / 2 - 4) - 18,
            top: mapSize.h / 2 - 18,
            background: `radial-gradient(circle at 35% 30%, #fff 0%, ${meta.accent} 100%)`,
            boxShadow: `0 4px 14px rgba(${meta.accentRgb},0.55), 0 0 0 2px rgba(255,255,255,0.7)`,
            cursor: 'ew-resize',
            zIndex: 10001,
          }}
        >
          <span
            className="block rounded-full"
            style={{ width: 8, height: 8, background: '#fff' }}
          />
        </div>

        {/* Empty-state toast when there are no dots at all. */}
        {!fetchingDots && dots.length === 0 && (
          <div
            className={cn(
              "absolute left-1/2 -translate-x-1/2 bottom-5 px-4 py-2 rounded-xl text-[11px] font-bold backdrop-blur-xl z-[10001]",
              isLight ? "bg-white/80 text-black/70 shadow-md" : "bg-black/60 text-white/90 shadow-lg",
            )}
          >
            No one nearby yet — tap ↻ to refresh or expand the radius.
          </div>
        )}

        {/* Scan Sonar Animation */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={`scan-${scanPulse}`}
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border-2 border-primary/40 pointer-events-none z-[10]"
          />
        </AnimatePresence>

        {/* ── DOT PREVIEW CARD ────────────────────────────────────────── */}
        <AnimatePresence>
          {selectedDot && (
            <motion.div
              initial={{ y: 100, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.95 }}
              className="absolute left-4 right-4 bottom-4 z-[10002] rounded-3xl p-4 overflow-hidden shadow-2xl"
              style={{
                background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(15,15,20,0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
               <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-muted/40 overflow-hidden flex-shrink-0 border border-white/10">
                    <img 
                      src={selectedDot.kind === 'listing' ? '/placeholder-listing.jpg' : '/placeholder-profile.jpg'} 
                      className="w-full h-full object-cover" 
                      alt="Preview"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                       <h4 className="text-sm font-black uppercase tracking-tight truncate pr-2">
                         {selectedDot.kind === 'listing' ? 'Verified Listing' : 'Active Profile'}
                       </h4>
                       <span className="text-[10px] font-black uppercase text-primary">
                         {haversineKm(baseLat, baseLng, selectedDot.latitude, selectedDot.longitude).toFixed(1)}km
                       </span>
                    </div>
                    <p className="text-[11px] font-bold opacity-60 uppercase mb-3 line-clamp-1 italic">
                      {selectedDot.kind === 'profile' ? (selectedDot.intentions?.[0] || 'Discovery Profile') : (selectedDot.category || 'General Listing')}
                    </p>
                    <button 
                      onClick={() => onStartSwiping()}
                      className="w-full h-9 rounded-xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all"
                    >
                      View Details
                    </button>
                  </div>
                  <button onClick={() => setSelectedDotId(null)} className="p-1 opacity-40">
                    <X className="w-4 h-4" />
                  </button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── BOTTOM PANEL: Finalized Start Scan ────────────────────────── */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 z-[10001] flex flex-col items-center pt-2 px-5",
          isEmbedded ? "pb-[calc(var(--bottom-nav-height)+var(--safe-bottom)+8px)]" : "pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]",
          isLight ? "bg-white/10" : "bg-black/5"
        )}
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <button
          onClick={() => onStartSwiping()}
          className="w-full max-w-sm h-14 rounded-3xl bg-primary text-white text-[12px] font-black uppercase tracking-[0.3em] active:scale-95 transition-all flex items-center justify-center gap-3"
          style={{ 
            background: meta.accent,
            boxShadow: `0 16px 32px rgba(${meta.accentRgb},0.4), inset 0 1px 0 rgba(255,255,255,0.3)`
          }}
        >
          <Zap className="w-5 h-5 fill-current" />
          Start {meta.label} Scan ({dotCount})
        </button>
      </div>
    </motion.div>
  );
});

DiscoveryMapView.displayName = 'DiscoveryMapView';
