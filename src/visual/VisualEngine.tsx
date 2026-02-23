import { motion, useReducedMotion } from "framer-motion";
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

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient - adapts to theme */}
      <div
        className={`absolute inset-0 transition-colors duration-500 ${
          isDark
            ? "bg-gradient-to-br from-slate-900 via-slate-950 to-black"
            : "bg-gradient-to-br from-slate-50 via-white to-slate-100"
        }`}
      />

      {/* Primary animated glow - soft purple (luxury accent) */}
      {shouldReduceMotion ? (
        <div
          className={`absolute w-[600px] h-[600px] rounded-full blur-3xl ${
            isDark ? "bg-purple-600/20" : "bg-purple-400/10"
          }`}
          style={{ top: "-200px", left: "-100px" }}
        />
      ) : (
        <motion.div
          className={`absolute w-[600px] h-[600px] rounded-full blur-3xl ${
            isDark ? "bg-purple-600/20" : "bg-purple-400/10"
          }`}
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          style={{ top: "-200px", left: "-100px", willChange: "transform" }}
        />
      )}

      {/* Secondary glow - soft blue (depth) */}
      {shouldReduceMotion ? (
        <div
          className={`absolute w-[500px] h-[500px] rounded-full blur-3xl ${
            isDark ? "bg-blue-500/15" : "bg-blue-300/8"
          }`}
          style={{ bottom: "-150px", right: "-100px" }}
        />
      ) : (
        <motion.div
          className={`absolute w-[500px] h-[500px] rounded-full blur-3xl ${
            isDark ? "bg-blue-500/15" : "bg-blue-300/8"
          }`}
          animate={{ x: [0, -40, 0], y: [0, -20, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          style={{ bottom: "-150px", right: "-100px", willChange: "transform" }}
        />
      )}

      {/* Tertiary glow - soft indigo (cinematic touch) */}
      {shouldReduceMotion ? (
        <div
          className={`absolute w-[400px] h-[400px] rounded-full blur-3xl ${
            isDark ? "bg-indigo-500/10" : "bg-indigo-300/6"
          }`}
          style={{ top: "50%", right: "20%" }}
        />
      ) : (
        <motion.div
          className={`absolute w-[400px] h-[400px] rounded-full blur-3xl ${
            isDark ? "bg-indigo-500/10" : "bg-indigo-300/6"
          }`}
          animate={{ x: [0, 30, 0], y: [0, 40, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          style={{ top: "50%", right: "20%", willChange: "transform" }}
        />
      )}

      {/* Subtle noise overlay for texture (premium detail) */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
        }}
      />

      {/* Branded S watermark pattern - subtle fire-S marks scattered across sections */}
      <SwipessSPattern
        opacity={isDark ? 0.025 : 0.015}
        count={5}
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
