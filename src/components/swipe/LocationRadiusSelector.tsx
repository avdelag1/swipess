import { useState, useEffect, useCallback, useMemo } from 'react';
import { Navigation, Minus, Plus, Search, Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '@/utils/haptics';
import { useTheme } from '@/hooks/useTheme';

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
  variant?: 'full' | 'minimal';
  onCategorySelect?: (category: any) => void;
  nodes?: RadarNode[];
}

const KM_PRESETS = [1, 5, 10, 25, 50, 100];

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
  variant = 'full',
  lat: centerLat,
  lng: centerLng,
  nodes = [],
}: LocationRadiusSelectorProps) => {
  const [localKm, setLocalKm] = useState(radiusKm);
  const { isLight, theme } = useTheme();
  
  useEffect(() => { setLocalKm(radiusKm); }, [radiusKm]);

  // Smoother debounced update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localKm !== radiusKm) onRadiusChange(localKm);
    }, 450);
    return () => clearTimeout(timer);
  }, [localKm, radiusKm, onRadiusChange]);

  const handleKmSelect = useCallback((km: number) => {
    triggerHaptic('light');
    setLocalKm(km);
  }, []);

  // ── INTEL NODE PROJECTION ──
  // Project lat/lng nodes onto the radar grid relative to center
  const projectedNodes = useMemo(() => {
    if (!centerLat || !centerLng || nodes.length === 0) return [];
    
    // Simple projection for the 2D radar grid
    // Scale: radiusKm corresponds to the 5th concentric ring (~85% of container)
    const seenPos = new Set<string>();

    return nodes.map((node, idx) => {
      const dLat = node.lat - centerLat;
      const dLng = node.lng - centerLng;
      
      // Convert to approx KM (very rough for UI visualization)
      const xKm = dLng * 111 * Math.cos(centerLat * Math.PI / 180);
      const yKm = dLat * 111;
      
      // Scale to percentage (1.0 = radiusKm)
      const xPos = (xKm / localKm);
      const yPos = (yKm / localKm);
      
      let x = 50 + (xPos * 40);
      let y = 50 - (yPos * 40);

      // JITTER DE-COLLISION: If coordinates are identical or very close, nudge them
      const posKey = `${Math.round(x * 10)},${Math.round(y * 10)}`;
      if (seenPos.has(posKey)) {
        // Nudge in a spiral based on index
        const angle = idx * 0.5;
        const radius = 2 + (idx * 0.1);
        x += Math.cos(angle) * radius;
        y += Math.sin(angle) * radius;
      }
      seenPos.add(posKey);
      
      return { ...node, x, y };
    }).filter(n => n.x > 2 && n.x < 98 && n.y > 2 && n.y < 98);
  }, [centerLat, centerLng, nodes, localKm]);

  if (variant === 'minimal') {
    return (
      <div className="w-full flex flex-col gap-2 relative">
        <div 
          className={cn(
            "w-full h-16 rounded-[2rem] overflow-hidden relative transition-all duration-500 cursor-pointer pointer-events-auto",
            isLight ? "bg-black/[0.03]" : "bg-white/[0.02] backdrop-blur-3xl"
          )}
        >
          {/* Background Nodes in Minimal View */}
          <div className="absolute inset-0 z-0 opacity-20 overflow-hidden pointer-events-none">
             {projectedNodes.slice(0, 15).map(node => (
               <div 
                 key={node.id} 
                 className="absolute w-1 h-1 bg-primary rounded-full" 
                 style={{ left: `${node.x}%`, top: `${node.y}%` }}
               />
             ))}
          </div>

          <div className="absolute inset-0 flex items-center justify-between px-4 pointer-events-none z-10">
            <div className="flex items-center gap-3 pointer-events-auto">
              <button
                onClick={(e) => { e.stopPropagation(); triggerHaptic('medium'); onDetectLocation(); }}
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
            
            <div className="flex gap-1.5 pointer-events-auto">
               {KM_PRESETS.slice(0, 3).map((km) => (
                  <button
                    key={km}
                    onClick={() => handleKmSelect(km)}
                    className={cn(
                      "h-9 px-4 rounded-xl text-[10px] font-black transition-all uppercase tracking-tighter",
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
      <div className="absolute inset-0 pointer-events-none">
        {/* ── ZENITH GRID SYSTEM ── */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <div className="absolute w-full h-[1px] bg-primary/40 shadow-[0_0_8px_rgba(var(--color-brand-primary-rgb),0.5)]" />
          <div className="absolute h-full w-[1px] bg-primary/40 shadow-[0_0_8px_rgba(var(--color-brand-primary-rgb),0.5)]" />
          
          {[...Array(6)].map((_, i) => (
            <div
              key={`grid-${i}`}
              className="absolute border border-primary/20 rounded-full"
              style={{
                width: `${(i + 1) * 35}%`,
                aspectRatio: '1/1',
              }}
            />
          ))}

          <div className="absolute w-4 h-4 border border-primary flex items-center justify-center rotate-45" />
        </div>

        {/* Technical Sweep Beam */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 flex items-center justify-center z-10"
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

        {/* ── INTEL NODES (The "Bottles") ── */}
        <div className="absolute inset-0 z-20">
          {projectedNodes.map((node, i) => (
            <motion.div
              key={node.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: i * 0.05, type: 'spring' }}
              className="absolute group pointer-events-auto"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              {/* The "Intel Node" Pulse */}
              <div className="relative -translate-x-1/2 -translate-y-1/2">
                <div className="w-5 h-5 rounded-full bg-primary shadow-[0_0_20px_var(--color-brand-primary)] animate-pulse" />
                <div className="absolute inset-0 w-5 h-5 rounded-full border border-primary animate-ping opacity-40" />
                
                {/* Always Visible Text (Top) */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10">
                   <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white/90 drop-shadow-md">
                      {node.label.split(' ')[0]}
                   </span>
                </div>

                {/* Node Price / Meta (Bottom) */}
                {node.price && (
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="text-[12px] font-black italic text-primary drop-shadow-lg">
                       {node.price}
                    </span>
                  </div>
                )}

                {/* Detailed Hover State (Visible on Tap/Desktop Hover) */}
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
      </div>

      <div className="flex-1 relative">
         {/* TOP HUD floating over geometry */}
         <div className="absolute top-8 left-8 right-8 z-[100] flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); triggerHaptic('heavy'); onDetectLocation(); }}
                disabled={detecting}
                className={cn(
                  "w-14 h-14 rounded-full flex items-center justify-center transition-all backdrop-blur-3xl border border-white/5 shadow-2xl active:scale-90 pointer-events-auto",
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

            {/* PRECISION RANGE SLIDER */}
            <div className="w-full px-2 pointer-events-auto">
               <input 
                 type="range"
                 min="1"
                 max="100"
                 step="1"
                 value={localKm}
                 onChange={(e) => setLocalKm(parseInt(e.target.value))}
                 className="w-full h-1 bg-primary/20 rounded-full appearance-none cursor-pointer accent-primary border-none overflow-hidden"
               />
               <div className="flex justify-between mt-3 px-1">
                  <span className={cn("text-[8px] font-black tracking-[0.2em] opacity-40 uppercase", isLight ? "text-black" : "text-white")}>System: Swipess-Scan-Active</span>
                  <span className={cn("text-[8px] font-black tracking-[0.2em] opacity-40 uppercase", isLight ? "text-black" : "text-white")}>Scale: 1:{localKm}KM</span>
               </div>
            </div>
         </div>

         {/* BOTTOM PRESETS — floating bar */}
         <div className="absolute bottom-8 left-8 right-8 z-[100] flex gap-3">
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



