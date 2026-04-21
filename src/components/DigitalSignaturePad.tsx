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
  const { theme, isLight } = useTheme();
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

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#EB4898'; 
    
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(235, 72, 152, 0.5)';
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent | any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
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
        
        {/* 🛸 Swipess GLOW */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#EB4898]/40 via-[#8b5cf6]/40 to-[#EB4898]/40 rounded-[3rem] blur-2xl opacity-40 group-hover:opacity-100 transition duration-1000" />
        
        {/* 🛸 SIGNATURE HUB */}
        <div className={cn(
             "relative h-72 w-full backdrop-blur-3xl border rounded-[3rem] overflow-hidden shadow-3xl",
             isLight ? "bg-black/5 border-black/10" : "bg-black/80 border-white/5"
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

          {/* 🌊 PARTICLE TRAIL EXHIBIT */}
          <div className="absolute inset-0 pointer-events-none">
            {points.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0.8, scale: 1.5 }}
                animate={{ opacity: 0, scale: 0, y: 15 }}
                transition={{ duration: 0.6 }}
                className="absolute w-2 h-2 rounded-full bg-[#EB4898] blur-[4px]"
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
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-10 text-center space-y-4"
              >
                <div className="w-20 h-20 rounded-[1.8rem] bg-[#EB4898]/10 border border-[#EB4898]/20 flex items-center justify-center animate-pulse">
                   <Fingerprint className="w-10 h-10 text-[#EB4898]" />
                </div>
                <div className="space-y-1">
                   <h4 className={cn("text-lg font-black uppercase italic tracking-tighter leading-none", isLight ? "text-black" : "text-white")}>Execute Liquid Ink</h4>
                   <p className={cn("text-[10px] font-black uppercase tracking-[0.3em] opacity-30 italic", isLight ? "text-black" : "text-white")}>Verification Protocol Required</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 🛸 SECURITY METADATA */}
          <div className="absolute bottom-6 left-10 flex items-center gap-3 opacity-20">
            <Sparkles className="w-4 h-4 text-[#EB4898]" />
            <span className={cn("text-[9px] font-black uppercase tracking-[0.4em] italic", isLight ? "text-black" : "text-white")}>Biometric Sync Active v14</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <Button 
          variant="outline" 
          onClick={clearCanvas}
          className={cn(
             "h-14 px-10 rounded-2xl border-none font-black uppercase tracking-[0.2em] text-[10px] italic transition-all shadow-2xl active:scale-95",
             isLight ? "bg-black/5 text-black hover:bg-black/10" : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
          )}
        >
          <Trash2 className="w-4 h-4 mr-3" />
          Purge Pad
        </Button>
      </div>
    </div>
  );
};


