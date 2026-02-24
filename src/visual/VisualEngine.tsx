import { useEffect } from "react";
import { motion, useReducedMotion, useMotionValue, useTransform } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { SwipessSPattern } from "@/components/SwipessSWatermark";

/**
 * VisualEngine - Cinematic Background Layer System
 *
 * Creates depth through layered animated backgrounds:
 * - Base gradient layer
 * - Soft animated glows (non-distracting)
 * - Adapts to light/dark theme
 *
 * Mounted once in AppLayout for persistent luxury feel
 */
export const VisualEngine = () => {
  const { theme } = useTheme();
  const isDark = theme === "black-matte";
  const shouldReduceMotion = useReducedMotion();

  // Pointer tracking for subtle reactive depth
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    if (shouldReduceMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Normalize to -50 to 50
      const x = (e.clientX / window.innerWidth - 0.5) * 60;
      const y = (e.clientY / window.innerHeight - 0.5) * 60;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [shouldReduceMotion, mouseX, mouseY]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient - adapts to theme */}
      <div
        className={`absolute inset-0 transition-colors duration-700 ${isDark
          ? "bg-gradient-to-br from-slate-900 via-slate-950 to-black"
          : "bg-gradient-to-br from-slate-50 via-white to-slate-100"
          }`}
      />

      {/* Primary animated glow - soft purple (luxury accent) */}
      <motion.div
        className={`absolute w-[700px] h-[700px] rounded-full blur-[100px] transition-colors duration-700 ${isDark ? "bg-purple-600/10" : "bg-purple-400/5"
          }`}
        style={{
          top: "-250px",
          left: "-150px",
          x: shouldReduceMotion ? 0 : mouseX,
          y: shouldReduceMotion ? 0 : mouseY,
          willChange: "transform"
        }}
        animate={shouldReduceMotion ? {} : {
          scale: [1, 1.05, 1],
          opacity: [0.8, 1, 0.8]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Secondary glow - soft orange/pink (warmth) */}
      <motion.div
        className={`absolute w-[600px] h-[600px] rounded-full blur-[100px] transition-colors duration-700 ${isDark ? "bg-orange-500/10" : "bg-orange-300/5"
          }`}
        style={{
          bottom: "-200px",
          right: "-150px",
          x: shouldReduceMotion ? 0 : useTransform(mouseX, (v) => v * -1.2),
          y: shouldReduceMotion ? 0 : useTransform(mouseY, (v) => v * -1.2),
          willChange: "transform"
        }}
        animate={shouldReduceMotion ? {} : {
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Subtle noise overlay for texture (premium detail) */}
      <div
        className="absolute inset-0 opacity-[0.02] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
        }}
      />

      {/* Branded S watermark pattern - subtle fire-S marks scattered across sections */}
      <SwipessSPattern
        opacity={isDark ? 0.02 : 0.01}
        count={6}
      />

      {/* Cinematic light ray - very subtle focus */}
      <motion.div
        className={`absolute w-full h-[1px] top-1/4 opacity-10 ${isDark ? "bg-white/10" : "bg-black/5"
          }`}
        style={{
          boxShadow: isDark ? '0 0 100px 1px rgba(255,255,255,0.1)' : '0 0 100px 1px rgba(0,0,0,0.05)',
          rotate: -15,
          scaleX: 2
        }}
      />
    </div>
  );
};

/**
 * Optional: Reactive background that responds to user actions
 * Can shift colors based on swipe direction or user activity
 */
interface ReactiveBackgroundProps {
  sentiment?: "positive" | "negative" | "neutral";
}

export const ReactiveBackground = ({ sentiment = "neutral" }: ReactiveBackgroundProps) => {
  const { theme } = useTheme();
  const isDark = theme === "black-matte";

  // Subtle color shift based on user action (e.g., swipe direction)
  const getSentimentGlow = () => {
    if (sentiment === "positive") {
      return isDark ? "bg-green-500/5" : "bg-green-300/3";
    }
    if (sentiment === "negative") {
      return isDark ? "bg-red-500/5" : "bg-red-300/3";
    }
    return "bg-transparent";
  };

  return (
    <motion.div
      className={`fixed inset-0 -z-5 pointer-events-none transition-colors duration-700 ${getSentimentGlow()}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    />
  );
};
