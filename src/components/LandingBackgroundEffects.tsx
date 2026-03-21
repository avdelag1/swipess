import { memo, useEffect, useRef, useCallback } from 'react';
import { playRandomZen } from '@/utils/sounds';

export type EffectMode = 'off' | 'stars';

// Audio unlock for mobile browsers
let audioUnlocked = false;
function unlockAudio() {
  if (audioUnlocked) return;
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const buf = ctx.createBuffer(1, 1, 22050);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start(0);
  audioUnlocked = true;
}

interface Star {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
  vx: number;
  vy: number;
  glow?: boolean;
}

interface ShootingStar {
  x: number; y: number; vx: number; vy: number;
  age: number; maxAge: number; length: number;
}

 
 



function LandingBackgroundEffects({ mode, isLightTheme = false, disableSounds = false }: { mode: EffectMode; isLightTheme?: boolean; disableSounds?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const starsRef = useRef<Star[]>([]);
  const initializedRef = useRef<EffectMode | null>(null);
  const disableSoundsRef = useRef(disableSounds);
  disableSoundsRef.current = disableSounds;

  const pointerRef = useRef({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
    isDown: false,
    isActive: false
  });

  const initStars = useCallback((w: number, h: number) => {
    const count = Math.floor((w * h) / 2000);
    starsRef.current = Array.from({ length: Math.min(count, 400) }, () => {
      const x = Math.random() * w;
      const y = Math.random() * h;
      return {
        x, y, baseX: x, baseY: y, vx: 0, vy: 0,
        size: Math.random() * 0.7 + 0.15,
        opacity: Math.random() * 0.55 + 0.15,
        twinkleSpeed: Math.random() * 0.04 + 0.008,
        twinklePhase: Math.random() * Math.PI * 2,
        glow: Math.random() > 0.93,
      };
    });
  }, []);

  const shootingStarsRef = useRef<ShootingStar[]>([]);


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const w = window.innerWidth;
    const h = window.innerHeight;

    if (initializedRef.current !== mode) {
      if (mode === 'stars') initStars(w, h);
      initializedRef.current = mode;
    }

    let time = 0;

    const spawnShootingStar = (x: number, y: number) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 10 + 8;
      shootingStarsRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        age: 0,
        maxAge: Math.random() * 0.8 + 0.6,
        length: Math.random() * 50 + 60,
      });
    };



    const handlePointerMove = (e: PointerEvent) => {
      pointerRef.current.x = e.clientX;
      pointerRef.current.y = e.clientY;
      pointerRef.current.isActive = true;
    };

    const handleCanvasPointerDown = (e: PointerEvent) => {
      unlockAudio();
      pointerRef.current.isDown = true;
      pointerRef.current.isActive = true;
      pointerRef.current.x = e.clientX;
      pointerRef.current.y = e.clientY;

      if (!disableSoundsRef.current) {
        if (mode === 'stars') {
          playRandomZen(0.3);
        }
      }

      if (mode === 'stars') {
        spawnShootingStar(e.clientX, e.clientY);
      }
    };

    const handlePointerUp = () => {
      pointerRef.current.isDown = false;
      pointerRef.current.isActive = false;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('pointerdown', handleCanvasPointerDown);

    const drawStars = () => {
      ctx.clearRect(0, 0, w, h);
      time += 0.5;
      for (const star of starsRef.current) {
        const bdx = star.baseX - star.x;
        const bdy = star.baseY - star.y;
        star.vx += bdx * 0.05;
        star.vy += bdy * 0.05;
        star.vx *= 0.85;
        star.vy *= 0.85;
        star.x += star.vx;
        star.y += star.vy;

        const noise = Math.random() * 0.1;
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.5 + 0.5;
        const alpha = Math.min(star.opacity * (twinkle * 0.7 + 0.3 + noise), 1);

        if (alpha < 0.05) continue;

        if (star.glow) {
          ctx.shadowBlur = 2;
          ctx.shadowColor = 'white';
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = isLightTheme ? `rgba(40,40,80,${alpha * 0.9})` : `rgba(255,255,255,${alpha})`;
        ctx.fill();
        
        if (star.glow) {
          ctx.shadowBlur = 0;
        }
      }

      for (let i = shootingStarsRef.current.length - 1; i >= 0; i--) {
        const ss = shootingStarsRef.current[i];
        ss.age += 0.016;
        if (ss.age >= ss.maxAge) {
          shootingStarsRef.current.splice(i, 1);
          continue;
        }
        const progress = ss.age / ss.maxAge;
        ss.x += ss.vx;
        ss.y += ss.vy;
        const fadeAlpha = 1 - progress;
        const angle = Math.atan2(ss.vy, ss.vx);
        const tx = ss.x - Math.cos(angle) * ss.length;
        const ty = ss.y - Math.sin(angle) * ss.length;

        const grad = ctx.createLinearGradient(tx, ty, ss.x, ss.y);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(1, `rgba(255,255,255,${fadeAlpha})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(ss.x, ss.y);
        ctx.stroke();
      }


    };

    const loop = () => {
      if (mode === 'stars') drawStars();
      animRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('pointerdown', handleCanvasPointerDown);
    };
  }, [mode, isLightTheme, initStars]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-auto touch-none"
      style={{ zIndex: 0 }}
    />
  );
}

export default memo(LandingBackgroundEffects);
