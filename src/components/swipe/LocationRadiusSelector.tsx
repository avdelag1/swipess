import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Navigation, Minus, Plus, Search, Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { triggerHaptic } from '@/utils/haptics';
import type { QuickFilterCategory } from '@/types/filters';

export interface RadarNode {
  id: string;
  lat: number;
  lng: number;
  label: string;
  category?: string;
  price?: string;
}

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
  nodes?: RadarNode[];
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

/**
 * 🛰️ ZENITH BOUNDLESS RADAR
 * Immersive, full-page technical discovery engine.
 */
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
  nodes = [],
}: LocationRadiusSelectorProps) => {
  const [localKm, setLocalKm] = useState(radiusKm);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const panStartRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const { theme, isLight } = useTheme();
  
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [mapSize, setMapSize] = useState({ w: 300, h: 400 });

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
    }, 450);
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
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 18, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(59,130,246,0.45)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
    };

    ctx.fillStyle = isLight ? '#f1f5f9' : '#0a0a0b';
    ctx.fillRect(0, 0, w, h);
    
    if (!isLight) {
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
    drawOverlay();
  }, [effectiveCenter, zoom, radiusPx, isLight, mapSize]);

  const handleKmSelect = useCallback((km: number) => {
    triggerHaptic('light');
    setLocalKm(km);
  }, []);

  const projectedNodes = useMemo(() => {
    if (!effectiveCenter.lat || !effectiveCenter.lng || nodes.length === 0) return [];
    const seenPos = new Set<string>();
    return nodes.map((node, idx) => {
      const dLat = node.lat - effectiveCenter.lat;
      const dLng = node.lng - effectiveCenter.lng;
      const xKm = dLng * 111 * Math.cos(effectiveCenter.lat * Math.PI / 180);
      const yKm = dLat * 111;
      const xPos = (xKm / localKm);
      const yPos = (yKm / localKm);
      let x = 50 + (xPos * 40);
      let y = 50 - (yPos * 40);
      const posKey = `${Math.round(x * 10)},${Math.round(y * 10)}`;
      if (seenPos.has(posKey)) {
        const angle = idx * 0.5;
        const radius = 2 + (idx * 0.1);
        x += Math.cos(angle) * radius;
        y += Math.sin(angle) * radius;
      }
      seenPos.add(posKey);
      return { ...node, x, y };
    }).filter(n => n.x > 2 && n.x < 98 && n.y > 2 && n.y < 98);
  }, [effectiveCenter, nodes, localKm]);

  const mapFilter = isLight ? 'none' : 'invert(0.9) hue-rotate(180deg) brightness(0.7) contrast(1.1)';

  if (variant === 'minimal') {
    return (
      <div className="w-full flex flex-col gap-2 pt-1 pb-1 relative">
        <div 
          ref={containerRef}
          className={cn(
            "w-full h-16 rounded-[2rem] overflow-hidden relative transition-all duration-500 cursor-pointer pointer-events-auto border",
            isLight ? "bg-black/[0.03] border-black/5" : "bg-white/[0.02] border-white/10 backdrop-blur-3xl"
          )}
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
          <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none z-10">
            <div className="flex items-center gap-3 pointer-events-auto">
              <button
                onClick={(e) => { e.stopPropagation(); onDetectLocation(); setPanOffset({ x: 0, y: 0 }); }}
                disabled={detecting}
                className={cn(
                  "w-10 h-10 flex items-center justify-center transition-all opacity-60 hover:opacity-100 active:scale-95",
                  detected ? "text-primary" : (isLight ? "text-black" : "text-white")
                )}
              >
                <Crosshair className={cn("w-5 h-5", detecting && "animate-spin")} />
              </button>
              <div className="px-1 py-1.5">
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-[0.2em]",
                  isLight ? "text-black/80" : "text-white"
                )}>
                  Scan <span className="text-primary italic">{localKm}KM</span>
                </span>
              </div>
            </div>
            <div 
              ref={scrollContainerRef}
              className="flex gap-1 overflow-x-auto scrollbar-none max-w-[140px] pointer-events-auto"
            >
              {KM_PRESETS.map((km) => (
                <button
                  key={km}
                  onClick={() => handleKmSelect(km)}
                  className={cn(
                    "h-9 px-4 rounded-xl text-[10px] font-black transition-all uppercase tracking-tighter flex-shrink-0",
                    localKm === km 
                      ? (isLight ? "bg-black text-white" : "bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.2)]") 
                      : (isLight ? "text-black/30" : "text-white/20")
                  )}
                >
                  {km}k
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="w-full h-full flex flex-col relative bg-transparent overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div
        ref={containerRef}
        className={cn(
          "flex-1 relative overflow-hidden rounded-[2.5rem] border",
          isLight ? "bg-white border-black/10" : "bg-black border-white/10"
        )}
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
        
        {/* technical overlays */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          {[...Array(6)].map((_, i) => (
            <div
              key={`grid-${i}`}
              className="absolute border border-primary/20 rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ width: `${(i + 1) * 35}%`, aspectRatio: '1/1' }}
            />
          ))}
        </div>

        {/* Technical Sweep Beam */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div 
            className="absolute h-[50%] w-[1px] top-0 left-1/2 -translate-x-1/2"
            style={{ 
              background: 'linear-gradient(to top, rgba(var(--color-brand-primary-rgb), 0.8), transparent)',
              boxShadow: '0 0 15px rgba(var(--color-brand-primary-rgb), 0.4)',
              transformOrigin: 'bottom center'
            }} 
          />
        </motion.div>

        {/* INTEL NODES */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          {projectedNodes.map((node, i) => (
            <motion.div
              key={node.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.05, type: 'spring' }}
              className="absolute pointer-events-auto"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              <div className="relative -translate-x-1/2 -translate-y-1/2 group">
                <div className="w-5 h-5 rounded-full bg-primary shadow-[0_0_20px_var(--color-brand-primary)] animate-pulse" />
                <div className="absolute inset-0 w-5 h-5 rounded-full border border-primary animate-ping opacity-40" />
                
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                   <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white/90 drop-shadow-md">
                      {node.label.split(' ')[0]}
                   </span>
                </div>

                {node.price && (
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="text-[12px] font-black italic text-primary drop-shadow-lg">
                       {node.price}
                    </span>
                  </div>
                )}
                
                <div className="absolute left-8 top-1/2 -translate-y-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 backdrop-blur-xl px-4 py-2 rounded-xl border border-primary/30 pointer-events-none z-[110] shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                   <div className="flex flex-col gap-0.5">
                      <span className="text-[11px] font-black uppercase tracking-widest text-primary">{node.label}</span>
                      <div className="h-px bg-white/10 w-full my-1" />
                      <div className="flex justify-between items-center gap-4">
                        <span className="text-[10px] font-bold text-white/60 uppercase">Protocol Match</span>
                        <span className="text-[10px] font-black text-emerald-400">98%</span>
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* HUD UI */}
        <div className="absolute top-8 left-8 right-8 z-[100] flex flex-col gap-6 pointer-events-none">
          <div className="flex items-center justify-between pointer-events-auto">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); triggerHaptic('heavy'); onDetectLocation(); setPanOffset({ x: 0, y: 0 }); }}
              disabled={detecting}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-all backdrop-blur-3xl border border-white/5 shadow-2xl active:scale-90",
                detected ? "bg-primary text-white" : (isLight ? "bg-white/90 text-black border-black/10" : "bg-black/40 text-white/40")
              )}
            >
              <Navigation className={cn("w-6 h-6", detecting && "animate-spin")} />
            </button>
            
            <div className="flex flex-col items-end gap-1">
               <div className={cn("backdrop-blur-3xl px-4 py-2 rounded-xl shadow-2xl border border-white/5", isLight ? "bg-white/80" : "bg-black/60")}>
                  <span className={cn("text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2", isLight ? "text-black" : "text-white")}>
                     <Search className="w-3 h-3 text-primary" />
                     Telemetric Radius
                  </span>
               </div>
               <span className="text-primary text-2xl font-black italic tracking-tighter">
                  {localKm}<small className="text-[10px] uppercase ml-1 not-italic">KM</small>
               </span>
            </div>
          </div>

          <div className="w-full px-2 pointer-events-auto">
             <input 
               type="range"
               min="1"
               max="100"
               value={localKm}
               onChange={(e) => setLocalKm(parseInt(e.target.value))}
               className="w-full h-1 bg-primary/20 rounded-full appearance-none cursor-pointer accent-primary"
             />
             <div className="flex justify-between mt-3 px-1">
                <span className={cn("text-[8px] font-black tracking-[0.2em] opacity-40 uppercase", isLight ? "text-black" : "text-white")}>System: Swipess-Scan-Active</span>
                <span className={cn("text-[8px] font-black tracking-[0.2em] opacity-40 uppercase", isLight ? "text-black" : "text-white")}>Scale: 1:{localKm}KM</span>
             </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-8 right-8 z-[100] flex gap-3 pointer-events-none">
          <div className={cn("flex-1 flex gap-2 overflow-x-auto scrollbar-none backdrop-blur-3xl p-2 rounded-2xl shadow-2xl border border-white/5 pointer-events-auto", isLight ? "bg-white/90" : "bg-black/60")}>
             {KM_PRESETS.map((km) => (
               <button
                 key={km}
                 onClick={() => handleKmSelect(km)}
                 className={cn(
                   "flex-shrink-0 h-12 min-w-[58px] rounded-xl text-[10px] font-black transition-all uppercase tracking-tighter",
                   localKm === km ? (isLight ? "bg-black text-white" : "bg-white text-black") : (isLight ? "text-black/40" : "text-white/20")
                 )}
               >
                 {km}k
               </button>
             ))}
          </div>
          
          <div className="flex gap-2 pointer-events-auto">
             <button
               type="button"
               onClick={() => setLocalKm(Math.min(100, localKm + 5))}
               className={cn("w-12 h-12 rounded-xl backdrop-blur-3xl flex items-center justify-center transition-all border border-white/5 shadow-2xl active:scale-90", isLight ? "bg-white text-black" : "bg-black/60 text-white")}
             >
               <Plus className="w-4 h-4" />
             </button>
             <button
               type="button"
               onClick={() => setLocalKm(Math.max(1, localKm - 5))}
               className={cn("w-12 h-12 rounded-xl backdrop-blur-3xl flex items-center justify-center transition-all border border-white/5 shadow-2xl active:scale-90", isLight ? "bg-white text-black" : "bg-black/60 text-white")}
             >
               <Minus className="w-4 h-4" />
             </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
