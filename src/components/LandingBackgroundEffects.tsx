import { memo, useEffect, useRef, useCallback } from 'react';

type EffectMode = 'off' | 'stars' | 'orbs';

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

interface Orb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: [number, number, number];
  opacity: number;
}

function LandingBackgroundEffects({ mode }: { mode: EffectMode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const starsRef = useRef<Star[]>([]);
  const orbsRef = useRef<Orb[]>([]);
  const initializedRef = useRef<EffectMode | null>(null);

  const initStars = useCallback((w: number, h: number) => {
    const count = Math.floor((w * h) / 1000);
    starsRef.current = Array.from({ length: Math.min(count, 500) }, () => {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.1 + 0.02,
        twinklePhase: Math.random() * Math.PI * 2,
      };
    });
  }, []);

  const initOrbs = useCallback((w: number, h: number) => {
    const colors: [number, number, number][] = [
      [255, 105, 180], // pink
      [255, 165, 0],   // orange
      [138, 43, 226],  // violet
      [0, 191, 255],   // deep sky blue
      [255, 20, 147],  // deep pink
      [50, 205, 50],   // lime green
    ];
    orbsRef.current = Array.from({ length: 10 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 3.5,
      vy: (Math.random() - 0.5) * 3.5,
      radius: Math.random() * 120 + 80, // much bigger orbs
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.3 + 0.12,
    }));
  }, []);

  useEffect(() => {
    if (mode === 'off') {
      cancelAnimationFrame(animRef.current);
      initializedRef.current = null;
      return;
    }

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
      ctx.scale(dpr, dpr);
    };
    resize();

    const w = window.innerWidth;
    const h = window.innerHeight;

    if (initializedRef.current !== mode) {
      if (mode === 'stars') initStars(w, h);
      if (mode === 'orbs') initOrbs(w, h);
      initializedRef.current = mode;
    }

    let time = 0;

    const drawStars = () => {
      ctx.clearRect(0, 0, w, h);
      time += 1;
      for (const star of starsRef.current) {
        const noise = Math.random() * 0.2;
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.5 + 0.5;
        const alpha = star.opacity * (twinkle * 0.8 + noise);
        if (alpha < 0.01) continue;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      }
    };

    const drawOrbs = () => {
      ctx.clearRect(0, 0, w, h);
      for (const orb of orbsRef.current) {
        orb.x += orb.vx;
        orb.y += orb.vy;
        // Bounce off edges
        if (orb.x - orb.radius < 0 || orb.x + orb.radius > w) orb.vx *= -1;
        if (orb.y - orb.radius < 0 || orb.y + orb.radius > h) orb.vy *= -1;
        // Clamp
        orb.x = Math.max(orb.radius, Math.min(w - orb.radius, orb.x));
        orb.y = Math.max(orb.radius, Math.min(h - orb.radius, orb.y));

        const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
        const [r, g, b] = orb.color;
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${orb.opacity})`);
        gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${orb.opacity * 0.4})`);
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    };

    const animate = () => {
      if (mode === 'stars') drawStars();
      if (mode === 'orbs') drawOrbs();
      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [mode, initStars, initOrbs]);

  if (mode === 'off') return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-10 pointer-events-none"
      style={{ mixBlendMode: mode === 'orbs' ? 'screen' : 'normal' }}
    />
  );
}

export default memo(LandingBackgroundEffects);
