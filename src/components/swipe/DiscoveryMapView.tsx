/**
 * DISCOVERY MAP VIEW ÔÇö Post Quick-Filter, Pre-Swipe
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

// ÔöÇÔöÇÔöÇ Category display config ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
const CATEGORY_META: Record<string, { label: string; accent: string; accentRgb: string }> = {
  property:   { label: 'Properties',  accent: '#3b82f6', accentRgb: '59,130,246' },
  motorcycle: { label: 'Motorcycles', accent: '#f97316', accentRgb: '249,115,22' },
  bicycle:    { label: 'Bicycles',    accent: '#f43f5e', accentRgb: '244,63,94' },
  services:   { label: 'Workers',     accent: '#a855f7', accentRgb: '168,85,247' },
};

// ÔöÇÔöÇÔöÇ Map Math ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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
  `https://basemaps.cartocdn.com/light_all/${z}/${x}/${y}.png`;

// ÔöÇÔöÇÔöÇ Haversine distance ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ÔöÇÔöÇÔöÇ Types ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
interface ListingDot {
  id: string;
  latitude: number;
  longitude: number;
}

interface DiscoveryMapViewProps {
  category: QuickFilterCategory;
  onBack: () => void;
  onStartSwiping: () => void;
  mode?: 'client' | 'owner';
}

// ÔöÇÔöÇÔöÇ SLIDER CONSTANTS ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
const MIN_KM = 1;
const MAX_KM = 100;
const SLIDER_TRACK_H = 6;
const THUMB_SIZE = 28;

export const DiscoveryMapView = memo(({ category, onBack, onStartSwiping, mode = 'client' }: DiscoveryMapViewProps) => {
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

  // ÔöÇÔöÇÔöÇ Detect location ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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

  // ÔöÇÔöÇÔöÇ Fetch real listing/profile dots ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
  useEffect(() => {
    if (!user?.id) return;
    const fetchDots = async () => {
      try {
        if (mode === 'owner') {
          // Owner looking for clients
          const { data, error } = await supabase
            .from('profiles')
            .select('id, latitude, longitude')
            .not('latitude', 'is', null)
            .not('longitude', 'is', null)
            .neq('id', user.id)
            .limit(200);

          if (error) { logger.error('[DiscoveryMap] profile fetch error:', error); return; }
          if (data) setDots(data as ListingDot[]);
        } else {
          // Client looking for listings
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

          if (error) { logger.error('[DiscoveryMap] listing fetch error:', error); return; }
          if (data) setDots(data as ListingDot[]);
        }
      } catch (e) { logger.error('[DiscoveryMap] error:', e); }
    };
    fetchDots();
  }, [user?.id, category, mode]);

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

  // ÔöÇÔöÇÔöÇ Map rendering ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
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

    // 🚀 ULTRA-STABLE RENDERING: Draw Dots & Overlay IMMEDIATELY on bg fill 
    // to prevent clear-frame flicker while tiles load.
    const drawDotsAndOverlay = () => {
      // High-contrast awareness: Keep map clear in dark mode
      if (!isLight) {
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
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

        if (inRadius) {
          ctx.beginPath();
          ctx.arc(px, py, 11, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${meta.accentRgb},0.28)`;
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(px, py, inRadius ? 5.5 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = inRadius ? meta.accent : (isLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.2)');
        ctx.fill();
        if (inRadius) {
          ctx.strokeStyle = '#fff';
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
    };

    ctx.fillStyle = '#f8fafc'; // Force light background for map tiles always
    ctx.fillRect(0, 0, w, h);
    drawDotsAndOverlay();

    // Draw simple grid fallback before tiles
    ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for(let x=0; x<w; x+=50) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for(let y=0; y<h; y+=50) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

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
          if (loaded >= total) drawDotsAndOverlay();
        };
        img.onerror = (e) => { 
          console.error('[DiscoveryMap] Tile load error:', e);
          loaded++; 
          if (loaded >= total) drawDotsAndOverlay();
        };
        img.src = tileUrl(centerTileX + dx, centerTileY + dy, zoom);
      }
    }
    // Final dots draw even if tiles fail
    drawDotsAndOverlay();
  }, [effectiveCenter, zoom, radiusPx, isLight, mapSize, dots, localKm, baseLat, baseLng, meta]);

  // ÔöÇÔöÇÔöÇ Slider drag logic ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
  const isDraggingSlider = useRef(false);
  const sliderRectRef = useRef<DOMRect | null>(null);

  const updateSliderFromX = useCallback((clientX: number) => {
    const track = sliderRef.current;
    if (!track) return;
    
    if (!sliderRectRef.current) {
      sliderRectRef.current = track.getBoundingClientRect();
    }
    const rect = sliderRectRef.current;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const km = Math.round(MIN_KM + ratio * (MAX_KM - MIN_KM));
    setLocalKm(km);
  }, []);

  const handleSliderPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    isDraggingSlider.current = true;
    sliderRectRef.current = (e.currentTarget as HTMLElement).getBoundingClientRect();
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
    sliderRectRef.current = null;
    triggerHaptic('light');
  }, []);

  const sliderRatio = (localKm - MIN_KM) / (MAX_KM - MIN_KM);

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden bg-white">
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => { triggerHaptic('light'); onBack(); }}
        className={cn(
          "absolute top-[calc(env(safe-area-inset-top,0px)+12px)] left-4 z-[10001] flex items-center justify-center w-10 h-10 rounded-full",
          "transition-transform active:scale-95",
          "bg-[var(--hud-bg)] backdrop-blur-[32px] saturate-[210%] border border-[var(--hud-border)] text-[var(--hud-text)] shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
        )}
      >
        <ChevronLeft className="w-5 h-5" strokeWidth={3} style={{ color: 'var(--hud-text)' }} />
      </motion.button>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute top-[calc(env(safe-area-inset-top,0px)+12px)] left-1/2 -translate-x-1/2 z-[10001]"
      >
        <div
          className={cn(
            "px-6 h-10 rounded-full flex items-center gap-3",
            "bg-[var(--hud-bg)] backdrop-blur-[32px] saturate-[210%] border border-[var(--hud-border)] shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
          )}
        >
          <div
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ background: meta.accent, boxShadow: `0 0 12px ${meta.accent}` }}
          />
          <span className="text-[11px] font-black uppercase tracking-[0.25em]" style={{ color: 'var(--hud-text)' }}>
            {meta.label}
          </span>
          <div className="w-[1px] h-3 bg-current opacity-10 mx-1" />
          <span className="text-[11px] font-bold opacity-40 whitespace-nowrap" style={{ color: 'var(--hud-text)' }}>
            {dotCount} Nearby
          </span>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={() => { detectLocation(); }}
        disabled={detecting}
        className={cn(
          "absolute top-[calc(env(safe-area-inset-top,0px)+12px)] right-4 z-[10001] w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-all",
          "bg-[var(--hud-bg)] backdrop-blur-[32px] saturate-[210%] border border-[var(--hud-border)] text-[var(--hud-text)] shadow-[0_8px_32px_rgba(0,0,0,0.08)]"
        )}
      >
        <Navigation className={cn("w-5 h-5", detecting && "animate-spin")} style={detected ? { color: meta.accent } : { color: 'var(--hud-text)' }} strokeWidth={2.5} />
      </motion.button>

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
      </div>

      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "relative z-[10001] px-5 pt-6 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] flex flex-col gap-6",
          "bg-[var(--hud-bg)] backdrop-blur-[32px] border-t border-[var(--hud-border)] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]"
        )}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 whitespace-nowrap" style={{ color: 'var(--hud-text)' }}>
            Search Radius
          </span>
          <div className="flex items-center gap-1">
            <span className="text-2xl font-black tabular-nums" style={{ color: meta.accent }}>
              {localKm}
            </span>
            <span className={cn("text-xs font-bold mt-1 opacity-40")} style={{ color: 'var(--hud-text)' }}>km</span>
          </div>
        </div>

        <div className="relative w-full select-none" style={{ height: THUMB_SIZE + 12 }}>
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
            <div
              className="absolute left-0 right-0 rounded-full overflow-hidden"
              style={{
                top: '50%', transform: 'translateY(-50%)',
                height: SLIDER_TRACK_H,
                background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
              }}
            >
              <div
                className="absolute left-0 top-0 bottom-0 rounded-full"
                style={{
                  width: `${sliderRatio * 100}%`,
                  background: meta.accent,
                }}
              />
            </div>

            <div
              className="absolute rounded-full"
              style={{
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                top: '50%',
                left: `calc(${sliderRatio * 100}% - ${THUMB_SIZE / 2}px)`,
                transform: 'translateY(-50%)',
                background: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => { triggerHaptic('medium'); onStartSwiping(); }}
          className={cn(
            "relative w-full h-14 rounded-2xl font-black text-[13px] uppercase tracking-[0.25em] flex items-center justify-center gap-2.5 overflow-hidden",
          )}
          style={{
            background: meta.accent,
            color: '#fff',
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
    </div>
  );
});

DiscoveryMapView.displayName = 'DiscoveryMapView';

export default DiscoveryMapView;

