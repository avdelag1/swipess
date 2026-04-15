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

    const nextTheme = theme === 'light' ? 'dark' : 'light';

    const handlePointerDown = (e: React.PointerEvent) => {
        e.stopPropagation();
        triggerHaptic('light');
    };

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setTheme(nextTheme, { x: e.clientX, y: e.clientY });
    };

    return (
        <button
            onPointerDown={handlePointerDown}
            onClick={handleToggle}
            className={cn(
                'relative flex items-center justify-center rounded-xl',
                'transition-all duration-100 ease-out',
                'active:scale-[0.9]',
                'touch-manipulation',
                '-webkit-tap-highlight-color-transparent',
                'h-9 w-9 flex-shrink-0',
                className
            )}
            style={{
                backgroundColor: 'transparent',
                border: 'none',
                boxShadow: 'none',
            }}
            aria-label={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} mode`}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} mode`}
        >
            <AnimatePresence mode="sync">
                <motion.div
                    key={theme}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.1, ease: 'easeOut' }}
                >
                    {theme === 'light' ? (
                        <Sun strokeWidth={1.5} className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                    ) : (
                        <Moon strokeWidth={1.5} className="h-4 w-4 sm:h-5 sm:w-5 text-white/70" />
                    )}
                </motion.div>
            </AnimatePresence>
        </button>
    );
}

export const ThemeToggle = memo(ThemeToggleComponent);
