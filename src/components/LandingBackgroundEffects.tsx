import { memo, useEffect, useRef, useCallback } from 'react';
import { playRandomZen } from '@/utils/sounds';

export type EffectMode = 'off' | 'stars' | 'sunset';

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

// ─── Stars types ────────────────────────────────────────────────────────────
interface Star {
  x: number; y: number; baseX: number; baseY: number;
  size: number; opacity: number;
  twinkleSpeed: number; twinklePhase: number;
  vx: number; vy: number; glow?: boolean;
}
interface ShootingStar {
  x: number; y: number; vx: number; vy: number;
  age: number; maxAge: number; length: number;
}

// ─── Sunset types ────────────────────────────────────────────────────────────
interface WaterSparkle {
  x: number; y: number; vx: number; vy: number;
  opacity: number; maxOpacity: number;
  size: number; phase: number;
  life: number; maxLife: number;
}
interface Bird {
  x: number; y: number; baseY: number;
  speed: number; phase: number;
  waveAmplitude: number; waveFreq: number;
  size: number; opacity: number;
}
interface CloudPuff { dx: number; dy: number; rx: number; ry: number; }
interface Cloud {
  x: number; y: number;
  speed: number; opacity: number;
  puffs: CloudPuff[];
}
interface Rainbow {
  age: number; maxAge: number;
  radiusOffset: number; shimmerPhase: number;
}
interface Ripple {
  x: number; y: number;
  radius: number; opacity: number;
}

