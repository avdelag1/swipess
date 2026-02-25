import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';

interface ThemeSelectorProps {
  compact?: boolean;
  showTitle?: boolean;
}

/**
 * ThemeSelector — Minimal light/dark toggle.
 *
 * Two modes:
 *   compact = true  → Small pill for profile headers
 *   compact = false → Wider pill for settings pages
 */
export function ThemeSelector({ compact = false }: ThemeSelectorProps) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'black-matte';

  const toggle = () => {
    const next = isDark ? 'white-matte' : 'black-matte';
    setTheme(next);
    toast.success(isDark ? 'Light mode' : 'Dark mode', {
      description: 'Theme updated',
      duration: 1500,
    });
  };

  /* ── Compact pill (for profile pages) ── */
  if (compact) {
    return (
      <motion.button
        onClick={toggle}
        className="relative inline-flex items-center rounded-full transition-colors duration-300 touch-manipulation"
        style={{
          width: 52,
          height: 28,
          background: isDark
            ? 'rgba(255,255,255,0.10)'
            : 'rgba(0,0,0,0.08)',
          border: isDark
            ? '1px solid rgba(255,255,255,0.12)'
            : '1px solid rgba(0,0,0,0.10)',
        }}
        whileTap={{ scale: 0.92 }}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {/* Knob */}
        <motion.div
          className="absolute flex items-center justify-center rounded-full"
          style={{
            width: 22,
            height: 22,
            top: 2,
            background: isDark
              ? 'linear-gradient(135deg, #2a2a2a, #1a1a1a)'
              : 'linear-gradient(135deg, #ffffff, #f0f0f0)',
            boxShadow: isDark
              ? '0 2px 6px rgba(0,0,0,0.5)'
              : '0 2px 6px rgba(0,0,0,0.12)',
          }}
          animate={{ left: isDark ? 3 : 25 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          {isDark ? (
            <Moon className="w-3 h-3 text-white/80" />
          ) : (
            <Sun className="w-3 h-3 text-amber-500" />
          )}
        </motion.div>
      </motion.button>
    );
  }

  /* ── Full-size pill (for settings) ── */
  return (
    <motion.button
      onClick={toggle}
      className="relative w-full flex items-center rounded-2xl transition-colors duration-300 touch-manipulation overflow-hidden"
      style={{
        height: 52,
        background: isDark
          ? 'rgba(255,255,255,0.06)'
          : 'rgba(0,0,0,0.04)',
        border: isDark
          ? '1px solid rgba(255,255,255,0.10)'
          : '1px solid rgba(0,0,0,0.08)',
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Sliding knob — half-width */}
      <motion.div
        className="absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-xl flex items-center justify-center gap-2"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))'
            : 'linear-gradient(135deg, #ffffff, #f5f5f5)',
          boxShadow: isDark
            ? '0 2px 10px rgba(0,0,0,0.4)'
            : '0 2px 10px rgba(0,0,0,0.08)',
        }}
        animate={{ left: isDark ? 4 : 'calc(50% + 0px)' }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {isDark ? (
          <>
            <Moon className="w-4 h-4 text-white/90" />
            <span className="text-sm font-semibold text-white/90">Dark</span>
          </>
        ) : (
          <>
            <Sun className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-foreground">Light</span>
          </>
        )}
      </motion.div>

      {/* Static labels on both sides */}
      <div className="absolute inset-0 flex items-center pointer-events-none">
        <div className="flex-1 flex items-center justify-center gap-1.5">
          <Moon className={`w-3.5 h-3.5 transition-opacity duration-300 ${isDark ? 'opacity-0' : 'opacity-40'}`}
            style={{ color: isDark ? 'white' : 'currentColor' }} />
          <span className={`text-xs font-medium transition-opacity duration-300 ${isDark ? 'opacity-0' : 'opacity-40 text-muted-foreground'}`}>
            Dark
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center gap-1.5">
          <Sun className={`w-3.5 h-3.5 transition-opacity duration-300 ${isDark ? 'opacity-40' : 'opacity-0'}`}
            style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'currentColor' }} />
          <span className={`text-xs font-medium transition-opacity duration-300 ${isDark ? 'opacity-40 text-white/40' : 'opacity-0'}`}>
            Light
          </span>
        </div>
      </div>
    </motion.button>
  );
}