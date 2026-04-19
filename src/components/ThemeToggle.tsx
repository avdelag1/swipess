import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { triggerHaptic } from '@/utils/haptics';

type Theme = 'light' | 'dark' | 'ivanna-style';

const CYCLE: Theme[] = ['light', 'dark', 'ivanna-style'];

interface ThemeToggleProps {
    className?: string;
}

function ThemeToggleComponent({ className }: ThemeToggleProps) {
    const { theme, setTheme } = useTheme();

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        triggerHaptic('light');
        const current = CYCLE.indexOf(theme as Theme);
        const next = CYCLE[(current + 1) % CYCLE.length];
        setTheme(next, { x: e.clientX, y: e.clientY });
    };

    const icon =
        theme === 'light' ? (
            <Sun strokeWidth={1.5} className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
        ) : theme === 'ivanna-style' ? (
            <Sparkles strokeWidth={1.5} className="h-4 w-4 sm:h-5 sm:w-5 text-pink-400" />
        ) : (
            <Moon strokeWidth={1.5} className="h-4 w-4 sm:h-5 sm:w-5 text-white/70" />
        );

    return (
        <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleToggle}
            className={cn(
                'relative flex items-center justify-center rounded-xl',
                'transition-all duration-100 ease-out active:scale-[0.9]',
                'touch-manipulation h-9 w-9 flex-shrink-0',
                className,
            )}
            style={{ backgroundColor: 'transparent', border: 'none', boxShadow: 'none' }}
            aria-label={`Theme: ${theme}. Tap to cycle`}
            title={`Current: ${theme}`}
        >
            <AnimatePresence mode="popLayout">
                <motion.div
                    key={theme}
                    initial={{ opacity: 0, scale: 0.5, rotate: -30 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.5, rotate: 30 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                    {icon}
                </motion.div>
            </AnimatePresence>
        </button>
    );
}

export const ThemeToggle = memo(ThemeToggleComponent);
