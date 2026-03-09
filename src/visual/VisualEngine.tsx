import { useTheme } from "@/hooks/useTheme";

/**
 * VisualEngine - Cinematic Background Layer System
 *
 * Creates depth through layered animated backgrounds:
 * - Base gradient layer
 * - Subtle noise texture
 * - Adapts to light/dark theme
 *
 * Mounted once in AppLayout for persistent luxury feel
 */
export const VisualEngine = () => {
  const { theme } = useTheme();
  const isDark = theme !== "white-matte";

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Base gradient - adapts to theme */}
      <div
        className={`absolute inset-0 transition-colors duration-500 ${isDark
            ? "bg-[#050505]"
            : "bg-background"
          }`}
      />

      {/* Subtle noise overlay for texture (premium detail) */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' /%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};
