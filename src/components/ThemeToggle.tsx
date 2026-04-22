import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppTheme } from '@/hooks/useAppTheme';
import { triggerHaptic } from '@/utils/haptics';

type Theme = 'light' | 'dark';

const CYCLE: Theme[] = ['light', 'dark'];

interface ThemeToggleProps {
    className?: string;
}

function ThemeToggleComponent({ className }: ThemeToggleProps) {
    const { theme, setTheme } = useAppTheme();

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        triggerHaptic('light');
        const next = theme === 'light' ? 'dark' : 'light';
        setTheme(next, { x: e.clientX, y: e.clientY });
    };

    const icon =
        theme === 'light' ? (
            <Sun strokeWidth={1.5} className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
        ) : (
            <Moon strokeWidth={1.5} className="h-5 w-5 sm:h-6 sm:w-6 text-black/70" />
        );


    return (
        <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleToggle}
            className={cn(
                'relative flex items-center justify-center rounded-full',
                'transition-all duration-100 ease-out active:scale-[0.9]',
                'touch-manipulation h-10 w-10 flex-shrink-0',
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


