import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { triggerHaptic } from '@/utils/haptics';

interface ThemeToggleProps {
    className?: string;
}

function ThemeToggleComponent({ className }: ThemeToggleProps) {
    const { theme, setTheme } = useTheme();
    const isDark = theme === 'dark';

    const glassBg = isDark ? 'var(--glass-bg)' : 'rgba(255, 255, 255, 0.95)';
    const glassBorder = isDark ? '1px solid rgba(255,255,255,0.16)' : '1px solid rgba(0, 0, 0, 0.08)';
    const floatingShadow = isDark
        ? 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 16px rgba(0,0,0,0.35)'
        : 'inset 0 1px 0 rgba(255,255,255,0.9), 0 4px 16px rgba(0,0,0,0.08)';

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        triggerHaptic('light');
        setTheme(isDark ? 'light' : 'dark');
    };

    return (
        <button
            onClick={handleToggle}
            className={cn(
                'relative flex items-center justify-center rounded-2xl',
                'transition-all duration-100 ease-out',
                'active:scale-[0.9]',
                'touch-manipulation',
                '-webkit-tap-highlight-color-transparent',
                'h-10 w-10 flex-shrink-0',
                className
            )}
            style={{
                backgroundColor: glassBg,
                border: glassBorder,
                boxShadow: floatingShadow,
            }}
            aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={theme}
                    initial={{ opacity: 0, scale: 0.8, rotate: -180 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.8, rotate: 180 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                    {isDark ? (
                        <Sun strokeWidth={3} className="h-5 w-5 text-amber-400" />
                    ) : (
                        <Moon strokeWidth={3} className="h-5 w-5 text-indigo-400" />
                    )}
                </motion.div>
            </AnimatePresence>
        </button>
    );
}

export const ThemeToggle = memo(ThemeToggleComponent);
