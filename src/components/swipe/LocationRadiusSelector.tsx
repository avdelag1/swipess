import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Navigation, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { triggerHaptic } from '@/utils/haptics';
import type { QuickFilterCategory } from '@/types/filters';

export interface LocationRadiusSelectorProps {
  radiusKm: number;
  onRadiusChange: (km: number) => void;
  onDetectLocation: () => void;
  detecting: boolean;
  detected: boolean;
  lat?: number | null;
  lng?: number | null;
  onCategorySelect?: (cat: QuickFilterCategory) => void;
}

const KM_PRESETS = [1, 5, 10, 25, 50, 100];

const kmToPixels = (km: number, lat: number, zoom: number) => {
  const metersPerPixel = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
  return (km * 1000) / metersPerPixel;
};

const getZoomForRadius = (km: number, lat: number, containerPx: number) => {
  for (let z = 16; z >= 2; z--) {
    const px = kmToPixels(km, lat, z);
    if (px * 2 < containerPx * 0.85) return z;
  }
  return 2;
};

const tileUrl = (x: number, y: number, z: number) =>
  `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

const latLngToTile = (lat: number, lng: number, zoom: number) => {
  const n = Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
};

const pixelToLatLng = (dx: number, dy: number, lat: number, zoom: number) => {
  const metersPerPixel = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
  const dLng = (dx * metersPerPixel) / (111320 * Math.cos((lat * Math.PI) / 180));
  const dLat = -(dy * metersPerPixel) / 110574;
  return { dLat, dLng };
};

export const LocationRadiusSelector = ({
  radiusKm,
  onRadiusChange,
  onDetectLocation,
  detecting,
  detected,
  lat,
  lng,
  onCategorySelect: _onCategorySelect,
}: LocationRadiusSelectorProps) => {
  const [localKm, setLocalKm] = useState(radiusKm);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const velocityRef = useRef({ vx: 0, vy: 0 });
  const lastMoveRef = useRef({ x: 0, y: 0, t: 0 });
  const inertiaRef = useRef<number | null>(null);
  const [mapSize, setMapSize] = useState({ w: 300, h: 200 });

  const baseLat = lat ?? 20.2114;
  const baseLng = lng ?? -87.4654;

  const zoom = useMemo(() => getZoomForRadius(localKm, baseLat, Math.min(mapSize.w, mapSize.h)), [localKm, baseLat, mapSize]);

  const effectiveCenter = useMemo(() => {
    const { dLat, dLng } = pixelToLatLng(panOffset.x, panOffset.y, baseLat, zoom);
    return { lat: baseLat + dLat, lng: baseLng + dLng };
  }, [baseLat, baseLng, panOffset, zoom]);

  const radiusPx = useMemo(() => kmToPixels(localKm, effectiveCenter.lat, zoom), [localKm, effectiveCenter.lat, zoom]);

  useEffect(() => { setLocalKm(radiusKm); }, [radiusKm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localKm !== radiusKm) onRadiusChange(localKm);
    }, 200);
    return () => clearTimeout(timer);
  }, [localKm, radiusKm, onRadiusChange]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setMapSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

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
            if (!isLight) {
              ctx.fillStyle = 'rgba(0,0,0,0.5)';
              ctx.fillRect(0, 0, w, h);
            }
            const r = Math.min(radiusPx, Math.min(w, h) / 2 - 4);
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
            ctx.fillStyle = isLight ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.18)';
            ctx.fill();
            ctx.strokeStyle = isLight ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.6)';
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#3b82f6';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        };
        img.onerror = () => { loaded++; };
        img.src = tileUrl(centerTileX + dx, centerTileY + dy, zoom);
      }
    }
  }, [effectiveCenter, zoom, radiusPx, isLight, mapSize]);

  const handleKmSelect = useCallback((km: number) => {
    triggerHaptic('light');
    setLocalKm(km);
  }, []);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const active = container.querySelector('[data-active="true"]') as HTMLElement;
    if (active) {
      active.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
    }
  }, [localKm]);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {/* KM Pill Selector — TOP, swipe left/right */}
      <div
        ref={scrollContainerRef}
        className="flex gap-1.5 overflow-x-auto snap-x snap-mandatory scrollbar-none px-1"
        style={{ overscrollBehaviorX: 'contain', WebkitOverflowScrolling: 'touch' }}
      >
        {KM_PRESETS.map((km) => {
          const isActive = localKm === km;
          return (
            <button
              key={km}
              type="button"
              data-active={isActive}
              onClick={() => handleKmSelect(km)}
              className={cn(
                "snap-center flex-shrink-0 h-8 min-w-[48px] px-2.5 rounded-full font-black text-[11px] tracking-tight transition-all active:scale-90 border",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
                  : "bg-muted/40 text-muted-foreground border-border/40"
              )}
            >
              {km}<span className="text-[8px] opacity-60 ml-0.5">km</span>
            </button>
          );
        })}
      </div>

      {/* Map — BELOW pills, compact, fits viewport */}
      <motion.div
        ref={containerRef}
        className="w-full relative overflow-hidden rounded-2xl border border-border/30"
        style={{
          touchAction: 'none',
          cursor: 'grab',
          height: 'min(38dvh, 280px)',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25 }}
      >
        <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} className="block" />

        {/* GPS — bottom right */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDetectLocation(); setPanOffset({ x: 0, y: 0 }); }}
          disabled={detecting}
          className={cn(
            "absolute bottom-2 right-2 z-10 w-9 h-9 rounded-full flex items-center justify-center border transition-all active:scale-90",
            detected
              ? "bg-primary border-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
              : "bg-background/80 backdrop-blur-md border-border/50 text-muted-foreground"
          )}
        >
          <Navigation className={cn("w-4 h-4", detecting && "animate-spin")} />
        </button>

        {/* +/- zoom — bottom left */}
        <div className="absolute bottom-2 left-2 z-10 flex flex-col gap-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); setLocalKm(Math.min(100, localKm + 5)); }}
            className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-md border border-border/50 flex items-center justify-center active:scale-90"
          >
            <Plus className="w-3.5 h-3.5 text-foreground" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); setLocalKm(Math.max(1, localKm - 5)); }}
            className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-md border border-border/50 flex items-center justify-center active:scale-90"
          >
            <Minus className="w-3.5 h-3.5 text-foreground" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