function LandingBackgroundEffects({
  mode,
  isLightTheme = false,
  disableSounds = false,
}: {
  mode: EffectMode;
  isLightTheme?: boolean;
  disableSounds?: boolean;
}) {
  const canvasRef      = useRef<HTMLCanvasElement>(null);
  const animRef        = useRef<number>(0);
  const initializedRef = useRef<EffectMode | null>(null);
  const disableSoundsRef = useRef(disableSounds);
  disableSoundsRef.current = disableSounds;

  // Stars refs
  const starsRef        = useRef<Star[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const pointerRef = useRef({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
    isDown: false, isActive: false,
  });

  // Sunset refs
  const birdsRef    = useRef<Bird[]>([]);
  const cloudsRef   = useRef<Cloud[]>([]);
  const sparklesRef = useRef<WaterSparkle[]>([]);
  const rainbowsRef = useRef<Rainbow[]>([]);
  const ripplesRef  = useRef<Ripple[]>([]);

  // ─── Init stars ───────────────────────────────────────────────────────────
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

  // ─── Init sunset scene ────────────────────────────────────────────────────
  const initSunset = useCallback((w: number, h: number) => {
    const horizonY = h * 0.52;

    // 5 birds at varying depths — larger = closer
    birdsRef.current = Array.from({ length: 5 }, (_, i) => {
      const baseY = horizonY * (0.18 + i * 0.14);
      return {
        x: Math.random() * w,
        y: baseY,
        baseY,
        speed: (Math.random() * 0.9 + 0.35) * (Math.random() > 0.5 ? 1 : -1),
        phase: Math.random() * Math.PI * 2,
        waveAmplitude: Math.random() * 14 + 6,
        waveFreq: Math.random() * 0.0025 + 0.0008,
        size: 3 + i * 1.1,   // depth: far birds small, near birds larger
        opacity: 0.45 + i * 0.1,
      };
    });

    // 4 soft clouds in the upper sky
    cloudsRef.current = Array.from({ length: 4 }, () => {
      const cw = Math.random() * 130 + 75;
      const ch = Math.random() * 38 + 22;
      return {
        x: Math.random() * w,
        y: Math.random() * horizonY * 0.48 + 18,
        speed: Math.random() * 0.12 + 0.04,
        opacity: Math.random() * 0.28 + 0.18,
        puffs: Array.from({ length: 5 }, () => ({
          dx: (Math.random() - 0.5) * cw * 0.85,
          dy: (Math.random() - 0.5) * ch * 0.55,
          rx: Math.random() * cw * 0.3 + cw * 0.18,
          ry: Math.random() * ch * 0.38 + ch * 0.18,
        })),
      };
    });

    sparklesRef.current = [];
    rainbowsRef.current = [];
    ripplesRef.current  = [];
  }, []);

  // ─── Main effect ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width  = window.innerWidth  * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width  = '100%';
      canvas.style.height = '100%';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const w = window.innerWidth;
    const h = window.innerHeight;

    if (initializedRef.current !== mode) {
      if (mode === 'stars')  initStars(w, h);
      if (mode === 'sunset') initSunset(w, h);
      initializedRef.current = mode;
    }

    let time = 0;

    // ── Spawn helpers ────────────────────────────────────────────────────────
    const spawnShootingStar = (x: number, y: number) => {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 10 + 8;
      shootingStarsRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        age: 0, maxAge: Math.random() * 0.8 + 0.6,
        length: Math.random() * 50 + 60,
      });
    };

    const spawnRainbow = () => {
      rainbowsRef.current.push({
        age: 0, maxAge: 10,
        radiusOffset: (Math.random() - 0.5) * 24,
        shimmerPhase: Math.random() * Math.PI * 2,
      });
    };

    const spawnRipple = (x: number, y: number) => {
      ripplesRef.current.push({ x, y, radius: 4, opacity: 0.65 });
    };

    // ── Pointer handlers ─────────────────────────────────────────────────────
    const handlePointerMove = (e: PointerEvent) => {
      pointerRef.current.x = e.clientX;
      pointerRef.current.y = e.clientY;
      pointerRef.current.isActive = true;
    };

    const handlePointerDown = (e: PointerEvent) => {
      unlockAudio();
      pointerRef.current.isDown   = true;
      pointerRef.current.isActive = true;
      pointerRef.current.x = e.clientX;
      pointerRef.current.y = e.clientY;

      if (mode === 'stars') {
        spawnShootingStar(e.clientX, e.clientY);
        if (!disableSoundsRef.current) playRandomZen(0.3);
      }

      if (mode === 'sunset') {
        spawnRainbow();
        const currentHorizon = h * 0.52;
        if (e.clientY > currentHorizon) spawnRipple(e.clientX, e.clientY);
        if (!disableSoundsRef.current) playRandomZen(0.22);
      }
    };

    const handlePointerUp = () => {
      pointerRef.current.isDown   = false;
      pointerRef.current.isActive = false;
    };

    window.addEventListener('pointermove',  handlePointerMove,  { passive: true });
    window.addEventListener('pointerup',    handlePointerUp,    { passive: true });
    window.addEventListener('pointercancel', handlePointerUp,   { passive: true });
    window.addEventListener('pointerdown',  handlePointerDown,  { passive: true });

    // ════════════════════════════════════════════════════════════════════════
    //  DRAW: STARS
    // ════════════════════════════════════════════════════════════════════════
    const drawStars = () => {
      ctx.clearRect(0, 0, w, h);
      time += 0.5;

      for (const star of starsRef.current) {
        const bdx = star.baseX - star.x;
        const bdy = star.baseY - star.y;
        star.vx += bdx * 0.05; star.vy += bdy * 0.05;
        star.vx *= 0.85;        star.vy *= 0.85;
        star.x  += star.vx;    star.y  += star.vy;

        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.5 + 0.5;
        const alpha   = Math.min(star.opacity * (twinkle * 0.7 + 0.3 + Math.random() * 0.1), 1);
        if (alpha < 0.05) continue;

        if (star.glow) { ctx.shadowBlur = 2; ctx.shadowColor = 'white'; }
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = isLightTheme
          ? `rgba(40,40,80,${alpha * 0.9})`
          : `rgba(255,255,255,${alpha})`;
        ctx.fill();
        if (star.glow) ctx.shadowBlur = 0;
      }

      for (let i = shootingStarsRef.current.length - 1; i >= 0; i--) {
        const ss = shootingStarsRef.current[i];
        ss.age += 0.016;
        if (ss.age >= ss.maxAge) { shootingStarsRef.current.splice(i, 1); continue; }
        const progress = ss.age / ss.maxAge;
        ss.x += ss.vx; ss.y += ss.vy;
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

    // ════════════════════════════════════════════════════════════════════════
    //  DRAW: SUNSET SHORE
    // ════════════════════════════════════════════════════════════════════════
    const drawSunset = () => {
      ctx.clearRect(0, 0, w, h);
      time += 0.5;

      const horizonY = h * 0.52;
      const sunX     = w * 0.5;
      const sunY     = horizonY - h * 0.13;

      // Tornasol: slow iridescent hue drift ±10° over ~100s
      const hueShift = Math.sin(time * 0.0006) * 10;

      // ── SKY GRADIENT ──────────────────────────────────────────────────────
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0,    `hsl(${208 + hueShift}, 50%, 83%)`);   // pale blue
      skyGrad.addColorStop(0.28, `hsl(${215 + hueShift}, 35%, 93%)`);   // near white
      skyGrad.addColorStop(0.60, `hsl(${27  + hueShift}, 68%, 83%)`);   // warm peach
      skyGrad.addColorStop(0.82, `hsl(${22  + hueShift}, 78%, 74%)`);   // orange-pink
      skyGrad.addColorStop(1,    `hsl(${32  + hueShift}, 88%, 68%)`);   // golden horizon
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, horizonY + 1);

      // ── CLOUDS ────────────────────────────────────────────────────────────
      for (const cloud of cloudsRef.current) {
        cloud.x += cloud.speed;
        if (cloud.x > w + 220) cloud.x = -220;
        ctx.save();
        ctx.globalAlpha = cloud.opacity;
        for (const puff of cloud.puffs) {
          const cx = cloud.x + puff.dx;
          const cy = cloud.y + puff.dy;
          const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, puff.rx);
          cg.addColorStop(0,   'rgba(255,245,235,0.95)');
          cg.addColorStop(0.5, 'rgba(255,225,205,0.5)');
          cg.addColorStop(1,   'rgba(255,200,180,0)');
          ctx.fillStyle = cg;
          ctx.beginPath();
          ctx.ellipse(cx, cy, puff.rx, puff.ry, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // ── SUN ───────────────────────────────────────────────────────────────
      // Atmospheric soft halo
      const atmG = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, h * 0.32);
      atmG.addColorStop(0,   'rgba(255,210,100,0.2)');
      atmG.addColorStop(0.38, 'rgba(255,170,60,0.08)');
      atmG.addColorStop(0.72, 'rgba(255,130,40,0.03)');
      atmG.addColorStop(1,   'rgba(255,100,20,0)');
      ctx.fillStyle = atmG;
      ctx.beginPath();
      ctx.arc(sunX, sunY, h * 0.32, 0, Math.PI * 2);
      ctx.fill();

      // Inner corona rings
      const rings: [number, number][] = [
        [h * 0.105, 0.07], [h * 0.072, 0.11],
        [h * 0.052, 0.16], [h * 0.034, 0.27],
      ];
      for (const [r, a] of rings) {
        const rg = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, r);
        rg.addColorStop(0, `rgba(255,210,105,${a})`);
        rg.addColorStop(1, 'rgba(255,150,50,0)');
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(sunX, sunY, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sun disk — subtle slow pulse
      const pulse  = Math.sin(time * 0.018) * 0.03 + 1;
      const sunR   = h * 0.042 * pulse;
      const diskG  = ctx.createRadialGradient(sunX - sunR * 0.22, sunY - sunR * 0.22, 0, sunX, sunY, sunR);
      diskG.addColorStop(0,   'rgba(255,255,228,1)');
      diskG.addColorStop(0.25,'rgba(255,240,155,1)');
      diskG.addColorStop(0.62,'rgba(255,192,68,0.96)');
      diskG.addColorStop(1,   'rgba(255,148,28,0.88)');
      ctx.fillStyle = diskG;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
      ctx.fill();

      // Horizontal lens flare streak
      const flareA = 0.16 + Math.sin(time * 0.024) * 0.04;
      const flareG = ctx.createLinearGradient(sunX - w * 0.3, sunY, sunX + w * 0.3, sunY);
      flareG.addColorStop(0,    'rgba(255,210,100,0)');
      flareG.addColorStop(0.42, `rgba(255,232,160,${flareA * 0.55})`);
      flareG.addColorStop(0.5,  `rgba(255,255,220,${flareA})`);
      flareG.addColorStop(0.58, `rgba(255,232,160,${flareA * 0.55})`);
      flareG.addColorStop(1,    'rgba(255,210,100,0)');
      ctx.fillStyle = flareG;
      ctx.fillRect(sunX - w * 0.3, sunY - 1.5, w * 0.6, 3);

      // ── RAINBOWS ──────────────────────────────────────────────────────────
      const rbColors: [number, number, number][] = [
        [255, 55, 55],   // red
        [255, 135, 28],  // orange
        [255, 228, 18],  // yellow
        [28,  200, 80],  // green
        [18,  172, 255], // cyan-blue
        [55,  75, 220],  // indigo
        [158, 28, 215],  // violet
      ];

      for (let i = rainbowsRef.current.length - 1; i >= 0; i--) {
        const rb = rainbowsRef.current[i];
        rb.age += 0.016;
        if (rb.age >= rb.maxAge) { rainbowsRef.current.splice(i, 1); continue; }

        const prog   = rb.age / rb.maxAge;
        const fadeIn  = Math.min(prog * 9, 1);
        const fadeOut = prog > 0.65 ? 1 - (prog - 0.65) / 0.35 : 1;
        const shimmer = Math.sin(time * 0.04 + rb.shimmerPhase) * 0.08 + 0.92;
        const alpha   = fadeIn * fadeOut * 0.62 * shimmer;

        // Center below horizon so arc peeks into sky
        const rbCX = w * 0.5;
        const rbCY = horizonY + h * 0.04;
        const baseR = Math.min(w, horizonY) * 0.74 + rb.radiusOffset;

        ctx.save();
        ctx.shadowBlur = 7;
        for (let c = 0; c < rbColors.length; c++) {
          const [r, g, b] = rbColors[c];
          const radius = baseR + (c - 3) * 13;
          if (radius <= 10) continue;
          ctx.strokeStyle  = `rgba(${r},${g},${b},${alpha})`;
          ctx.shadowColor  = `rgba(${r},${g},${b},${alpha * 0.45})`;
          ctx.lineWidth    = 9;
          ctx.beginPath();
          // Upper semicircle: counterclockwise from π (left) to 0 (right)
          ctx.arc(rbCX, rbCY, radius, Math.PI, 0, true);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // ── OCEAN BASE ────────────────────────────────────────────────────────
      const oceanG = ctx.createLinearGradient(0, horizonY, 0, h);
      oceanG.addColorStop(0,    `hsl(${195 + hueShift * 0.4}, 50%, 46%)`);
      oceanG.addColorStop(0.25, `hsl(${200 + hueShift * 0.25}, 58%, 33%)`);
      oceanG.addColorStop(0.65, `hsl(${205}, 66%, 23%)`);
      oceanG.addColorStop(1,    `hsl(${210}, 70%, 17%)`);
      ctx.fillStyle = oceanG;
      ctx.fillRect(0, horizonY, w, h - horizonY);

      // Horizon glow line
      const hzG = ctx.createLinearGradient(0, horizonY - 18, 0, horizonY + 18);
      hzG.addColorStop(0, 'rgba(255,200,100,0)');
      hzG.addColorStop(0.5, 'rgba(255,215,130,0.32)');
      hzG.addColorStop(1, 'rgba(255,180,80,0)');
      ctx.fillStyle = hzG;
      ctx.fillRect(0, horizonY - 18, w, 36);

      // ── SUN REFLECTION COLUMN ─────────────────────────────────────────────
      const refW = w * 0.11 + Math.sin(time * 0.011) * w * 0.014;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(sunX - refW * 0.18, horizonY);
      ctx.lineTo(sunX - refW * 1.5,  h);
      ctx.lineTo(sunX + refW * 1.5,  h);
      ctx.lineTo(sunX + refW * 0.18, horizonY);
      ctx.closePath();
      const refG = ctx.createLinearGradient(0, horizonY, 0, h);
      refG.addColorStop(0,    'rgba(255,228,120,0.68)');
      refG.addColorStop(0.22, 'rgba(255,205,82,0.38)');
      refG.addColorStop(0.55, 'rgba(255,178,50,0.18)');
      refG.addColorStop(1,    'rgba(255,152,30,0.04)');
      ctx.fillStyle = refG;
      ctx.fill();
      ctx.restore();

      // ── WAVE LAYERS ───────────────────────────────────────────────────────
      // 4 layers from near-horizon to foreground, each progressively larger
      const waveDefs = [
        { fy: 0.06,  amp: 6,  freq: 0.013, spd: 0.55, alp: 0.09, lw: 1   },
        { fy: 0.20,  amp: 9,  freq: 0.011, spd: 0.44, alp: 0.13, lw: 1.5 },
        { fy: 0.44,  amp: 12, freq: 0.009, spd: 0.34, alp: 0.17, lw: 2   },
        { fy: 0.74,  amp: 15, freq: 0.007, spd: 0.26, alp: 0.21, lw: 2.5 },
      ];

      for (const wd of waveDefs) {
        const wy = horizonY + (h - horizonY) * wd.fy;
        // Filled wave shape
        ctx.beginPath();
        ctx.moveTo(0, wy);
        for (let x = 0; x <= w; x += 4) {
          ctx.lineTo(x, wy + Math.sin(x * wd.freq + time * wd.spd) * wd.amp);
        }
        ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
        ctx.fillStyle = `rgba(255,255,255,${wd.alp})`;
        ctx.fill();
        // Crest highlight stroke
        ctx.beginPath();
        ctx.moveTo(0, wy);
        for (let x = 0; x <= w; x += 4) {
          ctx.lineTo(x, wy + Math.sin(x * wd.freq + time * wd.spd) * wd.amp);
        }
        ctx.strokeStyle = `rgba(255,255,255,${wd.alp * 1.9})`;
        ctx.lineWidth   = wd.lw;
        ctx.stroke();
      }

      // ── WATER SPARKLES ────────────────────────────────────────────────────
      // Spawn sparkles along the sun reflection band
      if (sparklesRef.current.length < 55 && Math.random() < 0.28) {
        const progDown  = Math.random(); // 0=horizon, 1=bottom
        const sy        = horizonY + (h - horizonY) * progDown * 0.85;
        const halfBand  = refW * (0.2 + progDown * 1.3);
        const sx        = sunX + (Math.random() - 0.5) * halfBand * 2;
        sparklesRef.current.push({
          x: sx, y: sy,
          vx: (Math.random() - 0.5) * 0.25,
          vy: -Math.random() * 0.35 - 0.08,
          opacity: 0, maxOpacity: Math.random() * 0.72 + 0.38,
          size: Math.random() * 2.2 + 0.4,
          phase: Math.random() * Math.PI * 2,
          life: 0, maxLife: Math.random() * 1.8 + 1.2,
        });
      }

      for (let i = sparklesRef.current.length - 1; i >= 0; i--) {
        const sp = sparklesRef.current[i];
        sp.life += 0.016;
        if (sp.life >= sp.maxLife) { sparklesRef.current.splice(i, 1); continue; }
        sp.x += sp.vx; sp.y += sp.vy;
        sp.phase += 0.1;
        const lp      = sp.life / sp.maxLife;
        const fade    = lp < 0.2 ? lp * 5 : lp > 0.7 ? 1 - (lp - 0.7) / 0.3 : 1;
        const twinkle = Math.sin(sp.phase) * 0.28 + 0.72;
        const alpha   = sp.maxOpacity * fade * twinkle;

        ctx.save();
        ctx.shadowBlur  = 5;
        ctx.shadowColor = `rgba(255,242,180,${alpha})`;
        ctx.fillStyle   = `rgba(255,252,222,${alpha})`;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fill();
        // Star-cross for brighter sparkles
        if (sp.size > 1.4) {
          const cs = sp.size * 2.2;
          ctx.strokeStyle = `rgba(255,255,240,${alpha * 0.65})`;
          ctx.lineWidth   = 0.7;
          ctx.beginPath();
          ctx.moveTo(sp.x - cs, sp.y); ctx.lineTo(sp.x + cs, sp.y);
          ctx.moveTo(sp.x, sp.y - cs); ctx.lineTo(sp.x, sp.y + cs);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
        ctx.restore();
      }

      // ── RIPPLES (water tap) ───────────────────────────────────────────────
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const rp = ripplesRef.current[i];
        rp.radius  += 1.9;
        rp.opacity -= 0.011;
        if (rp.opacity <= 0) { ripplesRef.current.splice(i, 1); continue; }
        // 3 concentric rings
        for (let r = 0; r < 3; r++) {
          const ringR = rp.radius * (0.38 + r * 0.31);
          if (ringR < 2) continue;
          ctx.beginPath();
          ctx.arc(rp.x, rp.y, ringR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255,255,255,${rp.opacity * (1 - r * 0.28)})`;
          ctx.lineWidth   = 1.4;
          ctx.stroke();
        }
      }

      // ── BIRDS ─────────────────────────────────────────────────────────────
      for (const bird of birdsRef.current) {
        bird.x    += bird.speed;
        bird.phase += 0.055;

        // Wrap around horizontally
        if (bird.x >  w + 110) bird.x = -110;
        if (bird.x < -110)     bird.x =  w + 110;

        // Gentle undulating flight path
        bird.y = bird.baseY
          + Math.sin(bird.x * bird.waveFreq + bird.phase * 0.14) * bird.waveAmplitude;

        const sz = bird.size;
        // Wing flap: 0.18 (up) to 0.65 (down)
        const wingA  = Math.sin(bird.phase) * 0.24 + 0.42;
        const rwingA = Math.sin(bird.phase + 0.22) * 0.24 + 0.42;

        ctx.save();
        ctx.translate(bird.x, bird.y);
        if (bird.speed < 0) ctx.scale(-1, 1);

        ctx.strokeStyle = `rgba(28,18,12,${bird.opacity})`;
        ctx.lineWidth   = sz * 0.52;
        ctx.lineCap     = 'round';
        ctx.lineJoin    = 'round';

        // Body
        ctx.beginPath();
        ctx.moveTo(-sz * 0.6, 0);
        ctx.lineTo( sz * 0.48, sz * 0.08);
        ctx.stroke();

        // Pelican beak (long, angled downward)
        ctx.beginPath();
        ctx.moveTo(sz * 0.48, sz * 0.08);
        ctx.lineTo(sz * 1.65, sz * 0.48);
        ctx.stroke();

        // Throat pouch hint
        ctx.beginPath();
        ctx.arc(sz * 1.1, sz * 0.42, sz * 0.22, 0, Math.PI);
        ctx.strokeStyle = `rgba(28,18,12,${bird.opacity * 0.4})`;
        ctx.lineWidth   = sz * 0.35;
        ctx.stroke();

        // Left wing
        ctx.strokeStyle = `rgba(28,18,12,${bird.opacity})`;
        ctx.lineWidth   = sz * 0.52;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(-sz * 1.35, -sz * 2.1 * wingA,  -sz * 2.9, -sz * wingA  * 0.45);
        ctx.stroke();

        // Right wing
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo( sz * 1.35, -sz * 2.1 * rwingA,  sz * 2.9, -sz * rwingA * 0.45);
        ctx.stroke();

        ctx.restore();
      }
    };

    // ─── Animation loop ───────────────────────────────────────────────────────
    const loop = () => {
      if (mode === 'stars')  drawStars();
      if (mode === 'sunset') drawSunset();
      animRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize',       resize);
      window.removeEventListener('pointermove',  handlePointerMove);
      window.removeEventListener('pointerup',    handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('pointerdown',  handlePointerDown);
    };
  }, [mode, isLightTheme, initStars, initSunset]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-auto touch-none"
      style={{ zIndex: 0 }}
    />
  );
}

export default memo(LandingBackgroundEffects);
