import { memo, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { uiSounds } from '@/utils/uiSounds';

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
  vx: number; vy: number; glow?: boolean; driftSpeed: number;
}
interface ShootingStar {
  x: number; y: number; vx: number; vy: number;
  age: number; maxAge: number; length: number;
  width: number;
  type: 'tiny' | 'medium' | 'typical';
}

// ─── Sunset types ────────────────────────────────────────────────────────────
interface Cloud {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
  id: number;
}

interface Ripple {
  x: number;
  y: number;
  r: number;
  maxR: number;
  opacity: number;
}

interface Airplane {
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
}

function LandingBackgroundEffects({ mode, isLightTheme = false, disableSounds = false }: { mode: EffectMode; isLightTheme?: boolean; disableSounds?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const starsRef = useRef<Star[]>([]);
  const cloudsRef = useRef<Cloud[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const airplanesRef = useRef<Airplane[]>([]);
  
  const initializedRef = useRef<EffectMode | null>(null);
  const disableSoundsRef = useRef(disableSounds);
  disableSoundsRef.current = disableSounds;

  const pointerRef = useRef({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
    isDown: false,
    isActive: false
  });
  const lastFrameTimeRef = useRef(0);

  const initStars = useCallback((w: number, h: number) => {
    // 💨 Speed of Light optimization: Reduced particle density for higher FPS
    const count = Math.floor((w * h) / 1200);
    starsRef.current = Array.from({ length: Math.min(count, 450) }, () => {
      const x = Math.random() * w;
      const y = Math.random() * h;
      return {
        x, y, baseX: x, baseY: y, vx: 0, vy: 0,
        size: Math.random() * 0.75 + 0.15,
        opacity: Math.random() * 0.55 + 0.35,
        twinkleSpeed: Math.random() * 0.01 + 0.001,
        twinklePhase: Math.random() * Math.PI * 2,
        glow: Math.random() > 0.85,
        driftSpeed: Math.random() * 0.15 + 0.08,
      };
    });
  }, []);

  const initClouds = useCallback((w: number, h: number) => {
    cloudsRef.current = Array.from({ length: 5 }, (_, i) => ({
      x: Math.random() * w,
      y: (h * 0.1) + Math.random() * (h * 0.3),
      w: 120 + Math.random() * 100,
      h: 40 + Math.random() * 30,
      speed: 0.15 + Math.random() * 0.25,
      id: i
    }));
  }, []);

  const shootingStarsRef = useRef<ShootingStar[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      // Cap DPR at 1 — retina canvas doubles pixel count with minimal visual gain
      // on an animation, but cuts fill rate and JS-side work in half.
      const dpr = 1;
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
      if (mode === 'sunset') {
        initClouds(w, h);
        ripplesRef.current = [];
        airplanesRef.current = [];
      }
      initializedRef.current = mode;
    }

    let time = 0;

    const spawnShootingStar = (x?: number, y?: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      
      // If no position provided, spawn from a random edge but move TOWARDS center
      const startX = x !== undefined ? x : (Math.random() > 0.5 ? (Math.random() > 0.5 ? -50 : w + 50) : Math.random() * w);
      const startY = y !== undefined ? y : (startX < 0 || startX > w ? Math.random() * h * 0.5 : -50);

      // Target the center area for longer visual enjoyment
      const targetX = w / 2 + (Math.random() - 0.5) * (w * 0.4);
      const targetY = h / 2 + (Math.random() - 0.5) * (h * 0.4);
      
      const angle = Math.atan2(targetY - startY, targetX - startX);
      const sizeType = Math.random() < 0.4 ? 'tiny' : (Math.random() < 0.7 ? 'medium' : 'typical');
      
      let speed, length, width, maxAge;
      
      if (sizeType === 'tiny') {
        speed = 4 + Math.random() * 3;
        length = 20 + Math.random() * 20;
        width = 1;
        maxAge = 1.2 + Math.random() * 0.5;
      } else if (sizeType === 'medium') {
        speed = 7 + Math.random() * 4;
        length = 50 + Math.random() * 30;
        width = 1.8;
        maxAge = 1.0 + Math.random() * 0.4;
      } else {
        speed = 10 + Math.random() * 6;
        length = 100 + Math.random() * 60;
        width = 3.0;
        maxAge = 0.8 + Math.random() * 0.3;
      }

      shootingStarsRef.current.push({
        x: startX, y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        age: 0,
        maxAge,
        length,
        width,
        type: sizeType
      });

      // User triggered stars should ALWAYS play sound & notify UI
      if (x !== undefined && y !== undefined && !disableSoundsRef.current) {
        uiSounds.playStarShoot();
        // Dispatch event so Swipess UI can react
        window.dispatchEvent(new CustomEvent('STAR_SPAWNED', { detail: { x, y } }));
      }
    };

    const spawnAirplane = (x: number, y: number) => {
      const direction = Math.random() > 0.5 ? 1 : -1;
      airplanesRef.current.push({
        x: direction === 1 ? -50 : window.innerWidth + 50,
        y: y + (Math.random() - 0.5) * 40,
        vx: direction * (4 + Math.random() * 2),
        vy: (Math.random() - 0.5) * 0.4,
        scale: 0.6 + Math.random() * 0.4
      });
    };

    const spawnRipple = (x: number, y: number) => {
      ripplesRef.current.push({
        x, y, r: 0, maxR: 40 + Math.random() * 60, opacity: 0.6
      });
    };

    const handlePointerMove = (e: PointerEvent) => {
      pointerRef.current.x = e.clientX;
      pointerRef.current.y = e.clientY;
      pointerRef.current.isActive = true;
    };

    const handleCanvasPointerDown = (e: PointerEvent) => {
      // Only trigger if we click on background (not buttons/links/interactive or the logo)
      const target = e.target;
      // 🛡️ HARDEN: Ensure target is an Element before calling .closest()
      // This prevents runtime crashes on SVG text or other non-element nodes 
      // that might bubble to this window-level listener.
      const isInteractive = target instanceof Element && (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'SELECT' ||
        target.tagName === 'TEXTAREA' ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[role="button"]') ||
        target.closest('[data-no-bg-sound]') ||
        target.closest('.pointer-events-auto:not(.fixed.inset-0)')
      );

      if (!target || isInteractive) {
        return;
      }

      unlockAudio();
      pointerRef.current.isDown = true;
      pointerRef.current.isActive = true;
      pointerRef.current.x = e.clientX;
      pointerRef.current.y = e.clientY;

      if (mode === 'stars') {
        spawnShootingStar(e.clientX, e.clientY);
      } else if (mode === 'sunset') {
        if (!disableSoundsRef.current) uiSounds.playZenBowl();
        const hh = window.innerHeight;
        if (e.clientY > hh * 0.6) {
          spawnRipple(e.clientX, e.clientY);
        } else {
          spawnAirplane(e.clientX, e.clientY);
        }
      }
    };

    const handlePointerUp = () => {
      pointerRef.current.isDown = false;
      pointerRef.current.isActive = false;
    };

    canvas.addEventListener('pointermove', handlePointerMove, { passive: true });
    canvas.addEventListener('pointerup', handlePointerUp, { passive: true });
    canvas.addEventListener('pointercancel', handlePointerUp, { passive: true });
    canvas.addEventListener('pointerdown', handleCanvasPointerDown, { passive: true });

    const drawStars = () => {
      time += 0.12;
      for (let i = 0; i < starsRef.current.length; i++) {
        const star = starsRef.current[i];
        
        // ── Depth Layer Multipliers ──
        // Smaller stars move shower, larger stars move faster (parallax)
        const depthSpeed = star.size * star.driftSpeed;
        star.baseY -= depthSpeed;
        
        // 🚀 SWIPESS: Star Repulsion
        // Stars move away from the touch/mouse position
        if (pointerRef.current.isActive || pointerRef.current.isDown) {
          const dx = star.x - pointerRef.current.x;
          const dy = star.y - pointerRef.current.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 120) {
            const force = (120 - dist) / 120;
            const angle = Math.atan2(dy, dx);
            star.vx += Math.cos(angle) * force * 1.2;
            star.vy += Math.sin(angle) * force * 1.2;
          }
        }

        if (star.baseY < -star.size) {
          star.baseY = window.innerHeight + star.size;
          star.y = star.baseY;
          star.baseX = Math.random() * window.innerWidth;
          star.x = star.baseX;
        }

        const bdx = star.baseX - star.x;
        const bdy = star.baseY - star.y;
        star.vx += bdx * 0.05;
        star.vy += bdy * 0.05;
        star.vx *= 0.85;
        star.vy *= 0.85;
        star.x += star.vx;
        star.y += star.vy;

        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.5 + 0.5;
        const alpha = Math.min(star.opacity * (twinkle * 0.7 + 0.3), 1);

        if (alpha < 0.02) continue;

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        
        // Add subtle glow to larger stars
        if (star.size > 0.6) {
           ctx.shadowBlur = 4;
           ctx.shadowColor = isLightTheme ? 'rgba(0,0,0,0.1)' : 'rgba(255,150,100,0.2)';
        } else {
           ctx.shadowBlur = 0;
        }

        ctx.fillStyle = isLightTheme
          ? `rgba(190,200,240,${alpha * 0.65})`
          : `rgba(255,255,255,${alpha})`;
        ctx.fill();
      }
      ctx.shadowBlur = 0;

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
        grad.addColorStop(1, isLightTheme ? `rgba(100,100,255,${fadeAlpha * 0.8})` : `rgba(255,255,255,${fadeAlpha})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = ss.width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(ss.x, ss.y);
        ctx.stroke();
      }
    };

    const drawSunset = () => {
      time += 0.005;
      
      // Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6);
      const shift = Math.sin(time) * 0.05;
      skyGrad.addColorStop(0, `hsl(${260 + shift * 50}, 40%, 15%)`);
      skyGrad.addColorStop(0.5, `hsl(${340 + shift * 30}, 50%, 40%)`);
      skyGrad.addColorStop(1, `hsl(${20 + shift * 20}, 80%, 65%)`);
      
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h * 0.6);

      // Ocean Gradient (Zen smooth flow)
      const oceanGrad = ctx.createLinearGradient(0, h * 0.6, 0, h);
      oceanGrad.addColorStop(0, `hsl(${200 + shift * 10}, 60%, 40%)`);
      oceanGrad.addColorStop(1, `hsl(${240 + shift * 10}, 80%, 15%)`);
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, h * 0.6, w, h * 0.4);

      // Draw Clouds
      ctx.save();
      for (const cloud of cloudsRef.current) {
        cloud.x += cloud.speed;
        if (cloud.x > w + 100) cloud.x = -cloud.w - 100;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        const rx = cloud.x;
        const ry = cloud.y;
        const rw = cloud.w;
        const rh = cloud.h;
        // Cartoonish cloud shape (minimalistic rectangles/circles)
        ctx.roundRect(rx, ry, rw, rh, rh / 2);
        ctx.fill();
        
        // Slightly brighter top edge
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.beginPath();
        ctx.roundRect(rx + 5, ry + 2, rw - 10, rh - 10, (rh-10) / 2);
        ctx.fill();
      }
      ctx.restore();

      // Ripples
      for (let i = ripplesRef.current.length - 1; i >= 0; i--) {
        const rip = ripplesRef.current[i];
        rip.r += 1.5;
        rip.opacity *= 0.98;
        if (rip.opacity < 0.01) {
          ripplesRef.current.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = `rgba(255, 255, 255, ${rip.opacity})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(rip.x, rip.y, rip.r, rip.r * 0.4, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Airplanes
      for (let i = airplanesRef.current.length - 1; i >= 0; i--) {
        const plane = airplanesRef.current[i];
        plane.x += plane.vx;
        plane.y += plane.vy;
        if (plane.x < -100 || plane.x > w + 100) {
          airplanesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(plane.x, plane.y);
        ctx.scale(plane.scale * (plane.vx > 0 ? 1 : -1), plane.scale);
        
        // Simple tiny cool airplane
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(20, 0);
        ctx.lineTo(25, 5);
        ctx.lineTo(0, 2);
        ctx.fill();
        // Wing
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(8, -8);
        ctx.lineTo(14, -8);
        ctx.lineTo(16, 0);
        ctx.fill();
        
        ctx.restore();
      }
    };

    const TARGET_FPS = 30;
    const FRAME_INTERVAL = 1000 / TARGET_FPS;

    let lastAutoStarTime = 0;
    let nextAutoStarDelay = 6000 + Math.random() * 4000; // 6-10s

    const loop = (timestamp: number) => {
      if (document.visibilityState === 'hidden') {
        animRef.current = requestAnimationFrame(loop);
        return;
      }

      // PERF: Throttle ALL drawing to ~30fps at the top, before any canvas work
      if (timestamp - lastFrameTimeRef.current < FRAME_INTERVAL) {
        animRef.current = requestAnimationFrame(loop);
        return;
      }
      lastFrameTimeRef.current = timestamp;
      
      ctx.clearRect(0, 0, w, h);

      // ─── Phase 1: Nebula / Atmospheric Glow ──────────────────────────────
      // A subtle, organic moving radial gradient to add "live" depth
      const nebulaX = (w/2) + Math.cos(timestamp * 0.0002) * (w * 0.2);
      const nebulaY = (h/2) + Math.sin(timestamp * 0.0003) * (h * 0.2);
      const nebulaGrad = ctx.createRadialGradient(nebulaX, nebulaY, 10, nebulaX, nebulaY, w * 0.8);
      nebulaGrad.addColorStop(0, isLightTheme ? 'rgba(255,255,255,0)' : 'rgba(10, 20, 60, 0.04)');
      nebulaGrad.addColorStop(0.5, isLightTheme ? 'rgba(0,0,0,0)' : 'rgba(5, 10, 30, 0.02)');
      nebulaGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = nebulaGrad;
      ctx.fillRect(0, 0, w, h);

      // ─── Phase 1.5: Dynamic Ambient Glow (Torch) ────────────────────────
      // Creates a beautiful halo that follows the cursor/touch for "physical" feel
      if (pointerRef.current.isActive || pointerRef.current.isDown) {
        const glowSize = pointerRef.current.isDown ? 450 : 350;
        const glowOpacity = isLightTheme ? 0.04 : (pointerRef.current.isDown ? 0.08 : 0.05);
        
        const haloGrad = ctx.createRadialGradient(
          pointerRef.current.x, pointerRef.current.y, 0,
          pointerRef.current.x, pointerRef.current.y, glowSize
        );
        
        const haloColor = isLightTheme ? '70, 100, 255' : '255, 255, 255';
        haloGrad.addColorStop(0, `rgba(${haloColor}, ${glowOpacity})`);
        haloGrad.addColorStop(0.5, `rgba(${haloColor}, ${glowOpacity * 0.4})`);
        haloGrad.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.fillStyle = haloGrad;
        ctx.fillRect(0, 0, w, h);
      }

      // Automatic Shooting Stars — random 6-10 second intervals
      if (mode === 'stars' && timestamp - lastAutoStarTime > nextAutoStarDelay) {
        spawnShootingStar();
        lastAutoStarTime = timestamp;
        nextAutoStarDelay = 6000 + Math.random() * 4000; // 6-10s
      }




      if (mode === 'stars') drawStars();
      else if (mode === 'sunset') {
        drawSunset();
      }
      animRef.current = requestAnimationFrame(loop);
    };
    loop(0);

    window.addEventListener('pointerdown', handleCanvasPointerDown, { passive: true });

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('pointerdown', handleCanvasPointerDown);
    };
  }, [mode, isLightTheme, initStars, initClouds]);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "fixed inset-0 pointer-events-auto touch-none z-0 transition-opacity duration-500",
        mode === 'off' ? "opacity-0" : "opacity-100"
      )}
    />
  );
}

export default memo(LandingBackgroundEffects);


