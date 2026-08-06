import { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeContext } from '@/hooks/useAppTheme';
import { useContext } from 'react';

import { triggerHaptic } from '@/utils/haptics';
import { useLocation } from 'react-router-dom';
import { getTopBarChrome, isDashboardPath } from '@/utils/headerChrome';

type Theme = 'light' | 'dark';

const _CYCLE: Theme[] = ['light', 'dark'];

interface ThemeToggleProps {
    className?: string;
    glassPillStyle?: React.CSSProperties;
}

function ThemeToggleComponent({ className, glassPillStyle }: ThemeToggleProps) {
    const themeContext = useContext(ThemeContext);
    const theme = themeContext?.theme ?? 'dark';
    const setTheme = themeContext?.setTheme ?? (() => {});

    const isLight = theme === 'light';
    const location = useLocation();
    const { iconColor, iconShadow } = getTopBarChrome(isLight, isDashboardPath(location.pathname) || isLight);

    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        triggerHaptic('light');
        const next = theme === 'light' ? 'dark' : 'light';
        setTheme(next, { x: e.clientX, y: e.clientY });
    };

    const icon =
        theme === 'light' ? (
            <Sun strokeWidth={1.9} className="h-[20px] w-[20px]" style={{ color: iconColor, filter: iconShadow }} />
        ) : (
            <Moon strokeWidth={1.9} className="h-[20px] w-[20px]" style={{ color: iconColor, filter: iconShadow }} />
        );


    return (
        <button
            onClick={(e) => {
                handleToggle(e as any);
            }}
            className={cn(
                'relative flex items-center justify-center rounded-full glass-pill',
                'transition-all duration-200 ease-out active:scale-[0.92]',
                'touch-manipulation h-[38px] w-[38px] flex-shrink-0',
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


