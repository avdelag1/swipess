import { memo, useEffect, useRef, useCallback } from 'react';
import { playRandomZen, playJungleSound } from '@/utils/sounds';

export type EffectMode = 'cheetah' | 'stars' | 'orbs' | 'sunset';

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
  x: number; y: number; baseX: number; baseY: number;
  size: number; opacity: number; twinkleSpeed: number; twinklePhase: number;
  vx: number; vy: number;
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
    isDown: false, isActive: false,
  });

  const initStars = useCallback((w: number, h: number) => {
    const count = Math.floor((w * h) / 1200);
    starsRef.current = Array.from({ length: Math.min(count, 500) }, () => {
      const x = Math.random() * w;
      const y = Math.random() * h;
      return {
        x, y, baseX: x, baseY: y, vx: 0, vy: 0,
        size: Math.random() * 1.2 + 0.5,
        opacity: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.08 + 0.02,
        twinklePhase: Math.random() * Math.PI * 2,
      };
    });
  }, []);

  const initOrbs = useCallback((w: number, h: number) => {
    const colors: [number, number, number][] = [
      [255, 105, 180], [255, 165, 0], [138, 43, 226],
      [0, 191, 255], [255, 20, 147], [50, 205, 50],
    ];
    orbsRef.current = Array.from({ length: 10 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - 0.5) * 2, vy: (Math.random() - 0.5) * 2,
      radius: Math.random() * 120 + 80,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.3 + 0.12,
      mass: Math.random() * 0.5 + 0.5,
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
      initializedRef.current = mode;
    }

    let time = 0;

    const spawnShootingStar = (x: number, y: number) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 6;
      shootingStarsRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        age: 0, maxAge: Math.random() * 1 + 0.8,
        length: Math.random() * 30 + 40,
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

    const spawnCloudPuff = (x: number, y: number) => {
      const particles: CloudParticle[] = Array.from({ length: 10 }, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 0.8 + 0.3;
        return {
          x: x + (Math.random() - 0.5) * 20,
          y: y + (Math.random() - 0.5) * 20,
          vx: Math.cos(angle) * speed,
          vy: -Math.random() * 0.6 - 0.2, // float upward
          radius: Math.random() * 6 + 3,
          opacity: 0.7 + Math.random() * 0.3,
        };
      });
      cloudsRef.current.push({
        x, y, birth: performance.now(), particles,
        hasRainbow: Math.random() < 0.05,
        hasSunRay: Math.random() < 0.05,
      });
    };

    // Pointer move on window (no sound)
    const handlePointerMove = (e: PointerEvent) => {
      pointerRef.current.x = e.clientX;
      pointerRef.current.y = e.clientY;
      pointerRef.current.isActive = true;
    };

    // Pointer down on CANVAS only (sound + effects)
    const handleCanvasPointerDown = (e: PointerEvent) => {
      pointerRef.current.isDown = true;
      pointerRef.current.isActive = true;
      pointerRef.current.x = e.clientX;
      pointerRef.current.y = e.clientY;

      // Play exactly ONE sound per tap, based on mode (preloaded for zero latency)
      if (!disableSoundsRef.current) {
        if (mode === 'stars' || mode === 'orbs' || mode === 'sunset') {
          playRandomZen(0.3);
        } else if (mode === 'cheetah') {
          playJungleSound(0.3);
        }
      }

      // Mode-specific visual effects
      if (mode === 'stars') {
        const roll = Math.random();
        if (roll < 0.34) spawnShootingStar(e.clientX, e.clientY);
        else if (roll < 0.67) spawnOrbUFO(e.clientX, e.clientY);
        else spawnSaucerUFO(e.clientX, e.clientY);
      }
      if (mode === 'cheetah') {
        ripplesRef.current.push({
          x: e.clientX, y: e.clientY,
          birth: performance.now(),
          maxRadius: 200,
        });
      }
      if (mode === 'sunset') {
        spawnCloudPuff(e.clientX, e.clientY);
      }
    };

    const handlePointerUp = () => {
      pointerRef.current.isDown = false;
      pointerRef.current.isActive = false;
    };

    // Attach ALL listeners to window so taps work even through UI layers
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('pointerdown', handleCanvasPointerDown);

    // ── Stars drawing ──
    const drawStars = () => {
      ctx.clearRect(0, 0, w, h);
      time += 0.5;
      for (const star of starsRef.current) {
        const bdx = star.baseX - star.x;
        const bdy = star.baseY - star.y;
        star.vx += bdx * 0.05; star.vy += bdy * 0.05;
        star.vx *= 0.85; star.vy *= 0.85;
        star.x += star.vx; star.y += star.vy;
        const noise = Math.random() * 0.2;
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.5 + 0.5;
        const alpha = Math.min(star.opacity * (twinkle * 0.8 + noise), 1);
        if (alpha < 0.01) continue;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = isLightTheme ? `rgba(40,40,80,${alpha * 0.9})` : `rgba(255,255,255,${alpha})`;
        ctx.fill();
      }
      // Shooting stars
      for (let i = shootingStarsRef.current.length - 1; i >= 0; i--) {
        const ss = shootingStarsRef.current[i];
        ss.age += 0.016;
        if (ss.age >= ss.maxAge) { shootingStarsRef.current.splice(i, 1); continue; }
        const progress = ss.age / ss.maxAge;
        ss.x += ss.vx; ss.y += ss.vy;
        const fadeAlpha = 1 - progress * 0.7;
        const angle = Math.atan2(ss.vy, ss.vx);
        const tailStartX = ss.x - Math.cos(angle) * ss.length;
        const tailStartY = ss.y - Math.sin(angle) * ss.length;
        const gradient = ctx.createLinearGradient(tailStartX, tailStartY, ss.x, ss.y);
        if (isLightTheme) {
          gradient.addColorStop(0, `rgba(100,100,200,0)`);
          gradient.addColorStop(0.5, `rgba(80,80,180,${fadeAlpha * 0.3})`);
          gradient.addColorStop(1, `rgba(60,60,160,${fadeAlpha * 0.6})`);
        } else {
          gradient.addColorStop(0, `rgba(255,255,255,0)`);
          gradient.addColorStop(0.5, `rgba(200,220,255,${fadeAlpha * 0.4})`);
          gradient.addColorStop(1, `rgba(255,255,255,${fadeAlpha})`);
        }
        ctx.strokeStyle = gradient; ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(tailStartX, tailStartY); ctx.lineTo(ss.x, ss.y); ctx.stroke();
        ctx.beginPath(); ctx.arc(ss.x, ss.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = isLightTheme ? `rgba(60,60,160,${fadeAlpha * 0.6})` : `rgba(255,255,255,${fadeAlpha})`; ctx.fill();
        ctx.beginPath(); ctx.arc(ss.x, ss.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = isLightTheme ? `rgba(100,80,200,${fadeAlpha * 0.2})` : `rgba(255,220,180,${fadeAlpha * 0.3})`; ctx.fill();
      }

      // ── Orb UFOs ──
      for (let i = orbUFOsRef.current.length - 1; i >= 0; i--) {
        const orb = orbUFOsRef.current[i];
        orb.age += 0.016;
        if (orb.age >= orb.maxAge) { orbUFOsRef.current.splice(i, 1); continue; }
        const progress = orb.age / orb.maxAge;
        // Fade in/out envelope
        const fadeAlpha = progress < 0.15
          ? progress / 0.15
          : progress > 0.75
            ? (1 - progress) / 0.25
            : 1;
        // Bob up and down
        orb.bobPhase += 0.04;
        orb.x += orb.vx;
        orb.y += orb.vy + Math.sin(orb.bobPhase) * 0.4;
        orb.pulsePhase += 0.08;
        const pulse = Math.sin(orb.pulsePhase) * 0.3 + 0.7;
        const [r, g, b] = orb.color;
        // Outer glow
        const glowR = orb.radius * (2.5 + pulse * 0.8);
        const glow = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, glowR);
        glow.addColorStop(0, `rgba(${r},${g},${b},${fadeAlpha * 0.5})`);
        glow.addColorStop(0.4, `rgba(${r},${g},${b},${fadeAlpha * 0.2})`);
        glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath(); ctx.arc(orb.x, orb.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = glow; ctx.fill();
        // Core sphere with specular highlight
        const coreGrad = ctx.createRadialGradient(
          orb.x - orb.radius * 0.3, orb.y - orb.radius * 0.3, orb.radius * 0.05,
          orb.x, orb.y, orb.radius
        );
        coreGrad.addColorStop(0, `rgba(255,255,255,${fadeAlpha * 0.95})`);
        coreGrad.addColorStop(0.25, `rgba(${r},${g},${b},${fadeAlpha * 0.9})`);
        coreGrad.addColorStop(0.7, `rgba(${Math.round(r * 0.6)},${Math.round(g * 0.6)},${Math.round(b * 0.6)},${fadeAlpha * 0.8})`);
        coreGrad.addColorStop(1, `rgba(0,0,0,${fadeAlpha * 0.5})`);
        ctx.beginPath(); ctx.arc(orb.x, orb.y, orb.radius * pulse, 0, Math.PI * 2);
        ctx.fillStyle = coreGrad; ctx.fill();
        // Small trail dots
        for (let t = 1; t <= 3; t++) {
          const tx = orb.x - orb.vx * t * 2.5;
          const ty = orb.y - orb.vy * t * 2.5;
          const ta = fadeAlpha * (0.3 / t);
          const tr = orb.radius * (0.4 / t);
          ctx.beginPath(); ctx.arc(tx, ty, tr, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${ta})`; ctx.fill();
        }
      }

      // ── Saucer UFOs ──
      for (let i = saucerUFOsRef.current.length - 1; i >= 0; i--) {
        const ufo = saucerUFOsRef.current[i];
        ufo.age += 0.016;
        if (ufo.age >= ufo.maxAge) { saucerUFOsRef.current.splice(i, 1); continue; }
        const progress = ufo.age / ufo.maxAge;
        const fadeAlpha = progress < 0.12
          ? progress / 0.12
          : progress > 0.8
            ? (1 - progress) / 0.2
            : 1;
        ufo.wobblePhase += 0.05;
        ufo.x += ufo.vx;
        ufo.y += ufo.vy + Math.sin(ufo.wobblePhase) * 0.5;
        const s = ufo.size;
        ctx.save();
        ctx.translate(ufo.x, ufo.y);
        ctx.globalAlpha = fadeAlpha;

        // Beam of light below
        if (ufo.beamOn) {
          const beamPulse = Math.sin(ufo.wobblePhase * 2) * 0.3 + 0.7;
          const beamGrad = ctx.createLinearGradient(0, s * 0.3, 0, s * 2.5);
          beamGrad.addColorStop(0, `rgba(160,255,200,${0.35 * beamPulse})`);
          beamGrad.addColorStop(0.6, `rgba(100,255,180,${0.1 * beamPulse})`);
          beamGrad.addColorStop(1, 'rgba(100,255,180,0)');
          ctx.beginPath();
          ctx.moveTo(-s * 0.6, s * 0.3);
          ctx.lineTo(s * 0.6, s * 0.3);
          ctx.lineTo(s * 1.1, s * 2.5);
          ctx.lineTo(-s * 1.1, s * 2.5);
          ctx.closePath();
          ctx.fillStyle = beamGrad;
          ctx.fill();
        }

        // Saucer body (flattened ellipse)
        const bodyGrad = ctx.createRadialGradient(0, -s * 0.1, s * 0.1, 0, 0, s);
        bodyGrad.addColorStop(0, 'rgba(210,230,255,0.95)');
        bodyGrad.addColorStop(0.4, 'rgba(140,170,220,0.9)');
        bodyGrad.addColorStop(0.8, 'rgba(80,100,160,0.85)');
        bodyGrad.addColorStop(1, 'rgba(40,50,100,0.8)');
        ctx.beginPath();
        ctx.ellipse(0, 0, s, s * 0.32, 0, 0, Math.PI * 2);
        ctx.fillStyle = bodyGrad;
        ctx.fill();
        // Rim highlight line
        ctx.beginPath();
        ctx.ellipse(0, 0, s, s * 0.32, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(180,210,255,0.7)`;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Dome on top
        const domeGrad = ctx.createRadialGradient(-s * 0.15, -s * 0.45, s * 0.05, 0, -s * 0.3, s * 0.45);
        domeGrad.addColorStop(0, 'rgba(255,255,255,0.9)');
        domeGrad.addColorStop(0.4, 'rgba(160,220,255,0.7)');
        domeGrad.addColorStop(1, 'rgba(80,140,200,0.3)');
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.3, s * 0.42, s * 0.38, 0, Math.PI, 0, true);
        ctx.fillStyle = domeGrad;
        ctx.fill();

        // Rotating rim lights
        const lightPulse = (Math.sin(ufo.wobblePhase * 3) * 0.5 + 0.5);
        for (const light of ufo.lights) {
          const lx = Math.cos(light.angle + ufo.wobblePhase * 1.5) * s * 0.75;
          const ly = Math.sin(light.angle + ufo.wobblePhase * 1.5) * s * 0.14;
          const lightGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, s * 0.13);
          const h = light.hue;
          lightGrad.addColorStop(0, `hsla(${h},100%,80%,${0.9 * lightPulse})`);
          lightGrad.addColorStop(0.5, `hsla(${h},100%,60%,${0.4 * lightPulse})`);
          lightGrad.addColorStop(1, `hsla(${h},100%,50%,0)`);
          ctx.beginPath();
          ctx.arc(lx, ly, s * 0.13, 0, Math.PI * 2);
          ctx.fillStyle = lightGrad;
          ctx.fill();
        }

        // Outer glow aura
        const auraGrad = ctx.createRadialGradient(0, 0, s * 0.5, 0, 0, s * 1.6);
        auraGrad.addColorStop(0, `rgba(120,200,255,${0.12 * lightPulse})`);
        auraGrad.addColorStop(1, 'rgba(120,200,255,0)');
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 1.6, s * 0.6, 0, 0, Math.PI * 2);
        ctx.fillStyle = auraGrad;
        ctx.fill();

        ctx.restore();
      }
    };

    // ── Orbs drawing ──
    const drawOrbs = () => {
      ctx.clearRect(0, 0, w, h);
      const { x: px, y: py, isDown } = pointerRef.current;
      for (const orb of orbsRef.current) {
        orb.x += orb.vx; orb.y += orb.vy;
        if (pointerRef.current.isActive) {
          const dx = px - orb.x; const dy = py - orb.y;
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
        const cs = Math.sqrt(orb.vx * orb.vx + orb.vy * orb.vy);
        if (cs > maxSpeed) { orb.vx = (orb.vx / cs) * maxSpeed; orb.vy = (orb.vy / cs) * maxSpeed; }
        const padding = orb.radius * 0.5;
        if (orb.x - padding < 0) orb.vx += 0.2;
        if (orb.x + padding > w) orb.vx -= 0.2;
        if (orb.y - padding < 0) orb.vy += 0.2;
        if (orb.y + padding > h) orb.vy -= 0.2;
        const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
        const [r, g, b] = orb.color;
        const finalOpacity = isDown ? Math.min(orb.opacity * 1.5, 0.8) : orb.opacity;
        gradient.addColorStop(0, `rgba(${r},${g},${b},${finalOpacity})`);
        gradient.addColorStop(0.5, `rgba(${r},${g},${b},${finalOpacity * 0.4})`);
        gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.beginPath(); ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient; ctx.fill();
      }
    };

    // ── Cheetah drawing with fur ripple ──
    const drawCheetah = () => {
      const img = cheetahImgRef.current;
      if (!img) {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = isLightTheme ? '#f8f8f8' : '#050505';
        ctx.fillRect(0, 0, w, h);
        return;
      }

      // Breathing scale
      const breathCycle = (Math.sin(performance.now() / 2000) * 0.5 + 0.5);
      const scale = 1 + breathCycle * 0.03;

      const imgRatio = img.width / img.height;
      const screenRatio = w / h;
      let drawW: number, drawH: number;
      if (imgRatio > screenRatio) {
        drawH = h * scale; drawW = drawH * imgRatio;
      } else {
        drawW = w * scale; drawH = drawW / imgRatio;
      }
      const offX = (w - drawW) / 2;
      const offY = (h - drawH) / 2;

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, offX, offY, drawW, drawH);

      // Apply ripple distortion
      const now = performance.now();
      const duration = 800;
      const activeRipples = ripplesRef.current.filter(r => now - r.birth < duration);
      ripplesRef.current = activeRipples;

      if (activeRipples.length > 0) {
        const imageData = ctx.getImageData(0, 0, w, h);
        const src = new Uint8ClampedArray(imageData.data);
        const dst = imageData.data;

        for (const ripple of activeRipples) {
          const elapsed = now - ripple.birth;
          const progress = elapsed / duration;
          const currentRadius = progress * ripple.maxRadius;
          const fadeOut = 1 - progress;
          const amplitude = 12 * fadeOut;
          const waveWidth = 30;

          const minX = Math.max(0, Math.floor(ripple.x - currentRadius - waveWidth));
          const maxX = Math.min(w - 1, Math.ceil(ripple.x + currentRadius + waveWidth));
          const minY = Math.max(0, Math.floor(ripple.y - currentRadius - waveWidth));
          const maxY = Math.min(h - 1, Math.ceil(ripple.y + currentRadius + waveWidth));

          for (let py = minY; py <= maxY; py++) {
            for (let px = minX; px <= maxX; px++) {
              const dx = px - ripple.x;
              const dy = py - ripple.y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              const distFromRing = Math.abs(dist - currentRadius);
              if (distFromRing > waveWidth) continue;

              const waveFactor = Math.cos((distFromRing / waveWidth) * Math.PI * 0.5);
              const displacement = Math.sin((dist - currentRadius) * 0.3) * amplitude * waveFactor;

              if (dist === 0) continue;
              const srcX = Math.round(px + (dx / dist) * displacement);
              const srcY = Math.round(py + (dy / dist) * displacement);

              if (srcX >= 0 && srcX < w && srcY >= 0 && srcY < h) {
                const dstIdx = (py * w + px) * 4;
                const srcIdx = (srcY * w + srcX) * 4;
                dst[dstIdx] = src[srcIdx];
                dst[dstIdx + 1] = src[srcIdx + 1];
                dst[dstIdx + 2] = src[srcIdx + 2];
                dst[dstIdx + 3] = src[srcIdx + 3];
              }
            }
          }
        }
        ctx.putImageData(imageData, 0, 0);
      }

      // Subtle warm overlay for depth
      ctx.fillStyle = 'rgba(20, 10, 0, 0.15)';
      ctx.fillRect(0, 0, w, h);
    };

    // ── Sunset drawing with beach image + cloud puffs ──
    const drawSunset = () => {
      const now = performance.now();
      const img = beachImgRef.current;

      if (img) {
        // Draw beach image as full background (cover)
        const imgRatio = img.width / img.height;
        const screenRatio = w / h;
        let drawW: number, drawH: number;
        if (imgRatio > screenRatio) {
          drawH = h; drawW = drawH * imgRatio;
        } else {
          drawW = w; drawH = drawW / imgRatio;
        }
        const offX = (w - drawW) / 2;
        const offY = (h - drawH) / 2;
        ctx.drawImage(img, offX, offY, drawW, drawH);

        // Subtle warm sunset overlay for depth
        const t = now / 20000;
        const shift1 = Math.sin(t) * 0.5 + 0.5;
        const overlayGrad = ctx.createLinearGradient(0, 0, 0, h);
        overlayGrad.addColorStop(0, `rgba(255,${Math.round(140 + shift1 * 40)},80,0.08)`);
        overlayGrad.addColorStop(0.5, 'rgba(255,200,150,0.05)');
        overlayGrad.addColorStop(1, `rgba(255,100,${Math.round(100 + shift1 * 50)},0.1)`);
        ctx.fillStyle = overlayGrad;
        ctx.fillRect(0, 0, w, h);
      } else {
        // Fallback: warm gradient while image loads
        ctx.fillStyle = '#1a0a05';
        ctx.fillRect(0, 0, w, h);
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, 'rgba(255,120,80,0.3)');
        grad.addColorStop(0.5, 'rgba(255,180,100,0.2)');
        grad.addColorStop(1, 'rgba(80,20,60,0.4)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }

      // Draw cloud puffs
      const cloudDuration = 1200; // 1.2 seconds total
      const expandTime = 400;
      const activeClouds = cloudsRef.current.filter(c => now - c.birth < cloudDuration);
      cloudsRef.current = activeClouds;

      for (const cloud of activeClouds) {
        const elapsed = now - cloud.birth;
        const totalProgress = elapsed / cloudDuration;

        if (elapsed < expandTime) {
          // Phase 1: Cloud expanding
          const expandProgress = elapsed / expandTime;
          const cloudRadius = expandProgress * 50;
          const cloudOpacity = 0.6 * (1 - expandProgress * 0.3);

          // Draw fluffy cloud (overlapping circles)
          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const cx = cloud.x + Math.cos(angle) * cloudRadius * 0.3;
            const cy = cloud.y + Math.sin(angle) * cloudRadius * 0.3;
            const r = cloudRadius * (0.5 + Math.random() * 0.2);

            const cGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
            cGrad.addColorStop(0, `rgba(255,255,255,${cloudOpacity})`);
            cGrad.addColorStop(0.6, `rgba(255,245,235,${cloudOpacity * 0.5})`);
            cGrad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fillStyle = cGrad;
            ctx.fill();
          }

          // Rare rainbow effect
          if (cloud.hasRainbow && expandProgress > 0.5) {
            const rainbowOpacity = (expandProgress - 0.5) * 2 * 0.3 * (1 - totalProgress);
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y + 30, 40, Math.PI, 0, false);
            ctx.lineWidth = 3;
            const rainbowGrad = ctx.createLinearGradient(cloud.x - 40, cloud.y, cloud.x + 40, cloud.y);
            rainbowGrad.addColorStop(0, `rgba(255,0,0,${rainbowOpacity})`);
            rainbowGrad.addColorStop(0.2, `rgba(255,165,0,${rainbowOpacity})`);
            rainbowGrad.addColorStop(0.4, `rgba(255,255,0,${rainbowOpacity})`);
            rainbowGrad.addColorStop(0.6, `rgba(0,255,0,${rainbowOpacity})`);
            rainbowGrad.addColorStop(0.8, `rgba(0,0,255,${rainbowOpacity})`);
            rainbowGrad.addColorStop(1, `rgba(128,0,255,${rainbowOpacity})`);
            ctx.strokeStyle = rainbowGrad;
            ctx.stroke();
          }
        } else {
          // Phase 2: Break into mist particles floating up
          const mistProgress = (elapsed - expandTime) / (cloudDuration - expandTime);
          const fadeOut = 1 - mistProgress;

          for (const p of cloud.particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy -= 0.005; // drift upward more
            const alpha = p.opacity * fadeOut;
            if (alpha < 0.01) continue;

            const pGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
            pGrad.addColorStop(0, `rgba(255,255,255,${alpha})`);
            pGrad.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * (1 + mistProgress * 0.5), 0, Math.PI * 2);
            ctx.fillStyle = pGrad;
            ctx.fill();
          }
        }

        // Rare sun ray shimmer
        if (cloud.hasSunRay && totalProgress < 0.6) {
          const rayOpacity = 0.15 * (1 - totalProgress / 0.6);
          for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + now * 0.0005;
            const rayLen = 60 + Math.sin(now * 0.002 + i) * 20;
            ctx.beginPath();
            ctx.moveTo(cloud.x, cloud.y);
            ctx.lineTo(
              cloud.x + Math.cos(angle) * rayLen,
              cloud.y + Math.sin(angle) * rayLen
            );
            ctx.strokeStyle = `rgba(255,220,150,${rayOpacity})`;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      if (mode === 'stars') drawStars();
      if (mode === 'orbs') drawOrbs();
      if (mode === 'cheetah') drawCheetah();
      if (mode === 'sunset') drawSunset();
      animRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('pointerdown', handleCanvasPointerDown);
    };
  }, [mode, initStars, initOrbs, isLightTheme]);

  // In light theme, 'screen' blend mode makes dark particles invisible on white bg
  // Use 'multiply' instead (dark colors show on white, transparent on black)
   const getBlendMode = () => {
    if (mode === 'cheetah' || mode === 'sunset') return 'normal';
    if (isLightTheme) return 'normal';
    return 'screen';
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0"
      style={{
        mixBlendMode: getBlendMode(),
        pointerEvents: 'none',
      }}
    />
  );
}

export default memo(LandingBackgroundEffects);
