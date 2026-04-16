import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapPin, Navigation, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { useTheme } from '@/hooks/useTheme';

export interface LocationRadiusSelectorProps {
  radiusKm: number;
  onRadiusChange: (km: number) => void;
  onDetectLocation: () => void;
  detecting: boolean;
  detected: boolean;
  lat?: number | null;
  lng?: number | null;
}

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

const MAP_SIZE = 240;

export const LocationRadiusSelector = ({
  radiusKm,
  onRadiusChange,
  onDetectLocation,
  detecting,
  detected,
  lat,
  lng,
}: LocationRadiusSelectorProps) => {
  const maxKm = 100;
  const [localKm, setLocalKm] = useState(radiusKm);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isLight } = useTheme();

  const userLat = lat ?? 20.2114;
  const userLng = lng ?? -87.4654;

  useEffect(() => {
    setLocalKm(radiusKm);
  }, [radiusKm]);

  // Debounce store update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localKm !== radiusKm) onRadiusChange(localKm);
    }, 200);
    return () => clearTimeout(timer);
  }, [localKm, radiusKm, onRadiusChange]);

  const zoom = useMemo(() => getZoomForRadius(localKm, userLat, MAP_SIZE), [localKm, userLat]);
  const radiusPx = useMemo(() => kmToPixels(localKm, userLat, zoom), [localKm, userLat, zoom]);

  // Draw map tiles + radius circle
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = MAP_SIZE;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const { x: tileX, y: tileY } = latLngToTile(userLat, userLng, zoom);
    const centerTileX = Math.floor(tileX);
    const centerTileY = Math.floor(tileY);
    const offsetX = (tileX - centerTileX) * 256;
    const offsetY = (tileY - centerTileY) * 256;

    // Clear with background
    ctx.fillStyle = isLight ? '#f1f5f9' : '#0a0a0a';
    ctx.fillRect(0, 0, size, size);

    const tilesNeeded = 3;
    const startTile = -1;
    let loaded = 0;
    const total = tilesNeeded * tilesNeeded;

    for (let dx = startTile; dx < startTile + tilesNeeded; dx++) {
      for (let dy = startTile; dy < startTile + tilesNeeded; dy++) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          const drawX = size / 2 - offsetX + dx * 256;
          const drawY = size / 2 - offsetY + dy * 256;
          ctx.drawImage(img, drawX, drawY, 256, 256);
          loaded++;
          if (loaded >= total) {
            // Apply dark overlay for dark theme
            if (!isLight) {
              ctx.fillStyle = 'rgba(0,0,0,0.55)';
              ctx.fillRect(0, 0, size, size);
            }
            // Draw radius circle
            const r = Math.min(radiusPx, size / 2 - 4);
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
            ctx.fillStyle = isLight ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.18)';
            ctx.fill();
            ctx.strokeStyle = isLight ? 'rgba(59,130,246,0.5)' : 'rgba(59,130,246,0.6)';
            ctx.lineWidth = 2;
            ctx.stroke();
            // Center dot
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#3b82f6';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        };
        img.onerror = () => {
          loaded++;
        };
        img.src = tileUrl(centerTileX + dx, centerTileY + dy, zoom);
      }
    }
  }, [userLat, userLng, zoom, radiusPx, isLight]);

  return (
    <motion.div
      className="w-full max-w-xs mx-auto px-3 py-3"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] leading-none mb-0.5">Coverage</span>
            <span className="text-xs font-bold text-foreground leading-none">Search Radius</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-md bg-muted/50 border border-border/50">
            <span className="text-sm font-black text-primary tracking-tight">
              {localKm} <span className="text-[10px] opacity-60 italic">km</span>
            </span>
          </div>
          <button
            onClick={onDetectLocation}
            disabled={detecting}
            className={cn(
              "flex items-center gap-1 h-7 px-2.5 rounded-lg text-[10px] font-black uppercase tracking-tight border transition-all active:scale-95",
              detected
                ? "bg-primary border-primary text-primary-foreground"
                : "bg-background border-border text-muted-foreground hover:border-primary/50"
            )}
          >
            <Navigation className={cn("w-3 h-3", detecting && "animate-spin")} />
            {detecting ? '...' : detected ? 'FIXED' : 'GPS'}
          </button>
        </div>
      </div>

      {/* Mini Map */}
      <div className="relative mx-auto rounded-2xl overflow-hidden border border-border/40 shadow-lg" style={{ width: MAP_SIZE, height: MAP_SIZE }}>
        <canvas
          ref={canvasRef}
          style={{ width: MAP_SIZE, height: MAP_SIZE }}
          className="block"
        />
        {/* Glass overlay at bottom with km label */}
        <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-background/80 to-transparent flex items-end justify-center pb-1">
          <span className="text-[10px] font-bold text-muted-foreground">{localKm} km radius</span>
        </div>
      </div>

      {/* Slider */}
      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={() => setLocalKm(Math.max(1, localKm - 5))}
          className="flex items-center justify-center w-7 h-7 rounded-lg bg-muted/50 border border-border/50 active:scale-90 transition-transform"
        >
          <Minus className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <Slider
            value={[localKm]}
            min={1}
            max={maxKm}
            step={1}
            onValueChange={([v]) => setLocalKm(v)}
          />
        </div>
        <button
          onClick={() => setLocalKm(Math.min(maxKm, localKm + 5))}
          className="flex items-center justify-center w-7 h-7 rounded-lg bg-muted/50 border border-border/50 active:scale-90 transition-transform"
        >
          <Plus className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex justify-between mt-1.5 px-10">
        <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">Local</span>
        <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">100km</span>
      </div>
    </motion.div>
  );
};
