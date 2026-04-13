import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Trash2, Sparkles, Fingerprint, MousePointer2 } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';
import { uiSounds } from '@/utils/uiSounds';

interface LiquidSignaturePadProps {
  onSignatureCapture: (signatureData: string, signatureType: 'drawn' | 'typed' | 'uploaded') => void;
  onClear?: () => void;
}

export const DigitalSignaturePad: React.FC<LiquidSignaturePadProps> = ({
  onSignatureCapture,
  onClear
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
    ctx.strokeStyle = '#f43f5e'; // Rose-500
    
    // Add glowing effect
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(244, 63, 94, 0.5)';
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
    <div className="w-full space-y-4">
      <div className="relative group">
        {/* Animated Background Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-rose-500/20 via-orange-500/20 to-rose-500/20 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
        
        {/* Matte Container */}
        <div className="relative h-64 w-full bg-black/40 backdrop-blur-3xl border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
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

          {/* Liquid Particles Trail Overlay (Visualization only) */}
          <div className="absolute inset-0 pointer-events-none">
            {points.map((p, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0.8, scale: 1 }}
                animate={{ opacity: 0, scale: 0, y: 10 }}
                transition={{ duration: 0.5 }}
                className="absolute w-1 h-1 rounded-full bg-rose-400 blur-[2px]"
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
                className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-6 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 animate-pulse">
                  <Fingerprint className="w-8 h-8 text-rose-500/60" />
                </div>
                <h4 className="text-sm font-black uppercase tracking-[0.2em] text-white/40">Hold and sign here</h4>
                <div className="flex items-center gap-2 mt-2">
                  <MousePointer2 className="w-3 h-3 text-rose-500/40 animate-bounce" />
                  <span className="text-[10px] font-bold text-white/20">Liquid Signature Pad v2</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Info */}
          <div className="absolute bottom-4 left-6 flex items-center gap-2 opacity-30">
            <Sparkles className="w-3 h-3 text-rose-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-white">Encrypted Digital Hash</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-3">
        <Button 
          variant="outline" 
          onClick={clearCanvas}
          className="rounded-2xl h-12 px-6 border-white/5 bg-white/5 backdrop-blur-md hover:bg-white/10 text-white/60 font-black uppercase tracking-widest text-[10px] transition-all"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear Pad
        </Button>
      </div>
    </div>
  );
};
