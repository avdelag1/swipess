import React, { useEffect, useRef } from 'react';

/**
 * IvanaSkyBackground
 * 
 * A painterly, real-time animated sky background evoking a post-sunset ocean sky —
 * warm amber/champagne at the horizon (~25%), gradually transitioning to a soft
 * periwinkle-blue with blushing lavender mid-tones, soft painted clouds, and subtle
 * color shifts that make the scene feel alive.
 */
export function IvanaSkyBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = window.innerWidth;
    let H = window.innerHeight;

    const resize = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    };
    resize();
    window.addEventListener('resize', resize);

    // ─── Cloud Definition ───────────────────────────────────────────────────
    interface Cloud {
      x: number;
      y: number;
      rx: number;       // ellipse x-radius
      ry: number;       // ellipse y-radius
      layers: number;   // number of sub-puffs
      speed: number;    // horizontal drift speed
      opacity: number;
      hue: number;      // slight hue shift (warm vs cool)
    }

    const clouds: Cloud[] = Array.from({ length: 14 }, (_, i) => ({
      x: Math.random() * W,
      y: H * (0.02 + Math.random() * 0.46), // occupy top ~48% of canvas
      rx: 80 + Math.random() * 200,
      ry: 28 + Math.random() * 60,
      layers: 3 + Math.floor(Math.random() * 5),
      speed: 0.06 + Math.random() * 0.12,
      opacity: 0.55 + Math.random() * 0.35,
      hue: Math.random() < 0.5 ? 210 : 240,
    }));

    // ─── Draw a single painterly cloud ──────────────────────────────────────
    function drawCloud(c: Cloud, time: number) {
      if (!ctx) return;
      const { x, y, rx, ry, layers, opacity, hue } = c;

      // Subtle breathe animation
      const breathe = 1 + Math.sin(time * 0.25 + c.x) * 0.025;

      for (let l = 0; l < layers; l++) {
        const angle = (l / layers) * Math.PI * 2;
        const cx = x + Math.cos(angle) * (rx * 0.45);
        const cy = y + Math.sin(angle) * (ry * 0.35) - 10;
        const r = (ry * 0.75 + Math.random() * ry * 0.2) * breathe;

        const grad = ctx.createRadialGradient(cx, cy - r * 0.3, 0, cx, cy, r);

        // Cloud core: slightly warm white
        grad.addColorStop(0, `hsla(${hue}, 30%, 98%, ${opacity})`);
        grad.addColorStop(0.5, `hsla(${hue}, 20%, 95%, ${opacity * 0.75})`);
        grad.addColorStop(1, `hsla(${hue}, 15%, 92%, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx * breathe * (0.5 + l * 0.1), r, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ─── Main draw loop ──────────────────────────────────────────────────────
    function draw(ts: number) {
      if (!ctx) return;
      timeRef.current = ts * 0.001; // seconds
      const t = timeRef.current;

      // ── Sky gradient ──
      // Bottom ~25%: warm champagne-amber (horizon glow)
      // Mid 25-65%: soft blush / lavender rose
      // Top 65-100%: clear sky blue (periwinkle)

      const sky = ctx.createLinearGradient(0, H, 0, 0);
      // Horizon glow
      sky.addColorStop(0.00, `hsl(38, 90%, 86%)`);   // warm champagne
      sky.addColorStop(0.08, `hsl(32, 75%, 82%)`);   // peachy amber
      sky.addColorStop(0.18, `hsl(20, 55%, 80%)`);   // dusty rose
      sky.addColorStop(0.28, `hsl(340, 35%, 82%)`);  // blush
      sky.addColorStop(0.42, `hsl(280, 25%, 82%)`);  // soft lavender
      sky.addColorStop(0.58, `hsl(220, 40%, 80%)`);  // periwinkle 
      sky.addColorStop(0.75, `hsl(210, 55%, 76%)`);  // sky blue
      sky.addColorStop(1.00, `hsl(205, 65%, 68%)`);  // deep sky

      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // ── Subtle animated color pulse (very gentle) ──
      const pulse = Math.sin(t * 0.08) * 0.03;
      const horizonOverlay = ctx.createLinearGradient(0, H, 0, H * 0.6);
      horizonOverlay.addColorStop(0, `hsla(28, 80%, 78%, ${0.12 + pulse})`);
      horizonOverlay.addColorStop(1, `hsla(28, 60%, 80%, 0)`);
      ctx.fillStyle = horizonOverlay;
      ctx.fillRect(0, H * 0.6, W, H * 0.4);

      // ── Horizon shimmer line ──
      const shimmer = ctx.createLinearGradient(0, H * 0.72, 0, H * 0.78);
      shimmer.addColorStop(0, `rgba(255, 220, 160, 0)`);
      shimmer.addColorStop(0.5, `rgba(255, 215, 150, ${0.18 + Math.sin(t * 0.3) * 0.05})`);
      shimmer.addColorStop(1, `rgba(255, 220, 160, 0)`);
      ctx.fillStyle = shimmer;
      ctx.fillRect(0, H * 0.72, W, H * 0.06);

      // ── Draw clouds ──
      ctx.save();
      for (const cloud of clouds) {
        // Drift clouds slowly to the right, wrap around
        cloud.x = (cloud.x + cloud.speed) % (W + 500);
        drawCloud(cloud, t);
      }
      ctx.restore();

      // ── Painterly texture overlay (grain) ──
      // A very subtle noise-like vignette that softens the digital look
      const vignette = ctx.createRadialGradient(W * 0.5, H * 0.4, H * 0.1, W * 0.5, H * 0.5, H * 0.9);
      vignette.addColorStop(0, 'rgba(255,248,240,0)');
      vignette.addColorStop(1, 'rgba(180,160,200,0.12)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, W, H);

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
        display: 'block',
      }}
    />
  );
}
