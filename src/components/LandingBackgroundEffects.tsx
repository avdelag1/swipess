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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const starsRef = useRef<Star[]>([]);
  const orbsRef = useRef<Orb[]>([]);
  const initializedRef = useRef<EffectMode | null>(null);

  // Track pointer for interactivity
  const pointerRef = useRef({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
    isDown: false,
    isActive: false // true if actively moving/touching recently
  });

  const initStars = useCallback((w: number, h: number) => {
    const count = Math.floor((w * h) / 1000);
    starsRef.current = Array.from({ length: Math.min(count, 500) }, () => {
      const x = Math.random() * w;
      const y = Math.random() * h;
      return {
        x, y, baseX: x, baseY: y, vx: 0, vy: 0,
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
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      radius: Math.random() * 120 + 80,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.3 + 0.12,
      mass: Math.random() * 0.5 + 0.5,
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

    // Global pointer listeners to track mouse/touch anywhere
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
    };
    const handlePointerUp = () => {
      pointerRef.current.isDown = false;
      setTimeout(() => { pointerRef.current.isActive = false; }, 2000);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    const drawStars = () => {
      ctx.clearRect(0, 0, w, h);
      time += 0.5;
      const { x: px, y: py, isDown } = pointerRef.current;

      const pullRadius = isDown ? 400 : 150;
      const pullStrength = isDown ? 0.05 : 0.01;

      for (const star of starsRef.current) {
        // Physical forces
        const dx = px - star.x;
        const dy = py - star.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < pullRadius && pointerRef.current.isActive) {
          // Pull towards finger
          const force = (pullRadius - dist) / pullRadius;
          star.vx += dx * force * pullStrength;
          star.vy += dy * force * pullStrength;
        } else {
          // Return to base position softly
          const bdx = star.baseX - star.x;
          const bdy = star.baseY - star.y;
          star.vx += bdx * 0.02;
          star.vy += bdy * 0.02;
        }

        // Apply friction
        star.vx *= 0.85;
        star.vy *= 0.85;

        // Apply velocities
        star.x += star.vx;
        star.y += star.vy;

        const noise = Math.random() * 0.2;
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.5 + 0.5;

        // Stars get brighter when moving fast
        const speed = Math.sqrt(star.vx * star.vx + star.vy * star.vy);
        const speedGlow = Math.min(speed * 0.5, 1);

        const alpha = Math.min(star.opacity * (twinkle * 0.8 + noise) + speedGlow, 1);

        if (alpha < 0.01) continue;

        ctx.beginPath();
        if (speed > 1.5) {
          // Warp effect trails
          const tailX = star.x - star.vx * 2;
          const tailY = star.y - star.vy * 2;

          const gradient = ctx.createLinearGradient(star.x, star.y, tailX, tailY);
          gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
          gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

          ctx.strokeStyle = gradient;
          ctx.lineWidth = star.size;
          ctx.lineCap = 'round';
          ctx.moveTo(star.x, star.y);
          ctx.lineTo(tailX, tailY);
          ctx.stroke();

          // Small head point
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.fill();
        } else {
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.fill();
        }

        // Add subtle glow to fast moving stars near finger
        if (speedGlow > 0.15) {
          ctx.shadowBlur = isDown ? 15 : 8;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }
    };

    const drawOrbs = () => {
      ctx.clearRect(0, 0, w, h);
      const { x: px, y: py, isDown } = pointerRef.current;

      for (const orb of orbsRef.current) {
        // Base random wander
        orb.x += orb.vx;
        orb.y += orb.vy;

        // Gravity towards pointer
        if (pointerRef.current.isActive) {
          const dx = px - orb.x;
          const dy = py - orb.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 0) {
            // Stronger pull if cursor is down
            const pull = isDown ? 0.03 : 0.005;
            orb.vx += (dx / dist) * pull * (1 / orb.mass);
            orb.vy += (dy / dist) * pull * (1 / orb.mass);
          }
        } else {
          // Gently return to random wander speed bounds
          const currentSpeed = Math.sqrt(orb.vx * orb.vx + orb.vy * orb.vy);
          if (currentSpeed > 2) {
            orb.vx *= 0.98;
            orb.vy *= 0.98;
          }
        }

        // Apply friction to max speed cap
        const maxSpeed = isDown ? 12 : 4;
        const currentSpeed = Math.sqrt(orb.vx * orb.vx + orb.vy * orb.vy);
        if (currentSpeed > maxSpeed) {
          orb.vx = (orb.vx / currentSpeed) * maxSpeed;
          orb.vy = (orb.vy / currentSpeed) * maxSpeed;
        }

        // Bounce off edges softly
        const padding = orb.radius * 0.5;
        if (orb.x - padding < 0) { orb.vx += 0.2; }
        if (orb.x + padding > w) { orb.vx -= 0.2; }
        if (orb.y - padding < 0) { orb.vy += 0.2; }
        if (orb.y + padding > h) { orb.vy -= 0.2; }

        // Draw the glowing orb
        const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
        const [r, g, b] = orb.color;

        // Boost opacity when finger is down
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
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [mode, initStars, initOrbs]);

  if (mode === 'off') return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ mixBlendMode: mode === 'orbs' ? 'screen' : 'screen' }}
    />
  );
}

export default memo(LandingBackgroundEffects);
