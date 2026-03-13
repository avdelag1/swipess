import { useTheme } from "@/hooks/useTheme";
import { useEffect, useRef } from "react";

/**
 * VisualEngine - Cinematic Background Layer System
 *
 * Creates depth through layered animated backgrounds:
 * - Base gradient layer
 * - Subtle noise texture
 * - Animated star field (theme-aware)
 * - Adapts to light/dark theme
 *
 * Mounted once in AppLayout for persistent luxury feel
 */

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
}

function StarCanvas({ isLightTheme }: { isLightTheme: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
      canvas.height = window.innerHeight * (window.devicePixelRatio || 1);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
      initStars();
    };

    const initStars = () => {
      const count = Math.min(120, Math.floor((window.innerWidth * window.innerHeight) / 8000));
      starsRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 1.8 + 0.4,
        opacity: Math.random() * 0.6 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2,
      }));
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      
      for (const star of starsRef.current) {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinklePhase);
        const alpha = star.opacity * (0.5 + 0.5 * twinkle);

        if (isLightTheme) {
          ctx.fillStyle = `rgba(30, 30, 60, ${alpha * 0.7})`;
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    resize();
    animRef.current = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [isLightTheme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
      style={{
        mixBlendMode: isLightTheme ? "normal" : "screen",
        pointerEvents: "none",
      }}
    />
  );
}

export const VisualEngine = () => {
  const { theme } = useTheme();
  const isDark = theme !== "white-matte";
  const isLightTheme = !isDark;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient - adapts to theme */}
      <div
        className={`absolute inset-0 transition-colors duration-500 ${isDark
            ? "bg-[#050505]"
            : "bg-background"
          }`}
      />

      {/* Subtle noise overlay for texture (premium detail) - hidden in light theme */}
      {isDark && (
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
          }}
        />
      )}

      {/* Animated star field - visible on all themes */}
      <StarCanvas isLightTheme={isLightTheme} />
    </div>
  );
};
