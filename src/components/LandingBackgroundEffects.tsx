import { memo, useEffect, useRef, useCallback } from 'react';

export type EffectMode = 'off' | 'stars' | 'orbs' | 'animal' | 'beach';

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

interface Spot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  vRotation: number;
  opacity: number;
}

interface Wave {
  y: number;
  amplitude: number;
  frequency: number;
  speed: number;
  phase: number;
  color: string;
  opacity: number;
}

function LandingBackgroundEffects({ mode }: { mode: EffectMode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const starsRef = useRef<Star[]>([]);
  const orbsRef = useRef<Orb[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const spotsRef = useRef<Spot[]>([]);
  const wavesRef = useRef<Wave[]>([]);
  const initializedRef = useRef<EffectMode | null>(null);

  // Track pointer for interactivity
  const pointerRef = useRef({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
    isDown: false,
    isActive: false
  });

  const initStars = useCallback((w: number, h: number) => {
    // High density for premium feel
    const count = Math.floor((w * h) / 800);
    starsRef.current = Array.from({ length: Math.min(count, 800) }, () => {
      const x = Math.random() * w;
      const y = Math.random() * h;
      return {
        x, y, baseX: x, baseY: y, vx: 0, vy: 0,
        // Larger stars for better visibility
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.05 + 0.01,
        twinklePhase: Math.random() * Math.PI * 2,
        glow: Math.random() > 0.8,
      };
    });
  }, []);

  const initOrbs = useCallback((w: number, h: number) => {
    const colors: [number, number, number][] = [
      [255, 105, 180], // pink
      [255, 165, 0],   // orange
      [138, 43, 226],  // violet
      [0, 191, 255],   // blue
      [255, 20, 147],  // deep pink
      [50, 205, 50],   // lime
    ];
    orbsRef.current = Array.from({ length: 12 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      radius: Math.random() * 140 + 60,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.25 + 0.1,
      mass: Math.random() * 0.5 + 0.5,
    }));
  }, []);

  const initAnimal = useCallback((w: number, h: number) => {
    spotsRef.current = Array.from({ length: 40 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 40 + 20,
      rotation: Math.random() * Math.PI * 2,
      vRotation: (Math.random() - 0.5) * 0.01,
      opacity: Math.random() * 0.15 + 0.05,
    }));
  }, []);

  const initBeach = useCallback((w: number, h: number) => {
    const colors = ['#0ea5e9', '#06b6d4', '#22d3ee', '#ffffff'];
    wavesRef.current = Array.from({ length: 5 }, (_, i) => ({
      y: (h / 6) * (i + 1),
      amplitude: Math.random() * 30 + 20,
      frequency: Math.random() * 0.002 + 0.001,
      speed: Math.random() * 0.02 + 0.01,
      phase: Math.random() * Math.PI * 2,
      color: colors[i % colors.length],
      opacity: 0.15 - (i * 0.02),
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
      if (mode === 'animal') initAnimal(w, h);
      if (mode === 'beach') initBeach(w, h);
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
          ctx.shadowBlur = 4;
          ctx.shadowColor = 'white';
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
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
            const pull = isDown ? 0.05 : 0.008;
            orb.vx += (dx / dist) * pull * (1 / orb.mass);
            orb.vy += (dy / dist) * pull * (1 / orb.mass);
          }
        }
        const speed = Math.sqrt(orb.vx * orb.vx + orb.vy * orb.vy);
        const maxSpeed = isDown ? 15 : 5;
        if (speed > maxSpeed) {
          orb.vx = (orb.vx / speed) * maxSpeed;
          orb.vy = (orb.vy / speed) * maxSpeed;
        }
        const pad = orb.radius;
        if (orb.x < -pad) orb.x = w + pad;
        if (orb.x > w + pad) orb.x = -pad;
        if (orb.y < -pad) orb.y = h + pad;
        if (orb.y > h + pad) orb.y = -pad;

        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
        const [r, g, b] = orb.color;
        const alpha = isDown ? Math.min(orb.opacity * 1.8, 0.9) : orb.opacity;
        grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
        grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawAnimal = () => {
      ctx.clearRect(0, 0, w, h);
      time += 0.01;
      for (const spot of spotsRef.current) {
        spot.x += spot.vx;
        spot.y += spot.vy;
        spot.rotation += spot.vRotation;
        
        if (spot.x < -100) spot.x = w + 100;
        if (spot.x > w + 100) spot.x = -100;
        if (spot.y < -100) spot.y = h + 100;
        if (spot.y > h + 100) spot.y = -100;

        ctx.save();
        ctx.translate(spot.x, spot.y);
        ctx.rotate(spot.rotation);
        ctx.globalAlpha = spot.opacity;
        
        // Draw a "blob" spot (irregular circle)
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += 0.5) {
          const r = spot.size * (0.8 + Math.random() * 0.4);
          const rx = Math.cos(a) * r;
          const ry = Math.sin(a) * r;
          if (a === 0) ctx.moveTo(rx, ry);
          else ctx.lineTo(rx, ry);
        }
        ctx.closePath();
        // Leopard/Safari colors
        ctx.fillStyle = '#b45309'; // Warm amber
        ctx.fill();
        
        // Inner spot
        ctx.beginPath();
        ctx.arc(0, 0, spot.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#451a03'; // Darker brown
        ctx.fill();
        
        ctx.restore();
      }
    };

    const drawBeach = () => {
      ctx.clearRect(0, 0, w, h);
      time += 0.02;
      for (const wave of wavesRef.current) {
        wave.phase += wave.speed;
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 20) {
          const y = wave.y + Math.sin(x * wave.frequency + wave.phase) * wave.amplitude;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.fillStyle = wave.color;
        ctx.globalAlpha = wave.opacity;
        ctx.fill();
        
        // Add subtle shimmering particles on waves
        if (Math.random() > 0.98) {
          const sx = Math.random() * w;
          const sy = wave.y + Math.sin(sx * wave.frequency + wave.phase) * wave.amplitude + (Math.random() - 0.5) * 10;
          ctx.fillStyle = 'white';
          ctx.globalAlpha = 0.4;
          ctx.beginPath();
          ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const animate = () => {
      if (mode === 'stars') drawStars();
      else if (mode === 'orbs') drawOrbs();
      else if (mode === 'animal') drawAnimal();
      else if (mode === 'beach') drawBeach();
      animRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [mode, initStars, initOrbs, initAnimal, initBeach]);

  if (mode === 'off') {
    return (
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(10,10,20,0.7) 0%, rgba(0,0,0,0.97) 100%)',
        }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ mixBlendMode: mode === 'beach' ? 'normal' : 'screen' }}
    />
  );
}

export default memo(LandingBackgroundEffects);
