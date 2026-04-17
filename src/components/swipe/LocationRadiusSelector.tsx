import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Navigation, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { triggerHaptic } from '@/utils/haptics';
import { useFilterStore } from '@/state/filterStore';

export interface LocationRadiusSelectorProps {
  radiusKm: number;
  onRadiusChange: (km: number) => void;
  onDetectLocation: () => void;
  detecting: boolean;
  detected: boolean;
  lat?: number | null;
  lng?: number | null;
}

const KM_PRESETS = [1, 5, 10, 25, 50, 100];



// Convert km to pixels at a given zoom level and latitude
const kmToPixels = (km: number, lat: number, zoom: number) => {
  const metersPerPixel = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
  return (km * 1000) / metersPerPixel;
};

// Calculate optimal zoom to fit radius in container
const getZoomForRadius = (km: number, lat: number, containerPx: number) => {
  for (let z = 16; z >= 2; z--) {
    const px = kmToPixels(km, lat, z);
    if (px * 2 < containerPx * 0.85) return z;
  }
  return 2;
};

// Tile URL
const tileUrl = (x: number, y: number, z: number) =>
  `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

// Convert lat/lng to tile coordinates
const latLngToTile = (lat: number, lng: number, zoom: number) => {
  const n = Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
};

// Convert pixel offset back to lat/lng delta
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
}: LocationRadiusSelectorProps) => {
  const [localKm, setLocalKm] = useState(radiusKm);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const activeCategory = useFilterStore((state) => state.activeCategory);

  // Pan state
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const velocityRef = useRef({ vx: 0, vy: 0 });
  const lastMoveRef = useRef({ x: 0, y: 0, t: 0 });
  const inertiaRef = useRef<number | null>(null);
  const [mapSize, setMapSize] = useState({ w: 300, h: 400 });

  const baseLat = lat ?? 20.2114;
  const baseLng = lng ?? -87.4654;

  // Effective center after pan offset
  const zoom = useMemo(() => getZoomForRadius(localKm, baseLat, Math.min(mapSize.w, mapSize.h)), [localKm, baseLat, mapSize]);
  
  const effectiveCenter = useMemo(() => {
    const { dLat, dLng } = pixelToLatLng(panOffset.x, panOffset.y, baseLat, zoom);
    return { lat: baseLat + dLat, lng: baseLng + dLng };
  }, [baseLat, baseLng, panOffset, zoom]);

  const radiusPx = useMemo(() => kmToPixels(localKm, effectiveCenter.lat, zoom), [localKm, effectiveCenter.lat, zoom]);

  useEffect(() => { setLocalKm(radiusKm); }, [radiusKm]);

  // Debounce radius update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localKm !== radiusKm) onRadiusChange(localKm);
    }, 200);
    return () => clearTimeout(timer);
  }, [localKm, radiusKm, onRadiusChange]);

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setMapSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

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
    // Inertia
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

  // Draw map tiles + radius circle
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

    // How many tiles needed to cover the canvas
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
            // Dark overlay
            if (!isLight) {
              ctx.fillStyle = 'rgba(0,0,0,0.5)';
              ctx.fillRect(0, 0, w, h);
            }
            // Radius circle
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
            // Center dot
            ctx.beginPath();
            ctx.arc(w / 2, h / 2, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#3b82f6';
            ctx.fill();
            ctx.strokeStyle = isLight ? '#fff' : '#fff';
            ctx.lineWidth = 2.5;
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

  // Scroll active pill into view
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const active = container.querySelector('[data-active="true"]') as HTMLElement;
    if (active) {
      active.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
    }
  }, [localKm]);

  return (
    <motion.div
      className="w-full flex h-[min(58dvh,460px)] flex-col relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Map Canvas — fills available space */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden rounded-[2rem] border border-border/30"
        style={{ touchAction: 'none', cursor: 'grab', minHeight: 320 }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%' }}
          className="block"
        />

        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(180deg,hsl(var(--background)/0.08)_0%,transparent_18%,transparent_72%,hsl(var(--background)/0.55)_100%)]" />



        {/* GPS Button — bottom right floating */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDetectLocation(); setPanOffset({ x: 0, y: 0 }); }}
          disabled={detecting}
          className={cn(
            "absolute bottom-3 right-3 z-10 w-10 h-10 rounded-full flex items-center justify-center border transition-all active:scale-90",
            detected
              ? "bg-primary border-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.4)]"
              : "bg-background/80 backdrop-blur-md border-border/50 text-muted-foreground"
          )}
        >
          <Navigation className={cn("w-4.5 h-4.5", detecting && "animate-spin")} />
        </button>

        {/* +/- zoom for radius — bottom left */}
        <div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); setLocalKm(Math.min(100, localKm + 5)); }}
            className="w-9 h-9 rounded-full bg-background/80 backdrop-blur-md border border-border/50 flex items-center justify-center active:scale-90 transition-transform"
          >
            <Plus className="w-4 h-4 text-foreground" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); triggerHaptic('light'); setLocalKm(Math.max(1, localKm - 5)); }}
            className="w-9 h-9 rounded-full bg-background/80 backdrop-blur-md border border-border/50 flex items-center justify-center active:scale-90 transition-transform"
          >
            <Minus className="w-4 h-4 text-foreground" />
          </button>
        </div>
      </div>

      {/* KM Pill Selector — horizontal snap-scroll */}
      <div className="pt-2.5 pb-1">
        <div
          ref={scrollContainerRef}
          className="flex gap-2 overflow-x-auto snap-x snap-mandatory scrollbar-none px-2"
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
                  "snap-center flex-shrink-0 h-9 min-w-[52px] px-3 rounded-full font-black text-xs tracking-tight transition-all active:scale-90 border",
                  isActive
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_14px_hsl(var(--primary)/0.35)]"
                    : "bg-muted/40 text-muted-foreground border-border/40 hover:bg-muted/60"
                )}
              >
                {km}<span className="text-[9px] opacity-60 ml-0.5">km</span>
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};
