import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Trash2, Sparkles, Fingerprint, MousePointer2 } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';
import { uiSounds } from '@/utils/uiSounds';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface LiquidSignaturePadProps {
  onSignatureCapture: (signatureData: string, signatureType: 'drawn' | 'typed' | 'uploaded') => void;
  onClear?: () => void;
}

export const DigitalSignaturePad: React.FC<LiquidSignaturePadProps> = ({
  onSignatureCapture,
  onClear
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isLight } = useTheme();
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [points, setPoints] = useState<{x: number, y: number}[]>([]);

  // Initialize Canvas with High-DPI support
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Initial state
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#EB4898'; // Swipess Brand Pink
    
    // Add glowing effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(235, 72, 152, 0.5)';
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent | any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = (e as React.TouchEvent).touches ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = (e as React.TouchEvent).touches ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    setHasDrawn(true);
    const { x, y } = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
    setPoints([{ x, y }]);
    triggerHaptic('light');
    uiSounds.playPop();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    setPoints(prev => [...prev.slice(-20), { x, y }]);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const signatureData = canvas.toDataURL('image/png');
      onSignatureCapture(signatureData, 'drawn');
    }
  };

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setPoints([]);
    onClear?.();
    triggerHaptic('medium');
    uiSounds.playSwoosh();
  }, [onClear]);

  return (
    <div className="w-full space-y-6">
      <div className="relative group">
        {/* 🛸 Swipess BRAND GLOW */}
        <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 via-indigo-500/20 to-primary/20 rounded-[2.5rem] blur-2xl opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
        
        {/* 🛸 MATTE CONTAINER */}
        <div className={cn(
          "relative h-72 w-full backdrop-blur-3xl border rounded-[2.5rem] overflow-hidden shadow-2xl transition-colors duration-500",
          isLight ? "bg-black/[0.04] border-black/5" : "bg-white/[0.04] border-white/10"
        )}>
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />

          {/* 🛸 LIQUID PARTICLES TRAIL */}
          <div className="absolute inset-0 pointer-events-none">
            {points.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0.8, scale: 1 }}
                animate={{ opacity: 0, scale: 0, y: 10 }}
                transition={{ duration: 0.5 }}
                className="absolute w-1.5 h-1.5 rounded-full bg-primary blur-[2px]"
                style={{ left: p.x, top: p.y }}
              />
            ))}
          </div>

          <AnimatePresence>
            {!hasDrawn && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-10 text-center"
              >
                <div className={cn("w-20 h-20 rounded-full border flex items-center justify-center mb-6 animate-pulse", isLight ? "bg-black/5 border-black/5" : "bg-white/5 border-white/10")}>
                  <Fingerprint className="w-10 h-10 text-primary/60" />
                </div>
                <h4 className={cn("text-base font-black uppercase tracking-[0.3em] italic", isLight ? "text-black/40" : "text-white/40")}>Hold and sign here</h4>
                <div className="flex items-center gap-3 mt-4">
                  <MousePointer2 className="w-4 h-4 text-primary/40 animate-bounce" />
                  <span className={cn("text-[10px] font-black uppercase tracking-widest opacity-20", isLight ? "text-black" : "text-white")}>Liquid Signature Pad v2</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 🛸 TELEMETRY INFO */}
          <div className="absolute bottom-6 left-8 flex items-center gap-3 opacity-30">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className={cn("text-[9px] font-black uppercase tracking-[0.5em] italic", isLight ? "text-black" : "text-white")}>Encrypted Digital Hash</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button 
          variant="outline" 
          onClick={clearCanvas}
          className={cn(
            "h-14 px-10 rounded-2xl font-black uppercase italic tracking-[0.2em] text-[11px] transition-all shadow-xl active:scale-95",
            isLight 
              ? "bg-black text-white hover:bg-black/80" 
              : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
          )}
        >
          <Trash2 className="w-4 h-4 mr-3" />
          Purge Pad
        </Button>
      </div>
    </div>
  );
};
