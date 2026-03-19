import { memo, useEffect, useRef, useCallback } from 'react';
import { playRandomZen } from '@/utils/sounds';

export type EffectMode = 'off' | 'stars' | 'orbs';

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

interface OrbUFO {
  x: number; y: number; vx: number; vy: number;
  age: number; maxAge: number;
  radius: number;
  color: [number, number, number];
  pulsePhase: number;
  bobPhase: number;
}

interface SaucerUFO {
  x: number; y: number; vx: number; vy: number;
  age: number; maxAge: number;
  size: number;
  wobblePhase: number;
  beamOn: boolean;
  lights: Array<{ angle: number; hue: number }>;
}

interface Orb {
  x: number; y: number; vx: number; vy: number;
  radius: number; color: [number, number, number];
  opacity: number; mass: number;
}


function LandingBackgroundEffects({ mode, isLightTheme = false, disableSounds = false }: { mode: EffectMode; isLightTheme?: boolean; disableSounds?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const starsRef = useRef<Star[]>([]);
  const orbsRef = useRef<Orb[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const orbUFOsRef = useRef<OrbUFO[]>([]);
  const saucerUFOsRef = useRef<SaucerUFO[]>([]);
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
      if (mode === 'orbs') initOrbs(w, h);
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

    const spawnOrbUFO = (x: number, y: number) => {
      const orbColors: [number, number, number][] = [
        [0, 255, 180],   // alien green-cyan
        [160, 80, 255],  // purple
        [80, 200, 255],  // sky blue
        [255, 220, 80],  // gold
        [255, 100, 200], // pink
      ];
      const angle = (Math.random() - 0.5) * Math.PI * 0.8; // mostly horizontal
      const speed = Math.random() * 2.5 + 1.2;
      orbUFOsRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed * (Math.random() < 0.5 ? 1 : -1),
        vy: Math.sin(angle) * speed - 0.5,
        age: 0, maxAge: Math.random() * 2.5 + 2,
        radius: Math.random() * 8 + 6,
        color: orbColors[Math.floor(Math.random() * orbColors.length)],
        pulsePhase: Math.random() * Math.PI * 2,
        bobPhase: Math.random() * Math.PI * 2,
      });
    };

    const spawnSaucerUFO = (x: number, y: number) => {
      const angle = (Math.random() - 0.5) * Math.PI * 0.5;
      const speed = Math.random() * 2 + 1;
      const lights = Array.from({ length: 6 }, (_, i) => ({
        angle: (i / 6) * Math.PI * 2,
        hue: Math.floor(Math.random() * 360),
      }));
      saucerUFOsRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed * (Math.random() < 0.5 ? 1 : -1),
        vy: Math.sin(angle) * speed - 0.3,
        age: 0, maxAge: Math.random() * 3 + 2.5,
        size: Math.random() * 16 + 18,
        wobblePhase: Math.random() * Math.PI * 2,
        beamOn: Math.random() < 0.6,
        lights,
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
        if (mode === 'stars' || mode === 'orbs') {
          playRandomZen(0.3);
        }
      }

      if (mode === 'stars') {
        const roll = Math.random();
        if (roll < 0.33) spawnShootingStar(e.clientX, e.clientY);
        else if (roll < 0.66) spawnSaucerUFO(e.clientX, e.clientY);
        else spawnOrbUFO(e.clientX, e.clientY);
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

      // Saucer UFOs
      for (let i = saucerUFOsRef.current.length - 1; i >= 0; i--) {
        const saucer = saucerUFOsRef.current[i];
        saucer.age += 0.016;
        if (saucer.age >= saucer.maxAge) { saucerUFOsRef.current.splice(i, 1); continue; }
        const progress = saucer.age / saucer.maxAge;
        const fadeAlpha = progress < 0.1 ? progress / 0.1 : progress > 0.8 ? (1 - progress) / 0.2 : 1;
        saucer.wobblePhase += 0.03;
        saucer.x += saucer.vx;
        saucer.y += saucer.vy + Math.sin(saucer.wobblePhase) * 0.3;
        const s = saucer.size;

        ctx.save();
        ctx.translate(saucer.x, saucer.y);
        ctx.globalAlpha = fadeAlpha;

        // --- 1. Tractor Beam (If On) ---
        if (saucer.beamOn && progress > 0.1 && progress < 0.9) {
          const beamPulse = Math.sin(time * 0.2) * 0.15 + 0.35;
          const beamGrad = ctx.createLinearGradient(0, 0, 0, 80);
          beamGrad.addColorStop(0, `rgba(100, 255, 220, ${beamPulse * 0.6 * fadeAlpha})`);
          beamGrad.addColorStop(1, `rgba(0, 255, 180, 0.0)`);
          
          ctx.beginPath();
          ctx.moveTo(-s * 0.2, 2);
          ctx.lineTo(-s * 0.6, 80);
          ctx.lineTo(s * 0.6, 80);
          ctx.lineTo(s * 0.2, 2);
          ctx.closePath();
          ctx.fillStyle = beamGrad;
          ctx.fill();
        }

        // --- 2. Thruster Glow (Bottom) ---
        const thrustPulse = Math.sin(time * 0.4 + i) * 0.2 + 0.4;
        const thrustGrad = ctx.createRadialGradient(0, 2, 0, 0, 2, s * 0.8);
        thrustGrad.addColorStop(0, `rgba(80, 200, 255, ${thrustPulse * fadeAlpha})`);
        thrustGrad.addColorStop(1, 'rgba(0, 100, 255, 0)');
        ctx.fillStyle = thrustGrad;
        ctx.beginPath();
        ctx.ellipse(0, 2, s * 0.8, s * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // --- 3. Main Disk Body (Liquid Metal Style) ---
        ctx.beginPath();
        ctx.ellipse(0, 2, s, s * 0.28, 0, 0, Math.PI * 2);
        const bodyGrad = ctx.createLinearGradient(0, -s * 0.28, 0, s * 0.28);
        bodyGrad.addColorStop(0, 'rgba(230,230,240,0.95)'); // Bright top catch
        bodyGrad.addColorStop(0.4, 'rgba(170,170,185,0.9)'); // Mid metal
        bodyGrad.addColorStop(0.6, 'rgba(120,120,135,0.85)'); // Shadow divide
        bodyGrad.addColorStop(1, 'rgba(60,60,75,0.8)'); // Bottom shadow
        ctx.fillStyle = bodyGrad;
        ctx.fill();

        // --- 4. Blinking Rim Lights ---
        saucer.lights.forEach((light, li) => {
          const lx = Math.cos(light.angle + saucer.wobblePhase * 0.5) * s * 0.85;
          const ly = Math.sin(light.angle + saucer.wobblePhase * 0.5) * s * 0.15 + 2;
          
          // Blink logic
          const isOn = Math.sin(time * 0.15 + li) > 0;
          if (isOn) {
            ctx.beginPath();
            ctx.arc(lx, ly, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${light.hue}, 100%, 75%, ${fadeAlpha})`;
            ctx.shadowBlur = 10;
            ctx.shadowColor = `hsla(${light.hue}, 100%, 70%, 1)`;
            ctx.fill();
            ctx.shadowBlur = 0;
            
            // Core pixel
            ctx.beginPath();
            ctx.arc(lx, ly, 1, 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(lx, ly, 1.8, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(40, 40, 50, 0.4)';
            ctx.fill();
          }
        });

        // --- 5. Glass Dome ---
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.38, s * 0.26, 0, Math.PI, 0);
        const domeGrad = ctx.createLinearGradient(0, -s * 0.3, 0, 0);
        domeGrad.addColorStop(0, 'rgba(180,240,255,0.8)'); // Sky/light reflection
        domeGrad.addColorStop(0.5, 'rgba(100,180,255,0.4)'); // Translucent blue
        domeGrad.addColorStop(1, 'rgba(40,60,100,0.2)'); // Depth
        ctx.fillStyle = domeGrad;
        ctx.fill();

        // Dome Inner Detail (Small Alien Silhouette)
        ctx.beginPath();
        ctx.arc(0, -s * 0.08, s * 0.06, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fill();

        // High gloss rim highlight
        ctx.beginPath();
        ctx.ellipse(0, 2, s, s * 0.28, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // Orb UFOs (Energy Spheres)
      for (let i = orbUFOsRef.current.length - 1; i >= 0; i--) {
        const orb = orbUFOsRef.current[i];
        orb.age += 0.016;
        if (orb.age >= orb.maxAge) { orbUFOsRef.current.splice(i, 1); continue; }
        
        const progress = orb.age / orb.maxAge;
        const currentFade = progress < 0.2 ? progress / 0.2 : progress > 0.8 ? (1 - progress) / 0.2 : 1;
        
        orb.x += orb.vx;
        orb.y += orb.vy + Math.sin(time * 0.1 + orb.bobPhase) * 0.5;
        orb.pulsePhase += 0.1;
        
        const [r, g, b] = orb.color;
        const glowSize = orb.radius * (1.5 + Math.sin(orb.pulsePhase) * 0.3);
        
        ctx.save();
        ctx.globalAlpha = currentFade;
        
        // Outer Glow
        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, glowSize);
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.8)`);
        grad.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, 0.3)`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, glowSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Core
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.shadowBlur = 15;
        ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
        ctx.fill();
        
        ctx.restore();
      }
    };

    const drawOrbs = () => {
      ctx.clearRect(0, 0, w, h);
      const { x: px, y: py, isDown } = pointerRef.current;
      for (const orb of orbsRef.current) {
        orb.x += orb.vx;
        orb.y += orb.vy;
        if (pointerRef.current.isActive) {
          const dx = px - orb.x; const dy = py - orb.y;
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

    const loop = () => {
      if (mode === 'stars') drawStars();
      else if (mode === 'orbs') drawOrbs();
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
  }, [mode, isLightTheme, initStars, initOrbs]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-auto touch-none"
      style={{ zIndex: 0 }}
    />
  );
}

export default memo(LandingBackgroundEffects);
