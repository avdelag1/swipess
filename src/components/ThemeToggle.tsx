import { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeContext } from '@/hooks/useAppTheme';
import { useContext } from 'react';

import { triggerHaptic } from '@/utils/haptics';
import { useLocation } from 'react-router-dom';
import { getTopBarChrome, isDashboardPath } from '@/utils/chromeStyles';

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
            <Sun strokeWidth={1.5} className="h-[18px] w-[18px]" style={{ color: iconColor, filter: iconShadow }} />
        ) : (
            <Moon strokeWidth={1.5} className="h-[18px] w-[18px]" style={{ color: iconColor, filter: iconShadow }} />
        );


    return (
        <button
            onClick={(e) => {
                handleToggle(e as any);
            }}
            className={cn(
                'chrome-icon-btn relative flex items-center justify-center rounded-full',
                'touch-manipulation flex-shrink-0',
                className,
            )}
            style={glassPillStyle}
            aria-label={`Theme: ${theme}. Tap to cycle`}
            title={`Current: ${theme}`}
        >
            {icon}
        </button>
    );
}

export const ThemeToggle = memo(ThemeToggleComponent);


