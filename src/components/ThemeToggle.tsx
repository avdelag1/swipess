import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeContext } from '@/hooks/useAppTheme';
import { useContext } from 'react';
import { triggerHaptic } from '@/utils/haptics';

type Theme = 'light' | 'dark';

const CYCLE: Theme[] = ['light', 'dark'];

interface ThemeToggleProps {
    className?: string;
    glassPillStyle?: React.CSSProperties;
}

function ThemeToggleComponent({ className, glassPillStyle }: ThemeToggleProps) {
    const themeContext = useContext(ThemeContext);
    const theme = themeContext?.theme ?? 'dark';
    const setTheme = themeContext?.setTheme ?? (() => {});

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        triggerHaptic('light');
        const next = theme === 'light' ? 'dark' : 'light';
        setTheme(next, { x: e.clientX, y: e.clientY });
    };

    const icon =
        theme === 'light' ? (
            <Sun strokeWidth={2.1} className="h-4 w-4 text-foreground" />
        ) : (
            <Moon strokeWidth={2.1} className="h-4 w-4 text-primary" />
        );


    return (
        <button
            onClick={(e) => {
                handleToggle(e as any);
            }}
            className={cn(
                'relative flex items-center justify-center rounded-full',
                'transition-all duration-200 ease-out active:scale-[0.92]',
                'touch-manipulation h-9 w-9 flex-shrink-0',
                className,
            )}
            style={glassPillStyle}
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


