import { memo, useEffect, useRef, useCallback } from 'react';

type EffectMode = 'off' | 'stars' | 'orbs';

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
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  maxAge: number;
  length: number;
}

interface Orb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: [number, number, number];
  opacity: number;
  mass: number;
}

function LandingBackgroundEffects({ mode }: { mode: EffectMode }) {
  const animCanvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const starsRef = useRef<Star[]>([]);
  const orbsRef = useRef<Orb[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const initializedRef = useRef<EffectMode | null>(null);

  const pointerRef = useRef({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
    isDown: false,
    isActive: false,
  });

  /* ─── Stars / orbs init ───────────────────────────────── */
  const initStars = useCallback((w: number, h: number) => {
    const count = Math.floor((w * h) / 1200);
    starsRef.current = Array.from({ length: Math.min(count, 500) }, () => {
      const x = Math.random() * w;
      const y = Math.random() * h;
      return {
        x, y, baseX: x, baseY: y, vx: 0, vy: 0,
        size: Math.random() * 0.7 + 0.3,
        opacity: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.08 + 0.02,
        twinklePhase: Math.random() * Math.PI * 2,
      };
    });
  }, []);

  const initOrbs = useCallback((w: number, h: number) => {
    const colors: [number, number, number][] = [
      [255, 105, 180],
      [255, 165, 0],
      [138, 43, 226],
      [0, 191, 255],
      [255, 20, 147],
      [50, 205, 50],
    ];
    orbsRef.current = Array.from({ length: 10 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      radius: Math.random() * 120 + 80,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.3 + 0.12,
      mass: Math.random() * 0.5 + 0.5,
    }));
  }, []);

  /* ─── Animated stars/orbs canvas ─────────────────────── */
  useEffect(() => {
    if (mode === 'off') {
      cancelAnimationFrame(animRef.current);
      initializedRef.current = null;
      return;
    }

    const canvas = animCanvasRef.current;
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

    const handlePointerMove = (e: PointerEvent) => {
      pointerRef.current.x = e.clientX;
      pointerRef.current.y = e.clientY;
      pointerRef.current.isActive = true;
    };
    const handlePointerDown = (e: PointerEvent) => {
      pointerRef.current.isDown = true;
      pointerRef.current.isActive = true;
      pointerRef.current.x = e.clientX;
      pointerRef.current.y = e.clientY;
      if (mode === 'stars') spawnShootingStar(e.clientX, e.clientY);
    };
    const handlePointerUp = () => {
      pointerRef.current.isDown = false;
      pointerRef.current.isActive = false;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    const spawnShootingStar = (x: number, y: number) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 6;
      shootingStarsRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        age: 0,
        maxAge: Math.random() * 1 + 0.8,
        length: Math.random() * 30 + 40,
      });
    };

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

        const noise = Math.random() * 0.2;
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.5 + 0.5;
        const alpha = Math.min(star.opacity * (twinkle * 0.8 + noise), 1);
        if (alpha < 0.01) continue;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      }

      for (let i = shootingStarsRef.current.length - 1; i >= 0; i--) {
        const ss = shootingStarsRef.current[i];
        ss.age += 0.016;
        if (ss.age >= ss.maxAge) { shootingStarsRef.current.splice(i, 1); continue; }

        const progress = ss.age / ss.maxAge;
        ss.x += ss.vx;
        ss.y += ss.vy;
        const fadeAlpha = 1 - (progress * 0.7);
        const angle = Math.atan2(ss.vy, ss.vx);
        const tailStartX = ss.x - Math.cos(angle) * ss.length;
        const tailStartY = ss.y - Math.sin(angle) * ss.length;

        const gradient = ctx.createLinearGradient(tailStartX, tailStartY, ss.x, ss.y);
        gradient.addColorStop(0, `rgba(255, 255, 255, 0)`);
        gradient.addColorStop(0.5, `rgba(200, 220, 255, ${fadeAlpha * 0.4})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, ${fadeAlpha})`);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tailStartX, tailStartY);
        ctx.lineTo(ss.x, ss.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${fadeAlpha})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 220, 180, ${fadeAlpha * 0.3})`;
        ctx.fill();
      }
    };

    const drawOrbs = () => {
      ctx.clearRect(0, 0, w, h);
      const { x: px, y: py, isDown } = pointerRef.current;

      for (const orb of orbsRef.current) {
        orb.x += orb.vx;
        orb.y += orb.vy;

        if (pointerRef.current.isActive) {
          const dx = px - orb.x;
          const dy = py - orb.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 0) {
            const pull = isDown ? 0.03 : 0.005;
            orb.vx += (dx / dist) * pull * (1 / orb.mass);
            orb.vy += (dy / dist) * pull * (1 / orb.mass);
          }
        } else {
          const currentSpeed = Math.sqrt(orb.vx * orb.vx + orb.vy * orb.vy);
          if (currentSpeed > 2) { orb.vx *= 0.98; orb.vy *= 0.98; }
        }

        const maxSpeed = isDown ? 12 : 4;
        const currentSpeed = Math.sqrt(orb.vx * orb.vx + orb.vy * orb.vy);
        if (currentSpeed > maxSpeed) {
          orb.vx = (orb.vx / currentSpeed) * maxSpeed;
          orb.vy = (orb.vy / currentSpeed) * maxSpeed;
        }

        const padding = orb.radius * 0.5;
        if (orb.x - padding < 0) orb.vx += 0.2;
        if (orb.x + padding > w) orb.vx -= 0.2;
        if (orb.y - padding < 0) orb.vy += 0.2;
        if (orb.y + padding > h) orb.vy -= 0.2;

        const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
        const [r, g, b] = orb.color;
        const finalOpacity = isDown ? Math.min(orb.opacity * 1.5, 0.8) : orb.opacity;
        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${finalOpacity})`);
        gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${finalOpacity * 0.4})`);
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

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [mode, initStars, initOrbs]);

  return (
    <>
      {mode !== 'off' && (
        <canvas
          ref={animCanvasRef}
          className="absolute inset-0 z-[1] pointer-events-none"
          style={{ mixBlendMode: 'screen' }}
        />
      )}
    </>
  );
}

export default memo(LandingBackgroundEffects);
