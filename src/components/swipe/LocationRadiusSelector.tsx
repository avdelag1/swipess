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
  variant?: 'full' | 'minimal';
}

const KM_PRESETS = [1, 5, 10, 25, 50, 100];
const TILE_CACHE: Record<string, HTMLImageElement> = {};

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
  onCategorySelect: _onCategorySelect,
  variant = 'full',
}: LocationRadiusSelectorProps) => {
  const [localKm, setLocalKm] = useState(radiusKm);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isLight = theme === 'light';
  
  // Pan state — no inertia. Pan follows the finger only.
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
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

  // 🚀 HIGH PERFORMANCE PROGRESSIVE DRAWING
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || mapSize.w < 10 || mapSize.h < 10) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const { w, h } = mapSize;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.scale(dpr, dpr);

    const { x: tileX, y: tileY } = latLngToTile(effectiveCenter.lat, effectiveCenter.lng, zoom);
    const centerTileX = Math.floor(tileX);
    const centerTileY = Math.floor(tileY);
    const offsetX = (tileX - centerTileX) * 256;
    const offsetY = (tileY - centerTileY) * 256;

    const drawOverlay = () => {
        // Radius disc + dashed border
        const r = Math.min(radiusPx, Math.min(w, h) / 2 - 4);

        ctx.beginPath();
        ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
        ctx.fillStyle = isLight ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.14)';
        ctx.fill();

        ctx.strokeStyle = isLight ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // ── Radar center stack (high contrast) ────────────────────
        // Outer pulse ring
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 18, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(59,130,246,0.45)';
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
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
    };

    // Initial fill + Radar Grid Fallback
    ctx.fillStyle = isLight ? '#f1f5f9' : '#0a0a0b';
    ctx.fillRect(0, 0, w, h);
    
    if (!isLight) {
        // Draw a subtle 'Radar Grid' so the map never looks 'broken' or blank
        ctx.strokeStyle = 'rgba(59,130,246,0.1)';
        ctx.lineWidth = 0.5;
        for(let i=0; i<w; i+=40) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); }
        for(let j=0; j<h; j+=40) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(w, j); ctx.stroke(); }
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
            img.src = tileUrl(tx, ty, zoom);
        }
      }
    }
    
    // Always draw overlay at least once
    drawOverlay();

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

  // Dynamic filter for dark mode OSM tiles
  const mapFilter = isLight ? 'none' : 'invert(0.9) hue-rotate(180deg) brightness(0.7) contrast(1.1)';

  if (variant === 'minimal') {
    return (
      <div className="w-full flex flex-col gap-2 pt-1 pb-1 relative">
        <div 
          ref={containerRef}
          className="w-full h-16 rounded-2xl overflow-hidden relative border border-white/10 glass-nano-texture shadow-lg group active:h-24 transition-all duration-300"
          style={{ touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <canvas 
            ref={canvasRef} 
            style={{ width: '100%', height: '100%', filter: mapFilter }} 
            className="block opacity-90 transition-opacity duration-500" 
          />
          
          <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                onClick={(e) => { e.stopPropagation(); onDetectLocation(); setPanOffset({ x: 0, y: 0 }); }}
                disabled={detecting}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95 bg-black/40 backdrop-blur-md border border-white/10 shadow-xl",
                  detected ? "text-primary" : "text-white/40"
                )}
              >
                <Navigation className={cn("w-3.5 h-3.5", detecting && "animate-spin")} />
              </button>
              <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-lg">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/90">
                  <span className="text-primary">{localKm}k</span> radius
                </span>
              </div>
            </div>
            
            <div 
              ref={scrollContainerRef}
              className="flex gap-1 overflow-x-auto scrollbar-none max-w-[140px] pointer-events-auto"
            >
              {KM_PRESETS.map((km) => {
                const isActive = localKm === km;
                return (
                  <button
                    key={km}
                    data-active={isActive}
                    onClick={() => handleKmSelect(km)}
                    className={cn(
                      "flex-shrink-0 h-7 px-2.5 rounded-lg text-[9px] font-black transition-all border",
                      isActive ? "bg-primary border-primary text-white" : "bg-black/40 backdrop-blur-md border-white/10 text-white/30"
                    )}
                  >
                    {km}k
                  </button>
                );
              })}
            </div>
          </div>

          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity">
             <input 
               type="range"
               min="1"
               max="100"
               value={localKm}
               onChange={(e) => setLocalKm(parseInt(e.target.value))}
               className="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-primary"
             />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="w-full h-full flex flex-col relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden rounded-[2.5rem] border border-white/10"
        style={{ touchAction: 'none', cursor: 'grab' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <canvas 
            ref={canvasRef} 
            style={{ width: '100%', height: '100%', filter: mapFilter }} 
            className="block opacity-90" 
        />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/10 via-transparent to-black/40" />

        <div className="absolute top-4 left-4 right-4 z-10">
           <div className="w-full flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDetectLocation(); setPanOffset({ x: 0, y: 0 }); }}
                  disabled={detecting}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border transition-all active:scale-90 shadow-2xl",
                    detected ? "bg-primary border-primary text-white" : "bg-black/60 backdrop-blur-xl border-white/10 text-white/40"
                  )}
                >
                  <Navigation className={cn("w-4 h-4", detecting && "animate-spin")} />
                </button>
                
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-2xl shadow-2xl">
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                      Scan Radius: <span className="text-primary">{localKm}km</span>
                   </span>
                </div>
              </div>

              {/* SLIDER DETECTOR ON TOP */}
              <div className="w-full px-2">
                 <input 
                   type="range"
                   min="1"
                   max="100"
                   value={localKm}
                   onChange={(e) => setLocalKm(parseInt(e.target.value))}
                   className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                 />
                 <div className="flex justify-between mt-1 px-0.5">
                    <span className="text-[8px] font-bold text-white/30">1KM</span>
                    <span className="text-[8px] font-bold text-white/30">100KM</span>
                 </div>
              </div>
           </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 z-10 flex gap-2">
           <div className="flex-1 flex gap-1.5 overflow-x-auto scrollbar-none bg-black/40 backdrop-blur-xl border border-white/10 p-1.5 rounded-2xl">
              {KM_PRESETS.map((km) => (
                <button
                  key={km}
                  onClick={() => handleKmSelect(km)}
                  className={cn(
                    "flex-shrink-0 h-9 min-w-[44px] rounded-xl text-[10px] font-black transition-all",
                    localKm === km ? "bg-primary text-white shadow-lg" : "text-white/40 hover:text-white"
                  )}
                >
                  {km}k
                </button>
              ))}
           </div>
           <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLocalKm(Math.min(100, localKm + 5)); }}
                className="w-9 h-9 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center active:scale-90"
              >
                <Plus className="w-3.5 h-3.5 text-white" />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLocalKm(Math.max(1, localKm - 5)); }}
                className="w-9 h-9 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center active:scale-90"
              >
                <Minus className="w-3.5 h-3.5 text-white" />
              </button>
           </div>
        </div>
      </div>
    </motion.div>
  );
};
