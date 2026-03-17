import { memo, useEffect, useRef, useCallback } from 'react';
import { playRandomZen, playJungleSound } from '@/utils/sounds';

export type EffectMode = 'off' | 'stars' | 'orbs' | 'animal' | 'beach' | 'cheetah' | 'sunset';

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

interface Ripple {
  x: number; y: number; birth: number; maxRadius: number;
}

interface CloudPuff {
  x: number; y: number; birth: number;
  particles: CloudParticle[];
  hasRainbow: boolean;
  hasSunRay: boolean;
}

interface CloudParticle {
  x: number; y: number; vx: number; vy: number;
  radius: number; opacity: number;
}

function LandingBackgroundEffects({ mode, isLightTheme = false, disableSounds = false }: { mode: EffectMode; isLightTheme?: boolean; disableSounds?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const starsRef = useRef<Star[]>([]);
  const orbsRef = useRef<Orb[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const spotsRef = useRef<Spot[]>([]);
  const wavesRef = useRef<Wave[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const cloudsRef = useRef<CloudPuff[]>([]);
  const orbUFOsRef = useRef<OrbUFO[]>([]);
  const saucerUFOsRef = useRef<SaucerUFO[]>([]);
  const cheetahImgRef = useRef<HTMLImageElement | null>(null);
  const beachImgRef = useRef<HTMLImageElement | null>(null);
  
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

  // Preload cheetah + beach images
  useEffect(() => {
    if (!cheetahImgRef.current) {
      const img = new Image();
      img.src = '/images/cheetah-1.jpeg';
      img.onload = () => { cheetahImgRef.current = img; };
    }
    if (!beachImgRef.current) {
      const img = new Image();
      img.src = '/images/beach-sunset.jpg';
      img.onload = () => { beachImgRef.current = img; };
    }
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
      if (mode === 'animal' || mode === 'cheetah') initAnimal(w, h);
      if (mode === 'beach' || mode === 'sunset') initBeach(w, h);
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
        if (mode === 'stars' || mode === 'orbs' || mode === 'sunset' || mode === 'beach') {
          playRandomZen(0.3);
        } else if (mode === 'cheetah' || mode === 'animal') {
          playJungleSound(0.3);
        }
      }

      if (mode === 'stars') {
        const roll = Math.random();
        if (roll < 0.34) spawnShootingStar(e.clientX, e.clientY);
        else if (roll < 0.67) spawnOrbUFO(e.clientX, e.clientY);
        else spawnSaucerUFO(e.clientX, e.clientY);
      }
      if (mode === 'animal' || mode === 'cheetah') {
        ripplesRef.current.push({
          x: e.clientX, y: e.clientY,
          birth: performance.now(),
          maxRadius: 200,
        });
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
          ctx.shadowBlur = 4;
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

      // UFOs
      for (let i = orbUFOsRef.current.length - 1; i >= 0; i--) {
        const orb = orbUFOsRef.current[i];
        orb.age += 0.016;
        if (orb.age >= orb.maxAge) { orbUFOsRef.current.splice(i, 1); continue; }
        const progress = orb.age / orb.maxAge;
        const fadeAlpha = progress < 0.15 ? progress / 0.15 : progress > 0.75 ? (1 - progress) / 0.25 : 1;
        orb.bobPhase += 0.04;
        orb.x += orb.vx; orb.y += orb.vy + Math.sin(orb.bobPhase) * 0.4;
        orb.pulsePhase += 0.08;
        const pulse = Math.sin(orb.pulsePhase) * 0.3 + 0.7;
        const [r, g, b] = orb.color;
        const glowR = orb.radius * (2.5 + pulse * 0.8);
        const glow = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, glowR);
        glow.addColorStop(0, `rgba(${r},${g},${b},${fadeAlpha * 0.5})`);
        glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath(); ctx.arc(orb.x, orb.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = glow; ctx.fill();
        ctx.beginPath(); ctx.arc(orb.x, orb.y, orb.radius * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${fadeAlpha})`; ctx.fill();
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

    const drawAnimal = () => {
      ctx.clearRect(0, 0, w, h);
      const img = cheetahImgRef.current;
      if (img && (mode === 'animal' || mode === 'cheetah')) {
        const imgRatio = img.width / img.height;
        const screenRatio = w / h;
        let drawW, drawH;
        if (imgRatio > screenRatio) {
          drawH = h; drawW = drawH * imgRatio;
        } else {
          drawW = w; drawH = drawW / imgRatio;
        }
        ctx.globalAlpha = 0.2;
        ctx.drawImage(img, (w - drawW) / 2, (h - drawH) / 2, drawW, drawH);
        ctx.globalAlpha = 1;
      }

      for (const spot of spotsRef.current) {
        spot.x += spot.vx;
        spot.y += spot.vy;
        spot.rotation += spot.vRotation;
        if (spot.x < -spot.size) spot.x = w + spot.size;
        if (spot.x > w + spot.size) spot.x = -spot.size;
        if (spot.y < -spot.size) spot.y = h + spot.size;
        if (spot.y > h + spot.size) spot.y = -spot.size;

        ctx.save();
        ctx.translate(spot.x, spot.y);
        ctx.rotate(spot.rotation);
        ctx.beginPath();
        // Create irregular spot
        for (let j = 0; j < 6; j++) {
          const r = spot.size * (0.8 + Math.random() * 0.4);
          const angle = (j / 6) * Math.PI * 2;
          ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath();
        ctx.fillStyle = `rgba(0, 0, 0, ${spot.opacity})`;
        ctx.fill();
        ctx.restore();
      }
    };

    const drawBeach = () => {
      ctx.clearRect(0, 0, w, h);
      const img = beachImgRef.current;
      if (img && (mode === 'beach' || mode === 'sunset')) {
        const imgRatio = img.width / img.height;
        const screenRatio = w / h;
        let drawW, drawH;
        if (imgRatio > screenRatio) {
           drawH = h; drawW = drawH * imgRatio;
        } else {
           drawW = w; drawH = drawW / imgRatio;
        }
        ctx.globalAlpha = 0.3;
        ctx.drawImage(img, (w - drawW) / 2, (h - drawH) / 2, drawW, drawH);
        ctx.globalAlpha = 1;
      }

      for (const wave of wavesRef.current) {
        wave.phase += wave.speed;
        ctx.beginPath();
        ctx.moveTo(0, wave.y);
        for (let x = 0; x <= w; x += 10) {
          const y = wave.y + Math.sin(x * wave.frequency + wave.phase) * wave.amplitude;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.closePath();
        ctx.fillStyle = wave.color;
        ctx.globalAlpha = wave.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    };

    const loop = () => {
      if (mode === 'stars') drawStars();
      else if (mode === 'orbs') drawOrbs();
      else if (mode === 'animal' || mode === 'cheetah') drawAnimal();
      else if (mode === 'beach' || mode === 'sunset') drawBeach();
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
  }, [mode, isLightTheme, initStars, initOrbs, initAnimal, initBeach]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-auto touch-none"
      style={{ zIndex: 0 }}
    />
  );
}

export default memo(LandingBackgroundEffects);
