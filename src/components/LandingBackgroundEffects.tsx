import { memo, useEffect, useRef, useCallback } from 'react';
import { playRandomZen } from '@/utils/sounds';

type EffectMode = 'cheetah' | 'stars' | 'orbs';

interface Star {
  x: number; y: number; baseX: number; baseY: number;
  size: number; opacity: number; twinkleSpeed: number; twinklePhase: number;
  vx: number; vy: number;
}

interface ShootingStar {
  x: number; y: number; vx: number; vy: number;
  age: number; maxAge: number; length: number;
}

interface Orb {
  x: number; y: number; vx: number; vy: number;
  radius: number; color: [number, number, number];
  opacity: number; mass: number;
}

interface Ripple {
  x: number; y: number; birth: number; maxRadius: number;
}

function LandingBackgroundEffects({ mode }: { mode: EffectMode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const starsRef = useRef<Star[]>([]);
  const orbsRef = useRef<Orb[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const ripplesRef = useRef<Ripple[]>([]);
  const cheetahImgRef = useRef<HTMLImageElement | null>(null);
  const initializedRef = useRef<EffectMode | null>(null);

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
        size: Math.random() * 0.7 + 0.3,
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

  // Preload cheetah image
  useEffect(() => {
    if (!cheetahImgRef.current) {
      const img = new Image();
      img.src = '/images/cheetah-1.jpeg';
      img.onload = () => { cheetahImgRef.current = img; };
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

      // Singing bowl sound on tap for stars & orbs
      if (mode === 'stars' || mode === 'orbs') {
        playRandomZen(0.3);
      }

      if (mode === 'stars') {
        spawnShootingStar(e.clientX, e.clientY);
      }

      if (mode === 'cheetah') {
        playRandomZen(0.3);
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
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

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
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
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
        gradient.addColorStop(0, `rgba(255,255,255,0)`);
        gradient.addColorStop(0.5, `rgba(200,220,255,${fadeAlpha * 0.4})`);
        gradient.addColorStop(1, `rgba(255,255,255,${fadeAlpha})`);
        ctx.strokeStyle = gradient; ctx.lineWidth = 2; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(tailStartX, tailStartY); ctx.lineTo(ss.x, ss.y); ctx.stroke();
        ctx.beginPath(); ctx.arc(ss.x, ss.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${fadeAlpha})`; ctx.fill();
        ctx.beginPath(); ctx.arc(ss.x, ss.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,220,180,${fadeAlpha * 0.3})`; ctx.fill();
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
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, w, h);
        return;
      }

      // Breathing scale
      const breathCycle = (Math.sin(performance.now() / 2000) * 0.5 + 0.5); // 0-1
      const scale = 1 + breathCycle * 0.03; // 1.0 to 1.03

      // Draw base image scaled to cover with breathing
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
      const duration = 800; // ms
      const activeRipples = ripplesRef.current.filter(r => now - r.birth < duration);
      ripplesRef.current = activeRipples;

      if (activeRipples.length > 0) {
        // Get current pixels
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

          // Only process pixels near the ripple ring for performance
          const minX = Math.max(0, Math.floor(ripple.x - currentRadius - waveWidth));
          const maxX = Math.min(w - 1, Math.ceil(ripple.x + currentRadius + waveWidth));
          const minY = Math.max(0, Math.floor(ripple.y - currentRadius - waveWidth));
          const maxY = Math.min(h - 1, Math.ceil(ripple.y + currentRadius + waveWidth));

          for (let py = minY; py <= maxY; py++) {
            for (let px = minX; px <= maxX; px++) {
              const dx = px - ripple.x;
              const dy = py - ripple.y;
              const dist = Math.sqrt(dx * dx + dy * dy);

              // Only affect pixels near the wave front
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

    const animate = () => {
      if (mode === 'stars') drawStars();
      if (mode === 'orbs') drawOrbs();
      if (mode === 'cheetah') drawCheetah();
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

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none"
      style={{ mixBlendMode: mode === 'cheetah' ? 'normal' : 'screen' }}
    />
  );
}

export default memo(LandingBackgroundEffects);
