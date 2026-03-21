import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { triggerHaptic } from '@/utils/haptics';

interface ThemeToggleProps {
    className?: string;
}

function PawPrintIcon({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="currentColor"
            aria-hidden="true"
        >
            <ellipse cx="12" cy="16.5" rx="5.2" ry="4.2" />
            <ellipse cx="5.8" cy="12.8" rx="2.1" ry="2.7" />
            <ellipse cx="9.2" cy="10.2" rx="2.1" ry="2.7" />
            <ellipse cx="14.8" cy="10.2" rx="2.1" ry="2.7" />
            <ellipse cx="18.2" cy="12.8" rx="2.1" ry="2.7" />
        </svg>
    );
}

function ThemeToggleComponent({ className }: ThemeToggleProps) {
    const { theme, setTheme } = useTheme();

    const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'cheers' : 'light';

    const glassBg = theme === 'dark' || theme === 'cheers' ? 'var(--glass-bg)' : 'rgba(255, 255, 255, 0.95)';
    const glassBorder = theme === 'dark' || theme === 'cheers' ? '1px solid var(--glass-border)' : '1px solid rgba(0, 0, 0, 0.05)';
    const floatingShadow = theme === 'dark' || theme === 'cheers'
        ? '0 10px 30px -10px rgba(0,0,0,0.5)'
        : '0 10px 30px -10px rgba(0,0,0,0.1)';

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        triggerHaptic('light');
        setTheme(nextTheme, { x: e.clientX, y: e.clientY });
    };

    const getThemeLabel = () => {
        switch (theme) {
            case 'light': return 'Light';
            case 'dark': return 'Dark';
            case 'cheers': return 'Animal Print';
            default: return 'Dark';
        }
    };

    return (
        <button
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
                backgroundColor: glassBg,
                border: glassBorder,
                boxShadow: floatingShadow,
            }}
            aria-label={`Current: ${getThemeLabel()}. Click to cycle themes`}
            title="Themes: Light → Dark → Animal Print"
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={theme}
                    initial={{ opacity: 0, scale: 0.8, rotate: -180 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.8, rotate: 180 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                    {theme === 'light' && (
                        <Sun strokeWidth={3} className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                    )}
                    {theme === 'dark' && (
                        <Moon strokeWidth={3} className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-400" />
                    )}
                    {theme === 'cheers' && (
                        <PawPrintIcon className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
                    )}
                </motion.div>
            </AnimatePresence>
        </button>
    );
}

export const ThemeToggle = memo(ThemeToggleComponent);
