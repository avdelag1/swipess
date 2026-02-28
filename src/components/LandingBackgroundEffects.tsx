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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const starsRef = useRef<Star[]>([]);
  const orbsRef = useRef<Orb[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const initializedRef = useRef<EffectMode | null>(null);

  // Track pointer for interactivity
  const pointerRef = useRef({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
    isDown: false,
    isActive: false, // true if actively moving/touching recently
    lastDownTime: 0, // Track last tap time for shooting stars
  });

  const initStars = useCallback((w: number, h: number) => {
    // Higher density for more 'premium' feel
    const count = Math.floor((w * h) / 600);
    starsRef.current = Array.from({ length: Math.min(count, 1000) }, () => {
      const x = Math.random() * w;
      const y = Math.random() * h;
      return {
        x, y, baseX: x, baseY: y, vx: 0, vy: 0,
        // Tiny stars for more delicate look
        size: Math.random() * 0.7 + 0.3,
        opacity: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.08 + 0.02,
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
      pointerRef.current.lastDownTime = Date.now();
    };
    const handlePointerUp = () => {
      pointerRef.current.isDown = false;
      setTimeout(() => { pointerRef.current.isActive = false; }, 2000);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    const spawnShootingStars = (x: number, y: number) => {
      // Spawn 1-2 shooting stars when tapped
      const count = Math.random() < 0.5 ? 1 : 2;
      for (let i = 0; i < count; i++) {
        // Random direction outward
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 6;
        shootingStarsRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          age: 0,
          maxAge: Math.random() * 1 + 0.8, // 0.8-1.8 seconds
          length: Math.random() * 30 + 40, // 40-70px tail
        });
      }
    };

    const drawStars = () => {
      ctx.clearRect(0, 0, w, h);
      time += 0.5;
      const { x: px, y: py, isDown, lastDownTime } = pointerRef.current;

      // Spawn shooting stars on every tap (check if recently tapped)
      if (isDown && pointerRef.current.isActive) {
        const timeSinceDown = Date.now() - lastDownTime;
        // Spawn only once per tap (within first 50ms of tap)
        if (timeSinceDown < 50) {
          spawnShootingStars(px, py);
        }
      }

      // Draw regular twinkling stars (no interaction)
      for (const star of starsRef.current) {
        // Just return to home position naturally
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

      // Draw and update shooting stars
      for (let i = shootingStarsRef.current.length - 1; i >= 0; i--) {
        const ss = shootingStarsRef.current[i];
        ss.age += 0.016; // ~60fps

        if (ss.age >= ss.maxAge) {
          shootingStarsRef.current.splice(i, 1);
          continue;
        }

        // Progress of the shooting star (0 to 1)
        const progress = ss.age / ss.maxAge;

        // Move the shooting star
        ss.x += ss.vx;
        ss.y += ss.vy;

        // Fade out towards the end
        const fadeAlpha = 1 - (progress * 0.7);

        // Draw shooting star with tail
        const speed = Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy);
        const angle = Math.atan2(ss.vy, ss.vx);

        // Tail
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

        // Bright head of the shooting star
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${fadeAlpha})`;
        ctx.fill();

        // Glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgba(255, 255, 255, ${fadeAlpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 220, 180, ${fadeAlpha * 0.3})`;
        ctx.fill();
        ctx.shadowBlur = 0;
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
      style={{ mixBlendMode: 'screen' }}
    />
  );
}

export default memo(LandingBackgroundEffects);
